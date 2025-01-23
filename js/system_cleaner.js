import { fileSystem } from './storage.js';
import { StorageManager } from './storage/storage_manager.js';  

export class SystemCleaner {
    constructor() {
        this.currentUser = fileSystem.currentUsername;
        this.currentTab = 'clean-files'; // Default tab
    }

    async initialize(container) {
        container.innerHTML = `
            <div class="cleaner-container">
                <div class="cleaner-tabs">
                    <button class="tab-button active" data-tab="clean-files">
                        Clean Files
                    </button>
                    <button class="tab-button" data-tab="storage-location">
                        Storage Location
                    </button>
                    <button class="tab-button disabled" data-tab="programs">
                        Programs
                    </button>
                </div>

                <div class="tab-content"></div>
            </div>
        `;

        this.setupTabs(container);
        await this.showTab(container, 'clean-files');
    }

    setupTabs(container) {
        container.querySelector('.cleaner-tabs').addEventListener('click', async (e) => {
            const button = e.target.closest('.tab-button');
            if (button && !button.classList.contains('disabled')) {
                container.querySelectorAll('.tab-button').forEach(btn => 
                    btn.classList.remove('active'));
                button.classList.add('active');
                await this.showTab(container, button.dataset.tab);
            }
        });
    }

    async showTab(container, tabId) {
        const content = container.querySelector('.tab-content');
        this.currentTab = tabId;

        switch(tabId) {
            case 'clean-files':
                this.showCleanFilesTab(content);
                break;
            case 'storage-location':
                await this.showStorageLocationTab(content);
                break;
            case 'programs':
                this.showProgramsTab(content);
                break;
        }
    }

    showCleanFilesTab(container) {
        container.innerHTML = `
            <h2>Storage Cleaner</h2>
            <p class="cleaner-info">Manage your saved files to free up space</p>
            
            <div class="cl-files-container">
                <div class="cl-files-header">
                    <div class="cl-file-name-col">Name</div>
                    <div class="cl-file-type-col">Type</div>
                    <div class="cl-file-location-col">Location</div>
                    <div class="cl-file-size-col">Size</div>
                    <div class="cl-file-actions-col">Action</div>
                </div>
                <div class="cl-files-list"></div>
            </div>

            <div class="cleaner-footer">
                <button class="clean-all-button">Clean All Files</button>
            </div>
        `;

        this.updateFilesList(container);
        this.setupCleanerEvents(container);
    }

    async showStorageLocationTab(container) {
        // Access StorageManager through fileSystem
        const storageManager = fileSystem.storageManager;
        const supported = await storageManager.isSupported();
        const hasPermission = await storageManager.hasPermission();
    
        container.innerHTML = `
            <h2>Storage Location</h2>
            <div class="storage-info">
                ${supported ? `
                    <div class="storage-section">
                        <p class="storage-status">
                            Current Storage: <span class="status-value">
                                ${hasPermission ? 'External Storage' : 'Browser Storage'}
                            </span>
                        </p>
                        <button class="storage-button" id="changeStorageBtn">
                            ${hasPermission ? 'Change Storage Location' : 'Set Storage Location'}
                        </button>
                        <p class="storage-description">
                            Choose a folder on your computer where ElxaOS will store your files.
                            This allows unlimited storage and keeps your files accessible even when offline.
                        </p>
                    </div>
                ` : `
                    <div class="storage-warning">
                        Your browser doesn't support external file storage.
                        Files will be saved in browser storage instead.
                    </div>
                `}
            </div>
        `;
    
        if (supported) {
            container.querySelector('#changeStorageBtn').addEventListener('click', async () => {
                const success = await storageManager.selectDirectory();
                if (success) {
                    await this.showStorageLocationTab(container);
                }
            });
        }
    }

    showProgramsTab(container) {
        container.innerHTML = `
            <h2>Programs</h2>
            <p class="coming-soon">Program management coming soon...</p>
        `;
    }

