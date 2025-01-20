// storage.js - Enhanced file system with hierarchical structure

export class FileSystem {
    constructor() {
        this.SYSTEM_KEY = 'elxaos_system';
        this.FILES_KEY = 'elxaos_files';
        this.FOLDERS_KEY = 'elxaos_folders';
        this.currentUsername = 'kitkat'; // Set initial user
        
        // Initialize the file system if it doesn't exist
        this.initializeFileSystem();
    }

    setCurrentUser(username) {
        console.log('FileSystem: Setting current user to:', username);
        this.currentUsername = username;
    }

    // Initialize the basic file system structure
    initializeFileSystem() {
        if (!localStorage.getItem(this.SYSTEM_KEY)) {
            const defaultSystem = {
                root: {
                    name: 'ElxaOS',
                    path: '/',
                    type: 'system',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            };
    
            const defaultFolders = {
                '/ElxaOS': {
                    name: 'ElxaOS',
                    path: '/',
                    type: 'system',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System': {
                    name: 'System',
                    path: '/ElxaOS',
                    type: 'system',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users': {
                    name: 'Users',
                    path: '/ElxaOS',
                    type: 'system',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat': {
                    name: 'kitkat',
                    path: '/ElxaOS/Users',
                    type: 'user',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Recycle Bin': {
                    name: 'Recycle Bin',
                    path: '/ElxaOS',
                    type: 'system',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Documents': {
                    name: 'Documents',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Pictures': {
                    name: 'Pictures',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Music': {
                    name: 'Music',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Downloads': {
                    name: 'Downloads',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/Users/kitkat/Games': {
                    name: 'Games',
                    path: '/ElxaOS/Users/kitkat',
                    type: 'user',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            };
    
            const defaultFiles = {
                '/ElxaOS/System/Paint.abbi': {
                    name: 'Paint.abbi',
                    type: 'program',
                    program: 'paint',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Notepad.abbi': {
                    name: 'Notepad.abbi',
                    type: 'program',
                    program: 'notepad',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Kittysweeper.abbi': {
                    name: 'Kittysweeper.abbi',
                    type: 'program',
                    program: 'minesweeper',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Solitaire.abbi': {
                    name: 'Solitaire.abbi',
                    type: 'program',
                    program: 'solitaire',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/DUCK.abbi': {
                    name: 'DUCK.abbi',
                    type: 'program',
                    program: 'duck',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Settings.abbi': {
                    name: 'Settings.abbi',
                    type: 'program',
                    program: 'settings',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/About.abbi': {
                    name: 'About.abbi',
                    type: 'program',
                    program: 'about',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Calculator.abbi': {
                    name: 'Calculator.abbi',
                    type: 'program',
                    program: 'scientificCalculator',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Clock.abbi': {
                    name: 'Clock.abbi',
                    type: 'program',
                    program: 'clock',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Calendar.abbi': {
                    name: 'Calendar.abbi',
                    type: 'program',
                    program: 'calendar',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/ElxaOS/System/Slideshow.abbi': {
                    name: 'Slideshow.abbi',
                    type: 'program',
                    program: 'slideshow',
                    path: '/ElxaOS/System',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            };
                
            // Save everything to localStorage in the correct order
            localStorage.setItem(this.SYSTEM_KEY, JSON.stringify(defaultSystem));
            localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(defaultFolders));
            localStorage.setItem(this.FILES_KEY, JSON.stringify(defaultFiles));
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

    deleteFolder(path) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if folder exists and is not a system folder
        if (!folders[path] || folders[path].type === 'system') {
            throw new Error('Cannot delete folder');
        }

        // Delete all subfolders and files
        Object.keys(folders).forEach(folderPath => {
            if (folderPath.startsWith(path)) {
                delete folders[folderPath];
            }
        });

        Object.keys(files).forEach(filePath => {
            if (filePath.startsWith(path)) {
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
            console.log('Available folders:', Object.keys(folders));
            throw new Error('Folder not found');
        }
    
        // Check if it's a system folder
        if (folders[path].type === 'system') {
            throw new Error('System folders cannot be renamed');
        }
    
        const parentPath = this.getParentPath(path);
        const newPath = this.joinPaths(parentPath, newName);
        
        console.log('Rename operation:', {
            oldPath: path,
            newPath: newPath,
            parentPath: parentPath,
            folderExists: this.folderExists(path),
            newPathExists: this.folderExists(newPath)
        });
        
        // Check if new name already exists
        if (this.folderExists(newPath)) {
            throw new Error('A folder with that name already exists');
        }
    
        // Store all paths that need to be updated
        const pathUpdates = new Map();
        
        // Add the folder itself
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
        
        console.log('Folder renamed successfully, new structure:', folders);
        return newPath; // Return the new path
    }


// In storage.js, update the getFolderContents method

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
                if (folder.path === normalizedPath && folder.name === this.currentUsername) {
                    console.log('Found user folder:', folder.name);
                    contents.folders.push({
                        ...folder,
                        fullPath: folderPath
                    });
                }
            });
        } else if (normalizedPath.startsWith('/ElxaOS/Users/')) {
            // For paths within the Users directory, only show contents if it's the current user's folder
            const pathParts = normalizedPath.split('/');
            const userFolderIndex = pathParts.indexOf('Users') + 1;
            const userFolder = pathParts[userFolderIndex];
            
            if (userFolder === this.currentUsername) {
                // Show all contents for the current user's folder
                Object.entries(folders).forEach(([folderPath, folder]) => {
                    if (folder.path === normalizedPath) {
                        console.log('Adding folder in user directory:', folder.name);
                        contents.folders.push({
                            ...folder,
                            fullPath: folderPath
                        });
                    }
                });

                Object.entries(files).forEach(([filePath, file]) => {
                    if (file.path === normalizedPath) {
                        console.log('Adding file in user directory:', file.name);
                        contents.files.push({
                            ...file,
                            fullPath: filePath
                        });
                    }
                });
            }
        } else {
            // For all other paths, show everything as before
            Object.entries(folders).forEach(([folderPath, folder]) => {
                if (folder.path === normalizedPath) {
                    console.log('Adding folder:', folder.name, 'from path:', folder.path);
                    contents.folders.push({
                        ...folder,
                        fullPath: folderPath
                    });
                }
            });

            Object.entries(files).forEach(([filePath, file]) => {
                if (file.path === normalizedPath) {
                    console.log('Adding file:', file.name, 'from path:', file.path);
                    contents.files.push({
                        ...file,
                        fullPath: filePath
                    });
                }
            });
        }

        console.log('Returning contents:', contents);
        return contents;
    }

    getFolderInfo(path) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const normalizedPath = this.normalizePath(path);
        return folders[normalizedPath];
    }

