export class StorageSettings {
    constructor(storageManager) {
        this.storageManager = storageManager;
    }

    async initialize(container) {
        const supported = await this.storageManager.isSupported();
        const hasPermission = await this.storageManager.hasPermission();

        container.innerHTML = `
            <div class="settings-section">
                <h2>Storage Location</h2>
                
                ${!supported ? `
                    <div class="settings-warning">
                        Your browser doesn't support external file storage. 
                        Files will be saved in browser storage instead.
                    </div>
                ` : ''}
                
                <div class="settings-content">
                    <div class="settings-row">
                        <div class="settings-label">Current Storage:</div>
                        <div class="settings-value">
                            ${hasPermission ? 'External Storage' : 'Browser Storage'}
                        </div>
                    </div>

                    ${supported ? `
                        <div class="settings-row">
                            <button class="settings-button" id="changeStorageBtn">
                                ${hasPermission ? 'Change Storage Location' : 'Set Storage Location'}
                            </button>
                        </div>
                        
                        <p class="settings-info">
                            Choose a folder on your computer where ElxaOS will store your files.
                            This allows unlimited storage and keeps your files accessible even when offline.
                        </p>
                    ` : ''}
                </div>
            </div>
        `;

        if (supported) {
            const changeBtn = container.querySelector('#changeStorageBtn');
            changeBtn.addEventListener('click', async () => {
                const success = await this.storageManager.selectDirectory();
                if (success) {
                    // Refresh the settings view
                    this.initialize(container);
                }
            });
        }
    }
}