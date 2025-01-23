import { WiFiSystem } from './wifi_system.js';

class BatterySystem {
    constructor(systemTray) {
        this.systemTray = systemTray; // Store reference to SystemTray instance
        this.percentage = 100;
        this.isCharging = false;
        this.drainInterval = null;
        this.popup = null;
        this.WARNING_THRESHOLD = 20;
        this.CRITICAL_THRESHOLD = 10;
        this.DRAIN_RATE = 1; // percentage points per minute
    }

    initialize() {
        this.startDraining();
    }

    startDraining() {
        // Drain battery every minute
        this.drainInterval = setInterval(() => {
            if (!this.isCharging && this.percentage > 0) {
                this.percentage = Math.max(0, this.percentage - this.DRAIN_RATE);
                this.updateDisplay();
                
                // Check for low battery warnings
                if (this.percentage === this.WARNING_THRESHOLD) {
                    this.showLowBatteryWarning();
                } else if (this.percentage === this.CRITICAL_THRESHOLD) {
                    this.showCriticalBatteryWarning();
                }
            }
        }, 60000); // every minute
    }

    charge() {
        this.isCharging = true;
        const chargeInterval = setInterval(() => {
            this.percentage = Math.min(100, this.percentage + 5);
            this.updateDisplay();
            
            if (this.percentage >= 100) {
                clearInterval(chargeInterval);
                this.isCharging = false;
            }
        }, 500); // Charge quickly for fun
    }

    updateDisplay() {
        const batteryIcon = document.querySelector('.battery-icon');
        if (batteryIcon) {
            batteryIcon.innerHTML = this.systemTray.getBatterySVG(this.percentage);
            // Update popup if it's open
            if (this.popup && !this.popup.classList.contains('hidden')) {
                this.updatePopupContent();
            }
        }
    }

