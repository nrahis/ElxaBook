export class WindowManager {
    constructor(config) {
        this.templateId = config.templateId;
        this.desktopAreaId = config.desktopAreaId;
        this.apps = new Map();
        this.activeWindows = new Map();
        this.zIndexCounter = 100;
    }

    initialize() {
        this.template = document.getElementById(this.templateId);
        this.desktopArea = document.getElementById(this.desktopAreaId);
    }

    registerApp(appName, config) {
        this.apps.set(appName, {
            title: config.title,
            initialize: config.initialize,
            defaultSize: config.defaultSize || { width: 500, height: 400 },
            singleton: config.singleton || false,
            windowId: config.windowId || null
        });
    }

    setTaskbar(taskbar) {
        this.taskbar = taskbar;
    }

    createWindow(appName, params) {
        console.log('DEBUG - WindowManager createWindow called with:', { appName, params });
        const app = this.apps.get(appName);
        if (!app) return null;
    
        // Enhanced window existence check
        if (appName === 'explorer' || appName === 'folder') {
            console.log('Checking for existing windows with path:', params?.path);
            const windows = Array.from(document.querySelectorAll('.program-window'));
            console.log('Found windows:', windows.length);
            
            const existingWindow = windows.find(w => {
                const windowPath = w.dataset.path;
                const matches = windowPath === params?.path;
                console.log('Window path check:', windowPath, 'matches:', matches);
                return matches;
            });
    
            if (existingWindow) {
                console.log('Found existing window for path:', params?.path);
                if (existingWindow.classList.contains('hidden')) {
                    existingWindow.classList.remove('hidden');
                    if (this.taskbar) {
                        this.taskbar.activateTaskbarItem(existingWindow.id);
                    }
                } else {
                    existingWindow.classList.add('hidden');
                    if (this.taskbar) {
                        this.taskbar.deactivateTaskbarItem(existingWindow.id);
                    }
                }
                this.bringToFront(existingWindow);
                return existingWindow;
            }
            console.log('No existing window found for path:', params?.path);
        }
    
        // Create new window with path data
        const window = this.template.cloneNode(true);
        const windowId = app.windowId || `window-${appName}-${Date.now()}`;
        window.id = windowId;
        window.classList.remove('hidden');
        window.classList.add('program-window');
    
        // Store the path and set title based on folder name
        if (params?.path) {
            window.dataset.path = params.path;
            const folderName = params.path.split('/').pop();
            window.querySelector('.window-title').textContent = folderName;
        } else {
            window.querySelector('.window-title').textContent = app.title;
        }
    
        // Set initial position and size
        const { width, height } = app.defaultSize;
        window.style.width = `${width}px`;
        window.style.height = `${height}px`;
        this.centerWindow(window);
    
        // Initialize window controls
        this.setupWindowControls(window);
        this.makeDraggable(window);
        this.makeResizable(window);
    
        // Initialize app content if an initialize function was provided
        const contentArea = window.querySelector('.window-content');
        if (app.initialize) {
            console.log('About to call app.initialize with params:', params);  // Add this debug log
            app.initialize(contentArea, params);
        }
    
        // Add to desktop and track
        this.desktopArea.appendChild(window);
        this.activeWindows.set(windowId, { appName, window });
        
        // Only the main File Explorer (not folder windows) should skip creating a taskbar item
        const isMainFileExplorer = appName === 'explorer' && window.querySelector('.window-title').textContent === 'File Explorer';
        if (!isMainFileExplorer && this.taskbar) {
            this.taskbar.addTaskbarItem(window);
        }
        
        this.bringToFront(window);
    
        return window;
    }

    centerWindow(window) {
        const desktop = this.desktopArea.getBoundingClientRect();
        const width = parseInt(window.style.width);
        const height = parseInt(window.style.height);
        
        window.style.left = `${Math.max(0, (desktop.width - width) / 2)}px`;
        window.style.top = `${Math.max(0, (desktop.height - height) / 2)}px`;
    }

    setupWindowControls(window) {
        const controls = window.querySelector('.window-controls');
        
        controls.querySelector('.minimize').addEventListener('click', () => {
            this.minimizeWindow(window);
        });

        controls.querySelector('.maximize').addEventListener('click', () => {
            this.toggleMaximize(window);
        });

        controls.querySelector('.close').addEventListener('click', () => {
            this.closeWindow(window);
        });
    }

    makeDraggable(window) {
        const titleBar = window.querySelector('.title-bar');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        titleBar.onmousedown = (e) => {
            if (e.target.closest('.window-controls')) return;
            if (window.classList.contains('maximized')) return;

            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;

            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };

            document.onmousemove = (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;

                const newTop = window.offsetTop - pos2;
                const newLeft = window.offsetLeft - pos1;

                window.style.top = `${Math.max(0, newTop)}px`;
                window.style.left = `${Math.max(0, newLeft)}px`;
            };

            this.bringToFront(window);
        };
    }

    makeResizable(window) {
        const minWidth = 200;
        const minHeight = 200;

        window.style.resize = 'both';
        window.style.overflow = 'hidden';
        
        const observer = new ResizeObserver(() => {
            const width = parseInt(window.style.width);
            const height = parseInt(window.style.height);
            
            if (width < minWidth) window.style.width = `${minWidth}px`;
            if (height < minHeight) window.style.height = `${minHeight}px`;
        });
        
        observer.observe(window);
    }

    minimizeWindow(window) {
        window.classList.add('hidden');
        this.emitWindowEvent('minimize', window);
        if (this.taskbar) {
            this.taskbar.deactivateTaskbarItem(window.id);
        }
    }

    showWindow(window) {
        window.classList.remove('hidden');
        this.bringToFront(window);
        this.emitWindowEvent('show', window);
        if (this.taskbar) {
            this.taskbar.activateTaskbarItem(window.id);
        }
    }

    toggleMaximize(window) {
        if (window.classList.contains('maximized')) {
            // Restore
            const prevState = JSON.parse(window.dataset.prevState || '{}');
            window.style.top = prevState.top || '50px';
            window.style.left = prevState.left || '100px';
            window.style.width = prevState.width || '500px';
            window.style.height = prevState.height || '400px';
            window.classList.remove('maximized');
        } else {
            // Maximize
            window.dataset.prevState = JSON.stringify({
                top: window.style.top,
                left: window.style.left,
                width: window.style.width,
                height: window.style.height
            });
            window.classList.add('maximized');
        }
    }

    closeWindow(window) {
        if (this.taskbar) {
            this.taskbar.removeTaskbarItem(window.id);
        }
        this.activeWindows.delete(window.id);
        this.emitWindowEvent('close', window);
        window.remove();
    }

    bringToFront(window) {
        window.style.zIndex = ++this.zIndexCounter;
        this.emitWindowEvent('focus', window);
    }

    emitWindowEvent(type, window) {
        const event = new CustomEvent('window' + type, {
            detail: { windowId: window.id }
        });
        document.dispatchEvent(event);
    }
}