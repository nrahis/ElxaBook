export class StorageSettings {
    constructor(storageManager) {
        this.storageManager = storageManager;
    }

    async initialize(container) {
        if (!container) {
            console.error('No container provided to StorageSettings');
            return;
        }

        // Ensure storageManager exists
        if (!this.storageManager) {
            console.error('No StorageManager provided to StorageSettings');
            container.innerHTML = `
                <div class="settings-warning">
                    Storage management is currently unavailable.
                </div>
            `;
            return;
        }

        try {
            const supported = await this.storageManager.isSupported();
            const hasPermission = await this.storageManager.hasPermission();

            container.innerHTML = `
                <div class="settings-section">
                    <h2 class="section-title">Storage Location</h2>
                    
                    ${!supported ? `
                        <div class="settings-warning">
                            Your browser doesn't support external file storage. 
                            Files will be saved in browser storage instead.
                        </div>
                    ` : ''}
                    
                    <div class="storage-content">
                        <div class="storage-status">
                            Current Storage: 
                            <span class="status-value">
                                ${hasPermission ? 'External Storage' : 'Browser Storage'}
                            </span>
                        </div>

                        ${supported ? `
                            <button class="storage-button" id="changeStorageBtn">
                                ${hasPermission ? 'Change Storage Location' : 'Set Storage Location'}
                            </button>
                            
                            <p class="storage-description">
                                Choose a folder on your computer where ElxaOS will store your files.
                                This allows unlimited storage and keeps your files accessible even when offline.
                            </p>
                        ` : ''}
                    </div>
                </div>
            `;

            if (supported) {
                const changeBtn = container.querySelector('#changeStorageBtn');
                if (changeBtn) {
                    changeBtn.addEventListener('click', async () => {
                        const success = await this.storageManager.selectDirectory();
                        if (success) {
                            // Refresh the storage view
                            await this.initialize(container);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error initializing StorageSettings:', error);
            container.innerHTML = `
                <div class="settings-error">
                    An error occurred while loading storage settings.
                    Please try again later.
                </div>
            `;
        }
    }
}