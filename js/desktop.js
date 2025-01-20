// desktop.js
import { IconSet } from './icons.js'; 

export class Desktop {
    constructor(fileSystem, windowManager) {
        this.fileSystem = fileSystem;
        this.windowManager = windowManager;
        this.desktopArea = document.getElementById('desktop-area');
        this.desktopIcons = new Map();
        this.selectedIcons = new Set();
        this.gridSize = 100; // Size of each grid cell
        this.initialize();
    }

    initialize() {
        // Create desktop icons container with improved grid
        const iconsContainer = document.createElement('div');
        iconsContainer.id = 'desktop-icons';
        iconsContainer.style.position = 'absolute';
        iconsContainer.style.top = '10px';
        iconsContainer.style.left = '10px';
        iconsContainer.style.right = '10px';
        iconsContainer.style.bottom = '10px';
        iconsContainer.style.display = 'grid';
        iconsContainer.style.gridTemplateColumns = 'repeat(2, 100px)';
        iconsContainer.style.gridAutoRows = '100px';
        iconsContainer.style.justifyContent = 'start';
        iconsContainer.style.alignContent = 'start';
        iconsContainer.style.gap = '20px';
        this.desktopArea.appendChild(iconsContainer);

        // Create default desktop icons in a specific order
        const defaultIcons = [
            { name: 'Computer', category: 'system', type: 'computer' },
            { name: 'Recycle Bin', category: 'folder', type: 'recycle' },
            { name: 'Documents', category: 'folder', type: 'documents' },
            { name: 'Pictures', category: 'folder', type: 'pictures' },
            { name: 'Music', category: 'folder', type: 'music' },
            { name: 'Downloads', category: 'folder', type: 'downloads' }
        ];

        defaultIcons.forEach((iconInfo, index) => {
            this.createDesktopIcon(iconInfo.name, iconInfo.category, iconInfo.type);
        });

        // Now define the event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add desktop area click handler for deselecting icons
        this.desktopArea.addEventListener('click', (e) => {
            if (!e.target.closest('.desktop-icon')) {
                this.deselectAllIcons();
            }
        });

        // Add context menu handler for desktop area
        this.desktopArea.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('.desktop-icon')) {
                e.preventDefault();
                this.showDesktopContextMenu(e);
            }
        });
    }

    makeIconDraggable(icon) {
        let isDragging = false;
        let startPos = { x: 0, y: 0 };
        let origPos = { x: 0, y: 0 };

        icon.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Left click only
            
            isDragging = false;
            startPos = { x: e.clientX, y: e.clientY };
            origPos = { x: icon.offsetLeft, y: icon.offsetTop };

            const onMouseMove = (e) => {
                const deltaX = e.clientX - startPos.x;
                const deltaY = e.clientY - startPos.y;

                // Start dragging if moved more than 5 pixels
                if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                    isDragging = true;
                    icon.classList.add('dragging');
                }

                if (isDragging) {
                    const newX = origPos.x + deltaX;
                    const newY = origPos.y + deltaY;
                    
                    // Apply position during drag
                    icon.style.left = `${newX}px`;
                    icon.style.top = `${newY}px`;
                }
            };

            const onMouseUp = () => {
                if (isDragging) {
                    // Calculate the closest grid position
                    const rect = icon.getBoundingClientRect();
                    const containerRect = this.desktopArea.getBoundingClientRect();
                    
                    const relX = rect.left - containerRect.left;
                    const relY = rect.top - containerRect.top;
                    
                    // Snap to grid
                    const gridX = Math.round(relX / this.gridSize) * this.gridSize;
                    const gridY = Math.round(relY / this.gridSize) * this.gridSize;
                    
                    // Apply snapped position
                    icon.style.left = `${gridX}px`;
                    icon.style.top = `${gridY}px`;
                    
                    // Store the position in localStorage
                    const iconPositions = JSON.parse(localStorage.getItem('desktopIconPositions') || '{}');
                    iconPositions[icon.dataset.name] = { x: gridX, y: gridY };
                    localStorage.setItem('desktopIconPositions', JSON.stringify(iconPositions));
                }
                
                icon.classList.remove('dragging');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    createDesktopIcon(name, category, type) {
        const icon = document.createElement('div');
        icon.className = 'desktop-icon';
        icon.dataset.name = name;
        
        // Create icon image
        const iconElement = IconSet.getIcon(category, type);
        
        // Create label
        const label = document.createElement('div');
        label.className = 'icon-label';
        label.textContent = name;
    
        // Assemble icon
        icon.appendChild(iconElement);
        icon.appendChild(label);

        // Add event listeners
        icon.addEventListener('click', (e) => this.handleIconClick(e, icon));
        icon.addEventListener('dblclick', () => this.handleIconDoubleClick(name));
        icon.addEventListener('contextmenu', (e) => this.handleIconContextMenu(e, icon));

        // Make icon draggable
        this.makeIconDraggable(icon);

        // Check for saved position
        const iconPositions = JSON.parse(localStorage.getItem('desktopIconPositions') || '{}');
        if (iconPositions[name]) {
            icon.style.position = 'absolute';
            icon.style.left = `${iconPositions[name].x}px`;
            icon.style.top = `${iconPositions[name].y}px`;
        }

        // Add to desktop
        document.getElementById('desktop-icons').appendChild(icon);
        this.desktopIcons.set(name, icon);
        return icon;
    }

    handleIconClick(e, icon) {
        if (e.ctrlKey) {
            // Toggle selection with Ctrl
            icon.classList.toggle('selected');
            if (icon.classList.contains('selected')) {
                this.selectedIcons.add(icon.dataset.name);
            } else {
                this.selectedIcons.delete(icon.dataset.name);
            }
        } else {
            // Single selection
            this.deselectAllIcons();
            icon.classList.add('selected');
            this.selectedIcons.add(icon.dataset.name);
        }
    }

    handleIconDoubleClick(name) {
        const paths = {
            'Computer': '/ElxaOS',
            'Documents': '/ElxaOS/Users/kitkat/Documents',
            'Pictures': '/ElxaOS/Users/kitkat/Pictures',
            'Music': '/ElxaOS/Users/kitkat/Music',
            'Downloads': '/ElxaOS/Users/kitkat/Downloads',
            'Videos': '/ElxaOS/Users/kitkat/Videos',
            'Recycle Bin': '/ElxaOS/Recycle Bin'
        };
    
        const path = paths[name];
        if (path) {
            console.log('Opening folder:', name, 'path:', path);
            
            // Look for existing window with this path
            const windows = Array.from(document.querySelectorAll('.program-window'));
            const existingWindow = windows.find(w => w.dataset.path === path);
            
            if (existingWindow) {
                console.log('Found existing window for path:', path);
                if (existingWindow.classList.contains('hidden')) {
                    existingWindow.classList.remove('hidden');
                }
                this.windowManager.bringToFront(existingWindow);
                return;
            }
            
            console.log('Creating new window for path:', path);
            const params = { path: path };
            this.windowManager.createWindow('folder', params);
        }
    }

    handleIconContextMenu(e, icon) {
        e.preventDefault();
        if (!icon.classList.contains('selected')) {
            this.deselectAllIcons();
            icon.classList.add('selected');
            this.selectedIcons.add(icon.dataset.name);
        }
        this.showIconContextMenu(e, icon.dataset.name);
    }

    makeIconDraggable(icon) {
        let isDragging = false;
        let startPos = { x: 0, y: 0 };
        let origPos = { x: 0, y: 0 };

        icon.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Left click only
            
            isDragging = false;
            startPos = { x: e.clientX, y: e.clientY };
            origPos = { x: icon.offsetLeft, y: icon.offsetTop };

            const onMouseMove = (e) => {
                const deltaX = e.clientX - startPos.x;
                const deltaY = e.clientY - startPos.y;

                // Start dragging if moved more than 5 pixels
                if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                    isDragging = true;
                    icon.classList.add('dragging');
                }

                if (isDragging) {
                    icon.style.left = `${origPos.x + deltaX}px`;
                    icon.style.top = `${origPos.y + deltaY}px`;
                }
            };

            const onMouseUp = () => {
                icon.classList.remove('dragging');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    deselectAllIcons() {
        this.selectedIcons.clear();
        this.desktopIcons.forEach(icon => {
            icon.classList.remove('selected');
        });
    }

    updateSelectionFromBox(selectionBox) {
        const boxRect = selectionBox.getBoundingClientRect();
        
        this.desktopIcons.forEach((icon, name) => {
            const iconRect = icon.getBoundingClientRect();
            const isIntersecting = !(
                boxRect.right < iconRect.left || 
                boxRect.left > iconRect.right || 
                boxRect.bottom < iconRect.top || 
                boxRect.top > iconRect.bottom
            );

            if (isIntersecting) {
                icon.classList.add('selected');
                this.selectedIcons.add(name);
            } else {
                icon.classList.remove('selected');
                this.selectedIcons.delete(name);
            }
        });
    }

    showDesktopContextMenu(e) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <button data-action="view">View</button>
            <button data-action="refresh">Refresh</button>
            <hr>
            <button data-action="new-folder">New Folder</button>
            <button data-action="new-file">New File</button>
            <hr>
            <button data-action="properties">Properties</button>
        `;

        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        document.body.appendChild(menu);

        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    showIconContextMenu(e, iconName) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <button data-action="open">Open</button>
            <hr>
            <button data-action="cut">Cut</button>
            <button data-action="copy">Copy</button>
            <button data-action="paste">Paste</button>
            <button data-action="delete">Delete</button>
            <hr>
            <button data-action="rename">Rename</button>
            <button data-action="properties">Properties</button>
        `;

        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        document.body.appendChild(menu);

        menu.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            if (action) {
                this.handleContextMenuAction(action, iconName);
            }
            menu.remove();
        });

        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    handleContextMenuAction(action, iconName) {
        switch (action) {
            case 'open':
                this.handleIconDoubleClick(iconName);
                break;
            case 'rename':
                // TODO: Implement rename
                break;
            case 'delete':
                // TODO: Implement delete
                break;
            // Add other actions as needed
        }
    }
}