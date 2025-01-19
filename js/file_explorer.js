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
        // If no path is provided at all, then use the default
        if (initialPath === undefined) {
            initialPath = '/ElxaOS/Users/kitkat';
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

        // Context menu
        this.elements.fileList.addEventListener('contextmenu', (e) => {
            e.preventDefault();
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

// Update the tree creation methods in FileExplorer class

    populateFolderTree() {
        const treeRoot = this.elements.folderTree;
        treeRoot.innerHTML = '';

        // Start with root folder
        const rootFolder = this.createTreeItem('ElxaOS', '/ElxaOS', true);
        treeRoot.appendChild(rootFolder);

        // Create container for root's children
        const rootBranch = document.createElement('div');
        rootBranch.className = 'tree-branch';
        this.populateTreeBranch('/ElxaOS', rootBranch);
        rootFolder.appendChild(rootBranch);

        // Start with root expanded
        rootFolder.querySelector('.expand-arrow').textContent = '▼';
    }

    createTreeItem(name, path, isRoot = false) {
        // Container for both the item and its children
        const container = document.createElement('div');
        container.className = 'tree-container';
        
        // Create the item itself
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.dataset.path = path;
        
        // Create a container for the item's content
        const itemContent = document.createElement('div');
        itemContent.className = 'tree-item-content';
        
        const expandArrow = document.createElement('span');
        expandArrow.className = 'expand-arrow';
        expandArrow.textContent = '►';
        itemContent.appendChild(expandArrow);
        
        // Add folder icon
        const icon = IconSet.getIcon('folder', isRoot ? 'computer' : 'default');
        icon.className = 'file-icon';
        itemContent.appendChild(icon);
        
        const label = document.createElement('span');
        label.textContent = name;
        itemContent.appendChild(label);
        
        // Add the content container to the item
        item.appendChild(itemContent);
        
        // Add item to the main container
        container.appendChild(item);
        
        // Add click handlers
        expandArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const branch = container.querySelector('.tree-branch');
            if (branch) {
                const isExpanded = expandArrow.textContent === '▼';
                branch.style.display = isExpanded ? 'none' : 'block';
                expandArrow.textContent = isExpanded ? '►' : '▼';
            }
        });
        
        item.addEventListener('click', () => {
            this.navigateTo(path);
            // Update visual selection
            this.elements.folderTree.querySelectorAll('.tree-item').forEach(i => {
                i.classList.remove('selected');
            });
            item.classList.add('selected');
        });
        
        return container;
    }
    
    // Update the populateTreeBranch method
    populateTreeBranch(path, container) {
        const contents = this.fileSystem.getFolderContents(path);
        
        contents.folders.forEach(folder => {
            const fullPath = this.fileSystem.joinPaths(path, folder.name);
            const treeItemContainer = this.createTreeItem(folder.name, fullPath);
            
            // Create branch for children
            const childBranch = document.createElement('div');
            childBranch.className = 'tree-branch';
            // Initially hide the branch
            childBranch.style.display = 'none';
            
            // Populate the branch
            this.populateTreeBranch(fullPath, childBranch);
            
            // Only append branch if it has children
            if (childBranch.children.length > 0) {
                treeItemContainer.appendChild(childBranch);
            }
            
            container.appendChild(treeItemContainer);
        });
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
            const item = this.createFileListItem(folder.name, 'folder');
            this.elements.fileList.appendChild(item);
        });
    
        // Then add files
        contents.files.forEach(file => {
            const item = this.createFileListItem(file.name, this.getFileType(file));
            this.elements.fileList.appendChild(item);
        });
    }

    updateFolderTree() {
        // Implementation for folder tree view
        // This will show the hierarchical folder structure
        // TODO: Implement folder tree
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

    createFileListItem(name, type) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.name = name;
        item.dataset.type = type;

        const icon = IconSet.getIcon(type === 'folder' ? 'folder' : 'file', type);
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
        // Determine file type based on extension or metadata
        return file.type || 'default';
    }

    openFile(name, type) {
        const path = this.fileSystem.joinPaths(this.currentPath, name);
        const file = this.fileSystem.getFile(path);

        switch (type) {
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

        this.showMenu(menu, e);
        this.setupContextMenuHandlers(menu, item);
    }

    showFolderContextMenu(e) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <button data-action="paste">Paste</button>
            <hr>
            <button data-action="new-folder">New Folder</button>
            <button data-action="new-file">New File</button>
            <hr>
            <button data-action="properties">Properties</button>
        `;

        this.showMenu(menu, e);
        this.setupFolderContextMenuHandlers(menu);
    }

    showMenu(menu, e) {
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

    setupContextMenuHandlers(menu, item) {
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleContextMenuAction(action, item);
            }
            menu.remove();
        });
    }

    setupFolderContextMenuHandlers(menu) {
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleFolderContextMenuAction(action);
            }
            menu.remove();
        });
    }

    handleContextMenuAction(action, item) {
        const name = item.dataset.name;
        const type = item.dataset.type;

        switch (action) {
            case 'open':
                this.handleItemDoubleClick(item);
                break;
            case 'cut':
                this.clipboard = { type: 'cut', items: Array.from(this.selectedItems) };
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
                this.startRename(item);
                break;
            // Add more actions as needed
        }
    }

    handleFolderContextMenuAction(action) {
        switch (action) {
            case 'new-folder':
                this.createNewFolder();
                break;
            case 'new-file':
                this.createNewFile();
                break;
            case 'paste':
                this.pasteItems();
                break;
            // Add more actions as needed
        }
    }

    // TODO: Implement remaining file operations
    createNewFolder() {}
    createNewFile() {}
    pasteItems() {}
    deleteSelectedItems() {}
    startRename(item) {}
}