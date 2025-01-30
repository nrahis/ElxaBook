import { UserManager } from './user_manager.js';
import { AvatarManager } from './avatar_manager.js';
import { CONFIG } from './apps/system/config.js';
import { SettingsManager } from './settings_manager.js';

export class Settings {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.pendingChanges = {
            display: {},
            personalization: {}
        };
        
        // Background options
        this.defaultBackgrounds = [
            {
                name: 'Vaporwave Gradient',
                type: 'gradient',
                value: 'linear-gradient(135deg, #a267ac, #67c9dc, #ff99cc)'
            },
            {
                name: 'Retro Grid',
                type: 'gradient',
                value: 'linear-gradient(171deg, #ff99cc 0%, #a267ac 100%)'
            },
            {
                name: 'Sunset Paradise',
                type: 'gradient',
                value: 'linear-gradient(45deg, #ff6ec4, #7873f5)'
            },
            {
                name: 'Ocean Dream',
                type: 'gradient',
                value: 'linear-gradient(135deg, #67c9dc, #7873f5, #ff99cc)'
            }
        ];

        // System fonts
        this.systemFonts = [
            { name: 'Verdana', value: '"Verdana", sans-serif' },
            { name: 'Arial', value: '"Arial", sans-serif' },
            { name: 'Segoe UI', value: '"Segoe UI", "Verdana", sans-serif' },
            { name: 'MS Sans Serif', value: '"MS Sans Serif", "Arial", sans-serif' },
            { name: 'Tahoma', value: '"Tahoma", sans-serif' }
        ];
    }

    async initialize(contentArea) {
        this.contentArea = contentArea;
        
        // Create a new SettingsManager if one doesn't exist globally
        if (!window.elxaSettingsManager) {
            window.elxaSettingsManager = new SettingsManager(this.fileSystem);
            await window.elxaSettingsManager.initialize(this.fileSystem.currentUsername);
        }
        
        this.settingsManager = window.elxaSettingsManager;
        
        await this.loadThemes();
        this.render();
        
        // Load current settings
        const currentSettings = this.settingsManager.getSettings();
        
        // Apply settings to UI without previewing
        this.applySettingsToUI(currentSettings);
        this.setupEventListeners();
    }

    render() {
        this.contentArea.innerHTML = `
            <div class="settings-container">
                <div class="settings-tabs">
                    <button class="tab-button active" data-tab="display">Display</button>
                    <button class="tab-button" data-tab="personalization">Personalization</button>
                    <button class="tab-button" data-tab="users">Users & Accounts</button>
                    <button class="tab-button" data-tab="system">System Info</button>
                </div>
                
                <div class="settings-content">
                    <div class="tab-panel active" id="display-panel">
                        ${this.renderDisplayPanel()}
                    </div>
                    <div class="tab-panel" id="personalization-panel">
                        ${this.renderPersonalizationPanel()}
                    </div>
                    <div class="tab-panel" id="users-panel">
                        ${this.renderUsersPanel()}
                    </div>
                    <div class="tab-panel" id="system-panel">
                        ${this.renderSystemPanel()}
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button class="settings-button" id="settings-apply">Apply</button>
                    <button class="settings-button" id="settings-ok">OK</button>
                    <button class="settings-button" id="settings-cancel">Cancel</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadCustomBackgrounds();
    }

    renderDisplayPanel() {
        return `
            <div class="settings-panel">
                <div class="settings-preview">
                    <div id="backgroundPreview" class="preview-box"></div>
                    <div class="preview-label">Background Preview</div>
                </div>
                
                <div class="settings-options">
                    <div class="settings-group">
                        <label>Desktop Background:</label>
                        <select id="backgroundSelect">
                            <option disabled>-- Default Backgrounds --</option>
                            ${this.defaultBackgrounds.map((bg, index) => `
                                <option value="default-${index}">${bg.name}</option>
                            `).join('')}
                            <option disabled>-- Custom Backgrounds --</option>
                        </select>
                        <button id="browseButton">Browse...</button>
                        <input type="file" id="customBackground" accept=".jpg,.jpeg,.png" style="display: none;">
                    </div>
                </div>
            </div>
        `;
    }

    renderPersonalizationPanel() {
        return `
            <div class="settings-panel">
                <div class="settings-group">
                    <h3>Theme</h3>
                    <select id="themeSelect" class="settings-select">
                        ${Object.values(this.themes || {}).map(theme => 
                            `<option value="${theme.id}">${theme.name}</option>`
                        ).join('')}
                    </select>
                    
                    <div class="theme-preview">
                        <div class="preview-window">
                            <div class="preview-titlebar" style="background: var(--titlebar-gradient)">
                                Theme Preview
                            </div>
                            <div class="preview-content" style="background: var(--bg-light)">
                                <button class="preview-button" style="background: var(--button-gradient)">
                                    Sample Button
                                </button>
                                <div class="preview-text" style="color: var(--purple-dark)">
                                    Sample Text
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>System Font</h3>
                    <select id="systemFont">
                        ${this.systemFonts.map(font => 
                            `<option value='${font.value}'>${font.name}</option>`
                        ).join('')}
                    </select>
                    <div id="fontPreview">
                        The quick brown fox jumps over the lazy dog
                    </div>
                </div>
            </div>`;
    }

    renderUsersPanel() {
        const userManager = new UserManager(this.fileSystem);
        const avatarManager = new AvatarManager();
        const users = userManager.getAllUsers();
        const currentUser = userManager.getCurrentUser();
    
        return `
            <div class="settings-panel">
                <div class="users-list">
                    ${Object.values(users).map(user => {
                        const avatar = avatarManager.getUserAvatar(user.username);
                        const canEditAvatar = 
                            user.username === currentUser.username ||
                            currentUser.type === 'administrator';
    
                        return `
                            <div class="user-item ${user.username === currentUser.username ? 'current' : ''}">
                                <div class="user-avatar-section">
                                    <div class="user-avatar">
                                        ${avatar.type === 'svg' ? avatar.content : 
                                          `<img src="${avatar.content}" alt="${user.username}" class="avatar-image">`}
                                    </div>
                                    ${canEditAvatar ? `
                                        <button class="avatar-change-btn" data-username="${user.username}">
                                            Change Avatar
                                        </button>
                                    ` : ''}
                                </div>
                                <div class="user-info">
                                    <span class="user-name">${user.username}</span>
                                    <span class="user-type">${user.type}</span>
                                </div>
                                <div class="user-actions">
                                    ${user.username !== 'kitkat' ? `
                                        <button class="user-action-btn" data-action="delete" data-username="${user.username}">
                                            Delete
                                        </button>
                                    ` : ''}
                                    <button class="user-action-btn" data-action="password" data-username="${user.username}">
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <button class="settings-button" id="addUser">Add New User...</button>
            </div>
        `;
    }

    renderSystemPanel() {
        return `
            <div class="settings-panel">
                <div class="system-info">
                    <h3>About ${CONFIG.system.name}</h3>
                    <div class="info-item">
                        <label>Version:</label>
                        <span>${CONFIG.system.shortVersion()}</span>
                    </div>
                    <div class="info-item">
                        <label>Computer Name:</label>
                        <span>ELXA-PC</span>
                    </div>
                    <div class="info-item">
                        <label>Current User:</label>
                        <span>${this.fileSystem.currentUsername}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Preview methods
    previewBackground(value) {
        const preview = this.contentArea.querySelector('#backgroundPreview');
        if (!preview) return;

        if (value.startsWith('default-')) {
            const index = parseInt(value.split('-')[1]);
            preview.style.background = this.defaultBackgrounds[index].value;
            document.body.style.background = this.defaultBackgrounds[index].value;
        } else {
            const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
            preview.style.background = `url(${customBgs[parseInt(value)]})`;
            document.body.style.background = `url(${customBgs[parseInt(value)]})`;
        }
        preview.style.backgroundSize = 'cover';
        document.body.style.backgroundSize = value.startsWith('default-') ? '400% 400%' : 'cover';
    }

    previewFont(fontValue) {
        document.documentElement.style.setProperty('--system-font', fontValue);
        const fontPreview = this.contentArea.querySelector('#fontPreview');
        if (fontPreview) {
            fontPreview.style.fontFamily = fontValue;
        }
    }

    // Settings management
    validateSettings(settings) {
        // Ensure all required properties exist
        const validated = {
            display: {
                background: settings.display?.background || 'default-0',
                fileExplorerView: settings.display?.fileExplorerView || 'icons'
            },
            personalization: {
                theme: settings.personalization?.theme || 'default',
                systemFont: settings.personalization?.systemFont || '"Verdana", sans-serif'
            }
        };
        return validated;
    }

    async applySettings() {
        if (Object.keys(this.pendingChanges.display).length === 0 && 
            Object.keys(this.pendingChanges.personalization).length === 0) {
            return false;
        }

        // Update settings using settingsManager
        for (const [category, changes] of Object.entries(this.pendingChanges)) {
            if (Object.keys(changes).length > 0) {
                await this.settingsManager.updateSettings(category, changes);
            }
        }

        this.pendingChanges = { display: {}, personalization: {} };
        return true;
    }

    // Modify handleCancel method
    async handleCancel() {
        // Revert all previewed changes by reapplying current settings
        await this.settingsManager.applySettings();
        this.pendingChanges = { display: {}, personalization: {} };
        this.closeWindow();
    }

    async handleOK() {
        if (await this.applySettings()) {
            this.closeWindow();
        } else {
            this.closeWindow();
        }
    }

    // UI updates
    applySettingsToUI(settings) {
        if (!settings) {
            console.error('No settings provided to applySettingsToUI');
            return;
        }
    
        try {
            if (settings.display?.background) {
                const backgroundSelect = this.contentArea.querySelector('#backgroundSelect');
                if (backgroundSelect) {
                    backgroundSelect.value = settings.display.background;
                    this.previewBackground(settings.display.background);
                }
            }
    
            if (settings.personalization?.theme) {
                const themeSelect = this.contentArea.querySelector('#themeSelect');
                if (themeSelect) {
                    themeSelect.value = settings.personalization.theme;
                }
            }
    
            if (settings.personalization?.systemFont) {
                const systemFont = this.contentArea.querySelector('#systemFont');
                if (systemFont) {
                    systemFont.value = settings.personalization.systemFont;
                    this.previewFont(settings.personalization.systemFont);
                }
            }
        } catch (error) {
            console.error('Error applying settings to UI:', error);
        }
    }

    // Event handlers
    setupEventListeners() {
        // Tab switching
        this.contentArea.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Background selection
        const backgroundSelect = this.contentArea.querySelector('#backgroundSelect');
        if (backgroundSelect) {
            backgroundSelect.addEventListener('change', (e) => {
                // Only preview the change, don't apply it
                this.previewBackground(e.target.value);
                this.pendingChanges.display.background = e.target.value;
            });
        }

        // Theme selection
        const themeSelect = this.contentArea.querySelector('#themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.pendingChanges.personalization.theme = e.target.value;
                // Preview theme without applying it permanently
                this.settingsLoader.applyTheme(e.target.value, true);
            });
        }

        // Font selection
        const systemFont = this.contentArea.querySelector('#systemFont');
        if (systemFont) {
            systemFont.addEventListener('change', (e) => {
                // Only preview the font
                this.previewFont(e.target.value);
                this.pendingChanges.personalization.systemFont = e.target.value;
            });
        }

        // Footer buttons
        const applyButton = this.contentArea.querySelector('#settings-apply');
        const okButton = this.contentArea.querySelector('#settings-ok');
        const cancelButton = this.contentArea.querySelector('#settings-cancel');

        if (applyButton) {
            applyButton.addEventListener('click', async () => {
                await this.applySettings();
            });
        }
        if (okButton) {
            okButton.addEventListener('click', async () => {
                await this.handleOK();
            });
        }
        if (cancelButton) {
            cancelButton.addEventListener('click', async () => {
                await this.handleCancel();
            });
        }

        // User panel events
        this.setupUsersPanelEvents();
    }

    // Theme loading
    async loadThemes() {
        try {
            const themesList = await fetch('/assets/themes/themes.json')
                .then(response => response.json())
                .then(data => data.themeFiles);
            
            this.themes = {};
    
            for (const themeFile of themesList) {
                try {
                    const theme = await fetch(`/assets/themes/${themeFile}`)
                        .then(response => response.json());
                    // ... continuing loadThemes method:
                    const themeKey = themeFile.replace('.json', '');
                    this.themes[themeKey] = theme;
                } catch (error) {
                    console.error(`Error loading theme ${themeFile}:`, error);
                }
            }
    
            console.log('Loaded themes:', this.themes);
    
            const themeSelect = this.contentArea?.querySelector('#themeSelect');
            if (themeSelect) {
                themeSelect.innerHTML = Object.values(this.themes)
                    .map(theme => `<option value="${theme.id}">${theme.name}</option>`)
                    .join('');
            }
        } catch (error) {
            console.error('Failed to load themes:', error);
            this.themes = {};
        }
    }

    // User management methods
    setupUsersPanelEvents() {
        const addUserBtn = this.contentArea.querySelector('#addUser');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                console.log('Add user button clicked');
                this.showAddUserDialog();
            });
        }
    
        // Setup delete and password change buttons
        const userActions = this.contentArea.querySelectorAll('.user-action-btn');
        userActions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const username = e.target.dataset.username;
                
                if (action === 'delete') {
                    this.handleDeleteUser(username);
                } else if (action === 'password') {
                    this.showChangePasswordDialog(username);
                }
            });
        });

        // Add avatar change button handlers
        const avatarButtons = this.contentArea.querySelectorAll('.avatar-change-btn');
        avatarButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.dataset.username;
                this.showAvatarDialog(username);
            });
        });
    }

    handleDeleteUser(username) {
        if (confirm(`Are you sure you want to delete user "${username}"?`)) {
            try {
                const userManager = new UserManager(this.fileSystem);
                userManager.deleteUser(username);
                this.refreshUsersPanel();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    // Custom backgrounds
    loadCustomBackgrounds() {
        const select = this.contentArea.querySelector('#backgroundSelect');
        const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
        
        customBgs.forEach((bg, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Custom Background ${index + 1}`;
            select.appendChild(option);
        });

        // Setup browse button
        const browseButton = this.contentArea.querySelector('#browseButton');
        const customBackgroundInput = this.contentArea.querySelector('#customBackground');
        
        if (browseButton && customBackgroundInput) {
            browseButton.addEventListener('click', () => {
                customBackgroundInput.click();
            });
            
            customBackgroundInput.addEventListener('change', (e) => {
                this.handleCustomBackground(e);
            });
        }
    }

    handleCustomBackground(e) {
        const file = e.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const dataUrl = readerEvent.target.result;
            const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
            customBgs.push(dataUrl);
            localStorage.setItem('customBackgrounds', JSON.stringify(customBgs));
    
            const select = this.contentArea.querySelector('#backgroundSelect');
            const option = document.createElement('option');
            option.value = customBgs.length - 1;
            option.textContent = `Custom Background ${customBgs.length}`;
            select.appendChild(option);
    
            select.value = customBgs.length - 1;
            this.previewBackground(String(customBgs.length - 1));
            this.pendingChanges.display.background = String(customBgs.length - 1);
        };
    
        reader.readAsDataURL(file);
    }

    // Utility methods
    switchTab(tabName) {
        this.contentArea.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        this.contentArea.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        const selectedTab = this.contentArea.querySelector(`[data-tab="${tabName}"]`);
        const selectedPanel = this.contentArea.querySelector(`#${tabName}-panel`);
        if (selectedTab && selectedPanel) {
            selectedTab.classList.add('active');
            selectedPanel.classList.add('active');
        }
    }

    refreshUsersPanel() {
        const panel = this.contentArea.querySelector('#users-panel');
        if (panel) {
            panel.innerHTML = this.renderUsersPanel();
            this.setupUsersPanelEvents();
        }
    }

    closeWindow() {
        const windowElement = this.contentArea.closest('.program-window');
        if (windowElement) {
            const closeEvent = new Event('windowclose');
            windowElement.dispatchEvent(closeEvent);
        }
    }
}