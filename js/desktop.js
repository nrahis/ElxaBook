// desktop.js
import { IconSet } from './icons.js'; 
import { RecycleBinHandler } from './recycle-bin-handler.js';

export class Desktop {
    constructor(fileSystem, windowManager) {
        if (!windowManager) {
            throw new Error('WindowManager is required for Desktop initialization');
        }
        
        this.fileSystem = fileSystem;
        this.windowManager = windowManager;
        this.desktopArea = document.getElementById('desktop-area');
        
        if (!this.desktopArea) {
            throw new Error('Desktop area element not found');
        }
        
        this.desktopIcons = new Map();
        this.selectedIcons = new Set();
        this.gridSize = 100;
        
        console.log('Desktop constructor - WindowManager status:', {
            exists: !!this.windowManager,
            apps: Array.from(this.windowManager.apps.keys())
        });
        
        // Bind methods to this instance to ensure proper 'this' context
        this.createDesktopIcon = this.createDesktopIcon.bind(this);
        this.handleIconClick = this.handleIconClick.bind(this);
        this.handleIconDoubleClick = this.handleIconDoubleClick.bind(this);
        this.handleIconContextMenu = this.handleIconContextMenu.bind(this);
        
        // Initialize only if WindowManager is ready
        if (this.windowManager.apps.size > 0) {
            this.initialize();
        } else {
            // Retry initialization after a short delay
            setTimeout(() => this.initialize(), 100);
        }

        this.recycleBinHandler = new RecycleBinHandler(fileSystem);

        // Add context menu handler for desktop background
        this.desktopArea.addEventListener('contextmenu', (e) => {
            // Only handle right-clicks directly on the desktop area, not on icons
            if (!e.target.closest('.desktop-icon') && !e.target.closest('.taskbar')) {
                e.preventDefault();
                e.stopPropagation();
                this.showDesktopContextMenu(e);
            }
        });
    }

