// user_manager.js
export class UserManager {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.USERS_KEY = 'elxaos_users';
        this.currentUser = 'kitkat';  // Set default user
        
        // Set the current user in the file system immediately
        this.fileSystem.setCurrentUser('kitkat');
        
        this.initializeUsers();
    }

    initializeUsers() {
        // If no users exist, create default admin user
        if (!localStorage.getItem(this.USERS_KEY)) {
            const defaultUser = {
                username: 'kitkat',
                // In a real system, we'd hash this password
                password: 'MyJ2MyJ2',
                type: 'administrator',
                created: new Date().toISOString(),
                lastLogin: null,
                settings: {
                    theme: {
                        primaryColor: '#a267ac',
                        accentColor: '#67c9dc',
                        systemFont: 'Segoe UI'
                    },
                    background: 'linear-gradient(135deg, #a267ac, #67c9dc, #ff99cc)'
                }
            };

            const users = { kitkat: defaultUser };
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        }
    }

    createUser(username, password, type = 'standard') {
        const users = this.getAllUsers();
        
        // Check if username already exists
        if (users[username]) {
            throw new Error('Username already exists');
        }
    
        // Create new user object
        const newUser = {
            username,
            password, // In a real system, we'd hash this
            type,
            created: new Date().toISOString(),
            lastLogin: null,
            settings: {
                theme: {
                    primaryColor: '#a267ac',
                    accentColor: '#67c9dc',
                    systemFont: 'Segoe UI'
                },
                background: 'linear-gradient(135deg, #a267ac, #67c9dc, #ff99cc)'
            }
        };
    
        // Create user's folders
        const foldersCreated = this.fileSystem.testCreateUser(username);
        if (!foldersCreated) {
            throw new Error('Failed to create user folders');
        }
    
        // Add user to storage
        users[username] = newUser;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    
        return newUser;
    }

    deleteUser(username) {
        const users = this.getAllUsers();
        const currentUser = this.getCurrentUser();
        
        // Basic validation
        if (!users[username]) {
            throw new Error('User not found');
        }
        
        // Prevent deleting your own account
        if (username === currentUser.username) {
            throw new Error('Cannot delete your own account');
        }
        
        // Prevent deleting the last administrator
        if (users[username].type === 'administrator' && 
            this.getAdministrators().length === 1) {
            throw new Error('Cannot delete the last administrator account');
        }
    
        try {
            // Check if user's folder exists before attempting to delete it
            const userFolderPath = `/ElxaOS/Users/${username}`;
            if (this.fileSystem.folderExists(userFolderPath)) {
                console.log(`Deleting user folder at: ${userFolderPath}`);
                this.fileSystem.deleteFolder(userFolderPath, true);
            } else {
                console.log(`No folder found for user ${username}, skipping folder deletion`);
            }
            
            // Remove user from storage
            delete users[username];
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            
            console.log(`User ${username} deleted successfully`);
            return true;
        } catch (error) {
            console.error('Error during user deletion:', error);
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }

    getAllUsers() {
        return JSON.parse(localStorage.getItem(this.USERS_KEY) || '{}');
    }

    getAdministrators() {
        const users = this.getAllUsers();
        return Object.values(users).filter(user => user.type === 'administrator');
    }

    getUser(username) {
        const users = this.getAllUsers();
        return users[username];
    }

    updateUser(username, updates) {
        const users = this.getAllUsers();
        if (!users[username]) {
            throw new Error('User not found');
        }

        // Update user data
        users[username] = {
            ...users[username],
            ...updates,
            modified: new Date().toISOString()
        };

        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return users[username];
    }

    validateLogin(username, password) {
        const user = this.getUser(username);
        if (!user || user.password !== password) {
            return false;
        }
    
        // Update last login time
        this.updateUser(username, {
            lastLogin: new Date().toISOString()
        });
    
        this.currentUser = username;
        
        // Update FileSystem's current user
        this.fileSystem.setCurrentUser(username);
        
        return true;
    }

    logout() {
        this.currentUser = null;
    }

    getCurrentUser() {
        if (!this.currentUser) return null;
        const users = this.getAllUsers();
        return users[this.currentUser] || null;
    }

    changePassword(username, currentPassword, newPassword) {
        const user = this.getUser(username);
        if (!user || user.password !== currentPassword) {
            throw new Error('Current password is incorrect');
        }

        return this.updateUser(username, { password: newPassword });
    }
}