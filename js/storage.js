// storage.js - Enhanced file system with hierarchical structure

export class FileSystem {
    constructor() {
        // Storage keys for different data types
        this.SYSTEM_KEY = 'elxaos_system';
        this.FILES_KEY = 'elxaos_files';
        this.FOLDERS_KEY = 'elxaos_folders';
        
        // Initialize the file system if it doesn't exist
        this.initializeFileSystem();
    }

    // Initialize the basic file system structure
// In storage.js, modify the initializeFileSystem method
initializeFileSystem() {
    if (!localStorage.getItem(this.SYSTEM_KEY)) {
        const defaultSystem = {
            root: {
                name: 'ElxaOS',
                path: '/',
                type: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            users: {
                name: 'Users',
                path: '/ElxaOS',
                type: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            kitkat: {
                name: 'kitkat',
                path: '/ElxaOS/Users',
                type: 'user',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            }
        };

        const defaultFolders = {
            documents: {
                name: 'Documents',
                path: '/ElxaOS/Users/kitkat',
                type: 'user',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            pictures: {
                name: 'Pictures',
                path: '/ElxaOS/Users/kitkat',
                type: 'user',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            desktop: {  // This is the Desktop folder in the hierarchy
                name: 'Desktop',
                path: '/ElxaOS/Users/kitkat',
                type: 'user',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            downloads: {
                name: 'Downloads',
                path: '/ElxaOS/Users/kitkat',
                type: 'user',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            music: {
                name: 'Music',
                path: '/ElxaOS/Users/kitkat',
                type: 'user',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            videos: {
                name: 'Videos',
                path: '/ElxaOS/Users/kitkat',
                type: 'user',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            recycle: {
                name: 'Recycle Bin',
                path: '/ElxaOS',  // This stays at root level
                type: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            }
        };

        localStorage.setItem(this.SYSTEM_KEY, JSON.stringify(defaultSystem));
        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(defaultFolders));
        localStorage.setItem(this.FILES_KEY, JSON.stringify({}));
    }
}

    // Path handling methods
    normalizePath(path) {
        // Remove trailing slashes and ensure leading slash
        return '/' + path.replace(/^\/+|\/+$/g, '');
    }

    joinPaths(...parts) {
        return this.normalizePath(parts.join('/'));
    }

    getParentPath(path) {
        const normalized = this.normalizePath(path);
        const parts = normalized.split('/').filter(Boolean);
        return parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
    }

    // Folder operations
    createFolder(parentPath, name) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const fullPath = this.joinPaths(parentPath, name);
        
        // Check if folder already exists
        if (this.folderExists(fullPath)) {
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

        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        return folders[fullPath];
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
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        
        // Check if folder exists and is not a system folder
        if (!folders[path] || folders[path].type === 'system') {
            throw new Error('Cannot rename folder');
        }

        const parentPath = this.getParentPath(path);
        const newPath = this.joinPaths(parentPath, newName);
        
        // Check if new name already exists
        if (this.folderExists(newPath)) {
            throw new Error('A folder with that name already exists');
        }

        // Update folder and all subfolders/files
        const oldPrefix = path;
        const newPrefix = newPath;

        // Create new folder entry
        folders[newPath] = {
            ...folders[path],
            name: newName,
            modified: new Date().toISOString()
        };
        delete folders[path];

        // Update subfolders
        Object.keys(folders).forEach(folderPath => {
            if (folderPath.startsWith(oldPrefix + '/')) {
                const newFolderPath = newPrefix + folderPath.slice(oldPrefix.length);
                folders[newFolderPath] = {
                    ...folders[folderPath],
                    path: this.getParentPath(newFolderPath)
                };
                delete folders[folderPath];
            }
        });

        // Update files
        Object.keys(files).forEach(filePath => {
            if (filePath.startsWith(oldPrefix + '/')) {
                const newFilePath = newPrefix + filePath.slice(oldPrefix.length);
                files[newFilePath] = {
                    ...files[filePath],
                    path: this.getParentPath(newFilePath)
                };
                delete files[filePath];
            }
        });

        localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
    }

getFolderContents(path) {
    const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
    const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
    const contents = {
        folders: [],
        files: []
    };

    // Get subfolders
    Object.entries(folders).forEach(([folderPath, folder]) => {
        if (folder.path === path) {
            contents.folders.push({
                ...folder,
                fullPath: folderPath
            });
        }
    });

    // Get files
    Object.entries(files).forEach(([filePath, file]) => {
        if (file.path === path) {
            contents.files.push({
                ...file,
                fullPath: filePath
            });
        }
    });

    return contents;
}

    // File operations
    saveFile(path, name, content, type = 'text') {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const fullPath = this.joinPaths(path, name);

        files[fullPath] = {
            name,
            content,
            type,
            path,
            created: files[fullPath]?.created || new Date().toISOString(),
            modified: new Date().toISOString()
        };

        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
        return files[fullPath];
    }

    getFile(path) {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        return files[path];
    }

    deleteFile(path) {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        delete files[path];
        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
    }

    renameFile(path, newName) {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        const file = files[path];
        
        if (!file) {
            throw new Error('File not found');
        }

        const parentPath = this.getParentPath(path);
        const newPath = this.joinPaths(parentPath, newName);
        
        if (files[newPath]) {
            throw new Error('A file with that name already exists');
        }

        files[newPath] = {
            ...file,
            name: newName,
            modified: new Date().toISOString()
        };
        delete files[path];

        localStorage.setItem(this.FILES_KEY, JSON.stringify(files));
    }

    // Utility methods
    folderExists(path) {
        const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
        return !!folders[path];
    }

    fileExists(path) {
        const files = JSON.parse(localStorage.getItem(this.FILES_KEY));
        return !!files[path];
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
}

export const fileSystem = new FileSystem();