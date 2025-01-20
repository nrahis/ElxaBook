// file_explorer.js
import { IconSet } from './icons.js'; 

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
        this.elements = {}; // Initialize the elements object
    }

    initialize(contentArea, initialPath) {
        // If no path is provided at all, use the current user's home directory
        if (initialPath === undefined) {
            const currentUser = this.fileSystem.currentUsername;
            console.log('Current user in file explorer:', currentUser); // Debug log
            initialPath = `/ElxaOS/Users/${currentUser}`;
        }
        
        console.log('Initializing FileExplorer with path:', initialPath);
        
        this.setupExplorerWindow(contentArea);
        
        this.currentPath = initialPath;
        console.log('Set current path to:', this.currentPath);
        
        this.history = [initialPath];
        this.historyIndex = 0;
        
        this.populateContent();
        this.setupEventListeners();
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
                    <div class="file-list"></div>
                </div>

                <div class="explorer-statusbar">
                    <span class="status-text">0 items</span>
                </div>
            </div>
        `;

        // Store element references
        this.elements = {
            window: contentArea.querySelector('.explorer-window'),
            titleBar: contentArea.closest('.program-window').querySelector('.window-title'),  // Add this line
            menubar: contentArea.querySelector('.explorer-menubar'),
            toolbar: contentArea.querySelector('.explorer-toolbar'),
            addressBar: contentArea.querySelector('.address-bar'),
            pathSegments: contentArea.querySelector('.path-segments'),
            folderTree: contentArea.querySelector('.folder-tree'),
            fileList: contentArea.querySelector('.file-list'),
            statusBar: contentArea.querySelector('.explorer-statusbar'),
            backButton: contentArea.querySelector('[data-action="back"]'),
            forwardButton: contentArea.querySelector('[data-action="forward"]'),
            upButton: contentArea.querySelector('[data-action="up"]')
        };

        // Verify that all elements were found
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                console.error(`Failed to find element: ${key}`);
            }
        });

        // Update the window title
        this.updateWindowTitle();
    }

    updateWindowTitle() {
        if (this.elements.titleBar) {
            const currentFolder = this.currentPath.split('/').pop() || 'File Explorer';
            this.elements.titleBar.textContent = currentFolder;
        }
    }

    setupEventListeners() {
        // Navigation buttons
        this.elements.backButton.addEventListener('click', () => this.navigateBack());
        this.elements.forwardButton.addEventListener('click', () => this.navigateForward());
        this.elements.upButton.addEventListener('click', () => this.navigateUp());

        // Menu items
        this.elements.menubar.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                this.showMenu(menuItem.dataset.menu);
            }
        });

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
        
        // Add folders first
        contents.folders.forEach(folder => {
            const item = this.createFileListItem(folder.name, 'folder', folder);
            this.elements.fileList.appendChild(item);
        });
    
        // Then add files
        contents.files.forEach(file => {
            const item = this.createFileListItem(file.name, file.type, file);
            this.elements.fileList.appendChild(item);
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
        console.log('Creating file list item:', { name, type, fileInfo }); // Debug log
        
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.name = name;
        item.dataset.type = type;
    
        // Determine correct icon category and type
        let iconCategory;
        if (type === 'folder') {
            iconCategory = 'folder';
        } else if (type === 'program') {
            iconCategory = 'program';
        } else {
            iconCategory = 'file';
        }
    
        console.log('Getting icon with:', { iconCategory, fileInfo }); // Debug log
        const icon = IconSet.getIcon(iconCategory, fileInfo);
        icon.className = 'file-icon';
    
        const label = document.createElement('div');
        label.className = 'file-label';
        label.textContent = name;
    
        item.appendChild(icon);
        item.appendChild(label);
    
        return item;
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
    
        if (type === 'folder') {
            this.navigateTo(this.fileSystem.joinPaths(this.currentPath, name));
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
                this.windowManager.createWindow('paint', { file });
                break;
            // Add more file type handlers as needed
        }
    }

    showContextMenu(e, item) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        // Get the full path and check if it's a system folder
        const fullPath = this.fileSystem.joinPaths(this.currentPath, item.dataset.name);
        const isSystemFolder = item.dataset.type === 'folder' && 
            this.fileSystem.getFolderInfo(fullPath)?.type === 'system';
    
        menu.innerHTML = `
            <button data-action="open">Open</button>
            <hr>
            <button data-action="cut" ${isSystemFolder ? 'disabled' : ''}>Cut</button>
            <button data-action="copy">Copy</button>
            <button data-action="paste" ${!this.clipboard ? 'disabled' : ''}>Paste</button>
            <button data-action="delete" ${isSystemFolder ? 'disabled' : ''}>Delete</button>
            <hr>
            <button data-action="rename" ${isSystemFolder ? 'disabled' : ''}>Rename</button>
            <button data-action="properties">Properties</button>
        `;
    
        this.showMenu(menu, e);
        this.setupContextMenuHandlers(menu, item);
    }


    showFolderContextMenu(e) {
        console.log('Showing folder context menu');
        e.preventDefault();  // Prevent default context menu
        e.stopPropagation(); // Stop event propagation
        
        // Remove any existing context menus
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <button data-action="paste" ${!this.clipboard ? 'disabled' : ''}>Paste</button>
            <hr>
            <button data-action="new-folder">New Folder</button>
            <button data-action="new-file">New Text Document</button>
            <hr>
            <button data-action="refresh">Refresh</button>
            <button data-action="properties">Properties</button>
        `;
    
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
        console.log('Positioning menu at:', e.pageX, e.pageY); // Debug log
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        document.body.appendChild(menu);
    
        // Handle clicking outside the menu
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                console.log('Closing menu due to outside click'); // Debug log
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
        }
    }

    // folder creation and deletion

