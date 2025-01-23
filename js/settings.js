// settings.js
import { UserManager } from './user_manager.js';
import { AvatarManager } from './avatar_manager.js';
import { CONFIG } from './apps/system/config.js'

export class Settings {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.themes = {};
        this.loadThemes();
        this.avatarManager = new AvatarManager();
        this.currentTab = 'display'; // Default tab
        
        // Background options from your existing code
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

        // Add default fonts
        this.systemFonts = [
            { name: 'Verdana', value: '"Verdana", sans-serif' },
            { name: 'Arial', value: '"Arial", sans-serif' },
            { name: 'Segoe UI', value: '"Segoe UI", "Verdana", sans-serif' },
            { name: 'MS Sans Serif', value: '"MS Sans Serif", "Arial", sans-serif' },
            { name: 'Tahoma', value: '"Tahoma", sans-serif' }
        ];
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.render();
        this.loadSavedSettings();
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
                        ${Object.values(this.themes).map(theme => 
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
                            // User can edit their own avatar
                            user.username === currentUser.username ||
                            // Administrators can edit any avatar
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
    
            <div id="avatarDialog" class="settings-dialog" style="display: none;">
                <div class="dialog-content">
                    <h3>Change Avatar</h3>
                    <div class="avatar-options">
                        ${Object.entries(avatarManager.getDefaultAvatars()).map(([key, avatar]) => `
                            <div class="avatar-option" data-avatar="${key}">
                                <div class="avatar-preview">
                                    ${avatar.content}
                                </div>
                                <span class="avatar-name">${avatar.name}</span>
                            </div>
                        `).join('')}
                        <div class="avatar-option custom">
                            <div class="avatar-preview">
                                <label for="customAvatar" class="custom-avatar-label">
                                    Custom<br>Upload
                                </label>
                                <input type="file" id="customAvatar" accept="image/*" style="display: none;">
                            </div>
                            <span class="avatar-name">Custom Upload</span>
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button id="cancelAvatar">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    showAddUserDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'settings-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Add New User</h3>
                <div class="dialog-form">
                    <label>Username:</label>
                    <input type="text" id="newUsername" class="dialog-input">
                    
                    <label>Password:</label>
                    <input type="password" id="newPassword" class="dialog-input">
                    
                    <label>Confirm Password:</label>
                    <input type="password" id="confirmPassword" class="dialog-input">
                    
                    <label>Account Type:</label>
                    <select id="accountType" class="dialog-input">
                        <option value="standard">Standard User</option>
                        <option value="administrator">Administrator</option>
                    </select>
                </div>
                <div class="dialog-buttons">
                    <button id="createUser">Create</button>
                    <button id="cancelCreate">Cancel</button>
                </div>
            </div>
        `;
    
        document.body.appendChild(dialog);
    
        // Add event listeners for the dialog
        dialog.querySelector('#createUser').addEventListener('click', () => {
            const username = dialog.querySelector('#newUsername').value;
            const password = dialog.querySelector('#newPassword').value;
            const confirm = dialog.querySelector('#confirmPassword').value;
            const type = dialog.querySelector('#accountType').value;
    
            if (password !== confirm) {
                alert('Passwords do not match');
                return;
            }
    
            try {
                const userManager = new UserManager(this.fileSystem);
                userManager.createUser(username, password, type);
                dialog.remove();
                this.refreshUsersPanel();
            } catch (error) {
                alert(error.message);
            }
        });
    
        dialog.querySelector('#cancelCreate').addEventListener('click', () => {
            dialog.remove();
        });
    }

    setupUsersPanelEvents() {
        const addUserBtn = this.contentArea.querySelector('#addUser');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                console.log('Add user button clicked'); // Debug log
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

    showAvatarDialog(username) {
        const dialog = document.getElementById('avatarDialog');
        dialog.style.display = 'flex';

        // Setup avatar option clicks
        const avatarOptions = dialog.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            if (!option.classList.contains('custom')) {
                option.addEventListener('click', () => {
                    const avatarKey = option.dataset.avatar;
                    const avatar = this.avatarManager.getDefaultAvatars()[avatarKey];
                    this.avatarManager.setUserAvatar(username, avatar);
                    this.refreshUsersPanel();
                    dialog.style.display = 'none';
                });
            }
        });

        // Setup custom avatar upload
        const customAvatarInput = dialog.querySelector('#customAvatar');
        customAvatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const avatarData = await this.avatarManager.handleCustomAvatarUpload(file);
                    this.avatarManager.setUserAvatar(username, avatarData);
                    this.refreshUsersPanel();
                    dialog.style.display = 'none';
                } catch (error) {
                    alert('Failed to upload avatar: ' + error.message);
                }
            }
        });

        // Setup cancel button
        const cancelButton = dialog.querySelector('#cancelAvatar');
        cancelButton.addEventListener('click', () => {
            dialog.style.display = 'none';
        });
    }
    

    refreshUsersPanel() {
        const panel = this.contentArea.querySelector('#users-panel');
        if (panel) {
            panel.innerHTML = this.renderUsersPanel();
            this.setupUsersPanelEvents();
        }
    }
    
    showChangePasswordDialog(username) {
        const dialog = document.createElement('div');
        dialog.className = 'settings-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Change Password for ${username}</h3>
                <div class="dialog-form">
                    <label>Current Password:</label>
                    <input type="password" id="currentPassword" class="dialog-input">
                    
                    <label>New Password:</label>
                    <input type="password" id="newPassword" class="dialog-input">
                    
                    <label>Confirm New Password:</label>
                    <input type="password" id="confirmPassword" class="dialog-input">
                </div>
                <div class="dialog-buttons">
                    <button id="savePassword">Save</button>
                    <button id="cancelPassword">Cancel</button>
                </div>
            </div>
        `;
    
        document.body.appendChild(dialog);
    
        // Add event listeners for the dialog
        dialog.querySelector('#savePassword').addEventListener('click', () => {
            const currentPassword = dialog.querySelector('#currentPassword').value;
            const newPassword = dialog.querySelector('#newPassword').value;
            const confirmPassword = dialog.querySelector('#confirmPassword').value;
    
            if (newPassword !== confirmPassword) {
                alert('New passwords do not match');
                return;
            }
    
            try {
                const userManager = new UserManager(this.fileSystem);
                userManager.changePassword(username, currentPassword, newPassword);
                dialog.remove();
                alert('Password changed successfully');
            } catch (error) {
                alert(error.message);
            }
        });
    
        dialog.querySelector('#cancelPassword').addEventListener('click', () => {
            dialog.remove();
        });
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
                        <span>kitkat</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Tab switching
        const tabs = this.contentArea.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Background selection
        const backgroundSelect = this.contentArea.querySelector('#backgroundSelect');
        if (backgroundSelect) {
            backgroundSelect.addEventListener('change', (e) => {
                this.updateBackgroundPreview(e.target.value);
            });
        }

        // File input for custom backgrounds
        const browseButton = this.contentArea.querySelector('#browseButton');
        const fileInput = this.contentArea.querySelector('#customBackground');
        if (browseButton && fileInput) {
            browseButton.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleCustomBackground(e));
        }

        // font preview
        const systemFont = this.contentArea.querySelector('#systemFont');
        const fontPreview = this.contentArea.querySelector('#fontPreview');
        
        if (systemFont && fontPreview) {
            console.log('Setting up font event listener');
            systemFont.addEventListener('change', (e) => {
                const select = e.target;
                const selectedOption = select.options[select.selectedIndex];
                const selectedFont = selectedOption.value;
                
                console.log('Font changed to:', selectedFont);
                console.log('Selected option:', selectedOption.textContent);
                
                // Update preview
                fontPreview.style.fontFamily = selectedFont;
                
                // Update system font immediately for preview
                document.documentElement.style.setProperty('--system-font', selectedFont);
                
                // Log current computed style to verify
                console.log('Current system font:', getComputedStyle(document.documentElement).getPropertyValue('--system-font'));
                
                // Test if the font is actually being applied
                console.log('Preview font family:', getComputedStyle(fontPreview).fontFamily);
            });
        }

        // Add theme selection handler
        const themeSelect = this.contentArea.querySelector('#themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
                
                // Update the preview immediately
                const preview = this.contentArea.querySelector('.theme-preview');
                if (preview) {
                    preview.style.setProperty('--theme-preview-scale', '1');
                }
            });
        }

        // Footer buttons
        const applyButton = this.contentArea.querySelector('#settings-apply');
        const okButton = this.contentArea.querySelector('#settings-ok');
        const cancelButton = this.contentArea.querySelector('#settings-cancel');

        if (applyButton) {
            applyButton.addEventListener('click', () => this.applySettings());
        }
        if (okButton) {
            okButton.addEventListener('click', () => this.handleOK());
        }
        if (cancelButton) {
            cancelButton.addEventListener('click', () => this.handleCancel());
        }

        // Add user panel event setup
        this.setupUsersPanelEvents();
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panels
        this.contentArea.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        this.contentArea.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Add active class to selected tab and panel
        const selectedTab = this.contentArea.querySelector(`[data-tab="${tabName}"]`);
        const selectedPanel = this.contentArea.querySelector(`#${tabName}-panel`);
        if (selectedTab && selectedPanel) {
            selectedTab.classList.add('active');
            selectedPanel.classList.add('active');
        }
    }

    async loadThemes() {
        try {
            // First load the list of themes
            const themesList = await fetch('/assets/themes/themes.json')
                .then(response => response.json())
                .then(data => data.themeFiles);
            
            this.themes = {};
    
            // Load each theme file
            for (const themeFile of themesList) {
                try {
                    const theme = await fetch(`/assets/themes/${themeFile}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Failed to load theme: ${themeFile}`);
                            }
                            return response.json();
                        });
                    
                    const themeKey = themeFile.replace('.json', '');
                    this.themes[themeKey] = theme;
                } catch (error) {
                    console.error(`Error loading theme ${themeFile}:`, error);
                }
            }
    
            console.log('Loaded themes:', this.themes); // Debug log
    
            // Update the theme select if it exists
            const themeSelect = this.contentArea?.querySelector('#themeSelect');
            if (themeSelect) {
                themeSelect.innerHTML = Object.values(this.themes)
                    .map(theme => `<option value="${theme.id}">${theme.name}</option>`)
                    .join('');
                    
                // Select the default theme
                themeSelect.value = 'default';
                this.applyTheme('default');
            }
        } catch (error) {
            console.error('Failed to load themes:', error);
            this.themes = {};
        }
    }

    applyTheme(themeId) {
        const theme = this.themes[themeId];
        if (!theme) return;

        const root = document.documentElement;
        
        // Apply all color variables
        Object.entries(theme.colors).forEach(([variable, value]) => {
            root.style.setProperty(variable, value);
        });

        // Apply gradients
        Object.entries(theme.gradients).forEach(([variable, value]) => {
            root.style.setProperty(variable, value);
        });

        // Apply transparent colors
        Object.entries(theme.transparentColors).forEach(([variable, value]) => {
            root.style.setProperty(variable, value);
        });
    }

    updateBackgroundPreview(value) {
        const preview = this.contentArea.querySelector('#backgroundPreview');
        if (!preview) return;

        if (value.startsWith('default-')) {
            const index = parseInt(value.split('-')[1]);
            preview.style.background = this.defaultBackgrounds[index].value;
        } else {
            const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
            preview.style.background = `url(${customBgs[parseInt(value)]})`;
        }
        preview.style.backgroundSize = 'cover';
    }

    loadCustomBackgrounds() {
        const select = this.contentArea.querySelector('#backgroundSelect');
        const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
        
        customBgs.forEach((bg, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Custom Background ${index + 1}`;
            select.appendChild(option);
        });
    }

    handleCustomBackground(e) {
        const file = e.target.files[0];
        if (!file) return;
    
        try {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const dataUrl = readerEvent.target.result;
                
                // Get existing custom backgrounds or initialize empty array
                const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
                
                // Add new background
                customBgs.push(dataUrl);
                
                // Save updated list
                localStorage.setItem('customBackgrounds', JSON.stringify(customBgs));
    
                // Add new option to select dropdown
                const select = this.contentArea.querySelector('#backgroundSelect');
                const option = document.createElement('option');
                option.value = customBgs.length - 1;  // Index of new background
                option.textContent = `Custom Background ${customBgs.length}`;
                select.appendChild(option);
    
                // Select the new background
                select.value = customBgs.length - 1;
    
                // Update preview
                const preview = this.contentArea.querySelector('#backgroundPreview');
                preview.style.background = `url(${dataUrl})`;
                preview.style.backgroundSize = 'cover';
            };
    
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error loading custom background:', error);
            alert('Failed to load custom background. Please try another image.');
        }
    }
   
    saveSettings() {
        const settings = {
            display: {
                background: this.contentArea.querySelector('#backgroundSelect').value,
                customBackgrounds: JSON.parse(localStorage.getItem('customBackgrounds') || '[]'),
                fileExplorerView: 'icons',
                desktopIcons: {}
            },
            personalization: {
                primaryColor: this.contentArea.querySelector('#primaryColor')?.value,
                accentColor: this.contentArea.querySelector('#accentColor')?.value,
                systemFont: this.contentArea.querySelector('#systemFont')?.value
            },
            systemTray: {
                clock: {
                    format24Hour: localStorage.getItem('clock24Hour') === 'true',
                    showSeconds: localStorage.getItem('showSeconds') === 'true',
                    showDate: localStorage.getItem('showDate') === 'true',
                    dateFormat: localStorage.getItem('dateFormat') || 'MM/DD/YYYY'
                },
                wifi: {
                    customNetworks: window.elxaSystemTray.wifi.networks
                        .filter(network => network.isCustom)
                        .map(network => ({
                            name: network.name,
                            security: network.security,
                            password: network.password,
                            saved: network.saved
                        }))
                }
            }
        };

        // Create settings directory if it doesn't exist
        const settingsPath = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.settings`;
        if (!this.fileSystem.folderExists(settingsPath)) {
            try {
                this.fileSystem.createFolder(`/ElxaOS/Users/${this.fileSystem.currentUsername}`, '.settings');
            } catch (error) {
                console.error('Failed to create settings directory:', error);
                return false;
            }
        }

        // Save settings to file
        try {
            this.fileSystem.saveFile(
                settingsPath,
                'user.config',
                JSON.stringify(settings, null, 2),
                'settings'
            );
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    loadSettings() {
        const settingsPath = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.settings/user.config`;
        try {
            const settingsFile = this.fileSystem.getFile(settingsPath);
            if (settingsFile) {
                const settings = JSON.parse(settingsFile.content);
                this.applyLoadedSettings(settings);
                
                // Apply system tray settings
                if (settings.systemTray) {
                    // Apply clock settings
                    if (settings.systemTray.clock) {
                        const { format24Hour, showSeconds, showDate, dateFormat } = settings.systemTray.clock;
                        localStorage.setItem('clock24Hour', format24Hour);
                        localStorage.setItem('showSeconds', showSeconds);
                        localStorage.setItem('showDate', showDate);
                        localStorage.setItem('dateFormat', dateFormat);
                    }
                    
                    // Apply WiFi settings
                    if (settings.systemTray.wifi?.customNetworks) {
                        const systemTray = window.elxaSystemTray;
                        if (systemTray && systemTray.wifi) {
                            // Filter out existing custom networks
                            systemTray.wifi.networks = systemTray.wifi.networks
                                .filter(network => !network.isCustom);
                            
                            // Add saved custom networks
                            settings.systemTray.wifi.customNetworks.forEach(savedNetwork => {
                                const network = new Network(
                                    savedNetwork.name,
                                    savedNetwork.security,
                                    100, // Initial signal strength
                                    true // isCustom flag
                                );
                                network.password = savedNetwork.password;
                                network.saved = savedNetwork.saved;
                                systemTray.wifi.networks.push(network);
                            });
                        }
                    }
                }
                return true;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        return false;
    }

    applyLoadedSettings(settings) {
        // Apply display settings
        if (settings.display) {
            if (settings.display.background) {
                const backgroundSelect = this.contentArea.querySelector('#backgroundSelect');
                if (backgroundSelect) {
                    backgroundSelect.value = settings.display.background;
                    this.updateBackgroundPreview(settings.display.background);
                }
            }
            
            if (settings.display.customBackgrounds) {
                localStorage.setItem('customBackgrounds', JSON.stringify(settings.display.customBackgrounds));
                this.loadCustomBackgrounds();
            }
        }

        // Apply personalization settings
        if (settings.personalization) {
            const { primaryColor, accentColor, systemFont } = settings.personalization;
            
            if (primaryColor) {
                const primaryColorInput = this.contentArea.querySelector('#primaryColor');
                if (primaryColorInput) primaryColorInput.value = primaryColor;
            }
            
            if (accentColor) {
                const accentColorInput = this.contentArea.querySelector('#accentColor');
                if (accentColorInput) accentColorInput.value = accentColor;
            }
            
            if (systemFont) {
                const systemFontSelect = this.contentArea.querySelector('#systemFont');
                if (systemFontSelect) {
                    systemFontSelect.value = systemFont;
                    document.documentElement.style.setProperty('--system-font', systemFont);
                }
            }
        }
    }

    applySettings() {
        // Apply current settings visually
        const selectedBackground = this.contentArea.querySelector('#backgroundSelect').value;
        const currentTheme = {
            primaryColor: this.contentArea.querySelector('#primaryColor')?.value,
            accentColor: this.contentArea.querySelector('#accentColor')?.value,
            systemFont: this.contentArea.querySelector('#systemFont')?.value
        };
    
        // Apply background
        if (selectedBackground.startsWith('default-')) {
            const index = parseInt(selectedBackground.split('-')[1]);
            document.body.style.background = this.defaultBackgrounds[index].value;
            document.body.style.backgroundSize = '400% 400%';
        } else {
            const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
            document.body.style.background = `url(${customBgs[parseInt(selectedBackground)]})`;
            document.body.style.backgroundSize = 'cover';
        }

        // Apply font settings
        const systemFontSelect = this.contentArea.querySelector('#systemFont');
        if (systemFontSelect) {
            const selectedFont = systemFontSelect.value;
            console.log('Applying font:', selectedFont); // Debug log
            
            // Apply to root element
            document.documentElement.style.setProperty('--system-font', selectedFont);
            const testFontChange = () => {
                const testElement = document.createElement('div');
                testElement.style.position = 'fixed';
                testElement.style.top = '10px';
                testElement.style.right = '10px';
                testElement.style.zIndex = '9999';
                testElement.style.background = 'white';
                testElement.style.padding = '5px';
                testElement.textContent = 'Font Test';
                document.body.appendChild(testElement);
                
                console.log('Test element font:', getComputedStyle(testElement).fontFamily);
                
                setTimeout(() => testElement.remove(), 2000);
            };
            
            // Force refresh by temporarily removing and re-adding the property
            const tempFont = document.documentElement.style.getPropertyValue('--system-font');
            document.documentElement.style.removeProperty('--system-font');
            setTimeout(() => {
                document.documentElement.style.setProperty('--system-font', tempFont);
                console.log('Font applied:', getComputedStyle(document.documentElement).getPropertyValue('--system-font'));
            }, 0);
        }

        // Save settings
        return this.saveSettings();
    }

    handleOK() {
        if (this.applySettings()) {
            this.closeWindow();
        } else {
            alert('Failed to save settings. Please try again.');
        }
    }
    
    handleCancel() {
        // Reload the last saved settings before closing
        this.loadSettings();
        this.closeWindow();
    }
    
    closeWindow() {
        const windowElement = this.contentArea.closest('.program-window');
        if (windowElement) {
            const closeEvent = new Event('windowclose');
            windowElement.dispatchEvent(closeEvent);
        }
    }
    
    loadSavedSettings() {
        const savedBackground = localStorage.getItem('currentBackground');
        const savedTheme = JSON.parse(localStorage.getItem('currentTheme') || '{}');
        
        // Set background select
        if (savedBackground) {
            // Find matching background in defaults
            const defaultIndex = this.defaultBackgrounds.findIndex(bg => 
                savedBackground.includes(bg.value)
            );
            
            const select = this.contentArea.querySelector('#backgroundSelect');
            if (defaultIndex !== -1) {
                select.value = `default-${defaultIndex}`;
            }
            
            // Update preview
            const preview = this.contentArea.querySelector('#backgroundPreview');
            if (preview) {
                preview.style.background = savedBackground;
                preview.style.backgroundSize = 'cover';
            }
        }

        // Load user-specific font settings
        const currentUser = this.fileSystem.currentUsername;
        const userSettings = JSON.parse(localStorage.getItem(`elxaos_user_settings_${currentUser}`) || '{}');
        
        if (userSettings.systemFont) {
            const systemFont = this.contentArea.querySelector('#systemFont');
            if (systemFont) {
                systemFont.value = userSettings.systemFont;
                document.documentElement.style.setProperty('--system-font', userSettings.systemFont);
                
                // Update preview
                const fontPreview = this.contentArea.querySelector('#fontPreview');
                if (fontPreview) {
                    fontPreview.style.fontFamily = userSettings.systemFont;
                }
            }
        }
    
        // Set theme controls
        if (savedTheme.primaryColor) {
            const primaryColor = this.contentArea.querySelector('#primaryColor');
            if (primaryColor) primaryColor.value = savedTheme.primaryColor;
        }
        if (savedTheme.accentColor) {
            const accentColor = this.contentArea.querySelector('#accentColor');
            if (accentColor) accentColor.value = savedTheme.accentColor;
        }
    }
}