import { fileSystem } from './storage.js';
import { StorageSettings } from './storage/storage_settings.js';

export class SystemCleaner {
    constructor() {
        // Debug logging to verify initialization
        console.log('Initializing SystemCleaner');
        console.log('FileSystem available:', !!fileSystem);
        console.log('Current user:', fileSystem?.currentUsername);
        
        this.currentUser = fileSystem.currentUsername;
        this.currentTab = 'clean-files';
        this.storageManager = fileSystem.storageManager;
        console.log('StorageManager available:', !!this.storageManager);
        
        // Initialize StorageSettings with the storageManager
        this.storageSettings = new StorageSettings(this.storageManager);
        console.log('StorageSettings initialized:', !!this.storageSettings);
    }

    async initialize(container) {
        if (!container) {
            console.error('No container provided to SystemCleaner');
            return;
        }

        // Add required CSS class to container
        container.classList.add('cleaner-container');
        
        container.innerHTML = `
            <div class="cleaner-wrapper">
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

                <div class="tab-content">
                    <div class="loading">Loading...</div>
                </div>
            </div>
        `;

        // Setup tabs and show initial content
        try {
            await this.setupTabs(container);
            await this.showTab(container, 'clean-files');
        } catch (error) {
            console.error('Failed to initialize SystemCleaner:', error);
            container.querySelector('.tab-content').innerHTML = `
                <div class="error-message">
                    Failed to initialize system cleaner. Please try again.
                    Error: ${error.message}
                </div>
            `;
        }
    }

    async setupTabs(container) {
        const tabsContainer = container.querySelector('.cleaner-tabs');
        if (!tabsContainer) return;

        tabsContainer.addEventListener('click', async (e) => {
            const button = e.target.closest('.tab-button');
            if (button && !button.classList.contains('disabled')) {
                // Remove active class from all buttons
                container.querySelectorAll('.tab-button').forEach(btn => 
                    btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                // Show the corresponding tab content
                await this.showTab(container, button.dataset.tab);
            }
        });
    }

    async showTab(container, tabId) {
        console.log(`Attempting to show tab: ${tabId}`);
        const content = container.querySelector('.tab-content');
        if (!content) {
            console.error('No content container found');
            return;
        }

        this.currentTab = tabId;
        content.innerHTML = '<div class="loading">Loading tab content...</div>';

        try {
            switch(tabId) {
                case 'clean-files':
                    console.log('Loading clean files tab');
                    await this.showCleanFilesTab(content);
                    break;
                case 'storage-location':
                    console.log('Loading storage location tab');
                    if (!this.storageSettings) {
                        throw new Error('Storage settings not initialized');
                    }
                    await this.storageSettings.initialize(content);
                    break;
                case 'programs':
                    console.log('Loading programs tab');
                    this.showProgramsTab(content);
                    break;
                default:
                    throw new Error(`Unknown tab: ${tabId}`);
            }
        } catch (error) {
            console.error(`Error showing tab ${tabId}:`, error);
            content.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Tab</h3>
                    <p>An error occurred while loading this tab: ${error.message}</p>
                    <button onclick="this.closest('.tab-content').querySelector('.error-message').remove(); this.showTab(this.closest('.cleaner-container'), '${tabId}')">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    async showCleanFilesTab(container) {
        console.log('Setting up clean files tab content');
        container.innerHTML = `
            <div class="cleaner-section">
                <h2 class="section-title">Storage Cleaner</h2>
                <p class="cleaner-info">Manage your saved files to free up space</p>
                
                <div class="cl-files-container">
                    <div class="cl-files-header">
                        <div class="cl-file-name-col">Name</div>
                        <div class="cl-file-type-col">Type</div>
                        <div class="cl-file-location-col">Location</div>
                        <div class="cl-file-size-col">Size</div>
                        <div class="cl-file-actions-col">Action</div>
                    </div>
                    <div class="cl-files-list">
                        <div class="loading">Loading files...</div>
                    </div>
                </div>

                <div class="cleaner-footer">
                    <button class="clean-all-button">Clean All Files</button>
                </div>
            </div>
        `;

        try {
            await this.updateFilesList(container);
            this.setupCleanerEvents(container);
        } catch (error) {
            console.error('Error loading files list:', error);
            container.querySelector('.cl-files-list').innerHTML = `
                <div class="error-message">
                    Failed to load files list: ${error.message}
                </div>
            `;
        }
    }

    showProgramsTab(container) {
        container.innerHTML = `
            <div class="cleaner-section">
                <h2 class="section-title">Programs</h2>
                <p class="coming-soon">Program management coming soon...</p>
            </div>
        `;
    }

    async updateFilesList(container) {
        const filesList = container.querySelector('.cl-files-list');
        if (!filesList) return;

        const files = this.getUserFiles();
        
        if (files.length === 0) {
            filesList.innerHTML = `
                <div class="no-files">
                    No user files found
                </div>
            `;
            const cleanAllButton = container.querySelector('.clean-all-button');
            if (cleanAllButton) {
                cleanAllButton.disabled = true;
            }
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
        
        const cleanAllButton = container.querySelector('.clean-all-button');
        if (cleanAllButton) {
            cleanAllButton.disabled = false;
        }
    }

    getUserFiles() {
        const files = JSON.parse(localStorage.getItem('elxaos_files') || '{}');
        const userPath = `/ElxaOS/Users/${this.currentUser}`;
        
        const userFiles = [];
        for (const [path, file] of Object.entries(files)) {
            if (path.startsWith(userPath) && !file.isProtected) {
                userFiles.push({
                    path,
                    name: file.name,
                    type: this.getFileType(file),
                    location: this.getFileLocation(path),
                    size: this.getFileSize(file),
                    modified: new Date(file.modified).toLocaleString()
                });
            }
        }

        return userFiles.sort((a, b) => b.size - a.size);
    }

    getFileSize(file) {
        if (!file.content) return 0;
        return typeof file.content === 'string' ? 
            new Blob([file.content]).size : 0;
    }

    getFileType(file) {
        if (file.type === 'image') return 'Image';
        if (file.type === 'text') return 'Text Document';
        return 'File';
    }

    getFileLocation(path) {
        const parts = path.split('/');
        const mainFolders = ['Documents', 'Pictures', 'Music', 'Downloads'];
        for (let i = parts.length - 2; i >= 0; i--) {
            if (mainFolders.includes(parts[i])) {
                return parts[i];
            }
        }
        return parts[parts.length - 2];
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    }

    setupCleanerEvents(container) {
        // Handle individual file deletion
        container.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-file-button')) {
                const fileItem = e.target.closest('.cl-file-item');
                const path = fileItem.dataset.path;
                
                if (confirm('Are you sure you want to delete this file?')) {
                    try {
                        fileSystem.deleteFile(path);
                        await this.updateFilesList(container);
                    } catch (error) {
                        alert('Failed to delete file');
                    }
                }
            }
        });

        // Handle clean all files
        const cleanAllButton = container.querySelector('.clean-all-button');
        if (cleanAllButton) {
            cleanAllButton.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete all user files? This cannot be undone!')) {
                    const files = this.getUserFiles();
                    let successCount = 0;
                    
                    for (const file of files) {
                        try {
                            fileSystem.deleteFile(file.path);
                            successCount++;
                        } catch (error) {
                            console.error('Failed to delete file:', error);
                        }
                    }

                    if (successCount > 0) {
                        alert(`Successfully deleted ${successCount} files`);
                        await this.updateFilesList(container);
                    }
                }
            });
        }
    }
}