// storage.js - Enhanced file system with hierarchical structure
import { StorageManager } from './storage/storage_manager.js'; 

export class FileSystem {
    constructor() {
        this.SYSTEM_KEY = 'elxaos_system';
        this.FILES_KEY = 'elxaos_files';
        this.FOLDERS_KEY = 'elxaos_folders';
        this.currentUsername = 'kitkat'; // Set initial user
        
        // Initialize StorageManager
        this.storageManager = new StorageManager();
        
        // Initialize the file system if it doesn't exist
        this.initializeFileSystem();
    }

    exists(path) {
        return this.fileExists(path) || this.folderExists(path);
    }

    setCurrentUser(username) {
        console.log('FileSystem: Setting current user to:', username);
        this.currentUsername = username;
    }

    // Initialize the basic file system structure
    async initializeFileSystem() {
        try {
            await this.storageManager.initialize();
        } catch (error) {
            console.warn('Failed to initialize storage manager:', error);
        }
    
        const needsInitialization = !localStorage.getItem(this.SYSTEM_KEY);
        
        if (needsInitialization) {
            const defaultSystem = {
                root: {
                    name: 'ElxaOS',
                    path: '/',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            };
    
            const defaultFolders = {
                '/ElxaOS': {
                    name: 'ElxaOS',
                    path: '/',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System': {
                    name: 'System',
                    path: '/ElxaOS',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Installers': {
                    name: 'Installers',
                    path: '/ElxaOS/System',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users': {
                    name: 'Users',
                    path: '/ElxaOS',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat': {
                    name: 'kitkat',
                    path: '/ElxaOS/Users',
                    type: 'user-root',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Recycle Bin': {
                    name: 'Recycle Bin',
                    path: '/ElxaOS',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/.settings': {
                    name: '.settings',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/.messenger': {
                    name: '.messenger',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/.messenger/chats': {
                    name: 'chats',
                    path: '/ElxaOS/Users/kitkat/.messenger',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/.settings': {
                    name: '.settings',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'system',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Desktop': {
                    name: 'Desktop',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    isProtected: true,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Documents': {
                    name: 'Documents',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    isProtected: false,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Pictures': {
                    name: 'Pictures',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    isProtected: false,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Music': {
                    name: 'Music',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    isProtected: false,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Downloads': {
                    name: 'Downloads',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    isProtected: false,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Games': {
                    name: 'Games',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    isProtected: false,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Applications': {
                    name: 'Applications',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    isProtected: false,
                    isHidden: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            };
    
            // Update the system files to be protected
            const defaultFiles = {
                '/ElxaOS/System/Paint': {
                    name: 'Paint',
                    type: 'program',
                    program: 'paint',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Notepad': {
                    name: 'Notepad',
                    type: 'program',
                    program: 'notepad',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Kittysweeper': {
                    name: 'Kittysweeper',
                    type: 'program',
                    program: 'minesweeper',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Solitaire': {
                    name: 'Solitaire',
                    type: 'program',
                    program: 'solitaire',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/DUCK.abby': {
                    name: 'DUCK.abby',
                    type: 'program',
                    program: 'duck',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Settings': {
                    name: 'Settings',
                    type: 'program',
                    program: 'settings',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/About': {
                    name: 'About',
                    type: 'program',
                    program: 'about',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Calculator': {
                    name: 'Calculator',
                    type: 'program',
                    program: 'scientificCalculator',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Clock': {
                    name: 'Clock',
                    type: 'program',
                    program: 'clock',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Calendar': {
                    name: 'Calendar',
                    type: 'program',
                    program: 'calendar',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Slideshow': {
                    name: 'Slideshow',
                    type: 'program',
                    program: 'slideshow',
                    path: '/ElxaOS/System',
                    isProtected: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Games/Math Match': {
                    name: 'Math Match',
                    type: 'program',
                    program: 'mathMatch',
                    path: '/ElxaOS/Users/kitkat/Games',
                    isProtected: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Games/Time Crunch': {
                    name: 'Time Crunch',
                    type: 'program',
                    program: 'timeCrunch',
                    path: '/ElxaOS/Users/kitkat/Games',
                    isProtected: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Games/Snake Equation': {
                    name: 'Snake Equation',
                    type: 'program',
                    program: 'snakeEquation',
                    path: '/ElxaOS/Users/kitkat/Games',
                    isProtected: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            };
                
            localStorage.setItem(this.SYSTEM_KEY, JSON.stringify(defaultSystem));
            localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(defaultFolders));
            localStorage.setItem(this.FILES_KEY, JSON.stringify(defaultFiles));
    
            // After setting up the basic file system, ensure the default user's folders exist
            this.ensureDefaultUserFolders();
        } else {
            // Even if system exists, verify default user folders
            this.verifyDefaultUserStructure();
        }
    
        // Initialize showHiddenFiles flag
        this.showHiddenFiles = false;
    
        // Log initialization completion
        console.log('File system initialization complete');
        console.log('System structure:', JSON.parse(localStorage.getItem(this.SYSTEM_KEY)));
        console.log('Folders:', JSON.parse(localStorage.getItem(this.FOLDERS_KEY)));
        console.log('Files:', JSON.parse(localStorage.getItem(this.FILES_KEY)));
    }


    ensureDefaultUserFolders() {
        console.log('Ensuring default user folders exist');
        const defaultUser = 'kitkat';
        const userRootPath = `/ElxaOS/Users/${defaultUser}`;
        
        try {
            // Define all required folders
            const requiredFolders = [
                { path: userRootPath, name: defaultUser, type: 'user-root' },
                { path: `${userRootPath}/.settings`, name: '.settings', hidden: true },
                { path: `${userRootPath}/.messenger`, name: '.messenger', hidden: true },
                { path: `${userRootPath}/.messenger/chats`, name: 'chats', hidden: true },
                { path: `${userRootPath}/Desktop`, name: 'Desktop' },
                { path: `${userRootPath}/Documents`, name: 'Documents' },
                { path: `${userRootPath}/Pictures`, name: 'Pictures' },
                { path: `${userRootPath}/Music`, name: 'Music' },
                { path: `${userRootPath}/Downloads`, name: 'Downloads' },
                { path: `${userRootPath}/Games`, name: 'Games' },
                { path: `${userRootPath}/Applications`, name: 'Applications' }
            ];
    
            const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY) || '{}');
    
            // Create each required folder if it doesn't exist
            requiredFolders.forEach(folder => {
                const fullPath = this.joinPaths(folder.path);
                if (!folders[fullPath]) {
                    folders[fullPath] = {
                        name: folder.name,
                        path: this.getParentPath(fullPath),
                        type: folder.type || 'user',
                        isProtected: folder.type === 'user-root',
                        isHidden: folder.hidden || false,
                        created: new Date().toISOString(),
                        modified: new Date().toISOString()
                    };
                }
            });
    
            localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
    
            // Ensure default user.config exists
            const settingsPath = `${userRootPath}/.settings`;
            const defaultSettings = {
                display: {
                    background: 'default-0',
                    fileExplorerView: 'icons',
                    desktopIcons: {}
                },
                personalization: {
                    systemFont: '"Verdana", sans-serif'
                },
                systemTray: {
                    clock: {
                        format24Hour: false,
                        showSeconds: true,
                        showDate: true,
                        dateFormat: 'MM/DD/YYYY'
                    }
                }
            };
    
            this.saveFile(
                settingsPath,
                'user.config',
                JSON.stringify(defaultSettings, null, 2),
                'settings'
            );
    
        } catch (error) {
            console.error('Error creating default user folders:', error);
        }
    }
    
