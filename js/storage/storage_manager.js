export class StorageManager {
    constructor() {
        this.directoryHandle = null;
        this.initialized = false;
    }
    
    async initialize() {
        const supported = await this.isSupported();
        if (supported) {
            this.initialized = await this.hasPermission();
        }
        return this.initialized;
    }

    async isSupported() {
        return 'showDirectoryPicker' in window;
    }

    async hasPermission() {
        if (!this.directoryHandle) return false;
        
        try {
            // Verify we still have permission to the directory
            await this.directoryHandle.requestPermission({ mode: 'readwrite' });
            return true;
        } catch (e) {
            return false;
        }
    }

    async selectDirectory() {
        try {
            // Show directory picker
            this.directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents',
                id: 'ElxaOSStorage'
            });

            // Create our directory structure if it doesn't exist
            await this.initializeDirectoryStructure();
            
            // Save the directory handle permission
            this.initialized = true;
            
            return true;
        } catch (e) {
            console.error('Failed to select directory:', e);
            return false;
        }
    }

    async initializeDirectoryStructure() {
        if (!this.directoryHandle) return;

        try {
            // Create ElxaOS directory structure
            const structure = [
                'Documents',
                'Pictures',
                'Music',
                'Downloads'
            ];

            for (const dir of structure) {
                try {
                    await this.directoryHandle.getDirectoryHandle(dir, { create: true });
                } catch (e) {
                    console.error(`Failed to create ${dir} directory:`, e);
                }
            }
        } catch (e) {
            console.error('Failed to initialize directory structure:', e);
        }
    }

    async saveFile(path, content) {
        if (!this.directoryHandle) return false;

        try {
            // Convert virtual path to actual path components
            const pathParts = path.split('/').filter(p => p !== 'ElxaOS' && p !== 'Users');
            
            // Navigate to the correct subdirectory
            let currentHandle = this.directoryHandle;
            for (let i = 0; i < pathParts.length - 1; i++) {
                currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], { create: true });
            }

            // Get file handle and write content
            const fileName = pathParts[pathParts.length - 1];
            const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            
            // If content is a string, write it directly
            // If it's an object, stringify it
            const dataToWrite = typeof content === 'object' ? 
                JSON.stringify(content) : content;
            
            await writable.write(dataToWrite);
            await writable.close();
            
            return true;
        } catch (e) {
            console.error('Failed to save file:', e);
            return false;
        }
    }

    async loadFile(path) {
        if (!this.directoryHandle) return null;

        try {
            // Convert virtual path to actual path components
            const pathParts = path.split('/').filter(p => p !== 'ElxaOS' && p !== 'Users');
            
            // Navigate to the correct subdirectory
            let currentHandle = this.directoryHandle;
            for (let i = 0; i < pathParts.length - 1; i++) {
                currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
            }

            // Get file handle and read content
            const fileName = pathParts[pathParts.length - 1];
            const fileHandle = await currentHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            
            // Determine how to read the file based on type
            if (file.name.endsWith('.txt')) {
                return await file.text();
            } else if (file.name.endsWith('.json')) {
                const text = await file.text();
                return JSON.parse(text);
            } else {
                // For binary files (like images), return array buffer
                return await file.arrayBuffer();
            }
        } catch (e) {
            console.error('Failed to load file:', e);
            return null;
        }
    }

    async deleteFile(path) {
        if (!this.directoryHandle) return false;

        try {
            const pathParts = path.split('/').filter(p => p !== 'ElxaOS' && p !== 'Users');
            
            let currentHandle = this.directoryHandle;
            for (let i = 0; i < pathParts.length - 1; i++) {
                currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
            }

            const fileName = pathParts[pathParts.length - 1];
            await currentHandle.removeEntry(fileName);
            
            return true;
        } catch (e) {
            console.error('Failed to delete file:', e);
            return false;
        }
    }
}