// settings_manager.js
export class SettingsManager {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.currentSettings = null;
        
        // Define all possible settings and their default values
        this.defaultSettings = {
            display: {
                background: 'default-0',
                fileExplorerView: 'icons',
                desktopIcons: {},  // For icon positions
                showHiddenFiles: false
            },
            personalization: {
                theme: 'default',
                systemFont: '"Verdana", sans-serif',
                avatar: {
                    type: 'svg',
                    name: 'Cute Snake',
                    content: null  // Will be set from AvatarManager
                }
            },
            clock: {
                format: '12hour',
                dateStyle: 'short',
                showSeconds: false
            },
            wifi: {
                customNetworks: [],
                savedNetworks: []
            }
        };
    }

    async initialize(contentArea) {
        try {
            this.contentArea = contentArea;
            
            // Create a new SettingsManager if one doesn't exist globally
            if (!window.elxaSettingsManager) {
                window.elxaSettingsManager = new SettingsManager(this.fileSystem);
                await window.elxaSettingsManager.initialize(this.fileSystem.currentUsername);
            }
            
            this.settingsManager = window.elxaSettingsManager;
            
            // Load themes before rendering
            await this.loadThemes();
            
            // Render UI
            this.render();
            
            // Load and apply current settings
            const currentSettings = this.settingsManager.getSettings();
            if (currentSettings) {
                this.applySettingsToUI(currentSettings);
            } else {
                console.warn('No settings available, using defaults');
                // Use default settings from SettingsManager
                this.applySettingsToUI(this.settingsManager.defaultSettings);
            }
            
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing settings:', error);
            // Show error in UI
            if (this.contentArea) {
                this.contentArea.innerHTML = `
                    <div class="settings-error">
                        <h3>Error Loading Settings</h3>
                        <p>There was an error loading your settings. Default values will be used.</p>
                    </div>
                `;
            }
        }
    }

    async loadSettings() {
        try {
            const settingsFile = this.fileSystem.getFile(this.settingsPath);
            if (settingsFile && settingsFile.content) {
                this.currentSettings = JSON.parse(settingsFile.content);
                return this.currentSettings;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return null;
    }

    async createDefaultSettings(username) {
        try {
            // Ensure settings directory exists
            const settingsDir = `/ElxaOS/Users/${username}/.settings`;
            if (!this.fileSystem.folderExists(settingsDir)) {
                this.fileSystem.createFolder(`/ElxaOS/Users/${username}`, '.settings');
            }

            // Create default settings
            this.currentSettings = this.defaultSettings;
            await this.saveSettings();
            
            return true;
        } catch (error) {
            console.error('Error creating default settings:', error);
            return false;
        }
    }

    async saveSettings() {
        try {
            this.fileSystem.saveFile(
                this.fileSystem.getParentPath(this.settingsPath),
                'user.config',
                JSON.stringify(this.currentSettings, null, 2),
                'settings'
            );
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    async updateSettings(category, key, value) {
        if (!this.currentSettings[category]) {
            throw new Error(`Invalid settings category: ${category}`);
        }

        // Update the setting
        if (typeof key === 'object') {
            // Handle nested updates
            this.currentSettings[category] = {
                ...this.currentSettings[category],
                ...key
            };
        } else {
            this.currentSettings[category][key] = value;
        }

        // Save and apply the changes
        await this.saveSettings();
        await this.applySettings();
    }

    async applySettings() {
        if (!this.currentSettings) return;

        // Apply background
        if (this.currentSettings.display?.background) {
            this.applyBackground(this.currentSettings.display.background);
        }

        // Apply theme
        if (this.currentSettings.personalization?.theme) {
            await this.applyTheme(this.currentSettings.personalization.theme);
        }

        // Apply system font
        if (this.currentSettings.personalization?.systemFont) {
            document.documentElement.style.setProperty(
                '--system-font', 
                this.currentSettings.personalization.systemFont
            );
        }

        // Apply file explorer view
        if (this.currentSettings.display?.fileExplorerView) {
            // Update all file explorer instances
            document.querySelectorAll('.file-list').forEach(element => {
                element.className = `file-list view-${this.currentSettings.display.fileExplorerView}`;
            });
        }

        // Apply desktop icon positions
        if (this.currentSettings.display?.desktopIcons) {
            this.applyDesktopIconPositions(this.currentSettings.display.desktopIcons);
        }
    }

    applyBackground(background) {
        if (background.startsWith('default-')) {
            const defaultBackgrounds = [
                'linear-gradient(135deg, #a267ac, #67c9dc, #ff99cc)',
                'linear-gradient(171deg, #ff99cc 0%, #a267ac 100%)',
                'linear-gradient(45deg, #ff6ec4, #7873f5)',
                'linear-gradient(135deg, #67c9dc, #7873f5, #ff99cc)'
            ];
            const index = parseInt(background.split('-')[1]);
            document.body.style.background = defaultBackgrounds[index];
            document.body.style.backgroundSize = '400% 400%';
        } else {
            const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
            document.body.style.background = `url(${customBgs[parseInt(background)]})`;
            document.body.style.backgroundSize = 'cover';
        }
    }

    async applyTheme(themeId) {
        try {
            const response = await fetch(`/assets/themes/${themeId}.json`);
            const theme = await response.json();
            
            Object.entries(theme.colors || {}).forEach(([variable, value]) => {
                document.documentElement.style.setProperty(variable, value);
            });
            
            Object.entries(theme.gradients || {}).forEach(([variable, value]) => {
                document.documentElement.style.setProperty(variable, value);
            });
        } catch (error) {
            console.error('Error applying theme:', error);
        }
    }

    applyDesktopIconPositions(positions) {
        Object.entries(positions).forEach(([iconName, position]) => {
            const icon = document.querySelector(`.desktop-icon[data-name="${iconName}"]`);
            if (icon) {
                icon.style.gridColumn = position.column;
                icon.style.gridRow = position.row;
            }
        });
    }

    getSettings(category, key) {
        if (!this.currentSettings) return null;
        if (key) {
            return this.currentSettings[category]?.[key];
        }
        return this.currentSettings[category];
    }
}