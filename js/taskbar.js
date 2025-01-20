import { IconSet } from './icons.js';

export class TaskBar {
    constructor(config) {
        this.startButtonId = config.startButtonId;
        this.startMenuId = config.startMenuId;
        this.clockId = config.clockId;
        this.taskbarProgramsClass = config.taskbarProgramsClass;
        this.taskbarItems = new Map();
        // Get fileSystem directly from import
        this.fileSystem = window.elxaFileSystem;
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
                    // Get current user's home directory
                    const currentUser = this.fileSystem.currentUsername;
                    const userHome = `/ElxaOS/Users/${currentUser}`;
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