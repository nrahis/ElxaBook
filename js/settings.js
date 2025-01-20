// settings.js
import { UserManager } from './user_manager.js';

export class Settings {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
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
                    <h3>Theme Colors</h3>
                    <label>Primary Color:</label>
                    <input type="color" id="primaryColor" value="#a267ac">
                    
                    <label>Accent Color:</label>
                    <input type="color" id="accentColor" value="#67c9dc">
                </div>
                
                <div class="settings-group">
                    <h3>System Font</h3>
                    <select id="systemFont">
                        <option value="Segoe UI">Segoe UI</option>
                        <option value="MS Sans Serif">MS Sans Serif</option>
                        <option value="Verdana">Verdana</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderUsersPanel() {
        const userManager = new UserManager(this.fileSystem);
        const users = userManager.getAllUsers();
        const currentUser = userManager.getCurrentUser();
    
        return `
            <div class="settings-panel">
                <div class="users-list">
                    ${Object.values(users).map(user => `
                        <div class="user-item ${currentUser && user.username === currentUser.username ? 'current' : ''}">
                            <img src="/api/placeholder/48/48" alt="${user.username}" class="user-avatar">
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
                    `).join('')}
                </div>
                
                <button class="settings-button" id="addUser">Add New User...</button>
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
                    <h3>About ElxaOS</h3>
                    <div class="info-item">
                        <label>Version:</label>
                        <span>ElxaOS 1.1</span>
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

    applySettings() {
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
            document.body.style.backgroundSize = '400% 400%';  // For the gradient animation
        } else {
            const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
            document.body.style.background = `url(${customBgs[parseInt(selectedBackground)]})`;
            document.body.style.backgroundSize = 'cover';
        }
    
        // Save current settings
        localStorage.setItem('currentBackground', document.body.style.background);
        localStorage.setItem('currentTheme', JSON.stringify(currentTheme));
    }
    
    handleOK() {
        this.applySettings();
        this.closeWindow();
    }
    
    handleCancel() {
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
    
        // Set theme controls
        if (savedTheme.primaryColor) {
            const primaryColor = this.contentArea.querySelector('#primaryColor');
            if (primaryColor) primaryColor.value = savedTheme.primaryColor;
        }
        if (savedTheme.accentColor) {
            const accentColor = this.contentArea.querySelector('#accentColor');
            if (accentColor) accentColor.value = savedTheme.accentColor;
        }
        if (savedTheme.systemFont) {
            const systemFont = this.contentArea.querySelector('#systemFont');
            if (systemFont) systemFont.value = savedTheme.systemFont;
        }
    }
}