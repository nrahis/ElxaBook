// Import all necessary modules
import { FileExplorer } from './file_explorer.js';
import { WindowManager } from './windows.js';
import { TaskBar } from './taskbar.js';
import { Desktop } from './desktop.js';
import { fileSystem } from './storage.js';
import { Paint } from './apps/system/paint.js';
import { Notepad } from './apps/system/notepad.js';
import { Duck } from './apps/system/duck.js';
import { minesweeper } from './apps/system/minesweeper.js';
import { MathMatch, mathMatch } from './apps/system/math_games/math_match.js';
import { SnakeEquation, snakeEquation } from './apps/system/math_games/snake_equation.js';
import { timeCrunch } from './apps/system/math_games/time_crunch.js';
import { solitaire } from './apps/system/solitaire.js';
import { About } from './apps/system/about.js';
import { scientificCalculator } from './apps/system/scientific_calculator.js';
import { Clock } from './apps/system/clock.js';
import { Calendar } from './apps/system/calendar.js';
import { Slideshow } from './apps/system/slideshow.js';
import { Settings } from './settings.js';
import { RecycleBinHandler } from './recycle-bin-handler.js';
import { FileOpenDialog } from './dialogs/file_open_dialog.js';
import { FileSaveDialog } from './dialogs/file_save_dialog.js';

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
    // Make sure we use a single fileSystem instance globally
    window.elxaFileSystem = window.elxaFileSystem || fileSystem;

    // Create and set up global RecycleBinHandler
    window.elxaRecycleBinHandler = new RecycleBinHandler(window.elxaFileSystem);
    
    // Create all system objects
    windowManager = new WindowManager({
        templateId: 'windowTemplate',
        desktopAreaId: 'desktop-area'
    });

    console.log('WindowManager created:', windowManager);
    console.log('WindowManager methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(windowManager)));

    taskbar = new TaskBar({
        startButtonId: 'startButton',
        startMenuId: 'startMenu',
        clockId: 'clock',
        taskbarProgramsClass: 'taskbar-programs'
    });

    // Set file system references
    windowManager.fileSystem = window.elxaFileSystem;
    taskbar.fileSystem = window.elxaFileSystem;

    // Connect the managers
    windowManager.setTaskbar(taskbar);
    taskbar.setWindowManager(windowManager);

    // Initialize core systems
    windowManager.initialize();
    taskbar.initialize();

    // Create file explorer instance with shared file system
    const fileExplorer = new FileExplorer(window.elxaFileSystem, windowManager);

    // Register core system apps first
    windowManager.registerApp('explorer', {
        title: 'File Explorer',
        initialize: (contentArea, params) => {
            const currentUser = window.elxaFileSystem.currentUsername;
            const initialPath = params?.path || `/ElxaOS/Users/${currentUser}`;
            console.log('Explorer app initialize called with params:', { ...params, initialPath });
            fileExplorer.initialize(contentArea, initialPath);
        },
        defaultSize: { width: 800, height: 600 },
        singleton: true
    });

    windowManager.registerApp('folder', {
        title: 'Folder',
        initialize: (contentArea, params) => {
            console.log('Folder app initialize called with params:', params);
            fileExplorer.initialize(contentArea, params?.path);
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

    // Now create desktop after core apps are registered
    console.log('Creating desktop...');
    const desktop = new Desktop(window.elxaFileSystem, windowManager);
    console.log('Desktop created:', desktop);

    try {
        console.log('Attempting to set desktop...');
        windowManager.setDesktop(desktop);
        console.log('Desktop set successfully');
    } catch (error) {
        console.error('Error setting desktop:', error);
    }

    // Initialize applications
    const paint = new Paint(fileSystem);
    const notepad = new Notepad(fileSystem);
    const about = new About();
    const clock = new Clock(fileSystem);
    const calendar = new Calendar(fileSystem);
    const slideshow = new Slideshow(fileSystem);
    const settings = new Settings(fileSystem);

    // Now continue with registering non-core apps
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

    windowManager.registerApp('mathMatch', {
        title: 'Math Match',
        initialize: (contentArea) => mathMatch.initialize(contentArea),
        defaultSize: { width: 500, height: 550 }
    });

    windowManager.registerApp('timeCrunch', {
        title: 'Time Crunch',
        initialize: (contentArea) => timeCrunch.initialize(contentArea),
        defaultSize: { width: 410, height: 500 }
    });

    windowManager.registerApp('snakeEquation', {  // lowercase to match the data-app attribute
        title: 'Snake Equation',
        initialize: (contentArea) => {
            const game = new SnakeEquation();
            game.initialize(contentArea);
        },
        defaultSize: { width: 500, height: 600 }
    });
    
    windowManager.registerApp('solitaire', {
        title: 'Solitaire',
        initialize: (contentArea) => solitaire.initialize(contentArea),
        defaultSize: { width: 710, height: 610 }
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
        defaultSize: { width: 850, height: 600 }
    });

    windowManager.registerApp('slideshow', {
        title: 'Slideshow',
        initialize: (contentArea) => slideshow.initialize(contentArea),
        defaultSize: { width: 750, height: 600 }
    });

    windowManager.registerApp('settings', {
        title: 'Settings',
        initialize: (contentArea) => settings.initialize(contentArea),
        defaultSize: { width: 420, height: 480 },
        singleton: true,
        onClose: () => {
            // Remove any open dialogs when settings window is closed
            const dialogs = document.querySelectorAll('.settings-dialog');
            dialogs.forEach(dialog => dialog.remove());
        }
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

    // Add shutdown screen to body
    const shutdownScreen = document.createElement('div');
    shutdownScreen.id = 'shutdown-screen';
    const shutdownMessage = document.createElement('div');
    shutdownMessage.id = 'shutdown-message';
    shutdownScreen.appendChild(shutdownMessage);
    document.body.appendChild(shutdownScreen);

    // Handle power options
    document.querySelectorAll('.power-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const action = e.target.getAttribute('data-action');
            taskbar.hideStartMenu();

            switch(action) {
                case 'logout':
                    // Save any necessary state
                    localStorage.setItem('lastUser', window.elxaFileSystem.currentUsername);
                    
                    // Show boot sequence again
                    const bootSequence = document.getElementById('boot-sequence');
                    if (!bootSequence) {
                        // If boot sequence doesn't exist, recreate it
                        location.reload();
                        return;
                    }
                    
                    bootSequence.style.display = 'block';
                    bootSequence.style.animation = 'fadeIn 1s forwards';
                    
                    // Show login screen directly
                    const loginScreen = document.querySelector('#login-screen');
                    const bootScreen = document.querySelector('#boot-screen');
                    const welcomeScreen = document.querySelector('#welcome-screen');
                    
                    if (loginScreen) loginScreen.classList.remove('hidden');
                    if (bootScreen) bootScreen.classList.add('hidden');
                    if (welcomeScreen) welcomeScreen.classList.add('hidden');
                    
                    // Hide desktop
                    const desktop = document.getElementById('desktop');
                    if (desktop) desktop.style.visibility = 'hidden';
                    break;

                case 'shutdown':
                    shutdownScreen.style.display = 'flex';
                    shutdownMessage.textContent = 'Shutting down ElxaOS...';
                    
                    // Ensure the shutdown screen is visible by bringing it to front
                    shutdownScreen.style.zIndex = '100000';
                    
                    setTimeout(() => {
                        shutdownMessage.textContent = 'It is now safe to turn off your computer.';
                        setTimeout(() => {
                            shutdownScreen.style.backgroundColor = '#000000';
                            shutdownMessage.style.display = 'none';
                        }, 2000);
                    }, 2000);
                    break;

                case 'restart':
                    shutdownScreen.style.display = 'flex';
                    shutdownMessage.textContent = 'Restarting ElxaOS...';
                    
                    // Store current user for quick login
                    localStorage.setItem('quickRestart', 'true');
                    localStorage.setItem('lastUser', window.elxaFileSystem.currentUsername);
                    
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                    break;
            }
        });
    });

    // Handle quick restart bypass
    if (localStorage.getItem('quickRestart') === 'true') {
        const bootSequence = document.getElementById('boot-sequence');
        const lastUser = localStorage.getItem('lastUser');
        
        if (bootSequence && lastUser) {
            // Remove boot sequence and show desktop
            bootSequence.remove();
            document.getElementById('desktop').style.visibility = 'visible';
            
            // Set current user
            window.elxaFileSystem.setCurrentUser(lastUser);
            
            // Load user settings
            const settingsPath = `/ElxaOS/Users/${lastUser}/.settings/user.config`;
            try {
                const settingsFile = window.elxaFileSystem.getFile(settingsPath);
                if (settingsFile) {
                    const settings = JSON.parse(settingsFile.content);
                    // Apply settings
                    if (settings.display?.background) {
                        if (settings.display.background.startsWith('default-')) {
                            const index = parseInt(settings.display.background.split('-')[1]);
                            document.body.style.background = defaultBackgrounds[index].value;
                            document.body.style.backgroundSize = '400% 400%';
                        } else {
                            const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
                            document.body.style.background = `url(${customBgs[parseInt(settings.display.background)]})`;
                            document.body.style.backgroundSize = 'cover';
                        }
                    }
                    if (settings.personalization?.systemFont) {
                        // Set the font immediately
                        document.documentElement.style.setProperty('--system-font', settings.personalization.systemFont);
                    }
                }
            } catch (error) {
                console.error('Failed to load user settings:', error);
            }
            
            // Clear quick restart flag
            localStorage.removeItem('quickRestart');
        }
    }
});

// Export for potential use by other modules
export {
    windowManager,
    taskbar,
    fileSystem
};