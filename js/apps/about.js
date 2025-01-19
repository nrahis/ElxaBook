export class About {
    constructor() {
        // Remove the hardcoded windowId from constructor
        this.content = `
            <div id="about-content">
                <h2>Welcome to ElxaOS!</h2>
                <p>The latest and greatest operating system from Elxa, designed with cutting-edge technology and a focus on user experience.</p>
                <p>ElxaOS offers a seamless and intuitive interface, powerful features, and a unique vaporwave aesthetic that sets it apart.</p>
                <p>Explore the possibilities with ElxaOS and unleash your creativity!</p>
                <p>Version: 1.0 Vapor Edition</p>
                <p>Copyright © <span id="currentYear"></span> Elxa Corporation. All rights reserved.</p>
            </div>
        `;
    }

    initialize(contentArea) {
        contentArea.innerHTML = this.content;
        
        // Update copyright year
        const currentYearSpan = contentArea.querySelector('#currentYear');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }
}

export const about = new About();