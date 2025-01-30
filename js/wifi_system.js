import { SettingsManager } from './settings_manager.js';

export class Network {
    constructor(name, security = 'none', signalStrength = 100, isCustom = false) {
        this.name = name;
        this.security = security;
        this.signalStrength = signalStrength;
        this.password = security === 'none' ? null : '';
        this.saved = false;
        this.isCustom = isCustom;
    }

    // Add a method to serialize the network for storage
    toJSON() {
        return {
            name: this.name,
            security: this.security,
            password: this.password,
            saved: this.saved,
            isCustom: this.isCustom
        };
    }
}

export class WiFiSystem {
    constructor(systemTray) {
        this.systemTray = systemTray;
        this.isEnabled = true;
        this.currentNetwork = null;
        this.networks = [
            new Network('Home Network', 'none', 95),
            new Network('Neighbor\'s WiFi', 'wpa2', 60),
            new Network('Coffee Shop', 'wpa2', 45),
            new Network('School Network', 'wpa2', 80)
        ];
        this.popup = null;
        this.signalUpdateInterval = null;
        this.settingsManager = window.elxaSettingsManager;
        this.loadSavedNetworks();
    }

    initialize() {
        this.startSignalUpdates();
    }

    startSignalUpdates() {
        // Randomly fluctuate signal strengths every few seconds
        this.signalUpdateInterval = setInterval(() => {
            this.networks.forEach(network => {
                // Random fluctuation ±5%
                const fluctuation = Math.random() * 10 - 5;
                network.signalStrength = Math.min(100, Math.max(0, 
                    network.signalStrength + fluctuation));
            });
            if (this.popup) {
                this.updatePopupContent();
            }
        }, 3000);
    }

