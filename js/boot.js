import { UserManager } from './user_manager.js';
import { FileSystem } from './storage.js';
import { AvatarManager } from './avatar_manager.js'; // Add this import

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

        // Create a single instance of FileSystem and make it globally available
        if (!window.elxaFileSystem) {
            window.elxaFileSystem = new FileSystem();
        }
        this.fileSystem = window.elxaFileSystem;
        
        // Initialize UserManager with the shared FileSystem instance
        this.userManager = new UserManager(this.fileSystem);
        
        this.selectedUser = 'kitkat'; // Default user

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
        this.avatarManager = new AvatarManager();
    }

    switchUser(username) {
        console.log('Switching to user:', username);
        this.selectedUser = username;
        this.renderLoginScreen();
        this.passwordInput.focus();
        this.loginMessage.textContent = '';
        this.loginMessage.classList.remove('show');
    }

    renderLoginScreen() {
        const users = this.userManager.getAllUsers();
        
        const usersList = Object.values(users)
            .map(user => {
                const avatar = this.avatarManager.getUserAvatar(user.username);
                return `
                    <div class="user-option ${user.username === this.selectedUser ? 'selected' : ''}" 
                         data-username="${user.username}">
                        <div class="user-avatar">
                            ${avatar.type === 'svg' ? avatar.content : 
                              `<img src="${avatar.content}" alt="${user.username}" class="avatar-image">`}
                        </div>
                        <div class="user-name">${user.username}</div>
                    </div>
                `;
            }).join('');

        const loginHTML = `
            <div class="login-container">
                <div class="users-list-container">
                    <button class="user-scroll-arrow user-scroll-left">◀</button>
                    <div class="users-list">
                        <div class="users-scroll-container">
                            ${usersList}
                        </div>
                    </div>
                    <button class="user-scroll-arrow user-scroll-right">▶</button>
                </div>
                
                <div class="password-container">
                    <input type="password" 
                           id="password-input" 
                           placeholder="Enter password"
                           autocomplete="off">
                    <button id="login-button">Log In</button>
                </div>
                
                <div id="login-message" class="login-message"></div>
            </div>
        `;

        this.loginScreen.innerHTML = loginHTML;
        
        // Refresh references to new elements
        this.passwordInput = document.getElementById('password-input');
        this.loginButton = document.getElementById('login-button');
        this.loginMessage = document.getElementById('login-message');
        
        // Set up event listeners
        this.setupEventListeners();
        this.setupScrolling();
    }

    setupScrolling() {
        const container = this.loginScreen.querySelector('.users-scroll-container');
        const leftArrow = this.loginScreen.querySelector('.user-scroll-left');
        const rightArrow = this.loginScreen.querySelector('.user-scroll-right');
        
        if (!container || !leftArrow || !rightArrow) return;

        let currentPosition = 0;
        const userOptions = container.querySelectorAll('.user-option');
        const totalUsers = userOptions.length;
        const userWidth = 120; // Width of user option including gap
        
        const scroll = (direction) => {
            const maxScroll = Math.max(0, totalUsers - 3); // Show 3 users at a time
            
            if (direction === 'left') {
                currentPosition = (currentPosition - 1 + totalUsers) % totalUsers;
            } else {
                currentPosition = (currentPosition + 1) % totalUsers;
            }

            container.style.transform = `translateX(-${currentPosition * userWidth}px)`;
        };

        leftArrow.addEventListener('click', () => scroll('left'));
        rightArrow.addEventListener('click', () => scroll('right'));

        // Show/hide arrows based on number of users
        if (totalUsers <= 3) {
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Login button and password input listeners
        if (this.loginButton) {
            this.loginButton.addEventListener('click', () => this.handleLogin());
        }
        if (this.passwordInput) {
            this.passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }

        // User selection listeners
        const userOptions = this.loginScreen.querySelectorAll('.user-option');
        userOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const username = e.currentTarget.dataset.username;
                if (username) {
                    this.switchUser(username);
                }
            });
        });
    }

    initialize() {
        // Start the boot sequence when the page loads
        this.startBoot();

        // Modify the start button click handler
        if (this.startButton) {
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
    }

    handleLogin() {
        const password = this.passwordInput.value;
        
        if (this.userManager.validateLogin(this.selectedUser, password)) {
            // Correct password
            this.loginMessage.textContent = `Welcome back, ${this.selectedUser}! 🐍`;
            this.loginMessage.style.color = '#00ff9d';
            this.loginMessage.classList.add('show');
            
            // Update FileSystem's current user
            window.elxaFileSystem.setCurrentUser(this.selectedUser);
            console.log('Set current user to:', this.selectedUser); // Debug log

        // Load user settings
            const settingsPath = `/ElxaOS/Users/${this.selectedUser}/.settings/user.config`;
            try {
                const settingsFile = window.elxaFileSystem.getFile(settingsPath);
                if (settingsFile) {
                    const settings = JSON.parse(settingsFile.content);
                    // Apply settings
                    if (settings.display?.background) {
                        if (settings.display.background.startsWith('default-')) {
                            const index = parseInt(settings.display.background.split('-')[1]);
                            document.body.style.background = defaultBackgrounds[index].value;
                            document.body.style.backgroundSize = '400% 400%';
                        } else {
                            const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
                            document.body.style.background = `url(${customBgs[parseInt(settings.display.background)]})`;
                            document.body.style.backgroundSize = 'cover';
                        }
                    }
                    if (settings.personalization?.systemFont) {
                        // Set the font immediately
                        document.documentElement.style.setProperty('--system-font', settings.personalization.systemFont);
                    }
                }
            } catch (error) {
                console.error('Failed to load user settings:', error);
            }
            
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
        // Update to use renderLoginScreen instead of static HTML
        this.bootScreen.classList.add('hidden');
        this.welcomeScreen.classList.remove('hidden');
        this.welcomeScreen.style.animation = 'fadeIn 1s forwards';
        
        // Pre-render login screen
        this.renderLoginScreen();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the boot sequence when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BootSequence();
});