    showLowBatteryWarning() {
        const warning = document.createElement('div');
        warning.className = 'battery-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <h3>Low Battery!</h3>
                <p>Your battery is getting low (${this.percentage}%). You might want to charge it soon!</p>
                <button onclick="this.closest('.battery-warning').remove()">OK</button>
            </div>
        `;
        document.body.appendChild(warning);
    }

    showCriticalBatteryWarning() {
        const warning = document.createElement('div');
        warning.className = 'battery-warning critical';
        warning.innerHTML = `
            <div class="warning-content">
                <h3>Critical Battery Level!</h3>
                <p>Your battery is very low (${this.percentage}%)! Please charge now!</p>
                <button onclick="this.closest('.battery-warning').remove()">OK</button>
            </div>
        `;
        document.body.appendChild(warning);
    }

    createPopup(x, y) {
        if (this.popup) {
            this.popup.remove();
        }

        this.popup = document.createElement('div');
        this.popup.className = 'battery-popup';
        this.updatePopupContent();

        // Position the popup above the battery icon
        this.popup.style.position = 'absolute';
        this.popup.style.left = `${x}px`;
        this.popup.style.bottom = `32px`; // Just above taskbar

        document.body.appendChild(this.popup);

        // Close popup when clicking outside
        const closePopup = (e) => {
            if (!this.popup.contains(e.target) && !e.target.closest('.battery-icon')) {
                this.popup.remove();
                document.removeEventListener('click', closePopup);
            }
        };
        document.addEventListener('click', closePopup);
    }

    updatePopupContent() {
        if (!this.popup) return;

        let statusText = this.isCharging ? 'Plugged in, charging' : 'On battery';
        let timeLeft = this.calculateTimeLeft();
        
        this.popup.innerHTML = `
            <div class="battery-info">
                <div class="battery-status">
                    <div class="big-battery-icon">${this.systemTray.getBatterySVG(this.percentage)}</div>
                    <div class="battery-details">
                        <div class="battery-percentage">${this.percentage}%</div>
                        <div class="battery-state">${statusText}</div>
                        ${!this.isCharging ? `<div class="time-remaining">${timeLeft}</div>` : ''}
                    </div>
                </div>
                ${!this.isCharging ? `
                    <button class="charge-button" onclick="window.elxaSystemTray.battery.charge()">
                        Plug In Charger
                    </button>
                ` : ''}
            </div>
        `;
    }

    calculateTimeLeft() {
        if (this.isCharging) return '';
        const minutesLeft = (this.percentage / this.DRAIN_RATE);
        const hours = Math.floor(minutesLeft / 60);
        const minutes = Math.round(minutesLeft % 60);
        return `${hours}h ${minutes}m remaining`;
    }
}

export class SystemTray {
    constructor() {
        this.container = null;
        this.wifiIcon = null;
        this.batteryIcon = null;
        this.battery = new BatterySystem(this); // Pass 'this' to BatterySystem
        this.wifi = new WiFiSystem(this);  // Add this line
    }

    initialize() {
        this.container = document.createElement('div');
        this.container.className = 'system-tray';
        
        // Create and add WiFi icon with click handler
        this.wifiIcon = document.createElement('div');
        this.wifiIcon.className = 'tray-icon wifi-icon';
        this.wifiIcon.innerHTML = this.getWifiSVG('full');
        this.wifiIcon.addEventListener('click', (e) => {
            const rect = e.target.closest('.wifi-icon').getBoundingClientRect();
            // Position popup more to the left by subtracting about 80% of typical popup width
            this.wifi.createPopup(rect.left - 240, rect.top);
        });
        
        // Create and add Battery icon
        this.batteryIcon = document.createElement('div');
        this.batteryIcon.className = 'tray-icon battery-icon';
        this.batteryIcon.innerHTML = this.getBatterySVG(100);
        this.batteryIcon.addEventListener('click', (e) => {
            const iconElement = e.target.closest('.battery-icon');
            if (iconElement) {
                const rect = iconElement.getBoundingClientRect();
                this.battery.createPopup(rect.left, rect.top);
            }
        });
        
        // Add icons to container
        this.container.appendChild(this.wifiIcon);
        this.container.appendChild(this.batteryIcon);
        
        // Insert before clock
        const clock = document.getElementById('clock');
        clock.parentNode.insertBefore(this.container, clock);
    
        // Initialize battery system
        this.battery.initialize();
    
        // Initialize wifi system
        this.wifi.initialize();
        
        // Make battery system accessible globally
        window.elxaSystemTray = this;
    }

    getWifiSVG(strength = 'full') {
        // Base SVG for WiFi icon with different strength levels
        const strengthMap = {
            'full': `
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 3C7.8 3 3.7 4.4 0.4 7.1L12 21L23.6 7.1C20.3 4.4 16.2 3 12 3Z"/>
                </svg>`,
            'medium': `
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 6C9.3 6 6.7 6.9 4.5 8.5L12 21L19.5 8.5C17.3 6.9 14.7 6 12 6Z"/>
                </svg>`,
            'low': `
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 10C10.6 10 9.2 10.4 8 11.3L12 21L16 11.3C14.8 10.4 13.4 10 12 10Z"/>
                </svg>`,
            'none': `
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 3C7.8 3 3.7 4.4 0.4 7.1L12 21L23.6 7.1C20.3 4.4 16.2 3 12 3Z" opacity="0.3"/>
                    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2"/>
                </svg>`
        };
        return strengthMap[strength] || strengthMap.full;
    }

    getBatterySVG(percentage = 100) {
        // Battery icon with dynamic fill based on percentage
        return `
        <svg viewBox="0 0 24 24" width="16" height="16">
            <rect x="2" y="6" width="18" height="12" fill="none" stroke="currentColor" stroke-width="2"/>
            <rect x="4" y="8" width="${14 * (percentage/100)}" height="8" fill="currentColor"/>
            <rect x="20" y="9" width="2" height="6" fill="currentColor"/>
        </svg>`;
    }
}