    toggleWiFi() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.disconnect();
        }
        this.updateDisplay();
        this.updatePopupContent();  // Add this to update the popup too
    }

    // First method - handles the click from UI
    findNetwork(name) {
        return this.networks.find(n => n.name === name);
    }

    showAddNetwork() {
        // Check custom network limit
        const customNetworks = this.networks.filter(n => n.isCustom);
        if (customNetworks.length >= 3) {
            const warning = document.createElement('div');
            warning.className = 'wifi-password-prompt'; // Reuse existing style
            warning.innerHTML = `
                <h3>Network Limit Reached</h3>
                <p>You can only create up to 3 custom networks. Please delete an existing custom network first.</p>
                <div class="password-buttons">
                    <button onclick="this.closest('.wifi-password-prompt').remove()">OK</button>
                </div>
            `;
            document.body.appendChild(warning);
            return;
        }
    
        const prompt = document.createElement('div');
        prompt.className = 'wifi-password-prompt';
        prompt.innerHTML = `
            <h3>Create New Network</h3>
            <input type="text" placeholder="Network Name" class="network-name-input">
            <div class="security-toggle">
                <label>
                    <input type="checkbox" id="network-security">
                    Require Password
                </label>
            </div>
            <input type="password" placeholder="Network Password" class="network-password-input" style="display: none;">
            <div class="password-buttons">
                <button class="create-btn">Create</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
    
        document.body.appendChild(prompt);
    
        const nameInput = prompt.querySelector('.network-name-input');
        const securityToggle = prompt.querySelector('#network-security');
        const passwordInput = prompt.querySelector('.network-password-input');
        const createBtn = prompt.querySelector('.create-btn');
        const cancelBtn = prompt.querySelector('.cancel-btn');
    
        securityToggle.addEventListener('change', (e) => {
            passwordInput.style.display = e.target.checked ? 'block' : 'none';
        });
    
        createBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert('Please enter a network name');
                return;
            }
            if (this.networks.some(n => n.name === name)) {
                alert('A network with this name already exists');
                return;
            }
        
            const security = securityToggle.checked ? 'wpa2' : 'none';
            const password = securityToggle.checked ? passwordInput.value : null;
        
            if (security === 'wpa2' && !password) {
                alert('Please enter a password for the secured network');
                return;
            }
        
            const network = new Network(name, security, 100, true);
            if (security === 'wpa2') {
                network.password = password;
                // Only mark as saved if it's an open network
                network.saved = security === 'none';
            } else {
                network.saved = true;
            }
            this.networks.push(network);
            this.updatePopupContent();
            prompt.remove();
        });
    
        cancelBtn.addEventListener('click', () => prompt.remove());
        nameInput.focus();
    }

    deleteNetwork(name) {
        const network = this.findNetwork(name);
        if (network && network.isCustom) {
            if (this.currentNetwork === network) {
                this.disconnect();
            }
            this.networks = this.networks.filter(n => n !== network);
            this.updatePopupContent();
        }
    }

    // This method routes between string names (from UI) and network objects
    connect(networkName) {
        if (typeof networkName === 'string') {
            const network = this.findNetwork(networkName);
            if (network) {
                this.connectToNetwork(network);
            }
        } else {
            this.connectToNetwork(networkName); // In case a network object was passed directly
        }
    }
    
    connectToNetwork(network, password = null) {
        // If the network requires a password and either:
        // 1. No password is provided AND
        // 2. The network isn't saved OR the saved network doesn't have a password
        if (network.security === 'wpa2' && 
            !password && 
            (!network.saved || !network.password)) {
            this.showPasswordPrompt(network);
            return;
        }
    
        // Clear any previous connection
        this.disconnect();
        
        // Show connecting state
        const networkItem = this.popup.querySelector(`[data-network="${network.name}"]`);
        if (networkItem) {
            networkItem.querySelector('.network-status').textContent = 'Connecting...';
        }
    
        // Simulate connection delay
        setTimeout(() => {
            this.currentNetwork = network;
            network.saved = true;
            if (password) network.password = password;
            this.updateDisplay();
            this.updatePopupContent();
        }, 1500);
    }

    disconnect() {
        this.currentNetwork = null;
        this.updateDisplay();
        this.updatePopupContent();
    }

    showPasswordPrompt(network) {
        const passwordPrompt = document.createElement('div');
        passwordPrompt.className = 'wifi-password-prompt';
        passwordPrompt.innerHTML = `
            <h3>Connect to ${network.name}</h3>
            <input type="password" placeholder="Enter network password" class="network-password-input">
            <div class="password-buttons">
                <button class="connect-btn">Connect</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
    
        document.body.appendChild(passwordPrompt);
    
        const connectBtn = passwordPrompt.querySelector('.connect-btn');
        const cancelBtn = passwordPrompt.querySelector('.cancel-btn');
        const input = passwordPrompt.querySelector('input');
    
        connectBtn.addEventListener('click', () => {
            const password = input.value;
            if (password) {
                // For custom networks, verify against stored password
                if (network.isCustom && network.password && password !== network.password) {
                    alert('Incorrect password');
                    return;
                }
                
                // Remove prompt before connecting
                passwordPrompt.remove();
                // Then connect
                this.connectToNetwork(network, password);
            }
        });
    
        cancelBtn.addEventListener('click', () => {
            passwordPrompt.remove();
        });
    
        input.focus();
    }

    updateDisplay() {
        const wifiIcon = document.querySelector('.wifi-icon');
        if (wifiIcon) {
            let level = 'none';
            if (this.isEnabled && this.currentNetwork) {
                const strength = this.currentNetwork.signalStrength;
                if (strength > 70) level = 'full';
                else if (strength > 40) level = 'medium';
                else level = 'low';
            }
            wifiIcon.innerHTML = this.systemTray.getWifiSVG(level);
        }
    }

    createPopup(x, y) {
        if (this.popup) {
            this.popup.remove();
        }
    
        this.popup = document.createElement('div');
        this.popup.className = 'wifi-popup';
        
        this.popup.style.position = 'absolute';
        this.popup.style.left = `${x}px`;
        this.popup.style.bottom = '32px';
        
        document.body.appendChild(this.popup);
        
        this.updatePopupContent();
    
        // Modified click handler to prevent closure when clicking network items
        const closePopup = (e) => {
            // Check if the click is on a network item or its children
            const isNetworkClick = e.target.closest('.network-item') ||
                                 e.target.closest('.network-action') ||
                                 e.target.closest('.wifi-toggle');
            
            // Only close if click is outside popup and not on wifi icon or network items
            if (!this.popup.contains(e.target) && 
                !e.target.closest('.wifi-icon') && 
                !isNetworkClick) {
                this.popup.remove();
                this.popup = null;
                document.removeEventListener('click', closePopup);
            }
        };
        document.addEventListener('click', closePopup);
    }

    getSignalStrengthIcon(strength) {
        if (strength > 70) return '●●●●';
        if (strength > 40) return '●●●○';
        return '●●○○';
    }

    updatePopupContent() {
        if (!this.popup) return;
    
        const networksList = this.networks
            .sort((a, b) => b.signalStrength - a.signalStrength)
            .map(network => {
                const isConnected = this.currentNetwork === network;
                return `
                    <div class="network-item ${isConnected ? 'connected' : ''}" 
                         data-network="${network.name}">
                        <div class="network-info" onclick="window.elxaSystemTray.wifi.connect('${network.name}')">
                            <div class="network-name">
                                ${network.name}
                                ${network.isCustom ? '<span class="custom-tag">(Custom)</span>' : ''}
                            </div>
                            <div class="network-status">
                                ${isConnected ? 'Connected' : network.saved ? 'Saved' : 
                                  network.security === 'wpa2' ? 'Secured' : 'Open'}
                            </div>
                        </div>
                        <div class="signal-strength">
                            ${this.getSignalStrengthIcon(network.signalStrength)}
                        </div>
                        ${network.security === 'wpa2' ? '<div class="lock-icon">🔒</div>' : ''}
                        ${network.isCustom ? `
                            <button class="delete-network" 
                                    onclick="window.elxaSystemTray.wifi.deleteNetwork('${network.name}')"
                                    title="Delete Network">✕</button>
                        ` : ''}
                    </div>
                `;
            }).join('');
    
        this.popup.innerHTML = `
            <div class="wifi-header">
                <span>WiFi ${this.isEnabled ? 'On' : 'Off'}</span>
                <label class="wifi-toggle">
                    <input type="checkbox" ${this.isEnabled ? 'checked' : ''}
                           onchange="window.elxaSystemTray.wifi.toggleWiFi()">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            ${this.isEnabled ? `
                <div class="networks-list">
                    ${networksList}
                </div>
                <button class="network-action" onclick="window.elxaSystemTray.wifi.showAddNetwork()">
                    Add Network
                </button>
            ` : ''}
        `;
    }

    loadSavedNetworks() {
        const wifiSettings = this.settingsManager.getSettings('wifi');
        if (wifiSettings?.customNetworks) {
            this.networks = [
                ...this.networks,
                ...wifiSettings.customNetworks.map(n => new Network(
                    n.name, 
                    n.security, 
                    n.signalStrength, 
                    true
                ))
            ];
        }
    }

    saveNetworks() {
        const customNetworks = this.networks
            .filter(n => n.isCustom)
            .map(n => n.toJSON());
        this.settingsManager.updateSettings('wifi', 'customNetworks', customNetworks);
    }
}