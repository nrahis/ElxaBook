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
        
        // Bind methods
        this.createDesktopIcon = this.createDesktopIcon.bind(this);
        this.handleIconClick = this.handleIconClick.bind(this);
        this.handleIconDoubleClick = this.handleIconDoubleClick.bind(this);
        this.handleIconContextMenu = this.handleIconContextMenu.bind(this);
        
        // Initialize asynchronously
        if (this.windowManager.apps.size > 0) {
            this.initialize().catch(error => {
                console.error('Failed to initialize desktop:', error);
            });
        } else {
            setTimeout(() => {
                this.initialize().catch(error => {
                    console.error('Failed to initialize desktop:', error);
                });
            }, 100);
        }
    
        this.recycleBinHandler = new RecycleBinHandler(fileSystem);
    
        // Add context menu handler for desktop background
        this.desktopArea.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('.desktop-icon') && !e.target.closest('.taskbar')) {
                e.preventDefault();
                e.stopPropagation();
                this.showDesktopContextMenu(e);
            }
        });
    }

    async initialize() {
        console.log('Initializing desktop...');
        
        // First, sync default items with Desktop folder
        this.syncDefaultDesktopItems();
        
        // Remove existing desktop-icons containers
        const existingContainers = this.desktopArea.querySelectorAll('#desktop-icons');
        existingContainers.forEach(container => container.remove());
        
        // Create fresh desktop icons container
        const iconsContainer = document.createElement('div');
        iconsContainer.id = 'desktop-icons';
        iconsContainer.style.display = 'grid';
        iconsContainer.style.gridTemplateColumns = 'repeat(auto-fill, 100px)';
        iconsContainer.style.gridGap = '10px';
        iconsContainer.style.padding = '10px';
        this.desktopArea.appendChild(iconsContainer);
    
        // Wait for WindowManager to be ready
        if (!this.windowManager || this.windowManager.apps.size === 0) {
            console.error('WindowManager not ready. Apps registered:', 
                this.windowManager?.apps.size);
            setTimeout(() => this.initialize(), 100);
            return;
        }
    
        try {
            // Load saved icon positions first
            const savedPositions = await this.loadIconPositions();
            
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
    
            // Get current user's desktop contents
            const currentUser = this.fileSystem.currentUsername;
            const desktopPath = `/ElxaOS/Users/${currentUser}/Desktop`;
            const desktopContents = this.fileSystem.getFolderContents(desktopPath);
    
            // Restore shortcuts from the Desktop folder
            for (const file of desktopContents.files) {
                if (file.name.endsWith('.lnk')) {
                    try {
                        const shortcutFile = await this.fileSystem.getFile(
                            this.fileSystem.joinPaths(desktopPath, file.name)
                        );
                        const shortcutData = JSON.parse(shortcutFile.content);
                        const baseName = file.name.replace('.lnk', '');
                        
                        if (!this.desktopIcons.has(baseName)) {
                            const position = savedPositions[baseName] || this.findNextAvailablePosition();
                            
                            const icon = this.createDesktopIcon(
                                baseName,
                                shortcutData.iconCategory || (shortcutData.type === 'folder' ? 'folder' : 'file'),
                                shortcutData.iconType || shortcutData.type,
                                position
                            );
    
                            if (icon) {
                                icon.dataset.targetPath = shortcutData.targetPath;
                                if (shortcutData.program) icon.dataset.program = shortcutData.program;
                                icon.dataset.shortcutType = shortcutData.type;
                                
                                if (!shortcutData.isDefault) {
                                    const iconElement = icon.querySelector('.file-icon');
                                    if (iconElement) {
                                        const shortcutOverlay = document.createElement('div');
                                        shortcutOverlay.className = 'shortcut-overlay';
                                        shortcutOverlay.innerHTML = '↗';
                                        iconElement.appendChild(shortcutOverlay);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to restore shortcut: ${file.name}`, error);
                    }
                }
            }
    
            // Set up event listeners and drop target
            this.setupEventListeners();
            this.setupDesktopDropTarget();
    
        } catch (error) {
            console.error('Error during desktop initialization:', error);
        }
    }
    
    // Add helper method to find next available position
    findNextAvailablePosition() {
        const occupiedPositions = new Set();
        
        // Collect all current positions
        this.desktopIcons.forEach(icon => {
            const column = parseInt(window.getComputedStyle(icon).gridColumnStart) || 1;
            const row = parseInt(window.getComputedStyle(icon).gridRowStart) || 1;
            occupiedPositions.add(`${column},${row}`);
        });
    
        // Calculate maximum rows based on desktop height
        const desktopRect = this.desktopArea.getBoundingClientRect();
        const maxRows = Math.floor((desktopRect.height - 40) / this.gridSize);
    
        // Find first available position
        let column = 1;
        let row = 1;
        
        while (occupiedPositions.has(`${column},${row}`)) {
            row++;
            if (row > maxRows) {
                row = 1;
                column++;
            }
        }
    
        return { column, row };
    }

    syncDefaultDesktopItems() {
        // Get current user's desktop path
        const currentUser = this.fileSystem.currentUsername;
        const desktopPath = `/ElxaOS/Users/${currentUser}/Desktop`;
        
        // Create Map to store existing shortcuts
        const existingShortcuts = new Map();
        
        // Get all existing shortcuts from the Desktop folder
        const contents = this.fileSystem.getFolderContents(desktopPath);
        if (contents && contents.files) {
            contents.files.forEach(file => {
                if (file.name.endsWith('.lnk')) {
                    try {
                        const shortcutData = JSON.parse(file.content);
                        existingShortcuts.set(file.name, shortcutData);
                    } catch (error) {
                        console.error('Error parsing shortcut:', error);
                    }
                }
            });
        }
        
        // Default items with their target paths, icon types and categories
        const defaultItems = [
            { 
                name: 'Computer', 
                targetPath: '/ElxaOS', 
                type: 'computer', 
                category: 'system',
                position: { column: 1, row: 1 }
            },
            { 
                name: 'Recycle Bin', 
                targetPath: '/ElxaOS/Recycle Bin', 
                type: 'recycle', 
                category: 'folder',
                position: { column: 1, row: 2 }
            },
            { 
                name: 'Documents', 
                targetPath: `/ElxaOS/Users/${currentUser}/Documents`, 
                type: 'documents', 
                category: 'folder',
                position: { column: 1, row: 3 }
            },
            { 
                name: 'Pictures', 
                targetPath: `/ElxaOS/Users/${currentUser}/Pictures`, 
                type: 'pictures', 
                category: 'folder',
                position: { column: 1, row: 4 }
            },
            { 
                name: 'Music', 
                targetPath: `/ElxaOS/Users/${currentUser}/Music`, 
                type: 'music', 
                category: 'folder',
                position: { column: 1, row: 5 }
            },
            { 
                name: 'Downloads', 
                targetPath: `/ElxaOS/Users/${currentUser}/Downloads`, 
                type: 'downloads', 
                category: 'folder',
                position: { column: 2, row: 1 }
            }
        ];
        
        // Create shortcuts in Desktop folder for default items
        defaultItems.forEach(item => {
            const shortcutPath = this.fileSystem.joinPaths(desktopPath, `${item.name}.lnk`);
            const shortcutContent = JSON.stringify({
                targetPath: item.targetPath,
                type: item.type,
                category: item.category,
                isDefault: true,
                position: item.position,
                iconType: item.type,
                iconCategory: item.category
            });
    
            // Create or update default shortcuts
            this.fileSystem.saveFile(
                desktopPath,
                `${item.name}.lnk`,
                shortcutContent,
                'shortcut',
                {
                    isDefault: true,
                    iconType: item.type,
                    iconCategory: item.category
                }
            );
        });
        
        // Preserve all non-default shortcuts
        existingShortcuts.forEach((shortcutData, fileName) => {
            if (!shortcutData.isDefault) {
                const shortcutPath = this.fileSystem.joinPaths(desktopPath, fileName);
                // Only recreate if it doesn't exist
                if (!this.fileSystem.fileExists(shortcutPath)) {
                    this.fileSystem.saveFile(
                        desktopPath,
                        fileName,
                        JSON.stringify({
                            ...shortcutData,
                            isDefault: false
                        }),
                        'shortcut'
                    );
                }
            }
        });
    }

    setupDesktopDropTarget() {
        const desktopArea = document.getElementById('desktop-area');
        
        desktopArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Add visual feedback
            if (!e.target.closest('.desktop-icon')) {
                desktopArea.classList.add('drag-over');
            }
        });
    
        desktopArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!e.target.closest('.desktop-icon')) {
                desktopArea.classList.remove('drag-over');
            }
        });
    
        desktopArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            desktopArea.classList.remove('drag-over');
            
            // Get the dragged path from the data transfer
            const sourcePath = e.dataTransfer.getData('text/plain');
            console.log('Drop received with source path:', sourcePath);
            
            if (!sourcePath) {
                console.error('No source path provided in drag data');
                return;
            }
    
            // Get file/folder information
            let sourceInfo = this.fileSystem.getFile(sourcePath);
            if (!sourceInfo) {
                sourceInfo = this.fileSystem.getFolderInfo(sourcePath);
            }
            
            if (!sourceInfo) {
                console.error('Source info not found for path:', sourcePath);
                console.log('Current file system state:', {
                    path: sourcePath,
                    files: JSON.parse(localStorage.getItem('elxaos_files')),
                    folders: JSON.parse(localStorage.getItem('elxaos_folders'))
                });
                return;
            }
    
            console.log('Drop source info:', sourceInfo);
    
            // Don't allow dropping protected items
            if (sourceInfo.isProtected) {
                alert('Protected items cannot be moved to the desktop');
                return;
            }
    
            try {
                // Create shortcut on desktop
                const name = sourcePath.split('/').pop();
                const type = sourceInfo.type === 'folder' ? 'folder' : 
                            sourceInfo.type === 'program' ? 'program' : 'file';
                
                await this.createShortcut(sourcePath, name, type);
                console.log('Shortcut created successfully');
            } catch (error) {
                console.error('Failed to create desktop shortcut:', error);
                alert('Unable to create desktop shortcut: ' + error.message);
            }
        });
    }
    
    // Also add a helper method to validate paths
    validatePath(path) {
        if (!path) return false;
        
        // Check if path exists in either files or folders
        const fileExists = this.fileSystem.getFile(path) !== null;
        const folderExists = this.fileSystem.getFolderInfo(path) !== null;
        
        return fileExists || folderExists;
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
        
        // In createDesktopIcon method in Desktop.js
        let iconCategory = category;
        let iconType = type;

        // Create the basic icon element
        const icon = document.createElement('div');
        icon.className = 'desktop-icon';
        icon.dataset.name = name;
        icon.dataset.type = type;

        // If it's a shortcut, determine the proper icon type
        if (name.endsWith('.lnk')) {
            try {
                const fullPath = this.fileSystem.joinPaths(this.currentPath, name);
                const shortcutFile = this.fileSystem.getFile(fullPath);
                if (shortcutFile && shortcutFile.content) {
                    const shortcutData = JSON.parse(shortcutFile.content);
                    const targetInfo = shortcutData.type === 'folder' ?
                        this.fileSystem.getFolderInfo(shortcutData.targetPath) :
                        this.fileSystem.getFile(shortcutData.targetPath);
                    
                    if (targetInfo) {
                        if (targetInfo.type === 'program') {
                            iconCategory = 'program';
                            iconType = targetInfo;  // Pass the whole file info for program icons
                        } else {
                            iconCategory = targetInfo.type === 'folder' ? 'folder' : 'file';
                            iconType = targetInfo.type;
                        }
                    }
                }
            } catch (error) {
                console.warn('Error determining shortcut icon:', error);
            }
        }

        // Create icon image with determined category and type
        const iconElement = IconSet.getIcon(iconCategory, iconType);
        iconElement.style.pointerEvents = 'none';
        
        // Create label - strip .lnk extension for display
        const label = document.createElement('div');
        label.className = 'icon-label';
        label.textContent = name.replace(/\.lnk$/, '');
        label.style.pointerEvents = 'none';
        
        // Add shortcut overlay if it's a shortcut
        if (name.endsWith('.lnk')) {
            const shortcutOverlay = document.createElement('div');
            shortcutOverlay.className = 'shortcut-overlay';
            shortcutOverlay.innerHTML = '↗';
            iconElement.appendChild(shortcutOverlay);
        }
        
        // Assemble icon
        icon.appendChild(iconElement);
        icon.appendChild(label);
    
        // Set position
        const savedPositions = this.loadIconPositions();
        const position = savedPositions[name] || defaultPosition;
        
        icon.style.gridColumn = position.column;
        icon.style.gridRow = position.row;
    
        // Add event listeners (rest of the method remains the same...)
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
                this.handleIconDoubleClick(name.replace(/\.lnk$/, ''));
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
        this.desktopIcons.set(name.replace(/\.lnk$/, ''), icon);
        console.log(`Icon ${name} created and added to desktop`);
        this.makeIconDraggable(icon);
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

    createShortcut(targetPath, name, type) {
        console.log('Creating desktop shortcut for:', {targetPath, name, type});
        
        // Get the target's file/folder info
        const targetInfo = this.fileSystem.getFile(targetPath) || 
                          this.fileSystem.getFolderInfo(targetPath);
        
        if (!targetInfo) {
            console.error('Target info not found for:', targetPath);
            throw new Error('Target not found');
        }
    
        let shortcutName = `${name}`;
        let counter = 1;
        while (this.desktopIcons.has(shortcutName)) {
            shortcutName = `${name} (${counter})`;
            counter++;
        }
    
        // Determine proper icon category and type
        let iconCategory, iconType;
    
        if (targetInfo.type === 'program') {
            iconCategory = 'program';
            iconType = targetInfo;  // Pass the whole program info for proper icon
        } else if (type === 'folder' || targetInfo.type === 'folder') {
            iconCategory = 'folder';
            // Check for special system folders
            if (targetInfo.name === 'Documents') iconType = 'documents';
            else if (targetInfo.name === 'Pictures') iconType = 'pictures';
            else if (targetInfo.name === 'Music') iconType = 'music';
            else if (targetInfo.name === 'Downloads') iconType = 'downloads';
            else if (targetInfo.name === 'Recycle Bin') iconType = 'recycle';
            else iconType = 'default';
        } else {
            iconCategory = 'file';
            iconType = targetInfo.type || 'default';
        }
        
        // Find first available position
        const position = this.findNextAvailablePosition();
    
        try {
            // Create desktop icon
            const shortcutIcon = this.createDesktopIcon(
                shortcutName,
                iconCategory,
                iconType,
                position
            );
            
            if (!shortcutIcon) {
                throw new Error('Failed to create desktop icon');
            }
            
            // Store the target path in the icon's dataset
            shortcutIcon.dataset.targetPath = targetPath;
            shortcutIcon.dataset.shortcutType = targetInfo.type;
            if (targetInfo.program) {
                shortcutIcon.dataset.program = targetInfo.program;
            }
            
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
                    type: targetInfo.type,
                    program: targetInfo.program, // Important for program shortcuts
                    category: iconCategory,
                    iconType: iconType,
                    iconCategory: iconCategory,
                    originalName: targetInfo.name
                }),
                'shortcut'
            );
    
            // Add to desktop icons map
            this.desktopIcons.set(shortcutName, shortcutIcon);
            
            // Save icon position
            const iconPositions = this.loadIconPositions();
            iconPositions[shortcutName] = {
                column: position.column,
                row: position.row,
                isShortcut: true,
                targetPath: targetPath,
                iconType: iconType,
                category: iconCategory,
                program: targetInfo.program // Save program info in positions
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
        
        // First check if this is a shortcut
        const icon = this.desktopIcons.get(name);
        if (icon && icon.dataset.targetPath) {
            console.log('Opening shortcut with target path:', icon.dataset.targetPath);
            
            const fullPath = icon.dataset.targetPath;
            const shortcutType = icon.dataset.shortcutType;
            const program = icon.dataset.program;
    
            try {
                if (shortcutType === 'program' || program) {
                    // Handle program shortcuts directly
                    this.windowManager.createWindow(program || shortcutType);
                } else if (shortcutType === 'folder') {
                    // For folder shortcuts
                    this.windowManager.createWindow('folder', { path: fullPath });
                } else {
                    // For file shortcuts
                    const fileInfo = this.fileSystem.getFile(fullPath);
                    if (fileInfo) {
                        switch (fileInfo.type) {
                            case 'text':
                                this.windowManager.createWindow('notepad', { file: fileInfo });
                                break;
                            case 'image':
                                this.windowManager.createWindow('paint', { file: fileInfo });
                                break;
                            case 'slideshow':
                                this.windowManager.createWindow('slideshow', { file: fileInfo });
                                break;
                            default:
                                this.windowManager.createWindow('notepad', { file: fileInfo });
                        }
                    }
                }
            } catch (error) {
                console.error('Error opening shortcut:', error);
                alert('Error opening shortcut: ' + error.message);
            }
            return;
        }
        
        // Handle default system folders as before
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
                
            case 'delete':
                // Get current user's desktop path
                const currentUser = this.fileSystem.currentUsername;
                const desktopPath = `/ElxaOS/Users/${currentUser}/Desktop`;
                const shortcutPath = `${desktopPath}/${iconName}.lnk`;
                
                try {
                    // Move the shortcut file to Recycle Bin
                    this.recycleBinHandler.moveToRecycleBin(shortcutPath);
                    
                    // Remove the icon from desktop
                    const icon = this.desktopIcons.get(iconName);
                    if (icon) {
                        icon.remove();
                        this.desktopIcons.delete(iconName);
                    }
                    
                    // Update saved icon positions
                    const iconPositions = this.loadIconPositions();
                    delete iconPositions[iconName];
                    this.saveIconPositions(iconPositions);
                    
                } catch (error) {
                    console.error('Failed to delete shortcut:', error);
                    alert('Failed to delete shortcut: ' + error.message);
                }
                break;
                
            case 'rename':
                // TODO: Implement rename
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
    
    async loadIconPositions() {
        const settingsPath = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.settings/user.config`;
        try {
            const settingsFile = await this.fileSystem.getFile(settingsPath);
            if (settingsFile && settingsFile.content) {
                const settings = JSON.parse(settingsFile.content);
                return settings.display?.desktopIcons || {};
            }
        } catch (error) {
            console.error('Failed to load icon positions:', error);
        }
        return {};
    }
}