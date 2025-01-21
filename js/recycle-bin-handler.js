export class RecycleBinHandler {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.RECYCLE_BIN_PATH = '/ElxaOS/Recycle Bin';
    }

    moveToRecycleBin(sourcePath) {
        const fileName = sourcePath.split('/').pop();
        const isFolder = this.fileSystem.folderExists(sourcePath);
        
        // Generate unique name to avoid conflicts
        let uniqueName = fileName;
        let counter = 1;
        while (this.fileSystem.fileExists(`${this.RECYCLE_BIN_PATH}/${uniqueName}`) ||
               this.fileSystem.folderExists(`${this.RECYCLE_BIN_PATH}/${uniqueName}`)) {
            const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
            const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
            uniqueName = `${baseName} (${counter})${ext}`;
            counter++;
        }

        try {
            if (isFolder) {
                // Check if it's a system folder
                const folderInfo = this.fileSystem.getFolderInfo(sourcePath);
                if (folderInfo?.type === 'system') {
                    throw new Error("Cannot move system folders to Recycle Bin");
                }
                
                // Move folder to Recycle Bin
                const newPath = this.fileSystem.moveFolder(sourcePath, this.RECYCLE_BIN_PATH);
                
                // Add metadata as a property of the folder
                const folders = JSON.parse(localStorage.getItem('elxaos_folders'));
                if (folders[newPath]) {
                    folders[newPath].recycleBinMetadata = {
                        originalPath: sourcePath,
                        deletionDate: new Date().toISOString()
                    };
                    localStorage.setItem('elxaos_folders', JSON.stringify(folders));
                }
            } else {
                // Get original file
                const file = this.fileSystem.getFile(sourcePath);
                if (!file) throw new Error("File not found");
                
                // Save file to Recycle Bin with metadata included in the file object
                const recyclePath = `${this.RECYCLE_BIN_PATH}/${uniqueName}`;
                const files = JSON.parse(localStorage.getItem('elxaos_files'));
                
                files[recyclePath] = {
                    name: uniqueName,
                    content: file.content,
                    type: file.type,
                    path: this.RECYCLE_BIN_PATH,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    recycleBinMetadata: {
                        originalPath: sourcePath,
                        deletionDate: new Date().toISOString()
                    },
                    isInRecycleBin: true
                };
                
                localStorage.setItem('elxaos_files', JSON.stringify(files));
                
                // Delete original file
                this.fileSystem.deleteFile(sourcePath);
            }

            return true;
        } catch (error) {
            console.error('Failed to move to Recycle Bin:', error);
            throw error;
        }
    }

    restoreItem(itemName) {
        try {
            const sourcePath = `${this.RECYCLE_BIN_PATH}/${itemName}`;
            const files = JSON.parse(localStorage.getItem('elxaos_files'));
            const folders = JSON.parse(localStorage.getItem('elxaos_folders'));
            
            if (folders[sourcePath]) {
                // Handle folder restoration
                const folder = folders[sourcePath];
                if (!folder.recycleBinMetadata) {
                    throw new Error("Metadata not found for folder");
                }
                
                const originalPath = folder.recycleBinMetadata.originalPath;
                const targetDir = originalPath.substring(0, originalPath.lastIndexOf('/'));
                
                if (!this.fileSystem.folderExists(targetDir)) {
                    throw new Error("Original location no longer exists");
                }
                
                // Move folder back
                const { recycleBinMetadata, ...cleanFolder } = folder;
                const originalName = originalPath.split('/').pop();
                
                // Remove from recycle bin
                delete folders[sourcePath];
                
                // Add back to original location
                folders[originalPath] = {
                    ...cleanFolder,
                    name: originalName,
                    path: targetDir,
                    modified: new Date().toISOString()
                };
                
                localStorage.setItem('elxaos_folders', JSON.stringify(folders));
                
            } else if (files[sourcePath]) {
                // Handle file restoration
                const file = files[sourcePath];
                if (!file.recycleBinMetadata) {
                    throw new Error("Metadata not found for file");
                }
                
                const originalPath = file.recycleBinMetadata.originalPath;
                const targetDir = originalPath.substring(0, originalPath.lastIndexOf('/'));
                const originalName = originalPath.split('/').pop();
                
                if (!this.fileSystem.folderExists(targetDir)) {
                    throw new Error("Original location no longer exists");
                }
                
                // Remove RecycleBin-specific properties
                const { recycleBinMetadata, isInRecycleBin, ...cleanFile } = file;
                
                // Save file back to original location
                files[originalPath] = {
                    ...cleanFile,
                    name: originalName,
                    path: targetDir,
                    modified: new Date().toISOString()
                };
                
                // Remove from RecycleBin
                delete files[sourcePath];
                
                localStorage.setItem('elxaos_files', JSON.stringify(files));
            } else {
                throw new Error("Item not found in Recycle Bin");
            }
            
            return true;
        } catch (error) {
            console.error('Failed to restore item:', error);
            throw error;
        }
    }

    emptyRecycleBin() {
        try {
            const files = JSON.parse(localStorage.getItem('elxaos_files'));
            const folders = JSON.parse(localStorage.getItem('elxaos_folders'));
            
            // Remove all files in Recycle Bin
            Object.keys(files).forEach(path => {
                if (path.startsWith(this.RECYCLE_BIN_PATH)) {
                    delete files[path];
                }
            });
            
            // Remove all folders in Recycle Bin
            Object.keys(folders).forEach(path => {
                if (path.startsWith(this.RECYCLE_BIN_PATH)) {
                    delete folders[path];
                }
            });
            
            localStorage.setItem('elxaos_files', JSON.stringify(files));
            localStorage.setItem('elxaos_folders', JSON.stringify(folders));
            
            return true;
        } catch (error) {
            console.error('Failed to empty Recycle Bin:', error);
            throw error;
        }
    }

    isInRecycleBin(path) {
        return path.startsWith(this.RECYCLE_BIN_PATH);
    }
}