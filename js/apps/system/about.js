import { CONFIG } from './config.js';

export class About {
    constructor() {
        this.content = `
            <div id="about-content">
                <h2>Welcome to ${CONFIG.system.name}!</h2>
                <p>The latest and greatest operating system from ${CONFIG.branding.companyName}, designed with cutting-edge technology and a focus on user experience.</p>
                <p>${CONFIG.system.name} offers a seamless and intuitive interface, powerful features, and a unique aesthetic that sets it apart.</p>
                <p>Explore the possibilities with ${CONFIG.system.name} and unleash your creativity!</p>
                <p>Version: ${CONFIG.system.fullVersion()}</p>
                <p>${CONFIG.system.copyright()}</p>
            </div>
        `;
    }

    initialize(contentArea) {
        contentArea.innerHTML = this.content;
    }
}

export const about = new About();