    verifyDefaultUserStructure() {
        console.log('Verifying default user structure');
        const defaultUser = 'kitkat';
        const userRootPath = `/ElxaOS/Users/${defaultUser}`;
        
        // Check if .settings folder and user.config exist
        const settingsPath = `${userRootPath}/.settings`;
        const configPath = `${settingsPath}/user.config`;
        
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY) || '{}');
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY) || '{}');
        
        if (!folders[settingsPath] || !files[configPath]) {
            console.log('Missing critical user files/folders, recreating...');
            this.ensureDefaultUserFolders();
        }
    }
    

    // Path handling methods
    normalizePath(path) {
        if (!path) return '/';
        // Remove multiple slashes and ensure leading slash
        return '/' + path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
    }

    joinPaths(...parts) {
        const joined = parts
            .map(part => part.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
            .filter(Boolean) // Remove empty segments
            .join('/');
        return this.normalizePath(joined);
    }

    getParentPath(path) {
        const normalized = this.normalizePath(path);
        const parts = normalized.split('/').filter(Boolean);
        return parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
    }

    // Folder operations
    createFolder(parentPath, name) {
        console.log('Creating folder:', { parentPath, name }); // Debug log
        
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const fullPath = this.joinPaths(parentPath, name);
        
        console.log('Full path:', fullPath); // Debug log
        console.log('Existing folders:', folders); // Debug log
        
        // Check if folder already exists
        if (folders[fullPath]) {
            console.log('Folder already exists at path:', fullPath); // Debug log
            throw new Error('Folder already exists');
        }
    
        // Create new folder
        folders[fullPath] = {
            name,
            path: parentPath,
            type: 'user',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
    
        console.log('Created new folder:', folders[fullPath]); // Debug log
    
        // Save to localStorage
        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        
        return folders[fullPath];
    }
    
    // Add a method to reset the file system (useful for debugging)
    resetFileSystem() {
        localStorage.removeItem(this.SYSTEM_KEY);
        localStorage.removeItem(this.FOLDERS_KEY);
        localStorage.removeItem(this.FILES_KEY);
        this.initializeFileSystem();
    }


    deleteFolder(path, isUserDelete = false) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if folder exists
        if (!folders[path]) {
            throw new Error('Folder not found');
        }
    
        const folder = folders[path];
        
        // Protection checks
        if (folder.isProtected) {
            if (folder.type === 'system') {
                throw new Error('System folders cannot be deleted');
            }
            
            if (folder.type === 'user-root' && !isUserDelete) {
                throw new Error('User folder can only be deleted when removing the account');
            }
        }
    
        // Delete all subfolders and files
        Object.keys(folders).forEach(folderPath => {
            if (folderPath === path || folderPath.startsWith(path + '/')) {
                // Check if any system folders would be affected
                if (folders[folderPath].type === 'system') {
                    throw new Error('Cannot delete folder containing system folders');
                }
                delete folders[folderPath];
            }
        });
    
        Object.keys(files).forEach(filePath => {
            if (filePath.startsWith(path + '/')) {
                // Check if any protected files would be affected
                if (files[filePath].isProtected) {
                    throw new Error('Cannot delete folder containing protected files');
                }
                delete files[filePath];
            }
        });
    
        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
    }

    renameFolder(path, newName) {
        console.log('Attempting to rename folder:', { path, newName });
        
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if folder exists
        if (!folders[path]) {
            console.error('Folder not found at path:', path);
            throw new Error('Folder not found');
        }
    
        // Protection checks
        const folder = folders[path];
        if (folder.isProtected) {
            if (folder.type === 'system') {
                throw new Error('System folders cannot be renamed');
            }
            if (folder.type === 'user-root') {
                throw new Error('User root folders cannot be renamed');
            }
        }
    
        const parentPath = this.getParentPath(path);
        const newPath = this.joinPaths(parentPath, newName);
        
        // Check if new name already exists
        if (this.folderExists(newPath)) {
            throw new Error('A folder with that name already exists');
        }
    
        // Store all paths that need to be updated
        const pathUpdates = new Map();
        pathUpdates.set(path, newPath);
        
        // Find all subfolders and files that need to be updated
        Object.keys(folders).forEach(folderPath => {
            if (folderPath.startsWith(path + '/')) {
                const relativePath = folderPath.slice(path.length);
                pathUpdates.set(folderPath, newPath + relativePath);
            }
        });
        
        Object.keys(files).forEach(filePath => {
            if (filePath.startsWith(path + '/')) {
                const relativePath = filePath.slice(path.length);
                pathUpdates.set(filePath, newPath + relativePath);
            }
        });
        
        // Perform all updates
        pathUpdates.forEach((newPath, oldPath) => {
            if (folders[oldPath]) {
                folders[newPath] = {
                    ...folders[oldPath],
                    name: oldPath === path ? newName : folders[oldPath].name,
                    path: this.getParentPath(newPath),
                    modified: new Date().toISOString()
                };
                delete folders[oldPath];
            } else if (files[oldPath]) {
                files[newPath] = {
                    ...files[oldPath],
                    path: this.getParentPath(newPath),
                    modified: new Date().toISOString()
                };
                delete files[oldPath];
            }
        });
    
        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        
        return newPath;
    }

    async toggleHiddenFiles(password) {
        // Verify the user is an administrator and password is correct
        const userManager = new UserManager(this);
        const currentUser = userManager.getCurrentUser();
        
        if (currentUser.type !== 'administrator') {
            throw new Error('Only administrators can toggle hidden files');
        }
    
        if (!userManager.validateLogin(currentUser.username, password)) {
            throw new Error('Invalid administrator password');
        }
    
        this.showHiddenFiles = !this.showHiddenFiles;
        return this.showHiddenFiles;
    }
    
    isHidden(path) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if it's a folder
        if (folders[path]) {
            return folders[path].isHidden;
        }
        
        // Check if it's a file
        if (files[path]) {
            return files[path].isHidden;
        }
        
        return false;
    }

    getFolderContents(path) {
        console.log('Getting contents for path:', path);
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const normalizedPath = this.normalizePath(path);
        
        console.log('Current username:', this.currentUsername);
        console.log('Normalized path:', normalizedPath);
        
        const contents = {
            folders: [],
            files: []
        };
    
        // Special handling for Users directory
        if (normalizedPath === '/ElxaOS/Users') {
            // If we're in the Users directory, only show current user's folder
            Object.entries(folders).forEach(([folderPath, folder]) => {
                if (folder.path === normalizedPath) {
                    // Only add the folder if it matches the current username and visibility rules
                    if (folder.name === this.currentUsername && 
                        (this.showHiddenFiles || !folder.isHidden)) {
                        console.log('Found matching user folder:', folder.name);
                        contents.folders.push({
                            ...folder,
                            fullPath: folderPath
                        });
                    }
                }
            });
        } else if (normalizedPath.startsWith('/ElxaOS/Users/')) {
            // For paths within the Users directory
            const pathParts = normalizedPath.split('/');
            const userFolderIndex = pathParts.indexOf('Users') + 1;
            const userFolder = pathParts[userFolderIndex];
            
            // Only show contents if we're in the current user's folder
            if (userFolder === this.currentUsername) {
                Object.entries(folders).forEach(([folderPath, folder]) => {
                    if (folder.path === normalizedPath && 
                        (this.showHiddenFiles || !folder.isHidden)) {
                        console.log('Adding folder in user directory:', folder.name);
                        contents.folders.push({
                            ...folder,
                            fullPath: folderPath
                        });
                    }
                });
    
                Object.entries(files).forEach(([filePath, file]) => {
                    if (file.path === normalizedPath && 
                        (this.showHiddenFiles || !file.isHidden)) {
                        console.log('Adding file in user directory:', file.name);
                        contents.files.push({
                            ...file,
                            fullPath: filePath
                        });
                    }
                });
            }
        } else {
            // For all other paths (system folders, etc.), show everything subject to hidden rules
            Object.entries(folders).forEach(([folderPath, folder]) => {
                if (folder.path === normalizedPath && 
                    (this.showHiddenFiles || !folder.isHidden)) {
                    console.log('Adding folder:', folder.name, 'from path:', folder.path);
                    contents.folders.push({
                        ...folder,
                        fullPath: folderPath
                    });
                }
            });
    
            Object.entries(files).forEach(([filePath, file]) => {
                if (file.path === normalizedPath && 
                    (this.showHiddenFiles || !file.isHidden)) {
                    console.log('Adding file:', file.name, 'from path:', file.path);
                    contents.files.push({
                        ...file,
                        fullPath: filePath
                    });
                }
            });
        }
    
        // Sort folders and files alphabetically
        contents.folders.sort((a, b) => a.name.localeCompare(b.name));
        contents.files.sort((a, b) => a.name.localeCompare(b.name));
    
        console.log('Returning contents:', contents);
        return contents;
    }

    getFolderInfo(path) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const normalizedPath = this.normalizePath(path);
        return folders[normalizedPath];
    }

    // File operations

    async saveFile(path, name, content, type = 'text', additionalProps = {}) {
        console.log('=== SaveFile Debug ===');
        console.log('Input parameters:', { path, name, type });
        
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY) || '{}');
        
        // Always use localStorage for these types of files
        const useLocalStorage = 
            type === 'shortcut' ||
            type === 'settings' ||
            type === 'program' ||
            name === 'user.config' ||
            path.includes('/.settings/') ||
            path.includes('/System/');
            
        if (useLocalStorage) {
            console.log('Using localStorage for system/config file');
            const finalName = type === 'shortcut' ? (name.endsWith('.lnk') ? name : `${name}.lnk`) : name;
            const fullPath = this.joinPaths(path, finalName);
            
            files[fullPath] = {
                name: finalName,
                content,
                type,
                path,
                created: files[fullPath]?.created || new Date().toISOString(),
                modified: new Date().toISOString(),
                ...additionalProps
            };
            
            localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
            return fullPath;
        }
        
        // Handle regular files
        const cleanName = name.replace(/\.(png|txt|jpg|jpeg|odp|lnk)$/g, '');
        let finalType = type;
        let finalName;
        
        // Determine file type and name
        if (type === 'image' || content?.startsWith?.('data:image')) {
            finalType = 'image';
            finalName = `${cleanName}.png`;
        } else if (type === 'slideshow') {
            finalType = 'slideshow';
            finalName = `${cleanName}.odp`;
        } else {
            finalType = 'text';
            finalName = `${cleanName}.txt`;
        }
        
        const fullPath = this.joinPaths(path, finalName);
    
        // Try external storage for large files or images
        const useExternalStorage = this.storageManager?.initialized && (
            (typeof content === 'string' && content.length > 50000) ||
            finalType === 'image'
        );
    
        if (useExternalStorage) {
            try {
                const success = await this.storageManager.saveFile(fullPath, content);
                if (success) {
                    // Store only metadata in localStorage
                    files[fullPath] = {
                        name: finalName,
                        type: finalType,
                        path,
                        externallyStored: true,
                        created: files[fullPath]?.created || new Date().toISOString(),
                        modified: new Date().toISOString(),
                        ...additionalProps
                    };
                    
                    localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
                    return fullPath;
                }
            } catch (error) {
                console.warn('External storage save failed:', error);
                // Continue to localStorage fallback
            }
        }
        
        // Fallback to localStorage
        files[fullPath] = {
            name: finalName,
            content,
            type: finalType,
            path,
            created: files[fullPath]?.created || new Date().toISOString(),
            modified: new Date().toISOString(),
            ...additionalProps
        };
    
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return fullPath;
    }
    
    async getFile(path) {
        console.log('Getting file at path:', path);
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY) || '{}');
        const fileMetadata = files[path];
        
        if (!fileMetadata) {
            console.log('File not found:', path);
            return null;
        }
    
        // Always use localStorage for system/config files
        if (
            fileMetadata.type === 'shortcut' || 
            fileMetadata.type === 'settings' ||
            fileMetadata.type === 'program' ||
            path.includes('user.config') ||
            path.includes('/.settings/') ||
            path.includes('/System/') ||
            !fileMetadata.externallyStored
        ) {
            console.log('Using localStorage for file:', path);
            return fileMetadata;
        }
    
        // Try to load externally stored content
        if (this.storageManager?.initialized && fileMetadata.externallyStored) {
            try {
                console.log('Attempting to load from external storage:', path);
                const content = await this.storageManager.loadFile(path);
                if (content !== null) {
                    return {
                        ...fileMetadata,
                        content
                    };
                }
                console.log('External load failed, falling back to localStorage');
            } catch (error) {
                console.error('Failed to load external file:', error);
                // Fall back to localStorage if available
                if (fileMetadata.content) {
                    console.log('Using cached content from localStorage');
                    return fileMetadata;
                }
            }
        }
    
        // If we reach here and still have metadata, return it
        if (fileMetadata.content) {
            console.log('Returning localStorage content');
            return fileMetadata;
        }
    
        console.log('No content found for file');
        return fileMetadata; // Return metadata only if no content is available
    }

    deleteFile(path) {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if file exists
        if (!files[path]) {
            throw new Error('File not found');
        }
    
        // Protection check
        if (files[path].isProtected) {
            throw new Error('Protected files cannot be deleted');
        }
    
        delete files[path];
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
    }

    renameFile(path, newName, targetParentPath = null) {  // Add targetParentPath parameter
        console.log('=== Storage renameFile Debug ===');
        console.log('Parameters:', { path, newName, targetParentPath });
        
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if file exists
        if (!files[path]) {
            console.error('File not found at path:', path);
            throw new Error('File not found');
        }
    
        // Protection check
        if (files[path].isProtected) {
            throw new Error('Protected files cannot be renamed');
        }
    
        // If targetParentPath is provided, use it; otherwise use current parent path
        const parentPath = targetParentPath || this.getParentPath(path);
        const newPath = this.joinPaths(parentPath, newName);
        console.log('New path will be:', newPath);
        
        // Check if new path already exists (not just the name)
        if (files[newPath]) {
            throw new Error('A file with that name already exists');
        }
    
        // Create new file entry with updated path
        files[newPath] = {
            ...files[path],
            name: newName,
            path: parentPath,
            modified: new Date().toISOString()
        };
        
        // Delete old entry
        delete files[path];
    
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return newPath;
    }

    moveFile(sourcePath, targetFolderPath) {
        console.log('=== Moving File ===', { sourcePath, targetFolderPath });
        
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if source file exists
        if (!files[sourcePath]) {
            throw new Error('Source file not found');
        }
    
        const file = files[sourcePath];
        
        // Protection check
        if (file.isProtected) {
            throw new Error('Protected files cannot be moved');
        }
    
        // Create the new path
        const targetPath = this.joinPaths(targetFolderPath, file.name);
        console.log('Target path will be:', targetPath);
        
        // Don't do anything if source and target are the same
        if (sourcePath === targetPath) {
            return sourcePath;
        }
        
        // Check if target already exists
        if (files[targetPath]) {
            throw new Error('A file with that name already exists in the destination');
        }
    
        // Create new entry at target path
        files[targetPath] = {
            ...file,
            path: targetFolderPath,
            modified: new Date().toISOString()
        };
        
        // Remove the old entry
        delete files[sourcePath];
    
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return targetPath;
    }
    
    moveFolder(sourcePath, targetFolderPath) {
        console.log('=== Moving Folder ===', { sourcePath, targetFolderPath });
        
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if source folder exists
        if (!folders[sourcePath]) {
            throw new Error('Source folder not found');
        }
    
        const folder = folders[sourcePath];
        
        // Protection checks
        if (folder.type === 'system') {
            throw new Error('System folders cannot be moved');
        }
        
        // Create the new path
        const targetPath = this.joinPaths(targetFolderPath, folder.name);
        console.log('Target path will be:', targetPath);
        
        // Don't do anything if source and target are the same
        if (sourcePath === targetPath) {
            return sourcePath;
        }
        
        // Check if moving into own subdirectory
        if (targetFolderPath.startsWith(sourcePath + '/')) {
            throw new Error('Cannot move a folder into itself or its subdirectories');
        }
        
        // Check if target already exists
        if (folders[targetPath]) {
            throw new Error('A folder with that name already exists in the destination');
        }
    
        // Store all paths that need to be updated
        const pathUpdates = new Map();
        
        // Find all subfolders and files that need to be moved
        Object.entries(folders).forEach(([path, info]) => {
            if (path === sourcePath || path.startsWith(sourcePath + '/')) {
                const relativePath = path.slice(sourcePath.length);
                const newPath = targetPath + relativePath;
                pathUpdates.set(path, { newPath, type: 'folder' });
            }
        });
        
        Object.entries(files).forEach(([path, info]) => {
            if (path.startsWith(sourcePath + '/')) {
                const relativePath = path.slice(sourcePath.length);
                const newPath = targetPath + relativePath;
                pathUpdates.set(path, { newPath, type: 'file' });
            }
        });
        
        // Perform all updates
        pathUpdates.forEach((update, oldPath) => {
            if (update.type === 'folder') {
                folders[update.newPath] = {
                    ...folders[oldPath],
                    path: this.getParentPath(update.newPath),
                    modified: new Date().toISOString()
                };
                delete folders[oldPath];
            } else {
                files[update.newPath] = {
                    ...files[oldPath],
                    path: this.getParentPath(update.newPath),
                    modified: new Date().toISOString()
                };
                delete files[oldPath];
            }
        });
    
        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return targetPath;
    }

    copyFolder(sourcePath, targetPath) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const sourceFolder = folders[sourcePath];
        
        if (!sourceFolder) {
            throw new Error('Source folder not found');
        }
    
        // Protection checks for system folders
        if (sourceFolder.type === 'system') {
            throw new Error('System folders cannot be copied');
        }
    
        // Check if target path is under a protected folder
        const targetFolderPath = this.getParentPath(targetPath);
        const targetFolder = folders[targetFolderPath];
        if (targetFolder && targetFolder.isProtected && targetFolder.type === 'system') {
            throw new Error('Cannot copy folders into system directories');
        }
    
        // Generate new folder name if needed
        let newName = sourceFolder.name;
        let counter = 1;
        let finalTargetPath = this.joinPaths(targetPath, newName);
        
        while (this.folderExists(finalTargetPath)) {
            newName = `${sourceFolder.name} (${counter})`;
            finalTargetPath = this.joinPaths(targetPath, newName);
            counter++;
        }
    
        // Copy the folder itself, but never copy as system type
        folders[finalTargetPath] = {
            name: newName,
            path: targetPath,
            type: sourceFolder.type === 'system' ? 'user' : sourceFolder.type,
            isProtected: false, // Copies are never protected
            isHidden: sourceFolder.isHidden,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
    
        // Copy all subfolders and files
        Object.entries(folders).forEach(([path, folder]) => {
            if (path.startsWith(sourcePath + '/')) {
                const relativePath = path.slice(sourcePath.length);
                const newPath = finalTargetPath + relativePath;
                folders[newPath] = {
                    ...folder,
                    path: this.getParentPath(newPath),
                    type: folder.type === 'system' ? 'user' : folder.type,
                    isProtected: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
            }
        });
    
        Object.entries(files).forEach(([path, file]) => {
            if (path.startsWith(sourcePath + '/')) {
                const relativePath = path.slice(sourcePath.length);
                const newPath = finalTargetPath + relativePath;
                files[newPath] = {
                    ...file,
                    path: this.getParentPath(newPath),
                    isProtected: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
            }
        });
    
        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return finalTargetPath;
    }
    
    // Update copyFile method
    copyFile(sourcePath, targetPath) {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const sourceFile = files[sourcePath];
        
        if (!sourceFile) {
            throw new Error('Source file not found');
        }
    
        // Check if target path is under a protected folder
        const targetFolderPath = this.getParentPath(targetPath);
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const targetFolder = folders[targetFolderPath];
        if (targetFolder && targetFolder.isProtected && targetFolder.type === 'system') {
            throw new Error('Cannot copy files into system directories');
        }
    
        // Generate new file name if needed
        let newName = sourceFile.name;
        let counter = 1;
        let finalTargetPath = this.joinPaths(targetPath, newName);
        
        while (this.fileExists(finalTargetPath)) {
            const nameWithoutExt = newName.replace(/\.[^/.]+$/, "");
            const extension = newName.match(/\.[^/.]+$/)?.[0] || "";
            newName = `${nameWithoutExt} (${counter})${extension}`;
            finalTargetPath = this.joinPaths(targetPath, newName);
            counter++;
        }
    
        // Create the copy, but never as protected
        files[finalTargetPath] = {
            ...sourceFile,
            name: newName,
            path: targetPath,
            isProtected: false,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
    
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return finalTargetPath;
    }

    // Utility methods
    folderExists(path) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        return !!folders[path];
    }

    fileExists(path) {
        console.log('Checking if file exists:', path);
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const exists = !!files[path];
        console.log('File exists?', exists);
        return exists;
    }

    getFullPath(parentPath, name) {
        return this.joinPaths(parentPath, name);
    }

    // Legacy support methods (for backward compatibility)
    getDocuments() {
        return this.getFolderContents(`/ElxaOS/Users/${this.currentUsername}/Documents`).files;
    }
    
    getPaintFiles() {
        return this.getFolderContents(`/ElxaOS/Users/${this.currentUsername}/Pictures`).files;
    }
    
    getDocument(name) {
        return this.getFile(this.joinPaths(`/ElxaOS/Users/${this.currentUsername}/Documents`, name));
    }
    
    getPaintFile(name) {
        return this.getFile(this.joinPaths(`/ElxaOS/Users/${this.currentUsername}/Pictures`, name));
    }
    
    saveDocument(name, content) {
        return this.saveFile(`/ElxaOS/Users/${this.currentUsername}/Documents`, name, content, 'text');
    }
    
    savePaintFile(name, content) {
        return this.saveFile(`/ElxaOS/Users/${this.currentUsername}/Pictures`, name, content, 'paint');
    }
    
    deleteDocument(name) {
        return this.deleteFile(this.joinPaths(`/ElxaOS/Users/${this.currentUsername}/Documents`, name));
    }
    
    deletePaintFile(name) {
        return this.deleteFile(this.joinPaths(`/ElxaOS/Users/${this.currentUsername}/Pictures`, name));
    }

    // Add this inside the FileSystem class, alongside other methods like createFolder, deleteFolder, etc.
    testCreateUser(username) {
        console.log('Testing user folder creation for:', username);
        
        // Create main user folder first
        const userRootPath = `/ElxaOS/Users/${username}`;
        try {
            this.createFolder('/ElxaOS/Users', username);
            
            // Create standard user folders inside the user's directory
            const userFolders = [
                'Desktop',
                'Documents',
                'Pictures',
                'Music',
                'Downloads',
                'Games',
                'Programs',
                // Add hidden messenger folders
                {name: '.messenger', hidden: true},
                {name: 'chats', parent: '.messenger', hidden: true},
                // Add .settings folder
                {name: '.settings', hidden: true}
            ];
    
            // Create folders
            userFolders.forEach(folder => {
                if (typeof folder === 'string') {
                    this.createFolder(userRootPath, folder);
                } else {
                    const parentPath = folder.parent ? 
                        `${userRootPath}/${folder.parent}` : userRootPath;
                    
                    if (folder.parent && !this.folderExists(`${userRootPath}/${folder.parent}`)) {
                        this.createFolder(userRootPath, folder.parent);
                    }
                    
                    this.createFolder(parentPath, folder.name);
                }
            });
    
            // Create default settings file
            const defaultSettings = {
                display: {
                    background: 'default-0',
                    fileExplorerView: 'icons',
                    desktopIcons: {}
                },
                personalization: {
                    systemFont: '"Verdana", sans-serif'
                },
                systemTray: {
                    clock: {
                        format24Hour: false,
                        showSeconds: true,
                        showDate: true,
                        dateFormat: 'MM/DD/YYYY'
                    }
                }
            };
    
            // Save default settings
            this.saveFile(
                `${userRootPath}/.settings`,
                'user.config',
                JSON.stringify(defaultSettings, null, 2),
                'settings'
            );
    
            return true;
        } catch (error) {
            console.error('Error creating user folders and settings:', error);
            return false;
        }
    }
}

export const fileSystem = new FileSystem();

// For testing purposes
window._resetFileSystem = function() {
    console.log('Resetting file system...');
    localStorage.removeItem('elxaos_system');
    localStorage.removeItem('elxaos_folders');
    localStorage.removeItem('elxaos_files');
    fileSystem.initializeFileSystem();
    console.log('File system reset complete. Please refresh the page.');
};