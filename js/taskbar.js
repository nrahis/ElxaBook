import { IconSet } from './icons.js';

export class TaskBar {
    constructor(config) {
        this.startButtonId = config.startButtonId;
        this.startMenuId = config.startMenuId;
        this.clockId = config.clockId;
        this.taskbarProgramsClass = config.taskbarProgramsClass;
        this.taskbarItems = new Map();
        this.fileSystem = window.elxaFileSystem;
        // Add clock format preferences with defaults
        this.clockPreferences = {
            militaryTime: false,
            dateFormat: 'short' // 'short', 'long', 'numeric'
        };
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

        // Initialize clock with context menu
        this.clockDisplay = document.getElementById(this.clockId);
        if (this.clockDisplay) {
            // Load preferences before starting the clock
            this.loadClockPreferences();
            
            this.clockDisplay.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showClockContextMenu(e.clientX, e.clientY);
            });

            // Initialize and start clock with saved preferences
            this.updateClock();
            setInterval(() => this.updateClock(), 1000);
        }
    
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

    loadClockPreferences() {
        const currentUser = this.fileSystem.currentUsername;
        const prefsPath = `/ElxaOS/Users/${currentUser}/.settings/clock.config`;
        
        try {
            const prefsFile = this.fileSystem.getFile(prefsPath);
            if (prefsFile) {
                const prefs = JSON.parse(prefsFile.content);
                this.clockPreferences = { ...this.clockPreferences, ...prefs };
            }
        } catch (error) {
            console.log('No existing clock preferences found, using defaults');
            // Ensure the settings directory exists
            const settingsPath = `/ElxaOS/Users/${currentUser}/.settings`;
            if (!this.fileSystem.exists(settingsPath)) {
                this.fileSystem.createDirectory(settingsPath);
            }
            // Save default preferences
            this.saveClockPreferences();
        }
    }

    saveClockPreferences() {
        const currentUser = this.fileSystem.currentUsername;
        const prefsPath = `/ElxaOS/Users/${currentUser}/.settings/clock.config`;
        
        try {
            // Ensure the settings directory exists
            const settingsPath = `/ElxaOS/Users/${currentUser}/.settings`;
            if (!this.fileSystem.exists(settingsPath)) {
                this.fileSystem.createDirectory(settingsPath);
            }
            
            // Save the preferences
            this.fileSystem.writeFile(prefsPath, JSON.stringify(this.clockPreferences, null, 2));
            console.log('Saved clock preferences:', this.clockPreferences);
        } catch (error) {
            console.error('Failed to save clock preferences:', error);
        }
    }

    showClockContextMenu(x, y) {
        // Remove any existing context menus
        const existingMenu = document.querySelector('.clock-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'clock-context-menu';
        
        // Add to document first without positioning so we can measure it
        document.body.appendChild(menu);
        
        // Set initial styles without position
        menu.style.cssText = `
            position: fixed;
            background-color: #d5bde6;
            border: 2px outset #f0d9ff;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            padding: 4px 0;
            min-width: 150px;
            visibility: hidden;
        `;

        // Add menu items
        const items = [
            {
                text: this.clockPreferences.militaryTime ? '✓ 24-hour format' : '12-hour format',
                action: () => {
                    this.clockPreferences.militaryTime = !this.clockPreferences.militaryTime;
                    this.saveClockPreferences();
                    this.updateClock();
                }
            },
            {
                text: 'Open Clock & Timer',
                action: () => {
                    if (this.windowManager) {
                        this.windowManager.createWindow('clock');
                    }
                }
            },
            { type: 'separator' },
            {
                text: this.clockPreferences.dateFormat === 'short' ? '✓ Short Date' : 'Short Date',
                action: () => {
                    this.clockPreferences.dateFormat = 'short';
                    this.saveClockPreferences();
                    this.updateClock();
                }
            },
            {
                text: this.clockPreferences.dateFormat === 'long' ? '✓ Long Date' : 'Long Date',
                action: () => {
                    this.clockPreferences.dateFormat = 'long';
                    this.saveClockPreferences();
                    this.updateClock();
                }
            },
            {
                text: this.clockPreferences.dateFormat === 'numeric' ? '✓ Numeric Date' : 'Numeric Date',
                action: () => {
                    this.clockPreferences.dateFormat = 'numeric';
                    this.saveClockPreferences();
                    this.updateClock();
                }
            }
        ];

        items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.textContent = item.text;
                menuItem.addEventListener('click', () => {
                    item.action();
                    menu.remove();
                });
                menu.appendChild(menuItem);
            }
        });

        // Calculate position after adding items
        const menuHeight = menu.offsetHeight;
        const menuWidth = menu.offsetWidth;
        
        // Position menu above the click point and ensure it stays within window bounds
        let menuX = Math.min(x, window.innerWidth - menuWidth - 5);
        let menuY = y - menuHeight - 5; // Position above click point with 5px padding
        
        // Make sure menu doesn't go off the top of the screen
        if (menuY < 5) {
            menuY = 5;
        }
        
        // Apply final position
        menu.style.left = `${menuX}px`;
        menu.style.top = `${menuY}px`;
        menu.style.visibility = 'visible';

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }

    updateClock() {
        if (this.clockDisplay) {
            const now = new Date();
            
            // Use the saved preferences for time format
            const timeOptions = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: !this.clockPreferences.militaryTime
            };

            // Use the saved preferences for date format
            let dateOptions;
            switch (this.clockPreferences.dateFormat) {
                case 'long':
                    dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    break;
                case 'numeric':
                    dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
                    break;
                default: // 'short'
                    dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
            }

            const time = now.toLocaleTimeString([], timeOptions);
            const date = now.toLocaleDateString([], dateOptions);
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