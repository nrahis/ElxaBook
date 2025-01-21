import { fileSystem } from '../../storage.js';
import { FileOpenDialog } from '../../dialogs/file_open_dialog.js';
import { FileSaveDialog } from '../../dialogs/file_save_dialog.js';

class Paint {
    constructor() {
        this.currentDocument = {
            name: 'Untitled.png',
            content: null,
            path: null
        };
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.defaultPath = `/ElxaOS/Users/${fileSystem.currentUsername}/Pictures`;
        
        // Tool states
        this.currentTool = 'pencil';
        this.brushSize = 5;
        this.currentColor = '#000000';
        this.fillColor = '#ffffff';
        this.modified = false;
        
        // Shape drawing states
        this.shapeStart = null;
        this.tempCanvas = null;
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupCanvas();
        this.setupEventListeners();
        this.loadLastSession();
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="ex-paint-container">
                <div class="ex-paint-menubar">
                    <div class="ex-paint-menu-item" data-menu="file">File</div>
                    <div class="ex-paint-menu-item" data-menu="edit">Edit</div>
                    <div class="ex-paint-menu-item" data-menu="tools">Tools</div>
                    <div class="ex-paint-menu-item" data-menu="colors">Colors</div>
                    <div class="ex-paint-menu-item" data-menu="help">Help</div>
                </div>
                <div class="ex-paint-toolbar">
                    <div class="ex-paint-tools">
                        <button class="ex-paint-tool active" data-tool="pencil" title="Pencil">✏️</button>
                        <button class="ex-paint-tool" data-tool="brush" title="Brush">🖌️</button>
                        <button class="ex-paint-tool" data-tool="eraser" title="Eraser">🧹</button>
                        <button class="ex-paint-tool" data-tool="fill" title="Fill">🪣</button>
                        <button class="ex-paint-tool" data-tool="eyedropper" title="Color Picker">👁️</button>
                        <div class="ex-paint-tool-separator"></div>
                        <button class="ex-paint-tool" data-tool="line" title="Line">📏</button>
                        <button class="ex-paint-tool" data-tool="rectangle" title="Rectangle">⬜</button>
                        <button class="ex-paint-tool" data-tool="circle" title="Circle">⭕</button>
                    </div>
                    <div class="ex-paint-tool-options">
                        <select id="ex-paint-brush-size" title="Brush Size">
                            <option value="1">1px</option>
                            <option value="3">3px</option>
                            <option value="5" selected>5px</option>
                            <option value="10">10px</option>
                            <option value="15">15px</option>
                            <option value="20">20px</option>
                        </select>
                        <div class="ex-paint-colors">
                            <input type="color" id="ex-paint-color" class="ex-paint-color-picker" value="#000000" title="Stroke Color">
                            <input type="color" id="ex-paint-fill-color" class="ex-paint-color-picker" value="#ffffff" title="Fill Color">
                        </div>
                    </div>
                </div>
                <div class="ex-paint-canvas-container">
                    <canvas id="ex-paint-canvas"></canvas>
                    <canvas id="ex-paint-temp-canvas"></canvas>
                </div>
                <div class="ex-paint-status">
                    <span class="ex-paint-status-modified"></span>
                    <span id="ex-paint-coordinates">0, 0 px</span>
                    <span id="ex-paint-current-tool">Pencil</span>
                </div>
            </div>
        `;

        // Store element references
        this.elements = {
            canvas: this.contentArea.querySelector('#ex-paint-canvas'),
            tempCanvas: this.contentArea.querySelector('#ex-paint-temp-canvas'),
            menubar: this.contentArea.querySelector('.ex-paint-menubar'),
            statusModified: this.contentArea.querySelector('.ex-paint-status-modified'),
            coordinates: this.contentArea.querySelector('#ex-paint-coordinates'),
            currentTool: this.contentArea.querySelector('#ex-paint-current-tool')
        };
    }

    setupCanvas() {
        this.ctx = this.elements.canvas.getContext('2d');
        this.tempCtx = this.elements.tempCanvas.getContext('2d');

        // Set initial canvas size
        this.resizeCanvas();

        // Setup resize observer
        const resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
        });
        resizeObserver.observe(this.elements.canvas.parentElement);
    }

    resizeCanvas() {
        const container = this.elements.canvas.parentElement;
        const width = container.clientWidth - 2;
        const height = container.clientHeight - 2;

        // Main canvas
        this.elements.canvas.width = width;
        this.elements.canvas.height = height;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, width, height);

        // Temp canvas (for shape preview)
        this.elements.tempCanvas.width = width;
        this.elements.tempCanvas.height = height;
    }

    setupEventListeners() {
        // Menu handling
        this.setupMenus();
        
        // Tool selection
        const tools = this.contentArea.querySelectorAll('.ex-paint-tool');
        tools.forEach(tool => {
            tool.addEventListener('click', () => {
                tools.forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                this.currentTool = tool.dataset.tool;
                this.elements.currentTool.textContent = tool.title;
            });
        });

        // Color and brush size changes
        this.contentArea.querySelector('#ex-paint-color').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        this.contentArea.querySelector('#ex-paint-fill-color').addEventListener('input', (e) => {
            this.fillColor = e.target.value;
        });

        this.contentArea.querySelector('#ex-paint-brush-size').addEventListener('change', (e) => {
            this.brushSize = parseInt(e.target.value);
        });

        // Canvas events
        this.setupCanvasEvents();

        // Window close handling
        const windowElement = this.contentArea.closest('.program-window');
        if (windowElement) {
            const closeButton = windowElement.querySelector('.window-button[data-action="close"]');
            if (closeButton) {
                closeButton.addEventListener('click', (e) => {
                    if (this.modified) {
                        e.stopPropagation();
                        if (confirm('Do you want to save changes?')) {
                            this.saveDocument().then(() => this.closeWindow());
                        } else {
                            this.closeWindow();
                        }
                    }
                });
            }
        }
    }

    setupCanvasEvents() {
        const canvasContainer = this.elements.canvas.parentElement;

        // Mouse events
        canvasContainer.addEventListener('mousedown', this.startDrawing.bind(this));
        canvasContainer.addEventListener('mousemove', this.draw.bind(this));
        canvasContainer.addEventListener('mouseup', this.stopDrawing.bind(this));
        canvasContainer.addEventListener('mouseleave', this.stopDrawing.bind(this));

        // Touch events
        canvasContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.startDrawing(mouseEvent);
        });

        canvasContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.draw(mouseEvent);
        });

        canvasContainer.addEventListener('touchend', () => this.stopDrawing());

        // Coordinate tracking
        canvasContainer.addEventListener('mousemove', (e) => {
            const rect = this.elements.canvas.getBoundingClientRect();
            const x = Math.round(e.clientX - rect.left);
            const y = Math.round(e.clientY - rect.top);
            this.elements.coordinates.textContent = `${x}, ${y} px`;
        });
    }

    setupMenus() {
        const menus = {
            file: [
                { label: 'New', action: 'new', shortcut: 'Ctrl+N' },
                { label: 'Open...', action: 'open', shortcut: 'Ctrl+O' },
                { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
                { label: 'Save As...', action: 'saveAs' },
                { type: 'separator' },
                { label: 'Exit', action: 'exit' }
            ],
            edit: [
                { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
                { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
                { type: 'separator' },
                { label: 'Clear Canvas', action: 'clear' }
            ],
            tools: [
                { label: 'Pencil', action: 'pencil', shortcut: 'P' },
                { label: 'Brush', action: 'brush', shortcut: 'B' },
                { label: 'Eraser', action: 'eraser', shortcut: 'E' },
                { label: 'Fill', action: 'fill', shortcut: 'F' },
                { label: 'Color Picker', action: 'eyedropper', shortcut: 'I' },
                { type: 'separator' },
                { label: 'Line', action: 'line', shortcut: 'L' },
                { label: 'Rectangle', action: 'rectangle', shortcut: 'R' },
                { label: 'Circle', action: 'circle', shortcut: 'C' }
            ],
            colors: [
                { label: 'Swap Colors', action: 'swapColors', shortcut: 'X' },
                { type: 'separator' },
                { label: 'Reset to Black & White', action: 'resetColors' }
            ],
            help: [
                { label: 'About Paint', action: 'about' }
            ]
        };

        let activeMenu = null;
        const menuItems = this.elements.menubar.querySelectorAll('.ex-paint-menu-item');
        
        menuItems.forEach(menuItem => {
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (activeMenu === menuItem) {
                    this.closeMenus();
                    activeMenu = null;
                    return;
                }
        
                this.closeMenus();
                this.showMenu(menuItem, menus[menuItem.dataset.menu]);
                activeMenu = menuItem;
            });
        });
        
        // Add document click handler to close menus
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.ex-paint-menu-item') && 
                !e.target.closest('.ex-paint-menu-dropdown')) {
                this.closeMenus();
                activeMenu = null;
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.saveDocument();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openDocument();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.newDocument();
                        break;
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                }
            } else {
                switch(e.key.toLowerCase()) {
                    case 'p': this.setTool('pencil'); break;
                    case 'b': this.setTool('brush'); break;
                    case 'e': this.setTool('eraser'); break;
                    case 'f': this.setTool('fill'); break;
                    case 'i': this.setTool('eyedropper'); break;
                    case 'l': this.setTool('line'); break;
                    case 'r': this.setTool('rectangle'); break;
                    case 'c': this.setTool('circle'); break;
                    case 'x': this.swapColors(); break;
                }
            }
        });
    }

    showMenu(menuItem, items) {
        const dropdown = document.createElement('div');
        dropdown.className = 'ex-paint-menu-dropdown';
        
        items.forEach(item => {
            if (item.type === 'separator') {
                dropdown.appendChild(document.createElement('hr'));
                return;
            }

            const menuEntry = document.createElement('div');
            menuEntry.className = 'ex-paint-menu-entry';
            
            menuEntry.innerHTML = `
                <span>${item.label}</span>
                ${item.shortcut ? `<span class="ex-paint-shortcut">${item.shortcut}</span>` : ''}
            `;
            
            menuEntry.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleMenuAction(item.action);
                this.closeMenus();
            });
            
            dropdown.appendChild(menuEntry);
        });

        menuItem.appendChild(dropdown);
        menuItem.classList.add('active');
    }

    closeMenus() {
        this.elements.menubar.querySelectorAll('.ex-paint-menu-item').forEach(item => {
            item.classList.remove('active');
            const dropdown = item.querySelector('.ex-paint-menu-dropdown');
            if (dropdown) dropdown.remove();
        });
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new': this.newDocument(); break;
            case 'open': this.openDocument(); break;
            case 'save': this.saveDocument(); break;
            case 'saveAs': this.saveDocumentAs(); break;
            case 'exit': this.closeWindow(); break;
            case 'undo': this.undo(); break;
            case 'redo': this.redo(); break;
            case 'clear': this.clearCanvas(); break;
            case 'swapColors': this.swapColors(); break;
            case 'resetColors': this.resetColors(); break;
            case 'about': this.showAbout(); break;
            default:
                if (this.tools[action]) {
                    this.setTool(action);
                }
        }
    }

    // Drawing History Management
    pushToHistory() {
        if (!this.history) this.history = [];
        if (!this.historyIndex) this.historyIndex = -1;
        
        // Remove any redo states
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Add current state to history
        this.history.push(this.elements.canvas.toDataURL());
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }

        this.setModified(true);
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadHistoryState();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadHistoryState();
        }
    }

    loadHistoryState() {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = this.history[this.historyIndex];
    }

    // Drawing Tools Implementation
    tools = {
        pencil: {
            draw: (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                this.ctx.lineWidth = this.brushSize;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.strokeStyle = this.currentColor;
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                
                [this.lastX, this.lastY] = [x, y];
            }
        },

        brush: {
            draw: (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                this.ctx.lineWidth = this.brushSize * 2;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.globalAlpha = 0.5;
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                
                this.ctx.globalAlpha = 1.0;
                [this.lastX, this.lastY] = [x, y];
            }
        },

        eraser: {
            draw: (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                this.ctx.lineWidth = this.brushSize * 2;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.strokeStyle = '#ffffff';
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                
                [this.lastX, this.lastY] = [x, y];
            }
        },

        fill: {
            start: (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                this.floodFill(x, y, this.currentColor);
                this.pushToHistory();
            }
        },

        eyedropper: {
            start: (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                const pixel = this.ctx.getImageData(x, y, 1, 1).data;
                this.currentColor = `#${[...pixel].slice(0,3).map(x => x.toString(16).padStart(2,'0')).join('')}`;
                this.contentArea.querySelector('#ex-paint-color').value = this.currentColor;
            }
        },

        line: {
            start: (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                this.shapeStart = { x, y };
            },
            draw: (e) => {
                if (!this.shapeStart) return;
                const { x, y } = this.getCanvasCoordinates(e);
                
                this.tempCtx.clearRect(0, 0, this.elements.tempCanvas.width, this.elements.tempCanvas.height);
                this.tempCtx.beginPath();
                this.tempCtx.moveTo(this.shapeStart.x, this.shapeStart.y);
                this.tempCtx.lineTo(x, y);
                this.tempCtx.strokeStyle = this.currentColor;
                this.tempCtx.lineWidth = this.brushSize;
                this.tempCtx.stroke();
            },
            end: () => {
                this.ctx.drawImage(this.elements.tempCanvas, 0, 0);
                this.tempCtx.clearRect(0, 0, this.elements.tempCanvas.width, this.elements.tempCanvas.height);
                this.pushToHistory();
                this.shapeStart = null;
            }
        },

        rectangle: {
            start: (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                this.shapeStart = { x, y };
            },
            draw: (e) => {
                if (!this.shapeStart) return;
                const { x, y } = this.getCanvasCoordinates(e);
                
                this.tempCtx.clearRect(0, 0, this.elements.tempCanvas.width, this.elements.tempCanvas.height);
                const width = x - this.shapeStart.x;
                const height = y - this.shapeStart.y;
                
                this.tempCtx.fillStyle = this.fillColor;
                this.tempCtx.strokeStyle = this.currentColor;
                this.tempCtx.lineWidth = this.brushSize;
                
                this.tempCtx.beginPath();
                this.tempCtx.rect(this.shapeStart.x, this.shapeStart.y, width, height);
                this.tempCtx.fill();
                this.tempCtx.stroke();
            },
            end: () => {
                this.ctx.drawImage(this.elements.tempCanvas, 0, 0);
                this.tempCtx.clearRect(0, 0, this.elements.tempCanvas.width, this.elements.tempCanvas.height);
                this.pushToHistory();
                this.shapeStart = null;
            }
        },

        circle: {
            start: (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                this.shapeStart = { x, y };
            },
            draw: (e) => {
                if (!this.shapeStart) return;
                const { x, y } = this.getCanvasCoordinates(e);
                
                this.tempCtx.clearRect(0, 0, this.elements.tempCanvas.width, this.elements.tempCanvas.height);
                const radius = Math.sqrt(
                    Math.pow(x - this.shapeStart.x, 2) + 
                    Math.pow(y - this.shapeStart.y, 2)
                );
                
                this.tempCtx.fillStyle = this.fillColor;
                this.tempCtx.strokeStyle = this.currentColor;
                this.tempCtx.lineWidth = this.brushSize;
                
                this.tempCtx.beginPath();
                this.tempCtx.arc(this.shapeStart.x, this.shapeStart.y, radius, 0, Math.PI * 2);
                this.tempCtx.fill();
                this.tempCtx.stroke();
            },
            end: () => {
                this.ctx.drawImage(this.elements.tempCanvas, 0, 0);
                this.tempCtx.clearRect(0, 0, this.elements.tempCanvas.width, this.elements.tempCanvas.height);
                this.pushToHistory();
                this.shapeStart = null;
            }
        }
    };

    // Drawing Event Handlers
    startDrawing(e) {
        const tool = this.tools[this.currentTool];
        if (!tool) return;

        this.isDrawing = true;
        const coords = this.getCanvasCoordinates(e);
        [this.lastX, this.lastY] = [coords.x, coords.y];

        if (tool.start) {
            tool.start(e);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const tool = this.tools[this.currentTool];
        if (!tool) return;

        if (tool.draw) {
            tool.draw(e);
        }
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        const tool = this.tools[this.currentTool];
        if (tool && tool.end) {
            tool.end();
        } else if (this.isDrawing) {
            this.pushToHistory();
        }
        
        this.isDrawing = false;
    }

    // Utility Methods
    getCanvasCoordinates(e) {
        const rect = this.elements.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    floodFill(startX, startY, fillColor) {
        const imageData = this.ctx.getImageData(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        const pixels = imageData.data;
        
        const startPos = (startY * this.elements.canvas.width + startX) * 4;
        const startR = pixels[startPos];
        const startG = pixels[startPos + 1];
        const startB = pixels[startPos + 2];
        
        const fillR = parseInt(fillColor.substr(1,2), 16);
        const fillG = parseInt(fillColor.substr(3,2), 16);
        const fillB = parseInt(fillColor.substr(5,2), 16);
        
        if (startR === fillR && startG === fillG && startB === fillB) {
            return;
        }
        
        const stack = [[startX, startY]];
        
        while(stack.length) {
            const [x, y] = stack.pop();
            const pos = (y * this.elements.canvas.width + x) * 4;
            
            if (x < 0 || x >= this.elements.canvas.width || 
                y < 0 || y >= this.elements.canvas.height ||
                pixels[pos] !== startR || 
                pixels[pos + 1] !== startG || 
                pixels[pos + 2] !== startB) {
                continue;
            }
            
            pixels[pos] = fillR;
            pixels[pos + 1] = fillG;
            pixels[pos + 2] = fillB;
            
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    setTool(toolName) {
        if (this.tools[toolName]) {
            this.currentTool = toolName;
            this.contentArea.querySelectorAll('.ex-paint-tool').forEach(tool => {
                tool.classList.toggle('active', tool.dataset.tool === toolName);
            });
            this.elements.currentTool.textContent = 
                this.contentArea.querySelector(`[data-tool="${toolName}"]`).title;
        }
    }

    swapColors() {
        const colorPicker = this.contentArea.querySelector('#ex-paint-color');
        const fillPicker = this.contentArea.querySelector('#ex-paint-fill-color');
        [colorPicker.value, fillPicker.value] = [fillPicker.value, colorPicker.value];
        [this.currentColor, this.fillColor] = [this.fillColor, this.currentColor];
    }

    resetColors() {
        this.currentColor = '#000000';
        this.fillColor = '#ffffff';
        this.contentArea.querySelector('#ex-paint-color').value = this.currentColor;
        this.contentArea.querySelector('#ex-paint-fill-color').value = this.fillColor;
    }

    // File Operations
    async newDocument() {
        if (this.modified && await this.confirmSave()) {
            await this.saveDocument();
        }
        
        this.currentDocument = {
            name: 'Untitled.png',
            content: null,
            path: null
        };
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        
        this.history = [];
        this.historyIndex = -1;
        this.pushToHistory();
        
        this.modified = false;
        this.updateTitle();
        this.updateModifiedStatus();
    }

    async openDocument() {
        try {
            if (this.modified && await this.confirmSave()) {
                await this.saveDocument();
            }

            const openDialog = new FileOpenDialog(fileSystem);
            const file = await openDialog.show({
                filters: ['.png', '.jpg', '.jpeg'],
                defaultPath: this.defaultPath
            });

            if (file) {
                const img = new Image();
                img.onload = () => {
                    // Resize canvas if needed
                    if (img.width > this.elements.canvas.width || 
                        img.height > this.elements.canvas.height) {
                        this.elements.canvas.width = img.width;
                        this.elements.canvas.height = img.height;
                        this.elements.tempCanvas.width = img.width;
                        this.elements.tempCanvas.height = img.height;
                    }

                    // Clear and draw new image
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
                    this.ctx.drawImage(img, 0, 0);

                    // Reset history
                    this.history = [];
                    this.historyIndex = -1;
                    this.pushToHistory();

                    this.currentDocument = {
                        name: file.name,
                        path: file.path,
                        content: file.content
                    };

                    this.modified = false;
                    this.updateTitle();
                    this.updateModifiedStatus();
                };
                img.src = file.content;
            }
        } catch (error) {
            if (error.message !== 'Open cancelled') {
                console.error('Open failed:', error);
                alert('Failed to open file: ' + error.message);
            }
        }
    }

    async saveDocument() {
        if (!this.currentDocument.path) {
            return this.saveDocumentAs();
        }

        try {
            const imageData = this.elements.canvas.toDataURL('image/png');
            await fileSystem.saveFile(
                this.currentDocument.path,
                this.currentDocument.name,
                imageData,
                'image'
            );

            this.modified = false;
            this.updateModifiedStatus();
            this.showSaveNotification();
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save file: ' + error.message);
        }
    }

    async saveDocumentAs() {
        try {
            const imageData = this.elements.canvas.toDataURL('image/png');
            const defaultName = this.currentDocument.name || 'Untitled.png';
            
            // Remove any existing extension before adding .png
            const baseName = defaultName.replace(/\.[^/.]+$/, "");
            const nameWithExt = baseName + '.png';
    
            const saveDialog = new FileSaveDialog(
                fileSystem,
                imageData,
                nameWithExt,
                'image'
            );
    
            const result = await saveDialog.show({
                defaultPath: this.defaultPath,
                defaultExtension: '.png',
                filters: ['.png'] // Add this to restrict to PNG files
            });
    
            if (result) {
                // Ensure the filename ends with .png
                let finalFilename = result.filename;
                if (!finalFilename.toLowerCase().endsWith('.png')) {
                    finalFilename = finalFilename + '.png';
                }
    
                this.currentDocument = {
                    name: finalFilename,
                    path: result.path,
                    content: imageData
                };
    
                this.modified = false;
                this.updateTitle();
                this.updateModifiedStatus();
                this.showSaveNotification();
            }
        } catch (error) {
            if (error.message !== 'Save cancelled') {
                console.error('Save failed:', error);
                alert('Failed to save file: ' + error.message);
            }
        }
    }

    // UI Updates
    updateTitle() {
        const windowElement = this.contentArea.closest('.program-window');
        if (windowElement) {
            const titleElement = windowElement.querySelector('.window-title');
            if (titleElement) {
                titleElement.textContent = `${this.currentDocument.name}${this.modified ? ' *' : ''} - Paint`;
            }
        }
    }

    updateModifiedStatus() {
        this.elements.statusModified.textContent = this.modified ? '●' : '';
        this.updateTitle();
    }

    setModified(value) {
        if (this.modified !== value) {
            this.modified = value;
            this.updateModifiedStatus();
        }
    }

    showSaveNotification() {
        const notification = document.createElement('div');
        notification.className = 'ex-paint-notification';
        notification.textContent = 'File saved successfully';
        this.contentArea.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('ex-paint-notification-hide');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Utility Methods
    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
            this.pushToHistory();
        }
    }

    confirmSave() {
        return confirm('Do you want to save changes to ' + this.currentDocument.name + '?');
    }

    showAbout() {
        alert(
            'Paint for ElxaOS\n\n' +
            'Version 1.0\n' +
            'A simple painting program for ElxaOS\n\n' +
            '© 2025 Elxa Corporation'
        );
    }

    loadLastSession() {
        try {
            const lastSession = localStorage.getItem('elxaos_paint_session');
            if (lastSession) {
                const session = JSON.parse(lastSession);
                // Verify the file still exists
                const file = fileSystem.getFile(session.path);
                if (file) {
                    this.currentDocument = {
                        name: session.name,
                        path: session.path,
                        content: file.content
                    };
                    const img = new Image();
                    img.onload = () => {
                        this.ctx.drawImage(img, 0, 0);
                        this.updateTitle();
                    };
                    img.src = file.content;
                }
            }
        } catch (error) {
            console.error('Failed to load last session:', error);
        }
    }

    saveSession() {
        if (this.currentDocument.path) {
            localStorage.setItem('elxaos_paint_session', JSON.stringify({
                name: this.currentDocument.name,
                path: this.currentDocument.path
            }));
        }
    }

    closeWindow() {
        this.saveSession();
        const windowElement = this.contentArea.closest('.program-window');
        if (windowElement) {
            const closeEvent = new CustomEvent('windowclose', {
                detail: { windowId: windowElement.id }
            });
            document.dispatchEvent(closeEvent);
        }
    }
}

// Create and export default instance
export { Paint };