    getUserFiles() {
        const files = JSON.parse(localStorage.getItem('elxaos_files') || '{}');
        const userPath = `/ElxaOS/Users/${this.currentUser}`;
        
        // Get only user-created files (not system files, games, or shortcuts)
        const userFiles = [];
        for (const [path, file] of Object.entries(files)) {
            // Skip if file is:
            // - Not in user's directory
            // - Protected
            // - A shortcut (.lnk)
            // - A program/game
            // - In the Games folder
            if (!path.startsWith(userPath) || 
                file.isProtected || 
                file.name.endsWith('.lnk') || 
                file.type === 'program' ||
                path.includes('/Games/')) {
                continue;
            }

            userFiles.push({
                path,
                name: file.name,
                type: this.getFileType(file),
                location: this.getFileLocation(path),
                size: new Blob([file.content || '']).size,
                modified: new Date(file.modified).toLocaleString()
            });
        }

        return userFiles.sort((a, b) => b.size - a.size); // Sort by size descending
    }

    getFileType(file) {
        if (file.type === 'image' || file.name.endsWith('.png')) return 'Image';
        if (file.name.endsWith('.txt')) return 'Text Document';
        if (file.name.endsWith('.odp')) return 'Slideshow';
        return 'Document';
    }

    getFileLocation(path) {
        // Extract the parent folder name from the path
        const parts = path.split('/');
        // Find the index of the main folders we care about
        const mainFolders = ['Documents', 'Pictures', 'Music', 'Downloads'];
        for (let i = parts.length - 2; i >= 0; i--) {
            if (mainFolders.includes(parts[i])) {
                return parts[i];
            }
        }
        return parts[parts.length - 2]; // Fallback to immediate parent
    }

    formatSize(bytes) {
        const units = ['B', 'KB', 'MB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    deleteFile(path) {
        try {
            fileSystem.deleteFile(path);
            return true;
        } catch (error) {
            console.error('Failed to delete file:', error);
            return false;
        }
    }

    initialize(container) {
        container.innerHTML = `
            <div class="cleaner-container">
                <h2>Storage Cleaner</h2>
                <p class="cleaner-info">Manage your saved files to free up space</p>
                
                <div class="cl-files-container">
                    <div class="cl-files-header">
                        <div class="cl-file-name-col">Name</div>
                        <div class="cl-file-type-col">Type</div>
                        <div class="cl-file-location-col">Location</div>
                        <div class="cl-file-size-col">Size</div>
                        <div class="cl-file-actions-col">Action</div>
                    </div>
                    <div class="cl-files-list"></div>
                </div>

                <div class="cleaner-footer">
                    <button class="clean-all-button">Clean All Files</button>
                </div>
            </div>
        `;

        this.updateDisplay(container);
        this.setupEventListeners(container);
    }

    updateDisplay(container) {
        const filesList = container.querySelector('.cl-files-list');
        const files = this.getUserFiles();
        
        if (files.length === 0) {
            filesList.innerHTML = `
                <div class="no-files">
                    No user files found
                </div>
            `;
            container.querySelector('.clean-all-button').disabled = true;
            return;
        }

        filesList.innerHTML = files.map(file => `
            <div class="cl-file-item" data-path="${file.path}">
                <div class="cl-file-name-col">${file.name}</div>
                <div class="cl-file-type-col">${file.type}</div>
                <div class="cl-file-location-col">${file.location}</div>
                <div class="cl-file-size-col">${this.formatSize(file.size)}</div>
                <div class="cl-file-actions-col">
                    <button class="delete-file-button">Delete</button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners(container) {
        // Individual file deletion
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-file-button')) {
                const fileItem = e.target.closest('.file-item');
                const path = fileItem.dataset.path;
                
                if (confirm('Are you sure you want to delete this file?')) {
                    if (this.deleteFile(path)) {
                        this.updateDisplay(container);
                    } else {
                        alert('Failed to delete file');
                    }
                }
            }
        });

        // Clean all files
        container.querySelector('.clean-all-button').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all user files? This cannot be undone!')) {
                const files = this.getUserFiles();
                let successCount = 0;
                
                files.forEach(file => {
                    if (this.deleteFile(file.path)) {
                        successCount++;
                    }
                });

                if (successCount > 0) {
                    alert(`Successfully deleted ${successCount} files`);
                    this.updateDisplay(container);
                }
            }
        });
    }
}