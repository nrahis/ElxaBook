// Import all necessary modules
import { FileExplorer } from './file_explorer.js';
import { WindowManager } from './windows.js';
import { TaskBar } from './taskbar.js';
import { Paint } from './apps/paint.js';
import { Notepad } from './apps/notepad.js';
import { Duck } from './apps/duck.js';
import { minesweeper } from './apps/minesweeper.js';
import { About } from './apps/about.js';
import { scientificCalculator } from './apps/scientific_calculator.js';
import { Clock } from './apps/clock.js';
import { Calendar } from './apps/calendar.js';
import { Settings } from './settings.js';
import { fileSystem } from './storage.js';
import { Desktop } from './desktop.js';

// Declare these in module scope so they can be exported
let windowManager;
let taskbar;

// Initialize clock
function updateClock() {
    const clockDisplay = document.getElementById('clock');
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString();
    clockDisplay.textContent = `${time} ${date}`;
}

// Wait for DOM to be ready before doing anything
document.addEventListener('DOMContentLoaded', () => {
    // First, create all system objects
    
    windowManager = new WindowManager({
        templateId: 'windowTemplate',
        desktopAreaId: 'desktop-area'
    });

    taskbar = new TaskBar({
        startButtonId: 'startButton',
        startMenuId: 'startMenu',
        clockId: 'clock',
        taskbarProgramsClass: 'taskbar-programs'
    });

    // Now we can safely connect them
    windowManager.setTaskbar(taskbar);
    taskbar.setWindowManager(windowManager);

    // Initialize core systems
    windowManager.initialize();
    taskbar.initialize();
    
    // Initialize applications
    const paint = new Paint(fileSystem);
    const notepad = new Notepad(fileSystem);
    const about = new About();
    const calculator = scientificCalculator;
    const clock = new Clock(fileSystem);
    const calendar = new Calendar(fileSystem);
    const settings = new Settings(fileSystem);
    const fileExplorer = new FileExplorer(fileSystem, windowManager);

    windowManager.registerApp('explorer', {
        title: 'File Explorer',  // This specific title will help us identify the main explorer
        initialize: (contentArea, params) => {
            console.log('Explorer app initialize called with params:', params);
            fileExplorer.initialize(contentArea, params?.path);
        },
        defaultSize: { width: 800, height: 600 },
        singleton: true  // Add this
    });

    windowManager.registerApp('folder', {
        title: 'Folder',  // This will be replaced with the actual folder name
        initialize: (contentArea, params) => {
            console.log('Folder app initialize called with params:', params);
            fileExplorer.initialize(contentArea, params?.path);
            // Set the window title to the folder name
            if (params?.path) {
                const folderName = params.path.split('/').pop();
                contentArea.closest('.program-window').querySelector('.window-title').textContent = folderName;
            }
        },
        defaultSize: { width: 800, height: 600 }
    });
    
    windowManager.registerApp('computer', {
        title: 'Computer',
        initialize: (contentArea) => fileExplorer.initialize(contentArea, '/ElxaOS'),
        defaultSize: { width: 800, height: 600 }
    });

    windowManager.registerApp('paint', {
        title: 'EX Paint',
        initialize: (contentArea) => paint.initialize(contentArea),
        defaultSize: { width: 800, height: 600 }
    });

    windowManager.registerApp('notepad', {
        title: 'Notepad',
        initialize: (contentArea) => notepad.initialize(contentArea),
        defaultSize: { width: 600, height: 400 }
    });

    windowManager.registerApp('minesweeper', {
        title: 'Kittysweeper',
        initialize: (contentArea) => minesweeper.initialize(contentArea),
        defaultSize: { width: 500, height: 600 }
    });

    windowManager.registerApp('about', {
        title: 'About ElxaOS',
        initialize: (contentArea) => about.initialize(contentArea),
        defaultSize: { width: 400, height: 300 },
        singleton: true,
        windowId: 'about-elxaos' // Changed to be more specific and consistent
    });

    windowManager.registerApp('scientificCalculator', {
        title: 'Calculator',
        initialize: (contentArea) => scientificCalculator.initialize(contentArea), // Fix typo from 'sceintificCalculator'
        defaultSize: { width: 330, height: 410 }
    });

    windowManager.registerApp('clock', {
        title: 'Clock & Timer',
        initialize: (contentArea) => clock.initialize(contentArea),
        defaultSize: { width: 600, height: 400 }
    });

    windowManager.registerApp('calendar', {
        title: 'Calendar',
        initialize: (contentArea) => calendar.initialize(contentArea),
        defaultSize: { width: 750, height: 600 }
    });

    windowManager.registerApp('settings', {
        title: 'Display Properties',  // Updated the title to be more Windows 95-like
        initialize: (contentArea) => settings.initialize(contentArea),
        defaultSize: { width: 400, height: 480 }  // Adjusted size to match Win95 style
    });

    windowManager.registerApp('duck', {
        title: 'DUCK Terminal',
        initialize: (contentArea) => {
            const duck = new Duck();
            duck.initialize(contentArea);
        },
        defaultSize: { width: 700, height: 500 }
    });
    
    windowManager.registerApp('recyclebin', {
        title: 'Recycle Bin',
        initialize: (contentArea) => {
            // The content will be set by the Desktop class
        },
        defaultSize: { width: 600, height: 400 }
    });

    const desktop = new Desktop(fileSystem, windowManager);

    // Handle start menu application launches
    document.querySelectorAll('#startMenu a[data-app]').forEach(menuItem => {
        menuItem.addEventListener('click', (e) => {
            e.preventDefault();
            const appName = e.target.getAttribute('data-app');
            windowManager.createWindow(appName);
            taskbar.hideStartMenu();
        });
    });

    // Update copyright year
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Start clock updates
    updateClock();
    setInterval(updateClock, 1000);

    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#startButton') && !e.target.closest('#startMenu')) {
            taskbar.hideStartMenu();
        }
    });

    // Handle window focus
    document.addEventListener('mousedown', (e) => {
        const windowElement = e.target.closest('.program-window');
        if (windowElement) {
            windowManager.bringToFront(windowElement);
        }
    });
});

// Export for potential use by other modules
export {
    windowManager,
    taskbar,
    fileSystem
};