    // File operations
    saveFile(path, name, content, type = 'text') {
        console.log('=== Saving File ===');
        console.log('Parameters:', { path, name, type });
        
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const fullPath = this.joinPaths(path, name);
        
        console.log('Full path:', fullPath);
        console.log('Current files:', files);
    
        files[fullPath] = {
            name,
            content,
            type,
            path,
            created: files[fullPath]?.created || new Date().toISOString(),
            modified: new Date().toISOString()
        };
    
        console.log('New file object:', files[fullPath]);
        console.log('Updated files structure:', files);
    
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return fullPath; // Return the full path instead of just the file object
    }

    getFile(path) {
        console.log('Getting file at path:', path);
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const file = files[path];
        console.log('Found file:', file);
        return file;
    }

    deleteFile(path) {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        delete files[path];
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
    }



    renameFile(path, newName) {
        console.log('=== Renaming File ===');
        console.log('Parameters:', { path, newName });
        
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        console.log('Current files:', files);
        console.log('Looking for file at path:', path);
        
        // Check if file exists
        if (!files[path]) {
            console.error('File not found at path:', path);
            console.log('Available file paths:', Object.keys(files));
            throw new Error('File not found');
        }
    
        const parentPath = this.getParentPath(path);
        const newPath = this.joinPaths(parentPath, newName);
        
        console.log('Path details:', {
            oldPath: path,
            newPath: newPath,
            parentPath: parentPath
        });
        
        // Check if new name already exists
        if (this.fileExists(newPath)) {
            throw new Error('A file with that name already exists');
        }
    
        // Create new file entry
        files[newPath] = {
            ...files[path],
            name: newName,
            path: parentPath,
            modified: new Date().toISOString()
        };
        
        // Delete old entry
        delete files[path];
    
        console.log('Final files structure:', files);
    
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return newPath;
    }

    copyFolder(sourcePath, targetPath) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const sourceFolder = folders[sourcePath];
        
        if (!sourceFolder) {
            throw new Error('Source folder not found');
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
    
        // Copy the folder itself
        folders[finalTargetPath] = {
            name: newName,
            path: targetPath,
            type: sourceFolder.type === 'system' ? 'user' : sourceFolder.type, // Never copy as system
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
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
            }
        });
    
        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return finalTargetPath;
    }
    
    copyFile(sourcePath, targetPath) {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const sourceFile = files[sourcePath];
        
        if (!sourceFile) {
            throw new Error('Source file not found');
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
    
        files[finalTargetPath] = {
            ...sourceFile,
            name: newName,
            path: targetPath,
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
        return this.getFolderContents('/ElxaOS/Users/kitkat/Documents').files;
    }

    getPaintFiles() {
        return this.getFolderContents('/ElxaOS/Users/kitkat/Pictures').files;
    }

    getDocument(name) {
        return this.getFile(this.joinPaths('/ElxaOS/Users/kitkat/Documents', name));
    }

    getPaintFile(name) {
        return this.getFile(this.joinPaths('/ElxaOS/Users/kitkat/Pictures', name));
    }

    saveDocument(name, content) {
        return this.saveFile('/ElxaOS/Users/kitkat/Documents', name, content, 'text');
    }

    savePaintFile(name, content) {
        return this.saveFile('/ElxaOS/Users/kitkat/Pictures', name, content, 'paint');
    }

    deleteDocument(name) {
        return this.deleteFile(this.joinPaths('/ElxaOS/Users/kitkat/Documents', name));
    }

    deletePaintFile(name) {
        return this.deleteFile(this.joinPaths('/ElxaOS/Users/kitkat/Pictures', name));
    }

    // Add this inside the FileSystem class, alongside other methods like createFolder, deleteFolder, etc.
    testCreateUser(username) {
        console.log('Testing user folder creation for:', username);
        
        const userPath = `/ElxaOS/Users/${username}`;
        const userFolders = [
            { path: userPath, name: username },
            { path: `${userPath}/Documents`, name: 'Documents' },
            { path: `${userPath}/Pictures`, name: 'Pictures' },
            { path: `${userPath}/Music`, name: 'Music' },
            { path: `${userPath}/Downloads`, name: 'Downloads' },
            { path: `${userPath}/Games`, name: 'Games' }
        ];

        console.log('Attempting to create folders...');
        
        try {
            userFolders.forEach(folder => {
                const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'));
                console.log('Creating folder:', {
                    parentPath: parentPath,
                    name: folder.name
                });
                this.createFolder(parentPath, folder.name);
            });
            console.log('User folder creation successful!');
            
            // Let's verify the folders were created
            const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
            console.log('Current folder structure:', folders);
            return true;
        } catch (error) {
            console.error('Error creating user folders:', error);
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