// Update this method in FileExplorer class

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
            let success = false;
            
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
                        const newPath = this.fileSystem.renameFolder(fullPath, newName);
                        console.log('Folder renamed successfully to:', newPath);
                    } else {
                        const newPath = this.fileSystem.renameFile(fullPath, newName);
                        console.log('File renamed successfully to:', newPath);
                    }
                    
                    success = true;
                } catch (error) {
                    console.error('Failed to rename:', error);
                    alert('Unable to rename: ' + error.message);
                }
            }
            
            // Create new label
            const newLabel = document.createElement('div');
            newLabel.className = 'file-label';
            newLabel.textContent = success ? newName : originalName;
            
            // Update the item's data attribute if successful
            if (success) {
                item.dataset.name = newName;
            }
            
            // Replace input with label
            input.replaceWith(newLabel);
            
            // Only refresh content if rename was successful
            if (success) {
                // Give the file system a moment to update
                setTimeout(() => {
                    this.populateContent();
                }, 50);
            }
        };
        
        // Handle input events
        input.addEventListener('blur', () => finishRename(input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishRename(input.value);
            } else if (e.key === 'Escape') {
                finishRename(originalName, true);
            }
        });
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
            ? `Are you sure you want to delete "${itemNames}"?`
            : `Are you sure you want to delete these ${selectedElements.length} items?\n"${itemNames}"`;
        
        if (confirm(confirmMessage)) {
            let errorCount = 0;
            
            selectedElements.forEach(element => {
                const name = element.dataset.name;
                const isFolder = element.dataset.type === 'folder';
                const fullPath = this.fileSystem.joinPaths(this.currentPath, name);
                
                try {
                    if (isFolder) {
                        // Check if this is a system folder
                        const folderInfo = this.fileSystem.getFolderInfo(fullPath);
                        if (folderInfo && folderInfo.type === 'system') {
                            throw new Error('System folders cannot be deleted');
                        }
                        this.fileSystem.deleteFolder(fullPath);
                    } else {
                        this.fileSystem.deleteFile(fullPath);
                    }
                    
                    // Remove from view if successful
                    element.remove();
                    this.selectedItems.delete(name);
                    
                } catch (error) {
                    console.error(`Failed to delete ${name}:`, error);
                    errorCount++;
                }
            });
            
            // Update the view
            this.updateStatusBar(this.fileSystem.getFolderContents(this.currentPath));
            
            // Show error message if any operations failed
            if (errorCount > 0) {
                alert(`Failed to delete ${errorCount} item(s).\nSystem folders cannot be deleted.`);
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
}