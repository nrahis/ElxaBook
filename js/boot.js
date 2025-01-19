// Add this to a new file called boot.js
class BootSequence {
    constructor() {
        this.bootScreen = document.getElementById('boot-screen');
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.progressBar = document.querySelector('.loading-progress');
        this.statusText = document.getElementById('boot-status');
        this.startButton = document.getElementById('start-button');
        this.bootSequence = document.getElementById('boot-sequence');
        this.loginScreen = document.getElementById('login-screen');
        this.passwordInput = document.getElementById('password-input');
        this.loginButton = document.getElementById('login-button');
        this.loginMessage = document.getElementById('login-message');
        
        this.bootMessages = [
            "Initializing core systems...",
            "Loading ElxaOS kernel...",
            "Activating quantum processors...",
            "Charging rainbow crystals...",
            "Synchronizing dream modules...",
            "Calibrating vaporwave frequencies...",
            "Loading cute protocols...",
            "Preparing digital happiness...",
            "Starting ElxaOS services..."
        ];

        // Fun messages for wrong passwords
        this.wrongPasswordMessages = [
            "Oopsie! That's not quite right! 🐍",
            "Your snake says try again! 🐍",
            "Almost there, but not quite! 🐍",
            "Hmm... my snake senses say that's incorrect! 🐍",
            "That password is as slippery as a snake! Try again! 🐍",
            "Nice try, but my snake guard says no! 🐍",
            "The password snake wants another attempt! 🐍",
            "Sneaky try, but not sneaky enough! 🐍",
            "Your password skills are still in training! 🐍",
            "The snake password detector is shaking its head! 🐍"
        ];
        
        this.initialize();
    }

    initialize() {
        // Start the boot sequence when the page loads
        this.startBoot();

        // Add login event listeners
        this.loginButton.addEventListener('click', () => this.handleLogin());
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        
        // Modify the start button click handler
        this.startButton.addEventListener('click', () => {
            this.welcomeScreen.style.animation = 'fadeOut 1s forwards';
            setTimeout(() => {
                this.welcomeScreen.classList.add('hidden');
                this.loginScreen.classList.remove('hidden');
                this.loginScreen.style.animation = 'fadeIn 1s forwards';
                this.passwordInput.focus();
            }, 1000);
        });
    }

    handleLogin() {
        const password = this.passwordInput.value;
        
        if (password === 'MyJ2MyJ2') {
            // Correct password
            this.loginMessage.textContent = "Welcome back, kitkat! 🐍";
            this.loginMessage.style.color = '#00ff9d';
            this.loginMessage.classList.add('show');
            
            // Transition to desktop
            setTimeout(() => {
                this.bootSequence.style.animation = 'fadeOut 1s forwards';
                setTimeout(() => {
                    this.bootSequence.remove();
                    document.getElementById('desktop').style.visibility = 'visible';
                }, 1000);
            }, 1000);
        } else {
            // Wrong password
            this.loginMessage.textContent = this.getRandomMessage();
            this.loginMessage.style.color = '#ff71ce';
            this.loginMessage.classList.add('show');
            
            // Clear password input
            this.passwordInput.value = '';
            this.passwordInput.focus();
            
            // Shake the input
            this.passwordInput.classList.add('shake');
            setTimeout(() => {
                this.passwordInput.classList.remove('shake');
            }, 500);
        }
    }

    getRandomMessage() {
        return this.wrongPasswordMessages[
            Math.floor(Math.random() * this.wrongPasswordMessages.length)
        ];
    }

    async startBoot() {
        let progress = 0;
        
        // Hide the desktop until boot is complete
        document.getElementById('desktop').style.visibility = 'hidden';
        
        // Simulate loading progress
        for (let message of this.bootMessages) {
            // Update status message
            this.statusText.textContent = message;
            
            // Increment progress
            progress += Math.floor(100 / this.bootMessages.length);
            this.progressBar.style.width = `${Math.min(progress, 100)}%`;
            
            // Wait for a random time between 0.5 and 1.5 seconds
            await this.delay(500 + Math.random() * 1000);
        }
        
        // Ensure we reach 100%
        this.progressBar.style.width = '100%';
        this.statusText.textContent = "Boot sequence complete!";
        
        // Wait a moment before showing welcome screen
        await this.delay(1000);
        
        // Show welcome screen
        this.bootScreen.style.animation = 'fadeOut 1s forwards';
        await this.delay(1000);
        this.bootScreen.classList.add('hidden');
        this.welcomeScreen.classList.remove('hidden');
        this.welcomeScreen.style.animation = 'fadeIn 1s forwards';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the boot sequence when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BootSequence();
});