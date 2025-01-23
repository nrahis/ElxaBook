// file_explorer.js
import { IconSet } from './icons.js'; 
import { RecycleBinHandler } from './recycle-bin-handler.js';

export class FileExplorer {
    constructor(fileSystem, windowManager) {
        this.fileSystem = fileSystem;
        this.windowManager = windowManager;
        this.selectedItems = new Set();
        this.viewMode = 'icons';
        this.history = [];
        this.historyIndex = -1;
        this.currentPath = '';
        this.clipboard = null;
        this.elements = {};
        this.activeMenu = null;  // Track active menu
        this.activeMenuType = null; // 'main' or 'context'
        this.menuClickInProgress = false;
        this.menuDefinitions = {
            file: {
                items: [
                    { label: 'New', submenu: [
                        { label: 'Folder', action: 'new-folder' },
                        { label: 'Text Document', action: 'new-file' }
                    ]},
                    { type: 'separator' },
                    { label: 'Properties', action: 'properties' },
                    { type: 'separator' },
                    { label: 'Close', action: 'close', shortcut: 'Alt+F4' }
                ]
            },
            edit: {
                items: [
                    { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
                    { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
                    { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
                    { type: 'separator' },
                    { label: 'Select All', action: 'select-all', shortcut: 'Ctrl+A' },
                    { type: 'separator' },
                    { label: 'Delete', action: 'delete', shortcut: 'Del' }
                ]
            },
            view: {
                items: [
                    { label: 'View Mode', submenu: [
                        { label: 'Icons', action: 'view-icons', type: 'radio', checked: true },
                        { label: 'List', action: 'view-list', type: 'radio' },
                        { label: 'Details', action: 'view-details', type: 'radio' }
                    ]},
                    { type: 'separator' },
                    { label: 'Show Hidden Files', action: 'toggle-hidden', type: 'checkbox' },
                    { type: 'separator' },
                    { label: 'Refresh', action: 'refresh', shortcut: 'F5' }
                ]
            },
            help: {
                items: [
                    { label: 'About File Explorer', action: 'about' }
                ]
            }
        };

        this.recycleBinHandler = new RecycleBinHandler(fileSystem);
    }

    initialize(contentArea, initialPath) {
        // If no path is provided at all, use the current user's home directory
        if (initialPath === undefined) {
            const currentUser = this.fileSystem.currentUsername;
            console.log('Current user in file explorer:', currentUser); // Debug log
            initialPath = `/ElxaOS/Users/${currentUser}`;
        }
        
        console.log('Initializing FileExplorer with path:', initialPath);

        // Load preferred view mode from settings
        try {
            const settingsPath = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.settings/user.config`;
            const settingsFile = this.fileSystem.getFile(settingsPath);
            if (settingsFile) {
                const settings = JSON.parse(settingsFile.content);
                if (settings.display?.fileExplorerView) {
                    this.viewMode = settings.display.fileExplorerView;
                }
            }
        } catch (error) {
            console.log('Could not load view mode preference, using default');
            this.viewMode = 'icons'; // Set explicit default
        }

        // Apply the view mode class immediately after setup
        if (this.elements.fileList) {
            this.elements.fileList.className = `file-list view-${this.viewMode}`;
        }
        
        this.setupExplorerWindow(contentArea);
        
        this.currentPath = initialPath;
        console.log('Set current path to:', this.currentPath);
        
        this.history = [initialPath];
        this.historyIndex = 0;
        
        this.populateContent();
        this.setupEventListeners();
        this.setupMenus();
        this.populateFolderTree();
        
        this.updateNavigationButtons();
    }


    setupExplorerWindow(contentArea) {
        if (!contentArea) {
            console.error('No content area provided to FileExplorer');
            return;
        }
        contentArea.innerHTML = `
            <div class="explorer-window">
                <div class="explorer-menubar">
                    <div class="menu-item" data-menu="file">File</div>
                    <div class="menu-item" data-menu="edit">Edit</div>
                    <div class="menu-item" data-menu="view">View</div>
                    <div class="menu-item" data-menu="help">Help</div>
                </div>
    
                <!-- Rest of your existing HTML template... -->
                <div class="explorer-toolbar">
                    <button class="toolbar-button" data-action="back" disabled>
                        <span class="toolbar-icon">◀</span>
                        Back
                    </button>
                    <button class="toolbar-button" data-action="forward" disabled>
                        <span class="toolbar-icon">▶</span>
                        Forward
                    </button>
                    <button class="toolbar-button" data-action="up">
                        <span class="toolbar-icon">▲</span>
                        Up
                    </button>
                    <div class="toolbar-separator"></div>
                    <div class="address-bar">
                        <div class="path-segments"></div>
                    </div>
                </div>
    
                <div class="explorer-content">
                    <div class="folder-tree"></div>
                    <div class="file-list view-${this.viewMode}"></div>
                </div>
    
                <div class="explorer-statusbar">
                    <span class="status-text">0 items</span>
                </div>
            </div>
        `;
    
        // Store element references
        this.elements = {
            window: contentArea.querySelector('.explorer-window'),
            menubar: contentArea.querySelector('.explorer-menubar'),
            toolbar: contentArea.querySelector('.explorer-toolbar'),
            addressBar: contentArea.querySelector('.address-bar'),
            pathSegments: contentArea.querySelector('.path-segments'),
            folderTree: contentArea.querySelector('.folder-tree'),
            fileList: contentArea.querySelector('.file-list'),
            statusBar: contentArea.querySelector('.explorer-statusbar'),
            backButton: contentArea.querySelector('[data-action="back"]'),
            forwardButton: contentArea.querySelector('[data-action="forward"]'),
            upButton: contentArea.querySelector('[data-action="up"]'),
            titleBar: contentArea.closest('.program-window').querySelector('.window-title')
        };
    
        // Verify that all elements were found
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                console.error(`Failed to find element: ${key}`);
            }
        });
    
        // Update the window title
        this.updateWindowTitle();
    
        // Initialize menus right after setting up the window
        this.setupMenus();
    }

    updateWindowTitle() {
        if (this.elements.titleBar) {
            const currentFolder = this.currentPath.split('/').pop() || 'File Explorer';
            this.elements.titleBar.textContent = currentFolder;
        }
    }

    setupDragAndDrop(item) {
        item.addEventListener('dragstart', (e) => this.handleDragStart(e, item));
        item.addEventListener('dragend', (e) => this.handleDragEnd(e, item));
        item.addEventListener('dragover', (e) => this.handleDragOver(e, item));
        item.addEventListener('dragleave', (e) => this.handleDragLeave(e, item));
        item.addEventListener('drop', (e) => this.handleDrop(e, item));
    }

    setupEventListeners() {
        // Navigation buttons
        this.elements.backButton.addEventListener('click', () => this.navigateBack());
        this.elements.forwardButton.addEventListener('click', () => this.navigateForward());
        this.elements.upButton.addEventListener('click', () => this.navigateUp());
        document.addEventListener('keydown', (e) => this.handleShortcut(e));
    
        // File list
        this.elements.fileList.addEventListener('click', (e) => {
            const item = e.target.closest('.file-item');
            if (item) {
                this.handleItemClick(e, item);
            } else {
                this.clearSelection();
            }
        });

        // Context menu for file list
        this.elements.fileList.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Context menu triggered');
            
            const item = e.target.closest('.file-item');
            if (item) {
                if (!item.classList.contains('selected')) {
                    this.clearSelection();
                    this.selectItem(item);
                }
                this.showContextMenu(e, item);
            } else {
                this.clearSelection();
                this.showFolderContextMenu(e);
            }
        });

        // Double click handling
        this.elements.fileList.addEventListener('dblclick', (e) => {
            const item = e.target.closest('.file-item');
            if (item) {
                this.handleItemDoubleClick(item);
            }
        });

        // Make the file list itself a drop target
        this.elements.fileList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.isDraggingFile) return;
            
            this.elements.fileList.classList.add('drag-over');
        });

        this.elements.fileList.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!e.target.closest('.file-list')) {
                this.elements.fileList.classList.remove('drag-over');
            }
        });

        this.elements.fileList.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.fileList.classList.remove('drag-over');
            
            if (this.draggedItem) {
                this.handleDropOnFolder(e, this.currentPath);
            }
        });
    }

//Drag and drop functionality

    handleDragStart(e, item) {
        this.draggedItem = item;
        this.isDraggingFile = true;
        
        // Create and set drag image
        const dragImage = item.cloneNode(true);
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => dragImage.remove(), 0);
        
        item.classList.add('dragging');
        
        // Set the full path as the drag data
        const fullPath = this.fileSystem.joinPaths(this.currentPath, item.dataset.name);
        console.log('Setting drag data path:', fullPath);
        e.dataTransfer.setData('text/plain', fullPath);
        
        // Also set the type and other relevant data
        e.dataTransfer.setData('application/x-file-type', item.dataset.type);
    }
    
    handleDragEnd(e, item) {
        this.isDraggingFile = false;
        this.draggedItem = null;
        item.classList.remove('dragging');
        
        // Remove any remaining drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => 
            el.classList.remove('drag-over'));
    }
    
    handleDragOver(e, item) {
        e.preventDefault();
        e.stopPropagation();
        
        // Only show drop target if dragging onto a folder
        if (this.draggedItem && item.dataset.type === 'folder' && 
            item !== this.draggedItem) {
            item.classList.add('drag-over');
        }
    }
    
    handleDragLeave(e, item) {
        e.preventDefault();
        e.stopPropagation();
        item.classList.remove('drag-over');
    }
    
    handleDrop(e, targetItem) {
        e.preventDefault();
        e.stopPropagation();
        
        targetItem.classList.remove('drag-over');
        
        if (!this.draggedItem || targetItem === this.draggedItem) {
            return;
        }
        
        // Only allow dropping on folders
        if (targetItem.dataset.type !== 'folder') {
            return;
        }
        
        const sourcePath = this.draggedItem.dataset.path;
        const targetPath = targetItem.dataset.path;
        
        console.log('Processing drop:', {
            sourcePath,
            targetPath,
            sourceType: this.draggedItem.dataset.type,
            targetType: targetItem.dataset.type
        });
        
        this.moveItem(sourcePath, targetPath);
    }
    
    handleDropOnFolder(e, targetPath) {
        if (!this.draggedItem) {
            return;
        }
        
        const sourcePath = this.draggedItem.dataset.path;
        
        console.log('Processing drop on folder:', {
            sourcePath,
            targetPath,
            sourceType: this.draggedItem.dataset.type
        });
        
        if (sourcePath === targetPath) {
            return;
        }
        
        this.moveItem(sourcePath, targetPath);
    }

    moveItem(sourcePath, targetPath) {
        try {
            const sourceType = this.draggedItem.dataset.type;
            console.log('Moving file:', sourcePath, 'to', targetPath);
            
            if (sourceType === 'folder') {
                // Check if it's a system folder
                const folderInfo = this.fileSystem.getFolderInfo(sourcePath);
                if (folderInfo?.type === 'system') {
                    throw new Error("Cannot move system folders");
                }
                
                // Don't allow moving into itself or its subdirectories
                if (targetPath.startsWith(sourcePath)) {
                    throw new Error("Cannot move a folder into itself");
                }
                
                this.fileSystem.moveFolder(sourcePath, targetPath);
            } else {
                // For files, just move directly
                const currentFile = this.fileSystem.getFile(sourcePath);
                if (!currentFile) {
                    throw new Error("Source file not found");
                }
                
                const fileName = sourcePath.split('/').pop();
                const newPath = this.fileSystem.joinPaths(targetPath, fileName);
                
                // Update the file's path in storage
                this.fileSystem.saveFile(targetPath, fileName, currentFile.content, currentFile.type);
                this.fileSystem.deleteFile(sourcePath);
            }
            
            // Refresh the view
            this.populateContent();
            
        } catch (error) {
            console.error('Failed to move item:', error);
            alert(error.message);
        }
    }

// Update the tree creation methods

    populateFolderTree() {
        const treeRoot = this.elements.folderTree;
        treeRoot.innerHTML = '';

        // Start with root folder
        const rootFolder = this.createTreeItem('ElxaOS', '/ElxaOS', true);
        treeRoot.appendChild(rootFolder);

        // Create container for root's children
        const rootBranch = document.createElement('div');
        rootBranch.className = 'tree-branch';
        
        // Populate root's children
        this.populateTreeBranch('/ElxaOS', rootBranch);
        
        // Always append the branch to show the structure
        rootFolder.appendChild(rootBranch);
        rootBranch.style.display = 'block';  // Show root's children by default
        
        // Start with root expanded
        rootFolder.querySelector('.expand-arrow').textContent = '▼';
        
        // Select the current folder in the tree
        this.updateTreeSelection();
    }

    createTreeItem(name, path, isRoot = false) {
        const container = document.createElement('div');
        container.className = 'tree-container';
        container.dataset.path = path;
        
        // Create the item itself
        const item = document.createElement('div');
        item.className = 'tree-item';
        
        // Create expand arrow
        const expandArrow = document.createElement('span');
        expandArrow.className = 'expand-arrow';
        expandArrow.textContent = '►';
        
        // Add all elements to item
        item.appendChild(expandArrow);
        
        // Add folder icon
        const icon = IconSet.getIcon('folder', isRoot ? 'computer' : 'default');
        icon.className = 'file-icon';
        item.appendChild(icon);
        
        // Add label
        const label = document.createElement('span');
        label.className = 'tree-label';
        label.textContent = name;
        item.appendChild(label);
        
        // Add the item to the container
        container.appendChild(item);
        
        // Create branch container for children
        const branch = document.createElement('div');
        branch.className = 'tree-branch';
        branch.style.display = 'none';  // Initially hidden
        container.appendChild(branch);
        
        // Set up click handlers
        expandArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Only populate the branch the first time it's expanded
            if (branch.children.length === 0) {
                this.populateTreeBranch(path, branch);
            }
            
            const isExpanded = branch.style.display === 'block';
            branch.style.display = isExpanded ? 'none' : 'block';
            expandArrow.textContent = isExpanded ? '►' : '▼';
        });
        
        item.addEventListener('click', (e) => {
            if (e.target !== expandArrow) {
                e.stopPropagation();
                this.navigateTo(path);
            }
        });
        
        return container;
    }

    populateTreeBranch(path, container) {
        const contents = this.fileSystem.getFolderContents(path);
        
        if (!contents || !contents.folders) {
            console.error('No folder contents found for path:', path);
            return;
        }
        
        contents.folders
            .filter(folder => folder.path === path)  // Only direct children
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(folder => {
                const fullPath = folder.fullPath;
                const treeItemContainer = this.createTreeItem(folder.name, fullPath);
                container.appendChild(treeItemContainer);
            });
    }

    updateTreeSelection() {
        // Remove existing selection
        const allItems = this.elements.folderTree.querySelectorAll('.tree-container');
        allItems.forEach(item => item.classList.remove('selected'));
        
        // Find and select the current path
        const currentContainer = this.elements.folderTree.querySelector(`.tree-container[data-path="${this.currentPath}"]`);
        if (currentContainer) {
            currentContainer.classList.add('selected');
            
            // Expand parent folders
            let parent = currentContainer.parentElement;
            while (parent && parent.classList.contains('tree-branch')) {
                parent.style.display = 'block';
                const parentContainer = parent.closest('.tree-container');
                if (parentContainer) {
                    const arrow = parentContainer.querySelector('.expand-arrow');
                    if (arrow) {
                        arrow.textContent = '▼';
                    }
                }
                parent = parent.parentElement.closest('.tree-branch');
            }
        }
    }
    
    updateNavigationButtons() {
        // Update back/forward buttons
        this.elements.backButton.disabled = this.historyIndex <= 0;
        this.elements.forwardButton.disabled = this.historyIndex >= this.history.length - 1;
        
        // Update up button
        const parentPath = this.fileSystem.getParentPath(this.currentPath);
        this.elements.upButton.disabled = this.currentPath === '/ElxaOS';
        
        // Update address bar
        this.updateAddressBar();
        
        // Update window title
        this.updateWindowTitle();
    }
    
    navigateBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentPath = this.history[this.historyIndex];
            this.populateContent();
            this.updateNavigationButtons();
        }
    }
    
    navigateForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentPath = this.history[this.historyIndex];
            this.populateContent();
            this.updateNavigationButtons();
        }
    }
    
    navigateUp() {
        const parentPath = this.fileSystem.getParentPath(this.currentPath);
        if (parentPath !== this.currentPath) {
            this.navigateTo(parentPath);
        }
    }

    navigateTo(path) {
        // Remove forward history when navigating to a new path
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.currentPath = path;
        this.addToHistory(path);
        this.populateContent();
        this.updateNavigationButtons();
        this.updateWindowTitle();
    }

    updateWindowTitle() {
        if (this.elements.titleBar) {
            const currentFolder = this.currentPath.split('/').pop() || 'File Explorer';
            this.elements.titleBar.textContent = currentFolder;
        }
    }

    addToHistory(path) {
        this.historyIndex++;
        this.history.splice(this.historyIndex, this.history.length - this.historyIndex, path);
        this.updateNavigationButtons();
    }

    updateAddressBar() {
        if (!this.elements || !this.elements.pathSegments) {
            console.error('Path segments element not found');
            return;
        }
    
        const segments = this.currentPath.split('/').filter(Boolean);
        this.elements.pathSegments.innerHTML = segments.map((segment, index) => {
            const path = '/' + segments.slice(0, index + 1).join('/');
            return `
                <span class="path-segment" data-path="${path}">${segment}</span>
                ${index < segments.length - 1 ? '<span class="path-separator">›</span>' : ''}
            `;
        }).join('');
    
        // Add click handlers for path segments
        this.elements.pathSegments.querySelectorAll('.path-segment').forEach(segment => {
            segment.addEventListener('click', () => {
                this.navigateTo(segment.dataset.path);
            });
        });
    }

    populateContent() {
        console.log('Populating content for path:', this.currentPath);
        const contents = this.fileSystem.getFolderContents(this.currentPath);
        console.log('Got folder contents:', contents);
        this.updateFileList(contents);
        this.updateFolderTree();
        this.updateStatusBar(contents);
    }

    updateFolderTree() {
        // Select the current folder in the tree
        const allTreeItems = this.elements.folderTree.querySelectorAll('.tree-container');
        allTreeItems.forEach(item => item.classList.remove('selected'));
        
        const currentContainer = this.elements.folderTree.querySelector(
            `.tree-container[data-path="${this.currentPath}"]`
        );
        
        if (currentContainer) {
            // Select the current folder
            currentContainer.classList.add('selected');
            
            // Expand parent folders to make the current folder visible
            let parent = currentContainer.parentElement;
            while (parent && parent.classList.contains('tree-branch')) {
                parent.style.display = 'block';
                const parentContainer = parent.closest('.tree-container');
                if (parentContainer) {
                    const arrow = parentContainer.querySelector('.expand-arrow');
                    if (arrow) {
                        arrow.textContent = '▼';
                    }
                }
                parent = parent.parentElement.closest('.tree-branch');
            }
        }
    }

    getFolderContents(path) {
        console.log('Getting contents for path:', path);
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const contents = {
            folders: [],
            files: []
        };
    
        // Get subfolders - check against full paths
        Object.entries(folders).forEach(([folderPath, folder]) => {
            // Get the parent path from the full folder path
            const parentPath = this.getParentPath(folderPath);
            if (parentPath === path) {
                contents.folders.push({
                    ...folder,
                    fullPath: folderPath
                });
            }
        });
    
        // Get files - check against full paths
        Object.entries(files).forEach(([filePath, file]) => {
            const parentPath = this.getParentPath(filePath);
            if (parentPath === path) {
                contents.files.push({
                    ...file,
                    fullPath: filePath
                });
            }
        });
    
        return contents;
    }

    updateFileList(contents) {
        this.elements.fileList.innerHTML = '';
        
        // Add header row for details view
        if (this.viewMode === 'details') {
            const header = document.createElement('div');
            header.className = 'details-header';
            
            const nameHeader = document.createElement('div');
            nameHeader.className = 'header-cell';
            nameHeader.textContent = 'Name';
            nameHeader.style.paddingLeft = '28px'; // Account for icon width
            
            const typeHeader = document.createElement('div');
            typeHeader.className = 'header-cell';
            typeHeader.textContent = 'Type';
            
            const sizeHeader = document.createElement('div');
            sizeHeader.className = 'header-cell';
            sizeHeader.textContent = 'Size';
            
            const modifiedHeader = document.createElement('div');
            modifiedHeader.className = 'header-cell';
            modifiedHeader.textContent = 'Date Modified';
            
            header.appendChild(document.createElement('div')); // Empty cell for icon
            header.appendChild(nameHeader);
            header.appendChild(typeHeader);
            header.appendChild(sizeHeader);
            header.appendChild(modifiedHeader);
            
            this.elements.fileList.appendChild(header);
        }
        
        // Add folders first
        contents.folders.forEach(folder => {
            const item = this.createFileListItem(folder.name, 'folder', folder);
            if (item) { // Only append if item is not null
                this.elements.fileList.appendChild(item);
            }
        });
    
        // Then add files
        contents.files.forEach(file => {
            const item = this.createFileListItem(file.name, file.type, file);
            if (item) { // Only append if item is not null
                this.elements.fileList.appendChild(item);
            }
        });
    }

    updateStatusBar(contents) {
        const totalItems = contents.folders.length + contents.files.length;
        const selectedCount = this.selectedItems.size;
        
        let statusText = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
        if (selectedCount > 0) {
            statusText = `${selectedCount} of ${totalItems} item${totalItems !== 1 ? 's' : ''} selected`;
        }
        
        this.elements.statusBar.querySelector('.status-text').textContent = statusText;
    }

    createFileListItem(name, type, fileInfo = null) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.name = name;
        item.dataset.type = type;
        
        let iconCategory = 'file';
        let iconType = 'default';
    
        // Determine the correct icon category and type
        if (type === 'folder') {
            iconCategory = 'folder';
            
            // Check for special system folders
            if (fileInfo?.type === 'system') {
                if (name === 'System') iconType = 'system';
                else if (name === 'Documents') iconType = 'documents';
                else if (name === 'Pictures') iconType = 'pictures';
                else if (name === 'Music') iconType = 'music';
                else if (name === 'Downloads') iconType = 'downloads';
                else if (name === 'Recycle Bin') iconType = 'recycle';
                else iconType = 'default';
            } else {
                // Check for user folders
                if (name === 'Documents') iconType = 'documents';
                else if (name === 'Pictures') iconType = 'pictures';
                else if (name === 'Music') iconType = 'music';
                else if (name === 'Downloads') iconType = 'downloads';
                else iconType = 'default';
            }
        } else {
            // File type determination
            const lowerName = name.toLowerCase();
            
            if (type === 'program' || fileInfo?.type === 'program') {
                iconCategory = 'program';
                iconType = fileInfo; // Pass the entire fileInfo for program icons
            } else if (lowerName.endsWith('.txt')) {
                iconCategory = 'file';
                iconType = 'txt';
            } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
                iconCategory = 'file';
                iconType = 'image';
            } else if (lowerName.endsWith('.odp')) {
                iconCategory = 'file';
                iconType = 'slideshow';
            } else if (lowerName.endsWith('.lnk')) {
                try {
                    if (fileInfo && fileInfo.content) {
                        const shortcutData = JSON.parse(fileInfo.content);
                        
                        // First check if this is a default item with explicit icon information
                        if (shortcutData.iconType && shortcutData.iconCategory) {
                            iconCategory = shortcutData.iconCategory;
                            iconType = shortcutData.iconType;
                        } else {
                            // Fall back to target resolution
                            const targetInfo = shortcutData.type === 'folder' ?
                                this.fileSystem.getFolderInfo(shortcutData.targetPath) :
                                this.fileSystem.getFile(shortcutData.targetPath);
                            
                            if (targetInfo) {
                                if (targetInfo.type === 'program') {
                                    iconCategory = 'program';
                                    iconType = targetInfo;
                                } else {
                                    iconCategory = targetInfo.type === 'folder' ? 'folder' : 'file';
                                    iconType = shortcutData.type || targetInfo.type;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Error determining shortcut icon:', error);
                }
            }
        }
    
        // Create icon with determined category and type
        const icon = IconSet.getIcon(iconCategory, iconType);
        icon.className = 'file-icon';
    
        // Don't make items in Recycle Bin draggable
        item.draggable = !this.recycleBinHandler.isInRecycleBin(this.currentPath);
    
        // Skip metadata files in Recycle Bin
        if (name.endsWith('.metadata') && this.recycleBinHandler.isInRecycleBin(this.currentPath)) {
            return null;
        }
    
        // Create label
        const label = document.createElement('div');
        label.className = 'file-label';
        
        // Hide .lnk extension in display
        let displayName = name;
        if (name.toLowerCase().endsWith('.lnk')) {
            displayName = name.slice(0, -4);
            
            // Add shortcut overlay to icon
            const shortcutOverlay = document.createElement('div');
            shortcutOverlay.className = 'shortcut-overlay';
            shortcutOverlay.innerHTML = '↗';
            icon.appendChild(shortcutOverlay);
        }
        
        label.textContent = displayName;
    
        item.appendChild(icon);
        item.appendChild(label);
    
        // Setup drag and drop if not in Recycle Bin
        if (!this.recycleBinHandler.isInRecycleBin(this.currentPath)) {
            this.setupDragAndDrop(item);
        }
    
        // Add details view information if needed
        if (this.viewMode === 'details') {
            const modified = fileInfo?.modified ? 
                new Date(fileInfo.modified).toLocaleString() : '';
            const typeLabel = this.getTypeLabel(type, name, fileInfo);
            const size = type === 'folder' ? '' : 
                        fileInfo?.size ? this.formatFileSize(fileInfo.size) : '';
    
            const typeCell = document.createElement('div');
            typeCell.className = 'file-details type';
            typeCell.textContent = typeLabel;
    
            const sizeCell = document.createElement('div');
            sizeCell.className = 'file-details size';
            sizeCell.textContent = size;
    
            const modifiedCell = document.createElement('div');
            modifiedCell.className = 'file-details modified';
            modifiedCell.textContent = modified;
    
            item.appendChild(typeCell);
            item.appendChild(sizeCell);
            item.appendChild(modifiedCell);
        }
    
        return item;
    }
    
    // Helper method for getting type labels
    getTypeLabel(type, name, fileInfo) {
        if (type === 'folder') return 'File Folder';
        if (type === 'program' || fileInfo?.type === 'program') return 'Application';
        if (name.endsWith('.lnk')) return 'Shortcut';
        if (name.endsWith('.txt')) return 'Text Document';
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'Image';
        return fileInfo?.type?.toUpperCase() + ' File' || 'File';
    }
    
    // Add this helper method for formatting file sizes
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleItemClick(e, item) {
        if (e.ctrlKey) {
            this.toggleSelection(item);
        } else {
            this.clearSelection();
            this.selectItem(item);
        }
    }

    handleItemDoubleClick(item) {
        const name = item.dataset.name;
        const type = item.dataset.type;
    
        // Prevent opening files in Recycle Bin
        if (this.recycleBinHandler.isInRecycleBin(this.currentPath)) {
            return;
        }
    
        // If it's a shortcut, handle it differently
        if (name.endsWith('.lnk')) {
            const fullPath = this.fileSystem.joinPaths(this.currentPath, name);
            const shortcutFile = this.fileSystem.getFile(fullPath);
            if (shortcutFile && shortcutFile.content) {
                try {
                    const shortcutData = JSON.parse(shortcutFile.content);
                    const targetPath = shortcutData.targetPath;
                    const targetType = shortcutData.type;
    
                    if (targetType === 'folder') {
                        this.navigateTo(targetPath);
                    } else if (targetType === 'program') {
                        const targetInfo = this.fileSystem.getFile(targetPath);
                        if (targetInfo && targetInfo.program) {
                            this.windowManager.createWindow(targetInfo.program);
                        }
                    } else {
                        const targetFile = this.fileSystem.getFile(targetPath);
                        if (targetFile) {
                            this.openFile(targetFile.name, targetFile.type);
                        }
                    }
                } catch (error) {
                    console.error('Error opening shortcut:', error);
                }
            }
            return;
        }
    
        // Handle regular files and folders
        if (type === 'folder') {
            const newPath = this.fileSystem.joinPaths(this.currentPath, name);
            this.navigateTo(newPath);
        } else {
            this.openFile(name, type);
        }
    }

    selectItem(item) {
        item.classList.add('selected');
        this.selectedItems.add(item.dataset.name);
        this.updateStatusBar(this.fileSystem.getFolderContents(this.currentPath));
    }

    toggleSelection(item) {
        item.classList.toggle('selected');
        if (item.classList.contains('selected')) {
            this.selectedItems.add(item.dataset.name);
        } else {
            this.selectedItems.delete(item.dataset.name);
        }
        this.updateStatusBar(this.fileSystem.getFolderContents(this.currentPath));
    }

    clearSelection() {
        this.selectedItems.clear();
        this.elements.fileList.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
        });
        this.updateStatusBar(this.fileSystem.getFolderContents(this.currentPath));
    }

    getFileType(file) {
        return file.type || 'default';
    }

    openFile(name, type) {
        const path = this.fileSystem.joinPaths(this.currentPath, name);
        const file = this.fileSystem.getFile(path);
    
        // Extract file extension
        const extension = name.toLowerCase().split('.').pop();
    
        switch (extension) {
            case 'txt':
            case 'rtf':
                this.windowManager.createWindow('notepad', { file });
                break;
            case 'png':
            case 'jpg':
            case 'jpeg':
                this.windowManager.createWindow('paint', { file });
                break;
            case 'odp':
                this.windowManager.createWindow('slideshow', { file });
                break;
            default:
                // Handle based on type for backwards compatibility
                switch (type) {
                    case 'program':
                        if (file && file.program) {
                            this.windowManager.createWindow(file.program);
                        }
                        break;
                    case 'text':
                        this.windowManager.createWindow('notepad', { file });
                        break;
                    case 'paint':
                    case 'image':
                        this.windowManager.createWindow('paint', { file });
                        break;
                    case 'slideshow':
                        this.windowManager.createWindow('slideshow', { file });
                        break;
                }
        }
    }

    showContextMenu(e, item) {
        e.preventDefault();
        e.stopPropagation();
        
        this.closeAllMenus();
        this.activeMenuType = 'context';
    
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        const fullPath = this.fileSystem.joinPaths(this.currentPath, item.dataset.name);
        const isSystemFolder = item.dataset.type === 'folder' && 
            this.fileSystem.getFolderInfo(fullPath)?.type === 'system';
        const isInRecycleBin = this.recycleBinHandler.isInRecycleBin(this.currentPath);
        
        if (isInRecycleBin) {
            // Context menu for items in Recycle Bin
            menu.innerHTML = `
                <button data-action="restore">Restore</button>
                <button data-action="delete">Delete Permanently</button>
                <hr>
                <button data-action="properties">Properties</button>
            `;
        } else {
            // Normal context menu
            menu.innerHTML = `
                <button data-action="open">Open</button>
                <hr>
                <button data-action="cut" ${isSystemFolder ? 'disabled' : ''}>Cut</button>
                <button data-action="copy">Copy</button>
                <button data-action="paste" ${!this.clipboard ? 'disabled' : ''}>Paste</button>
                <button data-action="delete" ${isSystemFolder ? 'disabled' : ''}>Delete</button>
                <hr>
                <button data-action="send-to-desktop">Send to Desktop</button>
                <hr>
                <button data-action="rename" ${isSystemFolder ? 'disabled' : ''}>Rename</button>
                <button data-action="properties">Properties</button>
            `;
        }
    
        this.showMenu(menu, e);
        this.setupContextMenuHandlers(menu, item);
    }

    showFolderContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();

        // Remove any existing context menus
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        if (this.recycleBinHandler.isInRecycleBin(this.currentPath)) {
            menu.innerHTML = `
                <button data-action="empty-recycle-bin">Empty Recycle Bin</button>
                <hr>
                <button data-action="refresh">Refresh</button>
                <button data-action="properties">Properties</button>
            `;
        } else {
        
            menu.innerHTML = `
                <button data-action="paste" ${!this.clipboard ? 'disabled' : ''}>Paste</button>
                <hr>
                <button data-action="new-folder">New Folder</button>
                <button data-action="new-file">New Text Document</button>
                <hr>
                <button data-action="refresh">Refresh</button>
                <button data-action="properties">Properties</button>
            `;
        }
    
        // Position the menu
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        document.body.appendChild(menu);
    
        // Add click handlers to menu items
        menu.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (clickEvent) => {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
                
                console.log('Menu button clicked:', button.dataset.action);
                
                if (!button.disabled && button.dataset.action) {
                    this.handleFolderContextMenuAction(button.dataset.action);
                }
                menu.remove();
            });
        });
    
        // Handle clicking outside the menu
        const handleClickOutside = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('contextmenu', handleClickOutside);
            }
        };
    
        // Delay adding the click outside handler
        requestAnimationFrame(() => {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('contextmenu', handleClickOutside);
        });
    }


    showMenu(menu, e) {
        // Remove any existing menus first
        document.querySelectorAll('.context-menu').forEach(m => m.remove());
        
        // If e (event) is provided, position relative to click
        if (e) {
            console.log('Positioning menu at:', e.pageX, e.pageY);
            menu.style.left = `${e.pageX}px`;
            menu.style.top = `${e.pageY}px`;
        } else {
            // For non-event-based menus (like main menubar), position under the menu item
            const menuItem = this.elements.menubar.querySelector('.menu-item.active');
            if (menuItem) {
                const rect = menuItem.getBoundingClientRect();
                menu.style.left = `${rect.left}px`;
                menu.style.top = `${rect.bottom}px`;
            }
        }
        
        document.body.appendChild(menu);
    
        // Handle clicking outside the menu
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                console.log('Closing menu due to outside click');
                menu.remove();
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('contextmenu', closeMenu);
            }
        };
    
        // Add event listeners to close the menu
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
            document.addEventListener('contextmenu', closeMenu);
        }, 0);
    }

    setupContextMenuHandlers(menu, item) {
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action || e.target.disabled) return;
    
            this.handleContextMenuAction(action, item);
            menu.remove();
        });
    }
    
    setupFolderContextMenuHandlers(menu) {
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action || e.target.disabled) return;
    
            console.log('Menu action clicked:', action); // Debug log
            this.handleFolderContextMenuAction(action);
            menu.remove();
        });
    }
    
    handleContextMenuAction(action, item) {
        const name = item.dataset.name;
        const type = item.dataset.type;
        const fullPath = this.fileSystem.joinPaths(this.currentPath, name);
    
        switch (action) {
            case 'open':
                this.handleItemDoubleClick(item);
                break;

            case 'restore':
                try {
                    this.recycleBinHandler.restoreItem(name);
                    this.populateContent(); // Refresh view
                } catch (error) {
                    alert('Failed to restore item: ' + error.message);
                }
                break;

            case 'send-to-desktop':
                console.log('WindowManager:', this.windowManager); // Debug log
                console.log('Desktop instance:', this.windowManager.desktop); // Debug log
                console.log('Global desktop:', window.elxaDesktop); // Debug log
                
                // Get the Desktop instance
                const desktopInstance = this.windowManager.desktop || window.elxaDesktop;
                
                if (desktopInstance) {
                    try {
                        desktopInstance.createShortcut(
                            fullPath,      // targetPath
                            name,         // name
                            type         // type
                        );
                        console.log('Desktop shortcut created for:', {
                            path: fullPath,
                            name: name,
                            type: type
                        });
                    } catch (error) {
                        console.error('Failed to create desktop shortcut:', error);
                        alert('Unable to create desktop shortcut: ' + error.message);
                    }
                } else {
                    console.error('Desktop instance not found. WindowManager:', this.windowManager);
                    alert('Unable to create shortcut: Desktop not initialized');
                }
                break;
                
            case 'cut':
                try {
                    if (type === 'folder') {
                        const folderInfo = this.fileSystem.getFolderInfo(fullPath);
                        if (folderInfo?.type === 'system') {
                            throw new Error('System folders cannot be cut');
                        }
                    }
                    this.clipboard = { type: 'cut', items: Array.from(this.selectedItems) };
                    // Add visual feedback for cut items
                    this.elements.fileList.querySelectorAll('.file-item.selected').forEach(
                        item => item.style.opacity = '0.5'
                    );
                } catch (error) {
                    console.error('Cut operation failed:', error);
                    alert(error.message);
                }
                break;
                
            case 'copy':
                this.clipboard = { type: 'copy', items: Array.from(this.selectedItems) };
                break;
                
            case 'paste':
                this.pasteItems();
                break;
                
            case 'delete':
                this.deleteSelectedItems();
                break;
                
            case 'rename':
                try {
                    if (type === 'folder') {
                        const folderInfo = this.fileSystem.getFolderInfo(fullPath);
                        if (folderInfo?.type === 'system') {
                            throw new Error('System folders cannot be renamed');
                        }
                    }
                    this.startRename(item);
                } catch (error) {
                    console.error('Rename operation failed:', error);
                    alert(error.message);
                }
                break;
                
            case 'properties':
                this.showProperties(item);
                break;
        }
    }
    
    handleFolderContextMenuAction(action) {
        console.log('Handling folder context menu action:', action);
        
        switch (action) {
            case 'new-folder':
                console.log('Creating new folder...');
                this.createNewFolder();
                break;
                
            case 'new-file':
                console.log('Creating new file...');
                this.createNewFile();
                break;
                
            case 'paste':
                console.log('Pasting items...');
                this.pasteItems();
                break;
                
            case 'refresh':
                console.log('Refreshing content...');
                this.populateContent();
                break;
                
            case 'properties':
                console.log('Showing properties...');
                this.showFolderProperties();
                break;

            case 'empty-recycle-bin':
                if (confirm('Are you sure you want to permanently delete all items in the Recycle Bin?')) {
                    try {
                        this.recycleBinHandler.emptyRecycleBin();
                        this.populateContent();
                    } catch (error) {
                        alert('Failed to empty Recycle Bin: ' + error.message);
                    }
                }
                break;
        }
    }

    // folder creation and deletion

    createNewFolder() {
        console.log('=== Starting CreateNewFolder ===');
        console.log('Current path:', this.currentPath);
        
        let counter = 1;
        let baseName = 'New Folder';
        let name = baseName;
        
        const fullPath = this.fileSystem.joinPaths(this.currentPath, name);
        console.log('Attempting to create at path:', fullPath);
        
        // Find a unique name
        while (this.fileSystem.folderExists(this.fileSystem.joinPaths(this.currentPath, name))) {
            counter++;
            name = `${baseName} (${counter})`;
            console.log('Name already exists, trying:', name);
        }
        
        try {
            console.log('Creating folder:', name, 'in path:', this.currentPath);
            const newFolder = this.fileSystem.createFolder(this.currentPath, name);
            console.log('Folder created successfully:', newFolder);
            
            // Add the new folder to the view
            const item = this.createFileListItem(name, 'folder');
            console.log('Created file list item:', item);
            
            this.elements.fileList.appendChild(item);
            console.log('Added item to file list');
            
            // Start rename operation immediately
            this.startRename(item);
            console.log('Started rename operation');
            
            // Refresh the view
            this.populateContent();
            console.log('Refreshed content');
            
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('Unable to create folder: ' + error.message);
        }
        
        console.log('=== Finished CreateNewFolder ===');
    }
    
    startRename(item) {
        const label = item.querySelector('.file-label');
        const originalName = label.textContent;
        const isFolder = item.dataset.type === 'folder';
        let isFinishing = false; // Flag to prevent multiple finishRename calls
        
        console.log('Starting rename for:', {
            name: originalName,
            type: item.dataset.type,
            isFolder
        });
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.className = 'rename-input';
        input.style.width = Math.max(100, label.offsetWidth) + 'px';
        
        // Replace label with input
        label.replaceWith(input);
        input.select();
        
        const finishRename = async (newName, abort = false) => {
            if (isFinishing) return; // Prevent multiple executions
            isFinishing = true;
            
            if (!abort && newName && newName !== originalName) {
                try {
                    const fullPath = this.fileSystem.joinPaths(this.currentPath, originalName);
                    
                    console.log('Attempting rename:', {
                        fullPath,
                        newName,
                        isFolder,
                        currentPath: this.currentPath
                    });
                    
                    // Perform rename operation
                    if (isFolder) {
                        const folderInfo = this.fileSystem.getFolderInfo(fullPath);
                        if (folderInfo && folderInfo.type === 'system') {
                            throw new Error('System folders cannot be renamed');
                        }
                        await this.fileSystem.renameFolder(fullPath, newName);
                        console.log('Folder renamed successfully');
                    } else {
                        await this.fileSystem.renameFile(fullPath, newName);
                        console.log('File renamed successfully');
                    }
                    
                    // Remove event listeners after successful rename
                    input.removeEventListener('blur', handleBlur);
                    input.removeEventListener('keydown', handleKeyDown);
                    
                    // Update the UI after successful rename
                    if (input.parentNode) {
                        const newLabel = document.createElement('div');
                        newLabel.className = 'file-label';
                        newLabel.textContent = newName;
                        input.replaceWith(newLabel);
                    }
                    
                    // Refresh the content view
                    this.populateContent();
                    
                } catch (error) {
                    console.error('Failed to rename:', error);
                    alert('Unable to rename: ' + error.message);
                    isFinishing = false; // Allow retry
                    
                    // Don't remove event listeners on error so user can try again
                    return;
                }
            } else {
                // Remove event listeners before restoring label
                input.removeEventListener('blur', handleBlur);
                input.removeEventListener('keydown', handleKeyDown);
                
                // Abort or no changes - restore original label
                if (input.parentNode) {
                    const originalLabel = document.createElement('div');
                    originalLabel.className = 'file-label';
                    originalLabel.textContent = originalName;
                    input.replaceWith(originalLabel);
                }
            }
        };
        
        // Create event handler functions
        const handleBlur = () => finishRename(input.value);
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename(input.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                finishRename(originalName, true);
            }
        };
        
        // Add event listeners
        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleKeyDown);
    }

    finishRename(item, newName, originalName) {
        console.log('=== Starting Rename Operation ===');
        console.log('Parameters:', { newName, originalName });
        console.log('Item:', item);
        
        const isFolder = item.dataset.type === 'folder';
        let success = false;
    
        try {
            const fullPath = this.fileSystem.joinPaths(this.currentPath, originalName);
            console.log('Full path for rename:', fullPath);
            console.log('Item type:', isFolder ? 'folder' : 'file');
    
            if (isFolder) {
                const folderInfo = this.fileSystem.getFolderInfo(fullPath);
                console.log('Folder info:', folderInfo);
                if (folderInfo && folderInfo.type === 'system') {
                    throw new Error('System folders cannot be renamed');
                }
                const newPath = this.fileSystem.renameFolder(fullPath, newName);
                console.log('Folder renamed successfully to:', newPath);
            } else {
                const fileInfo = this.fileSystem.getFile(fullPath);
                console.log('File info before rename:', fileInfo);
                const newPath = this.fileSystem.renameFile(fullPath, newName);
                console.log('File renamed successfully to:', newPath);
            }
            
            success = true;
        } catch (error) {
            console.error('Failed to rename:', error);
            alert('Unable to rename: ' + error.message);
        }
    
        const label = document.createElement('div');
        label.className = 'file-label';
        label.textContent = success ? newName : originalName;
        
        if (success) {
            item.dataset.name = newName;
            setTimeout(() => this.populateContent(), 50);
        }
    
        return label;
    }

    deleteSelectedItems() {
        const selectedElements = Array.from(this.elements.fileList.querySelectorAll('.file-item.selected'));
        
        if (selectedElements.length === 0) return;
        
        const itemNames = selectedElements.map(el => el.dataset.name).join('", "');
        const confirmMessage = selectedElements.length === 1
            ? `Are you sure you want to move "${itemNames}" to the Recycle Bin?`
            : `Are you sure you want to move these ${selectedElements.length} items to the Recycle Bin?\n"${itemNames}"`;
        
        if (confirm(confirmMessage)) {
            let errorCount = 0;
            
            selectedElements.forEach(element => {
                const name = element.dataset.name;
                const fullPath = this.fileSystem.joinPaths(this.currentPath, name);
                
                try {
                    // Don't allow recycling items that are already in the Recycle Bin
                    if (this.recycleBinHandler.isInRecycleBin(this.currentPath)) {
                        throw new Error("Cannot move Recycle Bin items to Recycle Bin");
                    }
                    
                    this.recycleBinHandler.moveToRecycleBin(fullPath);
                    
                    // Remove from view if successful
                    element.remove();
                    this.selectedItems.delete(name);
                    
                } catch (error) {
                    console.error(`Failed to move ${name} to Recycle Bin:`, error);
                    errorCount++;
                }
            });
            
            // Update the view
            this.updateStatusBar(this.fileSystem.getFolderContents(this.currentPath));
            
            // Show error message if any operations failed
            if (errorCount > 0) {
                alert(`Failed to move ${errorCount} item(s) to the Recycle Bin.\nSystem folders cannot be moved to the Recycle Bin.`);
            }
        }
    }

    // Add this new method for creating text files

    createNewFile() {
        console.log('=== Starting CreateNewFile ===');
        console.log('Current path:', this.currentPath);
        
        let counter = 1;
        let baseName = 'New Text Document';
        let name = baseName + '.txt';
        
        // Find a unique name
        while (this.fileSystem.fileExists(this.fileSystem.joinPaths(this.currentPath, name))) {
            counter++;
            name = `${baseName} (${counter}).txt`;
            console.log('Name already exists, trying:', name);
        }
        
        try {
            console.log('Creating file:', name, 'in path:', this.currentPath);
            
            // Create empty text file and get its path
            const newFilePath = this.fileSystem.saveFile(this.currentPath, name, '', 'text');
            console.log('File created successfully at path:', newFilePath);
            
            // Refresh content to ensure we have the latest state
            this.populateContent();
            
            // Find the new file item and start rename
            setTimeout(() => {
                const newItem = this.elements.fileList.querySelector(`.file-item[data-name="${name}"]`);
                if (newItem) {
                    console.log('Found new file item:', newItem);
                    console.log('Starting rename for:', name);
                    this.startRename(newItem);
                } else {
                    console.error('Could not find new file item in list');
                }
            }, 50);
            
        } catch (error) {
            console.error('Failed to create file:', error);
            alert('Unable to create file: ' + error.message);
        }
    }

    // Add this method for showing properties
    showProperties(item) {
        const name = item.dataset.name;
        const type = item.dataset.type;
        const fullPath = this.fileSystem.joinPaths(this.currentPath, name);
        
        let info;
        if (type === 'folder') {
            info = this.fileSystem.getFolderInfo(fullPath);
        } else {
            info = this.fileSystem.getFile(fullPath);
        }
        
        if (info) {
            const created = new Date(info.created).toLocaleString();
            const modified = new Date(info.modified).toLocaleString();
            
            alert(
                `Name: ${info.name}\n` +
                `Type: ${type === 'folder' ? 'Folder' : 'File'}\n` +
                `Location: ${info.path}\n` +
                `Created: ${created}\n` +
                `Modified: ${modified}`
            );
        }
    }

    // Add this method for showing current folder properties
    showFolderProperties() {
        const info = this.fileSystem.getFolderInfo(this.currentPath);
        if (info) {
            const created = new Date(info.created).toLocaleString();
            const modified = new Date(info.modified).toLocaleString();
            const contents = this.fileSystem.getFolderContents(this.currentPath);
            
            alert(
                `Name: ${info.name}\n` +
                `Type: ${info.type === 'system' ? 'System Folder' : 'Folder'}\n` +
                `Location: ${info.path}\n` +
                `Contents: ${contents.folders.length} folders, ${contents.files.length} files\n` +
                `Created: ${created}\n` +
                `Modified: ${modified}`
            );
        }
    }

    pasteItems() {
        if (!this.clipboard || !this.clipboard.items.length) return;
    
        const isCut = this.clipboard.type === 'cut';
        const errors = [];
        const processedItems = [];
    
        this.clipboard.items.forEach(itemName => {
            try {
                const sourcePath = this.fileSystem.joinPaths(this.currentPath, itemName);
                const sourceElement = this.elements.fileList.querySelector(`.file-item[data-name="${itemName}"]`);
                
                if (!sourceElement) return;
    
                const isFolder = sourceElement.dataset.type === 'folder';
                let newPath;
    
                if (isFolder) {
                    // Check if we're trying to paste into a subfolder of the source
                    if (isCut && this.currentPath.startsWith(sourcePath)) {
                        throw new Error(`Cannot move '${itemName}' into one of its subfolders`);
                    }
                    
                    // Copy/Move folder
                    if (isCut) {
                        this.fileSystem.renameFolder(sourcePath, itemName, this.currentPath);
                        newPath = this.fileSystem.joinPaths(this.currentPath, itemName);
                    } else {
                        newPath = this.fileSystem.copyFolder(sourcePath, this.currentPath);
                    }
                } else {
                    // Copy/Move file
                    if (isCut) {
                        this.fileSystem.renameFile(sourcePath, itemName, this.currentPath);
                        newPath = this.fileSystem.joinPaths(this.currentPath, itemName);
                    } else {
                        newPath = this.fileSystem.copyFile(sourcePath, this.currentPath);
                    }
                }
    
                processedItems.push({
                    oldPath: sourcePath,
                    newPath: newPath,
                    element: sourceElement
                });
    
            } catch (error) {
                console.error(`Failed to paste ${itemName}:`, error);
                errors.push(`${itemName}: ${error.message}`);
            }
        });
    
        // Handle processed items
        if (isCut) {
            processedItems.forEach(({element}) => element.remove());
            // Clear the cut items visual effect
            this.elements.fileList.querySelectorAll('.file-item').forEach(
                item => item.style.opacity = '1'
            );
            this.clipboard = null;
        }
    
        // Refresh the current folder view
        this.populateContent();
    
        // Show errors if any
        if (errors.length > 0) {
            alert('The following errors occurred while pasting:\n' + errors.join('\n'));
        }
    }

    // File/Edit/View menus
    
    setupMenus() {
        const menubar = this.elements.menubar;
        let activeMenuItem = null;
        
        // Handle menu item clicks
        menubar.querySelectorAll('.menu-item').forEach(menuItem => {
            menuItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const menuName = menuItem.dataset.menu;
                
                // If clicking the same menu item, close it
                if (menuItem === activeMenuItem) {
                    this.closeAllMenus();
                    activeMenuItem = null;
                    return;
                }
                
                // Close any open menus
                this.closeAllMenus();
                
                // Open the clicked menu
                menuItem.classList.add('active');
                activeMenuItem = menuItem;
                
                const dropdown = this.createMenuDropdown(this.menuDefinitions[menuName].items);
                menuItem.appendChild(dropdown);
            });
        });
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item') && !e.target.closest('.menu-dropdown')) {
                this.closeAllMenus();
                activeMenuItem = null;
            }
        });
    }
    
    createMenuDropdown(items) {
        const dropdown = document.createElement('div');
        dropdown.className = 'menu-dropdown';
        
        items.forEach(item => {
            if (item.type === 'separator') {
                dropdown.appendChild(document.createElement('hr'));
                return;
            }
            
            const button = document.createElement('button');
            button.className = 'menu-item-button';
            
            // Add type-specific classes
            if (item.type === 'checkbox') {
                button.classList.add('checkbox-item');
                if (item.checked) button.classList.add('checked');
            } else if (item.type === 'radio') {
                button.classList.add('radio-item');
                if (item.checked) button.classList.add('checked');
            }
            
            button.textContent = item.label;
            
            if (item.submenu) {
                button.classList.add('has-submenu');
                const submenuContainer = document.createElement('div');
                submenuContainer.className = 'submenu-container';
                const submenu = this.createMenuDropdown(item.submenu);
                submenuContainer.appendChild(submenu);
                button.appendChild(submenuContainer);
            } else {
                if (item.shortcut) {
                    const shortcut = document.createElement('span');
                    shortcut.className = 'menu-shortcut';
                    shortcut.textContent = item.shortcut;
                    button.appendChild(shortcut);
                }
                
                if (item.action) {
                    button.dataset.action = item.action;
                }
                
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (item.type === 'checkbox') {
                        button.classList.toggle('checked');
                    } else if (item.type === 'radio') {
                        // Uncheck all other radio items in the group
                        const siblings = button.parentElement.querySelectorAll('.radio-item');
                        siblings.forEach(sib => sib.classList.remove('checked'));
                        button.classList.add('checked');
                    }
                    
                    if (item.action) {
                        this.handleMenuAction(item.action);
                    }
                });
            }
            
            dropdown.appendChild(button);
        });
        
        return dropdown;
    }
    
    closeAllMenus() {
        console.log('Closing all menus');
        const dropdowns = this.elements.window.querySelectorAll('.menu-dropdown');
        console.log('Found dropdowns to remove:', dropdowns.length);
        dropdowns.forEach(menu => {
            console.log('Removing dropdown:', menu.outerHTML);
            menu.remove();
        });
        
        const activeItems = this.elements.menubar.querySelectorAll('.menu-item.active');
        console.log('Found active items to deactivate:', activeItems.length);
        activeItems.forEach(item => item.classList.remove('active'));
        
        this.activeMenuType = null;
    }

    handleMenuAction(action) {
        console.log('Handling menu action:', action); // Debug log
        
        switch (action) {
            case 'new-folder':
                this.createNewFolder();
                break;
                
            case 'new-file':
                this.createNewFile();
                break;
                
            case 'properties':
                if (this.selectedItems.size === 1) {
                    const item = this.elements.fileList.querySelector('.file-item.selected');
                    this.showProperties(item);
                } else {
                    this.showFolderProperties();
                }
                break;
                
            case 'close':
                this.windowManager.closeWindow(this.elements.window.closest('.program-window'));
                break;
                
            case 'cut':
                this.cutSelectedItems();
                break;
                
            case 'copy':
                this.copySelectedItems();
                break;
                
            case 'paste':
                this.pasteItems();
                break;
                
            case 'select-all':
                this.selectAll();
                break;
                
            case 'delete':
                this.deleteSelectedItems();
                break;
                
            case 'view-icons':
            case 'view-list':
            case 'view-details':
                this.setViewMode(action.split('-')[1]);
                break;
                
            case 'toggle-hidden':
                this.toggleHiddenFiles();
                break;
                
            case 'refresh':
                this.populateContent();
                break;
                
            case 'about':
                this.showAboutDialog();
                break;
                
            default:
                console.warn('Unhandled menu action:', action);
        }
        
        this.closeAllMenus();
    }

    handleShortcut(e) {
        // Only handle shortcuts if the window is active
        if (!this.elements.window.classList.contains('active')) return;

        if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 'a':
                    e.preventDefault();
                    this.handleMenuAction('select-all');
                    break;
                case 'c':
                    e.preventDefault();
                    this.handleMenuAction('copy');
                    break;
                case 'v':
                    e.preventDefault();
                    this.handleMenuAction('paste');
                    break;
                case 'x':
                    e.preventDefault();
                    this.handleMenuAction('cut');
                    break;
            }
        } else if (e.key === 'Delete') {
            this.handleMenuAction('delete');
        } else if (e.key === 'F5') {
            e.preventDefault();
            this.handleMenuAction('refresh');
        }
    }

    // file/edit/view menu actions
    // Add these methods to FileExplorer class

    selectAll() {
        this.elements.fileList.querySelectorAll('.file-item').forEach(item => {
            item.classList.add('selected');
            this.selectedItems.add(item.dataset.name);
        });
        this.updateStatusBar(this.fileSystem.getFolderContents(this.currentPath));
    }

    setViewMode(mode) {
        this.viewMode = mode;
        if (this.elements.fileList) {
            // Clear existing view classes
            this.elements.fileList.className = 'file-list';
            // Add new view class
            this.elements.fileList.classList.add(`view-${mode}`);
        }
        
        // Save the view mode preference
        try {
            const settingsPath = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.settings/user.config`;
            const settings = this.fileSystem.getFile(settingsPath);
            const settingsObj = settings ? JSON.parse(settings.content) : {};
            settingsObj.display = settingsObj.display || {};
            settingsObj.display.fileExplorerView = mode;
            this.fileSystem.saveFile(settingsPath, 'user.config', JSON.stringify(settingsObj), 'json');
        } catch (error) {
            console.log('Could not save view mode preference');
        }
        
        // Update radio buttons in view menu
        const viewModeButtons = this.elements.menubar
            .querySelectorAll('.menu-dropdown .radio-item');
        viewModeButtons.forEach(button => {
            button.classList.toggle('checked', 
                button.textContent.toLowerCase() === mode);
        });
        
        // Refresh the view to apply the new mode
        this.populateContent();
    }

    async toggleHiddenFiles() {
        try {
            const password = await this.promptForPassword();
            if (await this.fileSystem.toggleHiddenFiles(password)) {
                // Update checkbox in view menu
                const hideButton = this.elements.menubar
                    .querySelector('[data-action="toggle-hidden"]');
                if (hideButton) {
                    hideButton.classList.toggle('checked');
                }
                
                // Refresh the view
                this.populateContent();
            }
        } catch (error) {
            alert(error.message);
        }
    }

    async promptForPassword() {
        return new Promise((resolve, reject) => {
            const password = prompt('Enter administrator password to toggle hidden files:');
            if (password === null) {
                reject(new Error('Operation cancelled'));
            } else {
                resolve(password);
            }
        });
    }

    showAboutDialog() {
        alert(
            'File Explorer\n\n' +
            'Version 1.0\n' +
            'Part of ElxaOS\n\n' +
            '© 2025 Elxa Corporation'
        );
    }

    cutSelectedItems() {
        const selectedElements = Array.from(this.elements.fileList.querySelectorAll('.file-item.selected'));
        if (selectedElements.length === 0) return;

        this.clipboard = {
            type: 'cut',
            items: Array.from(this.selectedItems)
        };

        // Add visual feedback for cut items
        selectedElements.forEach(item => {
            item.style.opacity = '0.5';
        });
    }

    copySelectedItems() {
        if (this.selectedItems.size === 0) return;

        this.clipboard = {
            type: 'copy',
            items: Array.from(this.selectedItems)
        };
    }

}