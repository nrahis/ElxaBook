export class TaskBar {
    constructor(config) {
        this.startButtonId = config.startButtonId;
        this.startMenuId = config.startMenuId;
        this.clockId = config.clockId;
        this.taskbarProgramsClass = config.taskbarProgramsClass;
        this.taskbarItems = new Map();
    }

    initialize() {
        this.startButton = document.getElementById(this.startButtonId);
        this.startMenu = document.getElementById(this.startMenuId);
        this.taskbarPrograms = document.querySelector(`.${this.taskbarProgramsClass}`);
        this.clockDisplay = document.getElementById(this.clockId);

        // Set up start menu toggle
        this.startButton.addEventListener('click', () => {
            this.toggleStartMenu();
        });

        // Initialize and start clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Listen for window events
        document.addEventListener('windowclose', (e) => {
            this.removeTaskbarItem(e.detail.windowId);
        });

        document.addEventListener('windowfocus', (e) => {
            this.updateActiveState(e.detail.windowId);
        });

        document.addEventListener('windowminimize', (e) => {
            this.deactivateTaskbarItem(e.detail.windowId);
        });

        document.addEventListener('windowshow', (e) => {
            this.activateTaskbarItem(e.detail.windowId);
        });

        // Close start menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#startButton') && !e.target.closest('#startMenu')) {
                this.hideStartMenu();
            }
        });
    }

    updateClock() {
        if (this.clockDisplay) {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = now.toLocaleDateString();
            this.clockDisplay.textContent = `${time} ${date}`;
        }
    }

    toggleStartMenu() {
        this.startMenu.classList.toggle('hidden');
    }

    hideStartMenu() {
        this.startMenu.classList.add('hidden');
    }

    addTaskbarItem(window) {
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-program';
        taskbarItem.textContent = window.querySelector('.window-title').textContent;
        taskbarItem.dataset.windowId = window.id;

        taskbarItem.addEventListener('click', () => {
            if (window.classList.contains('hidden')) {
                window.classList.remove('hidden');
                taskbarItem.classList.add('active');
            } else {
                window.classList.add('hidden');
                taskbarItem.classList.remove('active');
            }
        });

        this.taskbarPrograms.appendChild(taskbarItem);
        this.taskbarItems.set(window.id, taskbarItem);
        return taskbarItem;
    }

    removeTaskbarItem(windowId) {
        const taskbarItem = this.taskbarItems.get(windowId);
        if (taskbarItem) {
            taskbarItem.remove();
            this.taskbarItems.delete(windowId);
        }
    }

    updateActiveState(windowId) {
        // Deactivate all items
        this.taskbarItems.forEach(item => {
            item.classList.remove('active');
        });

        // Activate the focused window's taskbar item
        const taskbarItem = this.taskbarItems.get(windowId);
        if (taskbarItem) {
            taskbarItem.classList.add('active');
        }
    }

    activateTaskbarItem(windowId) {
        const taskbarItem = this.taskbarItems.get(windowId);
        if (taskbarItem) {
            taskbarItem.classList.add('active');
        }
    }

    deactivateTaskbarItem(windowId) {
        const taskbarItem = this.taskbarItems.get(windowId);
        if (taskbarItem) {
            taskbarItem.classList.remove('active');
        }
    }
}