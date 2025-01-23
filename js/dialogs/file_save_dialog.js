export class FileSaveDialog {
    constructor(fileSystem, initialContent, defaultFileName = '', options = {}) {
        this.fileSystem = fileSystem;
        this.content = initialContent;
        this.currentPath = `/ElxaOS/Users/${fileSystem.currentUsername}/Documents`;
        this.dialog = null;
        this.defaultFileName = defaultFileName;
        this.type = options.type || 'text'; // Use options object and provide default
    }

    show() {
        return new Promise((resolve, reject) => {
            // Create dialog container
            this.dialog = document.createElement('div');
            this.dialog.className = 'file-dialog-overlay';
            
            // Create dialog content
            this.dialog.innerHTML = `
                <div class="file-dialog">
                    <div class="file-dialog-header">Save As</div>
                    <div class="file-dialog-body">
                        <div class="file-dialog-nav">
                            <button class="nav-button" data-action="up">↑ Up</button>
                            <div class="current-path"></div>
                        </div>
                        <div class="file-dialog-content">
                            <div class="file-list"></div>
                            <div class="save-input">
                                <label>File name:</label>
                                <input type="text" class="filename-input" value="${this.defaultFileName}">
                            </div>
                        </div>
                    </div>
                    <div class="file-dialog-footer">
                        <button class="save-button">Save</button>
                        <button class="cancel-button">Cancel</button>
                    </div>
                </div>
            `;

            // Add event listeners
            this.dialog.querySelector('.nav-button').addEventListener('click', () => this.navigateUp());
            this.dialog.querySelector('.save-button').addEventListener('click', () => this.handleSave(resolve, reject));
            this.dialog.querySelector('.cancel-button').addEventListener('click', () => this.handleCancel(reject));
            
            // Add dialog to document
            document.body.appendChild(this.dialog);
            
            // Initial population
            this.updatePath();
            this.populateFiles();
            
            // Focus filename input
            this.dialog.querySelector('.filename-input').focus();
            
            // Add enter key handler for the filename input
            this.dialog.querySelector('.filename-input').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSave(resolve, reject);
                }
            });
        });
    }

    updatePath() {
        const pathElement = this.dialog.querySelector('.current-path');
        pathElement.textContent = this.currentPath;
        
        // Update "Up" button state
        const upButton = this.dialog.querySelector('.nav-button');
        upButton.disabled = this.currentPath === '/ElxaOS';
    }

    populateFiles() {
        const fileList = this.dialog.querySelector('.file-list');
        fileList.innerHTML = '';
        
        const contents = this.fileSystem.getFolderContents(this.currentPath);
        
        // Show folders
        contents.folders.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'file-item folder';
            folderElement.innerHTML = `<span class="folder-icon">📁</span> ${folder.name}`;
            folderElement.addEventListener('click', () => this.navigateTo(folder.fullPath));
            fileList.appendChild(folderElement);
        });

        // Show text files
        contents.files.forEach(file => {
            if (file.type === 'text') {
                const fileElement = document.createElement('div');
                fileElement.className = 'file-item file';
                fileElement.innerHTML = `<span class="file-icon">📄</span> ${file.name}`;
                
                // Handle file selection
                fileElement.addEventListener('click', () => {
                    // Update filename input when a file is selected
                    this.dialog.querySelector('.filename-input').value = file.name;
                });

                fileList.appendChild(fileElement);
            }
        });
    }

    navigateTo(path) {
        this.currentPath = path;
        this.updatePath();
        this.populateFiles();
    }

    navigateUp() {
        const parentPath = this.fileSystem.getParentPath(this.currentPath);
        if (parentPath !== this.currentPath) {
            this.navigateTo(parentPath);
        }
    }

    handleSave(resolve, reject) {
        const filename = this.dialog.querySelector('.filename-input').value.trim();
        
        if (!filename) {
            alert('Please enter a file name');
            return;
        }

        try {
            const savedPath = this.fileSystem.saveFile(
                this.currentPath,
                filename,  // Pass the raw filename
                this.content,
                this.type  // Use the stored type
            );
            
            this.dialog.remove();
            resolve({ path: savedPath, filename: filename });
        } catch (error) {
            alert(`Error saving file: ${error.message}`);
            reject(error);
        }
    }

    handleCancel(reject) {
        this.dialog.remove();
        reject(new Error('Save cancelled'));
    }
}