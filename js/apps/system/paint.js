import { fileSystem } from '../../storage.js';

export class Paint {
    constructor() {
        this.currentFile = {
            name: 'Untitled',
            path: '/Pictures'  // Update default path
        };
        this.isDrawing = false;
        this.isEraser = false;
        this.lastX = 0;
        this.lastY = 0;
    }

    initialize(contentArea) {
        this.contentArea = contentArea; // Store reference to contentArea
        this.renderUI(contentArea);
        this.setupCanvas();
        this.setupEventListeners();
    }

    renderUI(contentArea) {
        contentArea.innerHTML = `
            <div class="paint-container">
                <div class="paint-menu">
                    <div class="menu-item">
                        File
                        <div class="menu-dropdown">
                            <button id="paint-new">New</button>
                            <button id="paint-open">Open...</button>
                            <button id="paint-save">Save</button>
                            <button id="paint-save-as">Save As...</button>
                        </div>
                    </div>
                    <div class="menu-item">
                        Debug
                        <div class="menu-dropdown">
                            <button id="check-storage">Check Storage</button>
                        </div>
                    </div>
                </div>
                <div class="paint-toolbar">
                    <select id="brush-size">
                        <option value="1">1px</option>
                        <option value="3">3px</option>
                        <option value="5" selected>5px</option>
                        <option value="10">10px</option>
                        <option value="15">15px</option>
                        <option value="20">20px</option>
                    </select>
                    <input type="color" class="color-picker" id="color-picker" value="#000000">
                    <button id="eraser">Eraser</button>
                    <button id="clear-canvas">Clear</button>
                </div>
                <div class="canvas-container">
                    <canvas id="paint-canvas"></canvas>
                </div>
                <div class="paint-status">
                    <span id="current-paint-file">Untitled</span>
                </div>
            </div>
        `;
    }

    setupCanvas() {
        this.canvas = this.contentArea.querySelector('#paint-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set initial canvas size
        this.resizeCanvas();

        // Setup resize observer
        const resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
        });
        resizeObserver.observe(this.canvas.parentElement);
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 2;
        this.canvas.height = container.clientHeight - 2;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupEventListeners() {
        // Drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
        this.canvas.addEventListener('mouseout', () => this.isDrawing = false);

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.startDrawing(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.draw(mouseEvent);
        });

        this.canvas.addEventListener('touchend', () => this.isDrawing = false);

        // Toolbar events
        this.contentArea.querySelector('#eraser').addEventListener('click', () => this.toggleEraser());
        this.contentArea.querySelector('#clear-canvas').addEventListener('click', () => this.clearCanvas());

        // File menu events
        this.contentArea.querySelector('#paint-new').addEventListener('click', () => this.newCanvas());
        this.contentArea.querySelector('#paint-open').addEventListener('click', () => this.openFile());
        this.contentArea.querySelector('#paint-save').addEventListener('click', () => this.saveFile());
        this.contentArea.querySelector('#paint-save-as').addEventListener('click', () => this.saveFileAs());

        //Debug
        this.contentArea.querySelector('#check-storage').addEventListener('click', () => {
            const documents = fileSystem.getDocuments();
            const paintFiles = fileSystem.getPaintFiles();
            console.log('All documents:', documents);
            console.log('All paint files:', paintFiles);
            alert(`Found ${Object.keys(documents).length} documents and ${Object.keys(paintFiles).length} paint files`);
        });

        // Menu handling
        this.setupMenus();
    }

    setupMenus() {
        const menuItems = this.contentArea.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                item.classList.toggle('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item')) {
                menuItems.forEach(item => item.classList.remove('active'));
            }
        });
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.lineWidth = this.contentArea.querySelector('#brush-size').value;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.isEraser) {
            this.ctx.strokeStyle = 'white';
        } else {
            this.ctx.strokeStyle = this.contentArea.querySelector('#color-picker').value;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        [this.lastX, this.lastY] = [x, y];
    }

    toggleEraser() {
        this.isEraser = !this.isEraser;
        const eraserButton = this.contentArea.querySelector('#eraser');
        eraserButton.style.borderStyle = this.isEraser ? 'inset' : 'outset';
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    newCanvas() {
        if (confirm('Do you want to create a new canvas? Any unsaved changes will be lost.')) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.currentFile.name = 'Untitled';
            this.contentArea.querySelector('#current-paint-file').textContent = 'Untitled';
        }
    }

    saveFile() {
        event?.preventDefault();
        
        if (this.currentFile.name === 'Untitled') {
            this.saveFileAs();
            return;
        }
        
        // Ensure the path starts with a forward slash
        const path = this.currentFile.path.startsWith('/') ? 
            this.currentFile.path : 
            '/' + this.currentFile.path;
        
        const imageData = this.canvas.toDataURL('image/png');
        fileSystem.savePaintFile(
            path,
            this.currentFile.name,
            imageData
        );
        
        this.showSaveNotification();
    }
    
    saveFileAs() {
        event?.preventDefault();
        
        const fileName = prompt('Enter file name:', this.currentFile.name);
        if (!fileName) return;
        
        this.currentFile.name = fileName;
        // Ensure the path starts with a forward slash
        this.currentFile.path = '/Pictures';
        
        this.contentArea.querySelector('#current-paint-file').textContent = fileName;
        
        const imageData = this.canvas.toDataURL('image/png');
        fileSystem.savePaintFile(
            this.currentFile.path,
            fileName,
            imageData
        );
        
        this.showSaveNotification();
    }

    showSaveNotification() {
        const status = this.contentArea.querySelector('#current-paint-file');
        const originalText = status.textContent;
        status.textContent = 'Saved!';
        setTimeout(() => {
            status.textContent = originalText;
        }, 1000);
    }

    openFile() {
        // Prevent default file open behavior
        event?.preventDefault();
    
        const paintFiles = fileSystem.getPaintFiles();
        const fileList = Object.values(paintFiles);
        
        if (fileList.length === 0) {
            alert('No saved paintings found.');
            return;
        }
        
        const fileNames = fileList.map(file => file.name).join('\n');
        const selected = prompt(
            'Select a file to open:\n\n' + fileNames + '\n\nEnter file name:',
            fileList[0].name
        );
        
        if (selected) {
            const file = fileList.find(file => file.name === selected);
            if (file) {
                const img = new Image();
                img.onload = () => {
                    // Clear the canvas and maintain aspect ratio
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Calculate dimensions to maintain aspect ratio
                    const hRatio = this.canvas.width / img.width;
                    const vRatio = this.canvas.height / img.height;
                    const ratio = Math.min(hRatio, vRatio);
                    
                    const centerShiftX = (this.canvas.width - img.width * ratio) / 2;
                    const centerShiftY = (this.canvas.height - img.height * ratio) / 2;
                    
                    this.ctx.drawImage(
                        img, 
                        0, 0, img.width, img.height,
                        centerShiftX, centerShiftY, 
                        img.width * ratio, img.height * ratio
                    );
                };
                img.src = file.data;
                
                this.currentFile = {
                    name: file.name,
                    path: file.path || '/Pictures'
                };
                this.contentArea.querySelector('#current-paint-file').textContent = file.name;
            } else {
                alert('File not found.');
            }
        }
    }
}

    // Add error handling for image loading
    function loadImageWithFallback(imageData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageData;
        });
    }

// Create and export default instance
export const paint = new Paint();