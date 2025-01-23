// config.js

export const CONFIG = {
    system: {
        name: 'ElxaOS',
        version: '2.0.0',
        codename: 'Vanilla',
        fullVersion: function() {
            return `${this.version} ${this.codename}`;
        },
        copyright: function() {
            return `Copyright © ${new Date().getFullYear()} Elxa Corporation. All rights reserved.`;
        },
        shortVersion: function() {
            return `${this.version}`;
        }
    },
    
    // Add other configuration categories as needed
    branding: {
        companyName: 'Elxa Corporation',
        logo: '🦆', // Example
    },
    
    debug: {
        enabled: false,
        logLevel: 'INFO'
    }
};

// Freeze the configuration to prevent modifications
Object.freeze(CONFIG.system);
Object.freeze(CONFIG.branding);
Object.freeze(CONFIG.debug);
Object.freeze(CONFIG);