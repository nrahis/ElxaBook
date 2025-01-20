import { IconSet } from './icons.js';

export class TaskBar {
    constructor(config) {
        this.startButtonId = config.startButtonId;
        this.startMenuId = config.startMenuId;
        this.clockId = config.clockId;
        this.taskbarProgramsClass = config.taskbarProgramsClass;
        this.taskbarItems = new Map();
    }

    initialize() {
        console.log('TaskBar initializing...');
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
            const focusedWindow = this.activeWindows?.get(e.detail.windowId)?.window;
            if (focusedWindow && focusedWindow.querySelector('.window-title').textContent === 'File Explorer') {
                document.getElementById('taskbar-explorer').classList.add('active');
            }
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

        // Initialize File Explorer button
        console.log('About to initialize explorer button...');
        const explorerButton = document.getElementById('taskbar-explorer');
        if (explorerButton) {
            const folderIcon = IconSet.getIcon('folder', 'default');
            folderIcon.className = 'file-icon';
            explorerButton.appendChild(folderIcon);
    
            explorerButton.addEventListener('click', () => {
                console.log('Explorer button clicked');
                if (this.windowManager) {
                    const userHome = '/ElxaOS/Users/kitkat';
                    console.log('Checking for existing explorer windows with path:', userHome);
                    
                    const windows = Array.from(document.querySelectorAll('.program-window'));
                    const explorerWindow = windows.find(w => w.dataset.path === userHome);
                    
                    if (explorerWindow) {
                        console.log('Found existing window for home directory');
                        if (explorerWindow.classList.contains('hidden')) {
                            explorerWindow.classList.remove('hidden');
                            this.windowManager.bringToFront(explorerWindow);
                            explorerButton.classList.add('active');
                        } else {
                            explorerWindow.classList.add('hidden');
                            explorerButton.classList.remove('active');
                        }
                    } else {
                        console.log('Creating new window for home directory');
                        const window = this.windowManager.createWindow('explorer', { path: userHome });
                        if (window) {
                            explorerButton.classList.add('active');
                        }
                    }
                }
            });
        }

    }

    // Add setter for WindowManager
    setWindowManager(windowManager) {
        this.windowManager = windowManager;
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