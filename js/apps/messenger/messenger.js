// messenger.js
export class Messenger {
    constructor(fileSystem, wifiSystem) {
        this.fileSystem = fileSystem;
        this.wifiSystem = wifiSystem;
        this.container = null;
        this.currentFriend = null;
        this.currentChat = [];
        this.userProfile = null;
        this.apiKey = null;
        
        // Bind methods
        this.handleSendMessage = this.handleSendMessage.bind(this);
        this.switchFriend = this.switchFriend.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.loadUserProfile = this.loadUserProfile.bind(this);
        this.saveUserProfile = this.saveUserProfile.bind(this);

        this.friends = {}; // Will store imported friends
        this.currentFriend = null;
        
        // Bind additional methods
        this.renderFriendsList = this.renderFriendsList.bind(this);
        this.switchFriend = this.switchFriend.bind(this);
    }

    async initialize(containerElement) {
        this.container = containerElement;
        this.setupUI();
        this.loadUserProfile();
        this.loadApiKey();
        
        // Load friends
        try {
            const { friends, getFriend, getAllFriends } = await import('./friends.js');
            this.friends = friends;
            this.renderFriendsList();
        } catch (error) {
            console.error('Error loading friends:', error);
        }
        
        // Initial network check
        this.updateNetworkStatus();
        
        // Set up periodic network status check
        setInterval(() => {
            this.updateNetworkStatus();
        }, 1000);
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="msg-container">
                <div class="msg-sidebar">
                    <div class="msg-profile-section">
                        <div class="msg-profile-header">
                            <span id="msg-username">Loading profile...</span>
                            <button class="msg-settings-btn" onclick="window.elxaMessenger.showSettings()">⚙️</button>
                        </div>
                        <button class="msg-edit-profile" onclick="window.elxaMessenger.showProfileEditor()">
                            Edit Profile
                        </button>
                    </div>
                    <div class="msg-network-status"></div>
                    <div class="msg-friends-list"></div>
                </div>
                <div class="msg-chat-area">
                    <div class="msg-chat-header">
                        <span class="msg-current-friend">Select a friend to start chatting</span>
                    </div>
                    <div class="msg-chat-messages"></div>
                    <div class="msg-input-area">
                        <textarea 
                            class="msg-input" 
                            placeholder="Type a message..." 
                            disabled
                        ></textarea>
                        <button class="msg-send-btn" disabled>Send</button>
                    </div>
                </div>
            </div>
        `;

        // Make messenger instance globally accessible
        window.elxaMessenger = this;

        // Set up event listeners
        const input = this.container.querySelector('.msg-input');
        const sendBtn = this.container.querySelector('.msg-send-btn');

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        sendBtn.addEventListener('click', this.handleSendMessage);

        // Initial network status check
        this.updateNetworkStatus();
    }

    updateProfile(newProfile) {
        this.userProfile = newProfile;
        this.updateProfileDisplay();
        
        // Save to file system
        const profileDir = '/ElxaOS/Users/' + this.fileSystem.currentUsername + '/.messenger';
        const profilePath = profileDir + '/profile.json';
        
        try {
            // Ensure directory exists
            if (!this.fileSystem.getDirectory(profileDir)) {
                this.fileSystem.createDirectory(profileDir);
            }
            
            // Save profile
            this.fileSystem.writeFile(profilePath, JSON.stringify(this.userProfile, null, 2));
        } catch (error) {
            console.error('Error saving updated profile:', error);
        }
    }

    async saveUserProfile(profile) {
        try {
            const profileDir = '/ElxaOS/Users/' + this.fileSystem.currentUsername + '/.messenger';
            const profilePath = profileDir + '/profile.json';
            
            // Ensure directory exists
            if (!this.fileSystem.getDirectory(profileDir)) {
                this.fileSystem.createDirectory(profileDir);
            }
            
            // Save profile
            this.fileSystem.writeFile(profilePath, JSON.stringify(profile || this.userProfile, null, 2));
            
            if (profile) {
                this.userProfile = profile;
                this.updateProfileDisplay();
            }
            
            document.querySelector('.msg-profile-dialog')?.remove();
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile');
        }
    }

    async loadUserProfile() {
        try {
            const profilePath = '/ElxaOS/Users/' + this.fileSystem.currentUsername + '/.messenger/profile.json';
            const profileFile = this.fileSystem.getFile(profilePath);
            
            if (profileFile) {
                this.userProfile = JSON.parse(profileFile.content);
                this.updateProfileDisplay();
            } else {
                this.showProfileEditor(true); // true indicates first-time setup
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showProfileEditor(true);
        }
    }

    async loadApiKey() {
        try {
            const keyPath = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.messenger/api_key.enc`;
            const keyFile = this.fileSystem.getFile(keyPath);
            
            if (keyFile) {
                // TODO: Add decryption logic in the future
                this.apiKey = keyFile.content;
                console.log('API key loaded successfully');
            } else {
                console.log('No API key found, will prompt user to enter one');
                this.showSettings(true); // true indicates first-time setup
            }
        } catch (error) {
            console.error('Error loading API key:', error);
            // Don't show an error to the user, just prompt them to enter the key
            this.showSettings(true);
        }
    }

    showSettings(isFirstTime = false) {
        const existingDialog = document.querySelector('.msg-settings-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
    
        const dialog = document.createElement('div');
        dialog.className = 'msg-settings-dialog';
        
        // Make dialog modal if it's first time setup
        if (isFirstTime) {
            dialog.classList.add('msg-modal');
        }
        
        dialog.innerHTML = `
            <h2>${isFirstTime ? 'Welcome to Messenger!' : 'Settings'}</h2>
            <div class="msg-settings-content">
                <label for="msg-api-key">Gemini API Key:</label>
                <input type="password" id="msg-api-key" value="${this.apiKey || ''}" 
                    placeholder="Enter your API key">
                <div class="msg-profile-buttons">
                    <button onclick="window.elxaMessenger.saveSettings()">Save</button>
                    ${!isFirstTime ? '<button onclick="this.closest(\'.msg-settings-dialog\').remove()">Cancel</button>' : ''}
                </div>
            </div>
        `;
    
        document.body.appendChild(dialog);
    
        // Focus the input field
        setTimeout(() => {
            dialog.querySelector('#msg-api-key')?.focus();
        }, 0);
    }

    async saveSettings() {
        console.log('Saving settings...');
        
        const keyInput = document.querySelector('#msg-api-key');
        const key = keyInput?.value?.trim();
        
        if (!key) {
            alert('Please enter your API key');
            return;
        }
    
        try {
            // Ensure the messenger directory exists
            const messengerDir = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.messenger`;
            
            // Check if directory exists first
            if (!this.fileSystem.folderExists(messengerDir)) {
                console.log('Creating messenger directory...');
                try {
                    // Create .messenger directory if it doesn't exist
                    const parentDir = `/ElxaOS/Users/${this.fileSystem.currentUsername}`;
                    this.fileSystem.createFolder(parentDir, '.messenger');
                } catch (error) {
                    console.error('Error creating messenger directory:', error);
                    throw new Error('Failed to create messenger directory');
                }
            }
    
            // TODO: Add actual encryption logic in the future
            // For now, we'll just save the key directly
            const encryptedKey = key; // Placeholder for encryption
            
            // Save the API key
            const keyPath = `${messengerDir}/api_key.enc`;
            await this.fileSystem.saveFile(
                messengerDir,
                'api_key.enc',
                encryptedKey,
                'text'
            );
    
            // Update local reference
            this.apiKey = key;
            
            // Remove settings dialog
            document.querySelector('.msg-settings-dialog')?.remove();
            
            console.log('API key saved successfully');
            
        } catch (error) {
            console.error('Error saving API key:', error);
            alert('Failed to save API key: ' + error.message);
        }
    }

// Update the showProfileEditor method in messenger.js
    showProfileEditor(isFirstTime = false) {
        // First, create the modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'msg-modal';
        
        // Then create the dialog
        const dialog = document.createElement('div');
        dialog.className = 'msg-profile-dialog';
        
        // Add dialog to overlay
        modalOverlay.appendChild(dialog);
        
        // Add overlay to container
        this.container.appendChild(modalOverlay);
        
        dialog.innerHTML = `
            <h2>${isFirstTime ? 'Create Your Profile' : 'Edit Profile'}</h2>
            <div class="msg-profile-form">
                <label for="msg-profile-name">Your Name:</label>
                <input type="text" id="msg-profile-name" value="${this.userProfile?.name || ''}">
                
                <label for="msg-profile-age">Your Age:</label>
                <input type="number" id="msg-profile-age" value="${this.userProfile?.age || ''}" min="1" max="99">
                
                <label for="msg-profile-interests">Your Interests (comma-separated):</label>
                <textarea id="msg-profile-interests">${this.userProfile?.interests?.join(', ') || ''}</textarea>
                
                <div class="msg-profile-buttons">
                    <button onclick="window.elxaMessenger.saveUserProfile()">Save</button>
                    ${!isFirstTime ? '<button onclick="this.closest(\'.msg-modal\').remove()">Cancel</button>' : ''}
                </div>
            </div>
        `;
    }

    async saveUserProfile() {
        console.log('Saving user profile...');
        
        const name = document.querySelector('#msg-profile-name').value.trim();
        const age = document.querySelector('#msg-profile-age').value;
        const interests = document.querySelector('#msg-profile-interests').value
            .split(',')
            .map(i => i.trim())
            .filter(i => i);
    
        if (!name || !age) {
            alert('Please fill in all required fields');
            return;
        }
    
        const profile = {
            name,
            age: parseInt(age),
            interests
        };
    
        try {
            // Ensure the messenger directory exists
            const profileDir = `/ElxaOS/Users/${this.fileSystem.currentUsername}/.messenger`;
            
            // Check if directory exists first
            if (!this.fileSystem.folderExists(profileDir)) {
                console.log('Creating messenger directory...');
                try {
                    // Create .messenger directory if it doesn't exist
                    const parentDir = `/ElxaOS/Users/${this.fileSystem.currentUsername}`;
                    this.fileSystem.createFolder(parentDir, '.messenger');
                } catch (error) {
                    console.error('Error creating messenger directory:', error);
                    throw new Error('Failed to create messenger directory');
                }
            }
    
            // Save the profile
            const profilePath = `${profileDir}/profile.json`;
            await this.fileSystem.saveFile(
                profileDir,
                'profile.json',
                JSON.stringify(profile, null, 2),
                'json'
            );
    
            // Update local profile
            this.userProfile = profile;
            
            // Update display
            this.updateProfileDisplay();
            
            // Remove dialog
            document.querySelector('.msg-modal')?.remove();
            
            console.log('Profile saved successfully:', profile);
            
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile: ' + error.message);
        }
    }
    
    // Add this helper method to properly update the profile display
    updateProfileDisplay() {
        if (this.userProfile) {
            const usernameElement = document.querySelector('#msg-username');
            if (usernameElement) {
                usernameElement.textContent = this.userProfile.name;
            }
        }
    }

    updateNetworkStatus() {
        const statusElement = this.container.querySelector('.msg-network-status');
        
        if (!this.wifiSystem.isEnabled || !this.wifiSystem.currentNetwork) {
            statusElement.innerHTML = `
                <div class="msg-offline">
                    <span>📡 No network connection</span>
                </div>
            `;
            this.disableChat();
        } else {
            statusElement.innerHTML = `
                <div class="msg-online">
                    <span>🟢 Connected to ${this.wifiSystem.currentNetwork.name}</span>
                </div>
            `;
            this.enableChat();
        }
    }
    
    renderFriendsList() {
        const friendsList = this.container.querySelector('.msg-friends-list');
        if (!friendsList) return;

        friendsList.innerHTML = Object.values(this.friends).map(friend => `
            <div class="msg-friend-item ${this.currentFriend?.id === friend.id ? 'active' : ''}" 
                 onclick="window.elxaMessenger.switchFriend('${friend.id}')">
                <div class="msg-friend-avatar">
                    ${friend.avatar}
                </div>
                <div class="msg-friend-info">
                    <div class="msg-friend-name">${friend.name}</div>
                    <div class="msg-friend-status">
                        <span class="status-indicator ${friend.status}">●</span>
                        ${friend.status}
                    </div>
                </div>
            </div>
        `).join('');
    }

    switchFriend(friendId) {
        const friend = this.friends[friendId];
        if (!friend) return;

        this.currentFriend = friend;
        
        // Update chat header
        const chatHeader = this.container.querySelector('.msg-current-friend');
        if (chatHeader) {
            chatHeader.innerHTML = `
                <div class="msg-chat-friend-info">
                    ${friend.avatar} ${friend.name}
                    <span class="status-indicator ${friend.status}">●</span>
                </div>
            `;
        }

        // Enable chat if we have network connection
        if (this.wifiSystem.isEnabled && this.wifiSystem.currentNetwork) {
            this.enableChat();
        }

        // Clear current chat messages
        const messagesArea = this.container.querySelector('.msg-chat-messages');
        if (messagesArea) {
            messagesArea.innerHTML = `
                <div class="msg-chat-start">
                    <div class="msg-chat-start-header">
                        Start of your conversation with ${friend.name}
                    </div>
                    <div class="msg-chat-start-prompt">
                        ${this.getConversationStarter(friend)}
                    </div>
                </div>
            `;
        }

        // Update friends list to show active friend
        this.renderFriendsList();
    }

    getConversationStarter(friend) {
        // Generate a conversation starter based on friend's interests
        const interest = friend.personality.interests[
            Math.floor(Math.random() * friend.personality.interests.length)
        ];
        return `${friend.name} loves talking about ${interest}. Why not start a conversation about that?`;
    }

    enableChat() {
        const input = this.container.querySelector('.msg-input');
        const sendBtn = this.container.querySelector('.msg-send-btn');
        
        // Only enable if we have a selected friend
        if (this.currentFriend) {
            input.disabled = false;
            sendBtn.disabled = false;
        }
    }
    
    disableChat() {
        const input = this.container.querySelector('.msg-input');
        const sendBtn = this.container.querySelector('.msg-send-btn');
        
        input.disabled = true;
        sendBtn.disabled = true;
    }
    
    
    async prepareChatContext() {
        if (!this.currentFriend || !this.userProfile) return null;
    
        return {
            base_context: `This is a private chat conversation in a messenger app. You should act as ${this.currentFriend.name} chatting with ${this.userProfile.name} (age ${this.userProfile.age}), who is interested in ${this.userProfile.interests.join(', ')}.`,
            character_context: `${this.currentFriend.personality.background} ${this.currentFriend.personality.prompt_additions}`,
            style_guide: this.currentFriend.personality.speech_style,
            traits: this.currentFriend.personality.traits,
            interests: this.currentFriend.personality.interests
        };
    }
    
    async getFriendResponse(message, context) {
        if (!this.apiKey) {
            throw new Error("API key not found. Please add your Gemini API key in settings.");
        }

        try {
            // Simplify the prompt to reduce chances of triggering filters
            const prompt = `You are ${context.base_context}

    Character Guidelines:
    - Name: ${this.currentFriend.name}
    - Personality: ${context.traits.join(", ")}
    - Speaking style: ${context.style_guide}

    Please respond to this message in a casual chat style: "${message}"`;

            // Make the API request with modified parameters
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.9,            // Increased for more varied responses
                        topK: 40,
                        topP: 0.95,                 // Increased for more creative responses
                        maxOutputTokens: 150,        // Reduced to ensure we get responses
                        stopSequences: ["Human:", "Assistant:"]  // Prevent unwanted format
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('API Error Response:', error);
                throw new Error(error.error?.message || 'API request failed');
            }

            const data = await response.json();
            console.log('Full API Response:', data);  // Debug log
            
            // More robust response extraction
            let responseText = '';
            
            if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];
                
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    responseText = candidate.content.parts[0].text;
                }
                
                // Log if we have content but it was filtered
                if (candidate.finishReason === "SAFETY") {
                    console.warn('Response was filtered for safety reasons');
                    throw new Error('Response was filtered - trying again with safer content');
                }
            }
            
            if (!responseText) {
                console.error('No valid response text found in:', data);
                throw new Error('No valid response generated');
            }

            // Clean up response
            responseText = responseText
                .trim()
                .replace(/^(Human|Assistant):?\s*/i, '')  // Remove any prefixes
                .replace(/\n{2,}/g, '\n');               // Clean up extra newlines

            return responseText;

        } catch (error) {
            console.error('API Call Error Details:', error);
            
            // Special handling for safety filters
            if (error.message.includes('filtered')) {
                // You could retry with a more conservative prompt here
                throw new Error('Message could not be processed - please try again');
            }
            
            throw new Error(`Failed to get response: ${error.message}`);
        }
    }


    async handleSendMessage() {
        const input = this.container.querySelector('.msg-input');
        const message = input.value.trim();
        
        if (!message || !this.currentFriend) return;

        // Clear input
        input.value = '';

        // Add user message to chat
        this.addMessageToChat(message, 'sent');

        try {
            // Check network connection
            if (!this.wifiSystem.isEnabled || !this.wifiSystem.currentNetwork) {
                throw new Error('No network connection');
            }

            // Validate API key exists and is properly formatted
            if (!this.apiKey || this.apiKey.length < 10) {
                throw new Error('Invalid API key');
            }

            // Show typing indicator
            this.showTypingIndicator();

            // Prepare chat context
            const context = await this.prepareChatContext();
            if (!context) {
                throw new Error('Failed to prepare chat context');
            }

            // Get AI response with timeout
            const response = await Promise.race([
                this.getFriendResponse(message, context),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timed out')), 30000)
                )
            ]);

            // Remove typing indicator and add friend's response
            this.hideTypingIndicator();
            this.addMessageToChat(response, 'received');

        } catch (error) {
            console.error('Detailed Chat Error:', error); // Enhanced error logging
            this.hideTypingIndicator();
            
            // Show specific user-friendly error message
            let errorMessage = "Sorry, I couldn't send that message right now.";
            if (error.message.includes('API key')) {
                errorMessage = "Please check your Gemini API key in settings.";
            } else if (error.message.includes('network')) {
                errorMessage = "No network connection. Please check your connection and try again.";
            } else if (error.message.includes('timed out')) {
                errorMessage = "The request took too long. Please try again.";
            }
            
            this.addMessageToChat(errorMessage, 'error');
        }
    }   
    
    addMessageToChat(message, type) {
        const messagesArea = this.container.querySelector('.msg-chat-messages');
        if (!messagesArea) return;
    
        const messageElement = document.createElement('div');
        messageElement.className = `msg-message ${type}`;
        messageElement.innerHTML = `
            <div class="msg-message-content">
                ${message}
            </div>
            <div class="msg-message-time">
                ${new Date().toLocaleTimeString()}
            </div>
        `;
    
        messagesArea.appendChild(messageElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    
    showTypingIndicator() {
        const messagesArea = this.container.querySelector('.msg-chat-messages');
        if (!messagesArea) return;
    
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'msg-typing';
        typingIndicator.innerHTML = `${this.currentFriend.name} is typing<span class="msg-typing-dots"></span>`;
        
        messagesArea.appendChild(typingIndicator);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    
    hideTypingIndicator() {
        const typingIndicator = this.container.querySelector('.msg-typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }


}