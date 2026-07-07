const form = document.querySelector("#todoForm");
const input = document.querySelector("#todoInput");
const list = document.querySelector("#todoList");
const emptyState = document.querySelector("#emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearDoneButton = document.querySelector("#clearDone");
const totalTasks = document.querySelector("#totalTasks");
const activeTasks = document.querySelector("#activeTasks");
const doneTasks = document.querySelector("#doneTasks");

const STORAGE_KEY = "aurora-tasks";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let activeFilter = "all";
let editingTaskId = null;

function createTaskId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getVisibleTasks() {
    if (activeFilter === "active") {
        return tasks.filter((task) => !task.completed);
    }

    if (activeFilter === "completed") {
        return tasks.filter((task) => task.completed);
    }

    return tasks;
}

function updateStats() {
    const completedCount = tasks.filter((task) => task.completed).length;

    totalTasks.textContent = tasks.length;
    activeTasks.textContent = tasks.length - completedCount;
    doneTasks.textContent = completedCount;
}

function renderTasks() {
    const visibleTasks = getVisibleTasks();

    list.innerHTML = "";
    emptyState.classList.toggle("show", visibleTasks.length === 0);

    visibleTasks.forEach((task) => {
        const item = document.createElement("li");
        item.className = `todo-item${task.completed ? " completed" : ""}${editingTaskId === task.id ? " editing" : ""}`;
        item.dataset.id = task.id;

        if (editingTaskId === task.id) {
            item.innerHTML = `
                <button class="check-btn" type="button" aria-label="Toggle task">✓</button>
                <input class="edit-input" type="text" maxlength="80" aria-label="Edit task">
                <div class="task-actions">
                    <button class="save-btn" type="button" aria-label="Save task">Save</button>
                    <button class="cancel-btn" type="button" aria-label="Cancel edit">Cancel</button>
                </div>
            `;

            item.querySelector(".edit-input").value = task.title;
        } else {
            item.innerHTML = `
                <button class="check-btn" type="button" aria-label="Toggle task">✓</button>
                <span class="task-title"></span>
                <div class="task-actions">
                    ${task.completed ? "" : `<button class="edit-btn" type="button" aria-label="Edit task">Edit</button>`}
                    <button class="delete-btn" type="button" aria-label="Delete task">×</button>
                </div>
            `;

            item.querySelector(".task-title").textContent = task.title;
        }

        list.appendChild(item);
    });

    const editInput = list.querySelector(".edit-input");

    if (editInput) {
        editInput.focus();
        editInput.select();
    }

    updateStats();
    saveTasks();
}

function saveEditedTask(item) {
    const taskId = item.dataset.id;
    const editInput = item.querySelector(".edit-input");
    const title = editInput.value.trim();

    if (!title) {
        return;
    }

    tasks = tasks.map((task) => task.id === taskId ? { ...task, title } : task);
    editingTaskId = null;
    renderTasks();
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = input.value.trim();

    if (!title) {
        return;
    }

    tasks.unshift({
        id: createTaskId(),
        title,
        completed: false
    });

    input.value = "";
    input.focus();
    renderTasks();
});

list.addEventListener("click", (event) => {
    const item = event.target.closest(".todo-item");

    if (!item) {
        return;
    }

    const taskId = item.dataset.id;

    if (event.target.closest(".check-btn")) {
        tasks = tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task);
        editingTaskId = null;
    }

    if (event.target.closest(".edit-btn")) {
        editingTaskId = taskId;
    }

    if (event.target.closest(".save-btn")) {
        saveEditedTask(item);
        return;
    }

    if (event.target.closest(".cancel-btn")) {
        editingTaskId = null;
    }

    if (event.target.closest(".delete-btn")) {
        tasks = tasks.filter((task) => task.id !== taskId);
        editingTaskId = null;
    }

    renderTasks();
});

list.addEventListener("keydown", (event) => {
    const item = event.target.closest(".todo-item.editing");

    if (!item) {
        return;
    }

    if (event.key === "Enter") {
        event.preventDefault();
        saveEditedTask(item);
    }

    if (event.key === "Escape") {
        editingTaskId = null;
        renderTasks();
    }
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        filterButtons.forEach((filterButton) => filterButton.classList.remove("active"));
        button.classList.add("active");
        renderTasks();
    });
});

clearDoneButton.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    renderTasks();
});

renderTasks();