    initialize() {
        console.log('Initializing desktop...');
        
        // First, remove any existing desktop-icons containers
        const existingContainers = this.desktopArea.querySelectorAll('#desktop-icons');
        existingContainers.forEach(container => container.remove());
        
        // Create fresh desktop icons container
        const iconsContainer = document.createElement('div');
        iconsContainer.id = 'desktop-icons';
        this.desktopArea.appendChild(iconsContainer);
    
        // Wait for WindowManager to be ready
        console.log('Checking WindowManager...', this.windowManager);
        if (!this.windowManager || this.windowManager.apps.size === 0) {
            console.error('WindowManager not ready. Apps registered:', 
                this.windowManager?.apps.size);
            setTimeout(() => this.initialize(), 100);
            return;
        }
    
        // Load saved icon positions first
        const savedPositions = this.loadIconPositions();
    
        // Create default desktop icons in specific order and positions
        const defaultIcons = [
            { name: 'Computer', category: 'system', type: 'computer', position: { column: 1, row: 1 } },
            { name: 'Recycle Bin', category: 'folder', type: 'recycle', position: { column: 1, row: 2 } },
            { name: 'Documents', category: 'folder', type: 'documents', position: { column: 1, row: 3 } },
            { name: 'Pictures', category: 'folder', type: 'pictures', position: { column: 1, row: 4 } },
            { name: 'Music', category: 'folder', type: 'music', position: { column: 1, row: 5 } },
            { name: 'Downloads', category: 'folder', type: 'downloads', position: { column: 2, row: 1 } }
        ];
    
        // Create default icons
        defaultIcons.forEach(iconInfo => {
            try {
                this.createDesktopIcon(iconInfo.name, iconInfo.category, iconInfo.type, iconInfo.position);
            } catch (error) {
                console.error(`Failed to create icon for ${iconInfo.name}:`, error);
            }
        });
    
        // Restore any saved shortcuts
        Object.entries(savedPositions).forEach(([name, data]) => {
            if (data.isShortcut && !this.desktopIcons.has(name)) {
                try {
                    const icon = this.createDesktopIcon(
                        name,
                        data.iconType === 'folder' ? 'folder' : 'file',
                        data.iconType,
                        { column: data.column, row: data.row }
                    );
                    
                    if (icon) {
                        // Add shortcut-specific properties
                        icon.dataset.targetPath = data.targetPath;
                        
                        // Add shortcut overlay
                        const iconElement = icon.querySelector('.file-icon');
                        if (iconElement) {
                            const shortcutOverlay = document.createElement('div');
                            shortcutOverlay.className = 'shortcut-overlay';
                            shortcutOverlay.innerHTML = '↗';
                            iconElement.appendChild(shortcutOverlay);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to restore shortcut: ${name}`, error);
                }
            }
        });
    
        this.setupEventListeners();
        console.log('Desktop initialization complete with WindowManager:', 
            { apps: Array.from(this.windowManager.apps.keys()) });
    }

    setupEventListeners() {
        // Add desktop area click handler for deselecting icons
        this.desktopArea.addEventListener('click', (e) => {
            console.log('Desktop area clicked');
            if (!e.target.closest('.desktop-icon')) {
                this.deselectAllIcons();
            }
        });

        // Test click handler on desktop area
        console.log('Adding test click handler to desktop-area:', this.desktopArea);
        this.desktopArea.addEventListener('dblclick', () => {
            console.log('Desktop area double clicked');
        });
    }

    createDesktopIcon(name, category, type, defaultPosition) {
        console.log(`Creating desktop icon: ${name}, type: ${type}`);
        
        let iconsContainer = document.getElementById('desktop-icons');
        if (!iconsContainer) {
            iconsContainer = document.createElement('div');
            iconsContainer.id = 'desktop-icons';
            this.desktopArea.appendChild(iconsContainer);
        }
        
        const icon = document.createElement('div');
        icon.className = 'desktop-icon';
        icon.dataset.name = name;
        icon.dataset.type = type;
        
        // Create icon image
        const iconElement = IconSet.getIcon(category, type);
        iconElement.style.pointerEvents = 'none';  // Ensure clicks go to parent
        
        // Create label
        const label = document.createElement('div');
        label.className = 'icon-label';
        label.textContent = name;
        label.style.pointerEvents = 'none';  // Ensure clicks go to parent
        
        // Assemble icon
        icon.appendChild(iconElement);
        icon.appendChild(label);
    
        // Set position
        const savedPositions = this.loadIconPositions();
        const position = savedPositions[name] || defaultPosition;
        
        icon.style.gridColumn = position.column;
        icon.style.gridRow = position.row;
    
        // Explicitly handle double-click
        let clickTimeout = null;
        let clickCount = 0;
    
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            clickCount++;
            
            if (clickCount === 1) {
                clickTimeout = setTimeout(() => {
                    clickCount = 0;
                    this.handleIconClick(e, icon);
                }, 300);
            } else if (clickCount === 2) {
                clearTimeout(clickTimeout);
                clickCount = 0;
                this.handleIconDoubleClick(name);
            }
        });
    
        // Add context menu handler
        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleIconContextMenu(e, icon);
        });

        // Add to desktop
        iconsContainer.appendChild(icon);
        this.desktopIcons.set(name, icon);
        
        // Make the icon draggable - Add this line
        this.makeIconDraggable(icon);
        
        console.log(`Icon ${name} created and added to desktop`);
        return icon;
    }
    
    getIconPath(name, currentUser) {
        const paths = {
            'Computer': '/ElxaOS',
            'Documents': `/ElxaOS/Users/${currentUser}/Documents`,
            'Pictures': `/ElxaOS/Users/${currentUser}/Pictures`,
            'Music': `/ElxaOS/Users/${currentUser}/Music`,
            'Downloads': `/ElxaOS/Users/${currentUser}/Downloads`,
            'Videos': `/ElxaOS/Users/${currentUser}/Videos`,
            'Recycle Bin': '/ElxaOS/Recycle Bin'
        };
        return paths[name] || null;
    }
    
    makeIconDraggable(icon) {
        let isDragging = false;
        let startPos = { x: 0, y: 0 };
        let dragElement = null;
        let originalGridArea = null;
        let allOtherIcons = [];
    
        icon.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Left click only
            
            isDragging = false;
            startPos = { x: e.clientX, y: e.clientY };
            
            // Store original position
            originalGridArea = {
                column: window.getComputedStyle(icon).gridColumnStart,
                row: window.getComputedStyle(icon).gridRowStart
            };
    
            // Store all other icons' positions
            allOtherIcons = Array.from(document.querySelectorAll('.desktop-icon'))
                .filter(i => i !== icon)
                .map(i => ({
                    element: i,
                    column: window.getComputedStyle(i).gridColumnStart,
                    row: window.getComputedStyle(i).gridRowStart
                }));
    
            const onMouseMove = (e) => {
                const deltaX = e.clientX - startPos.x;
                const deltaY = e.clientY - startPos.y;
    
                if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                    isDragging = true;
                    
                    // Create drag ghost
                    dragElement = icon.cloneNode(true);
                    dragElement.classList.add('dragging');
                    document.body.appendChild(dragElement);
                    
                    // Hide original but maintain its space
                    icon.style.opacity = '0';
                    
                    // Lock all other icons in place
                    allOtherIcons.forEach(({ element, column, row }) => {
                        element.style.gridColumn = column;
                        element.style.gridRow = row;
                    });
                }
    
                if (isDragging && dragElement) {
                    dragElement.style.left = `${e.clientX - (dragElement.offsetWidth / 2)}px`;
                    dragElement.style.top = `${e.clientY - 20}px`;
                    
                    const dropPos = this.calculateDropPosition(e.clientX, e.clientY);
                    this.highlightDropPosition(dropPos);
                }
            };
    
            const onMouseUp = (e) => {
                if (isDragging && dragElement) {
                    const dropPos = this.calculateDropPosition(e.clientX, e.clientY);
                    
                    if (dropPos) {
                        // Update icon position
                        icon.style.gridColumn = `${dropPos.column}`;
                        icon.style.gridRow = `${dropPos.row}`;
                        
                        // Store new position
                        const iconPositions = this.loadIconPositions();
                        iconPositions[icon.dataset.name] = dropPos;
                        this.saveIconPositions(iconPositions);
                        
                        // After placement, reorganize other icons if needed
                        this.reorganizeIcons(icon, originalGridArea, dropPos);
                    } else {
                        // Return to original position
                        icon.style.gridColumn = originalGridArea.column;
                        icon.style.gridRow = originalGridArea.row;
                    }
                }
                
                // Clean up
                if (dragElement) {
                    dragElement.remove();
                }
                icon.style.opacity = '1';
                this.removeDropHighlight();
                
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
    
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
    
    reorganizeIcons(movedIcon, oldPos, newPos) {
        // Only reorganize if necessary (if icon was moved to a position that was occupied)
        const occupiedPositions = new Set();
        
        // Collect all current positions
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            const column = window.getComputedStyle(icon).gridColumnStart;
            const row = window.getComputedStyle(icon).gridRowStart;
            occupiedPositions.add(`${column},${row}`);
        });
    
        // If we have duplicates, reorganize
        if (occupiedPositions.size < document.querySelectorAll('.desktop-icon').length) {
            // Sort icons by position (top to bottom, left to right)
            const icons = Array.from(document.querySelectorAll('.desktop-icon'))
                .filter(icon => icon !== movedIcon)
                .sort((a, b) => {
                    const aCol = parseInt(window.getComputedStyle(a).gridColumnStart);
                    const aRow = parseInt(window.getComputedStyle(a).gridRowStart);
                    const bCol = parseInt(window.getComputedStyle(b).gridColumnStart);
                    const bRow = parseInt(window.getComputedStyle(b).gridRowStart);
                    
                    if (aCol === bCol) return aRow - bRow;
                    return aCol - bCol;
                });
    
            // Find next available position for each icon
            icons.forEach(icon => {
                let column = 1;
                let row = 1;
                
                while (occupiedPositions.has(`${column},${row}`)) {
                    row++;
                    if (row > 5) {
                        row = 1;
                        column++;
                    }
                }
                
                icon.style.gridColumn = column;
                icon.style.gridRow = row;
                occupiedPositions.add(`${column},${row}`);
                
                // Save new position
                const iconPositions = this.loadIconPositions();
                iconPositions[icon.dataset.name] = dropPos;
                this.saveIconPositions(iconPositions);
            });
        }
    }
    
    calculateDropPosition(x, y) {
        const container = document.getElementById('desktop-icons');
        const rect = container.getBoundingClientRect();
        
        // Calculate grid position
        const cellWidth = 100; // Grid cell width (including gap)
        const cellHeight = 100; // Grid cell height (including gap)
        
        // Calculate relative position in the grid
        const relX = x - rect.left;
        const relY = y - rect.top;
        
        // Calculate grid column and row
        const column = Math.floor(relX / cellWidth) + 1;
        const row = Math.floor(relY / cellHeight) + 1;
        
        // Ensure we're within grid boundaries
        const maxColumns = Math.floor(rect.width / cellWidth);
        const maxRows = Math.floor(rect.height / cellHeight);
        
        if (column > 0 && column <= maxColumns && row > 0 && row <= maxRows) {
            return { column, row };
        }
        
        return null;
    }
    
    highlightDropPosition(pos) {
        this.removeDropHighlight();
        
        if (pos) {
            const highlight = document.createElement('div');
            highlight.className = 'grid-drop-highlight';
            highlight.style.cssText = `
                position: absolute;
                width: 90px;
                height: 90px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px dashed rgba(255, 255, 255, 0.5);
                border-radius: 5px;
                pointer-events: none;
                grid-column: ${pos.column};
                grid-row: ${pos.row};
            `;
            document.getElementById('desktop-icons').appendChild(highlight);
        }
    }
    
    removeDropHighlight() {
        const highlight = document.querySelector('.grid-drop-highlight');
        if (highlight) {
            highlight.remove();
        }
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

// In the Desktop class, update the createShortcut method:

    createShortcut(targetPath, name, type) {
        console.log('Creating desktop shortcut for:', {targetPath, name, type});
        
        // Ensure we have the desktop area
        if (!this.desktopArea) {
            console.error('Desktop area not found');
            throw new Error('Desktop area not initialized');
        }
        
        // Ensure we have a container for icons
        let iconsContainer = document.getElementById('desktop-icons');
        if (!iconsContainer) {
            console.log('Creating new desktop-icons container');
            iconsContainer = document.createElement('div');
            iconsContainer.id = 'desktop-icons';
            this.desktopArea.appendChild(iconsContainer);
        }
        
        // Generate a unique shortcut name
        let shortcutName = `${name} - Shortcut`;
        let counter = 1;
        while (this.desktopIcons.has(shortcutName)) {
            shortcutName = `${name} - Shortcut (${counter})`;
            counter++;
        }
        
        // Calculate maximum available rows based on desktop area height
        const desktopRect = this.desktopArea.getBoundingClientRect();
        const maxRows = Math.floor((desktopRect.height - 40) / this.gridSize); // Subtract some padding and account for taskbar
        
        // Find first available position
        let position = { column: 1, row: 1 };
        const occupiedPositions = new Set();
        
        this.desktopIcons.forEach((icon) => {
            if (icon && icon.style) {
                const col = parseInt(window.getComputedStyle(icon).gridColumnStart) || 1;
                const row = parseInt(window.getComputedStyle(icon).gridRowStart) || 1;
                occupiedPositions.add(`${col},${row}`);
            }
        });
        
        // Find next available position within grid boundaries
        let foundPosition = false;
        while (!foundPosition) {
            if (!occupiedPositions.has(`${position.column},${position.row}`)) {
                if (position.row <= maxRows) {
                    foundPosition = true;
                } else {
                    // Move to next column if we exceed maximum rows
                    position.column++;
                    position.row = 1;
                }
            } else {
                position.row++;
                if (position.row > maxRows) {
                    position.row = 1;
                    position.column++;
                }
            }
        }

        // Rest of the createShortcut method remains the same...
        try {
            // Create shortcut icon
            const shortcutIcon = this.createDesktopIcon(
                shortcutName,
                type === 'folder' ? 'folder' : 'file',
                type,
                position
            );
            
            if (!shortcutIcon) {
                throw new Error('Failed to create desktop icon');
            }
            
            // Store the target path in the icon's dataset
            shortcutIcon.dataset.targetPath = targetPath;
            
            // Add shortcut overlay
            const iconElement = shortcutIcon.querySelector('.file-icon');
            if (iconElement) {
                const shortcutOverlay = document.createElement('div');
                shortcutOverlay.className = 'shortcut-overlay';
                shortcutOverlay.innerHTML = '↗';
                iconElement.appendChild(shortcutOverlay);
            }
            
            // Save shortcut data
            const currentUser = this.fileSystem.currentUsername;
            const shortcutsPath = `/ElxaOS/Users/${currentUser}/Desktop`;
            
            this.fileSystem.saveFile(
                shortcutsPath,
                `${shortcutName}.lnk`,
                JSON.stringify({
                    targetPath: targetPath,
                    type: type
                }),
                'shortcut'
            );

            // Add to desktop icons map
            this.desktopIcons.set(shortcutName, shortcutIcon);
            
            console.log('Successfully created shortcut:', shortcutName);

            const iconPositions = this.loadIconPositions();
            iconPositions[shortcutName] = {
                column: position.column,
                row: position.row,
                isShortcut: true,
                targetPath: targetPath,
                iconType: type
            };
            this.saveIconPositions(iconPositions);

            return shortcutIcon;
        } catch (error) {
            console.error('Error in createShortcut:', error);
            throw error;
        }
    }

    handleIconDoubleClick(name) {
        console.log('Double click on desktop icon:', name);
        
        if (!this.windowManager) {
            console.error('WindowManager not available');
            return;
        }
    
        console.log('Available apps:', Array.from(this.windowManager.apps.keys()));
        
        const currentUser = this.fileSystem.currentUsername;
        const paths = {
            'Computer': '/ElxaOS',
            'Documents': `/ElxaOS/Users/${currentUser}/Documents`,
            'Pictures': `/ElxaOS/Users/${currentUser}/Pictures`,
            'Music': `/ElxaOS/Users/${currentUser}/Music`,
            'Downloads': `/ElxaOS/Users/${currentUser}/Downloads`,
            'Videos': `/ElxaOS/Users/${currentUser}/Videos`,
            'Recycle Bin': '/ElxaOS/Recycle Bin'
        };
    
        const path = paths[name];
        if (path) {
            console.log(`Opening ${name} with path: ${path}`);
            try {
                if (name === 'Computer') {
                    this.windowManager.createWindow('computer');
                } else {
                    this.windowManager.createWindow('folder', { path });
                }
            } catch (error) {
                console.error('Failed to open window:', error);
            }
        }
    }

    handleIconContextMenu(e, icon) {
        e.preventDefault();
        if (!icon.classList.contains('selected')) {
            this.deselectAllIcons();
            icon.classList.add('selected');
            this.selectedIcons.add(icon.dataset.name);
        }
        
        const isRecycleBin = icon.dataset.name === 'Recycle Bin';
        if (isRecycleBin) {
            this.showRecycleBinContextMenu(e);
        } else {
            this.showIconContextMenu(e, icon.dataset.name);
        }
    }
    
    // Add new method for Recycle Bin context menu
    showRecycleBinContextMenu(e) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <button data-action="open">Open</button>
            <hr>
            <button data-action="empty-recycle-bin">Empty Recycle Bin</button>
            <hr>
            <button data-action="properties">Properties</button>
        `;
    
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        document.body.appendChild(menu);
    
        menu.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            if (action) {
                this.handleRecycleBinContextMenuAction(action);
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
    
    // Add new method for handling Recycle Bin actions
    handleRecycleBinContextMenuAction(action) {
        switch (action) {
            case 'open':
                this.windowManager.createWindow('folder', { path: '/ElxaOS/Recycle Bin' });
                break;
                
            case 'empty-recycle-bin':
                if (confirm('Are you sure you want to permanently delete all items in the Recycle Bin?')) {
                    try {
                        this.recycleBinHandler.emptyRecycleBin();
                    } catch (error) {
                        alert('Failed to empty Recycle Bin: ' + error.message);
                    }
                }
                break;
                
            case 'properties':
                // Show Recycle Bin properties
                const contents = this.fileSystem.getFolderContents('/ElxaOS/Recycle Bin');
                const itemCount = contents.files.length + contents.folders.length;
                alert(
                    'Recycle Bin Properties\n\n' +
                    `Items: ${itemCount}\n` +
                    'Location: /ElxaOS/Recycle Bin'
                );
                break;
        }
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
        // Remove any existing context menus
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        // Use selectedIcons instead of selectedItems
        menu.innerHTML = `
            <button data-action="cut" ${!this.selectedIcons.size ? 'disabled' : ''}>Cut</button>
            <button data-action="copy" ${!this.selectedIcons.size ? 'disabled' : ''}>Copy</button>
            <button data-action="paste" ${!this.clipboard ? 'disabled' : ''}>Paste</button>
            <hr>
            <button data-action="personalize">Personalize</button>
        `;
    
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        document.body.appendChild(menu);
    
        menu.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            if (!action || event.target.disabled) return;
    
            this.handleDesktopContextMenuAction(action);
            menu.remove();
        });
    
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
    
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }
    
    handleDesktopContextMenuAction(action) {
        switch (action) {
            case 'cut':
                if (this.selectedIcons.size > 0) {
                    this.clipboard = { type: 'cut', items: Array.from(this.selectedIcons) };
                    // Add visual feedback for cut items
                    this.desktopIcons.forEach((icon, name) => {
                        if (this.selectedIcons.has(name)) {
                            icon.style.opacity = '0.5';
                        }
                    });
                }
                break;
    
            case 'copy':
                if (this.selectedIcons.size > 0) {
                    this.clipboard = { type: 'copy', items: Array.from(this.selectedIcons) };
                }
                break;
    
            case 'paste':
                if (this.clipboard && this.clipboard.items) {
                    const currentUser = this.fileSystem.currentUsername;
                    const desktopPath = `/ElxaOS/Users/${currentUser}/Desktop`;
                    
                    this.clipboard.items.forEach(itemName => {
                        const sourcePath = this.fileSystem.joinPaths(desktopPath, itemName);
                        try {
                            const itemType = this.fileSystem.getFileType(sourcePath);
                            
                            if (itemType === 'folder') {
                                if (this.clipboard.type === 'cut') {
                                    this.fileSystem.moveFolder(sourcePath, desktopPath);
                                } else {
                                    this.fileSystem.copyFolder(sourcePath, desktopPath);
                                }
                            } else {
                                if (this.clipboard.type === 'cut') {
                                    this.fileSystem.moveFile(sourcePath, desktopPath);
                                } else {
                                    this.fileSystem.copyFile(sourcePath, desktopPath);
                                }
                            }
                        } catch (error) {
                            console.error(`Failed to paste ${itemName}:`, error);
                        }
                    });
    
                    // Clear cut effect if this was a cut operation
                    if (this.clipboard.type === 'cut') {
                        this.desktopIcons.forEach(icon => icon.style.opacity = '1');
                        this.clipboard = null;
                    }
    
                    // Refresh desktop icons
                    this.initialize();
                }
                break;
    
            case 'personalize':
                if (this.windowManager) {
                    this.windowManager.createWindow('settings');
                }
                break;
        }
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

    saveIconPositions(positions) {
        const settingsPath = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.settings/user.config`;
        try {
            const settingsFile = this.fileSystem.getFile(settingsPath);
            const settings = settingsFile ? JSON.parse(settingsFile.content) : {};
            
            if (!settings.display) settings.display = {};
            
            // Enhance the positions object with shortcut data
            this.desktopIcons.forEach((icon, name) => {
                if (positions[name]) {
                    // Preserve existing position data
                    const position = positions[name];
                    
                    // Add shortcut-specific data if this is a shortcut
                    if (icon.dataset.targetPath) {
                        position.isShortcut = true;
                        position.targetPath = icon.dataset.targetPath;
                        position.iconType = icon.dataset.type;
                    }
                }
            });
            
            settings.display.desktopIcons = positions;
            
            this.fileSystem.saveFile(
                `/ElxaOS/Users/${this.fileSystem.currentUsername}/.settings`,
                'user.config',
                JSON.stringify(settings, null, 2),
                'settings'
            );
        } catch (error) {
            console.error('Failed to save icon positions:', error);
        }
    }
    
    loadIconPositions() {
        const settingsPath = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.settings/user.config`;
        try {
            const settingsFile = this.fileSystem.getFile(settingsPath);
            if (settingsFile) {
                const settings = JSON.parse(settingsFile.content);
                return settings.display?.desktopIcons || {};
            }
        } catch (error) {
            console.error('Failed to load icon positions:', error);
        }
        return {};
    }
}