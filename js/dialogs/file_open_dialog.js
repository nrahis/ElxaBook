export class FileOpenDialog {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.currentPath = `/ElxaOS/Users/${fileSystem.currentUsername}/Documents`;
        this.dialog = null;
        this.selectedFile = null;
    }

    show() {
        return new Promise((resolve, reject) => {
            // Create dialog container
            this.dialog = document.createElement('div');
            this.dialog.className = 'file-dialog-overlay';
            
            // Create dialog content with the same structure as original
            this.dialog.innerHTML = `
                <div class="file-dialog">
                    <div class="file-dialog-header">Open File</div>
                    <div class="file-dialog-body">
                        <div class="file-dialog-nav">
                            <button class="nav-button" data-action="up">↑ Up</button>
                            <div class="current-path"></div>
                        </div>
                        <div class="file-dialog-content">
                            <div class="file-list"></div>
                        </div>
                    </div>
                    <div class="file-dialog-footer">
                        <button class="open-button" disabled>Open</button>
                        <button class="cancel-button">Cancel</button>
                    </div>
                </div>
            `;

            // Add event listeners
            this.dialog.querySelector('.nav-button').addEventListener('click', () => this.navigateUp());
            this.dialog.querySelector('.open-button').addEventListener('click', () => this.handleOpen(resolve, reject));
            this.dialog.querySelector('.cancel-button').addEventListener('click', () => this.handleCancel(reject));
            
            // Store resolve/reject for double-click handler
            this.currentResolve = resolve;
            this.currentReject = reject;
            
            // Add dialog to document
            document.body.appendChild(this.dialog);
            
            // Initial population
            this.updatePath();
            this.populateFiles();
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
        
        // Add folders first
        contents.folders.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'file-item folder';
            folderElement.innerHTML = `<span class="folder-icon">📁</span> ${folder.name}`;
            folderElement.addEventListener('click', () => this.navigateTo(folder.fullPath));
            fileList.appendChild(folderElement);
        });

        // Then add text files
        contents.files.forEach(file => {
            if (file.type === 'text') {  // Only show text files
                const fileElement = document.createElement('div');
                fileElement.className = 'file-item file';
                fileElement.innerHTML = `<span class="file-icon">📄</span> ${file.name}`;
                
                // Handle file selection
                fileElement.addEventListener('click', (event) => {
                    // Deselect any previously selected file
                    fileList.querySelectorAll('.file-item.selected').forEach(el => 
                        el.classList.remove('selected'));
                    
                    // Select this file
                    fileElement.classList.add('selected');
                    this.selectedFile = file;
                    
                    // Enable open button
                    this.dialog.querySelector('.open-button').disabled = false;
                });

                // Handle double-click to open
                fileElement.addEventListener('dblclick', () => {
                    this.selectedFile = file;
                    this.handleOpen(
                        this.currentResolve, 
                        this.currentReject
                    );
                });

                fileList.appendChild(fileElement);
            }
        });
    }

    navigateTo(path) {
        this.currentPath = path;
        this.updatePath();
        this.populateFiles();
        
        // Clear selection when changing folders
        this.selectedFile = null;
        this.dialog.querySelector('.open-button').disabled = true;
    }

    navigateUp() {
        const parentPath = this.fileSystem.getParentPath(this.currentPath);
        if (parentPath !== this.currentPath) {
            this.navigateTo(parentPath);
        }
    }

    handleOpen(resolve, reject) {
        if (this.selectedFile) {
            this.dialog.remove();
            resolve(this.selectedFile);
        }
    }

    handleCancel(reject) {
        this.dialog.remove();
        reject(new Error('Open cancelled'));
    }
}