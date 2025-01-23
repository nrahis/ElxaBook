import { fileSystem } from '../../storage.js';
import { FileOpenDialog } from '../../dialogs/file_open_dialog.js';
import { FileSaveDialog } from '../../dialogs/file_save_dialog.js';

export class Slideshow {
    constructor() {
        this.currentPresentation = {
            name: 'Untitled Presentation',
            slides: [{
                elements: [], // Each element will have position, size, type, and content
                background: {
                    type: 'color',
                    value: '#ffffff' // default white
                }
            }],
            currentSlideIndex: 0
        };
        
        // Add debug flag
        this.debug = true;

        // Selection tracking
        this.selectedElement = null;
        
        // Undo/redo stacks
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50; // Limit stack size to prevent memory issues
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI(contentArea);
        this.setupEventListeners();
        this.loadLastPresentation();
    }

    renderUI(contentArea) {
        contentArea.innerHTML = `
            <div class="slideshow-container">
                <div class="slideshow-menu">
                    <div class="ss-menu-item" data-menu="file">File</div>
                    <div class="ss-menu-item" data-menu="edit">Edit</div>
                </div>
                <div class="slideshow-editor">
                    <div class="slide-canvas">
                        <div id="slide-content" class="slide-content">
                            <!-- Slide content will be added dynamically -->
                        </div>
                    </div>
                    <div class="slide-thumbnails">
                        <!-- Thumbnails will be added dynamically -->
                    </div>
                </div>
                <div class="slideshow-status">
                    <span id="slide-count">Slide 1 of 1</span>
                    <span id="presentation-name">Untitled Presentation</span>
                </div>
            </div>
        `;
    }

    selectElement(domElement) {
        // Deselect previous element if exists
        if (this.selectedElement && this.selectedElement !== domElement) {
            this.selectedElement.classList.remove('selected');
        }
        
        // Select new element
        this.selectedElement = domElement;
        if (domElement) {
            domElement.classList.add('selected');
        }
    }
    
    clearSelection() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
        }
    }

    saveState() {
        const state = JSON.stringify(this.currentPresentation);
        this.undoStack.push(state);
        this.redoStack = []; // Clear redo stack on new action
        
        // Maintain stack size limit
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }
    }
    
    undo() {
        if (this.undoStack.length === 0) return;
        
        // Save current state to redo stack
        const currentState = JSON.stringify(this.currentPresentation);
        this.redoStack.push(currentState);
        
        // Restore previous state
        const previousState = this.undoStack.pop();
        this.currentPresentation = JSON.parse(previousState);
        this.updateUI();
    }
    
    redo() {
        if (this.redoStack.length === 0) return;
        
        // Save current state to undo stack
        const currentState = JSON.stringify(this.currentPresentation);
        this.undoStack.push(currentState);
        
        // Restore next state
        const nextState = this.redoStack.pop();
        this.currentPresentation = JSON.parse(nextState);
        this.updateUI();
    }

    createDraggableElement(type, content = '') {
        const element = {
            type,
            content,
            position: { x: 50, y: 50 },
            size: { width: 200, height: type === 'text' ? 100 : 'auto' },
            style: {
                border: {
                    style: 'solid',
                    width: 'thin'
                },
                rotation: 0,
                zIndex: 1
            },
            background: 'white'
        };
    
        const domElement = document.createElement('div');
        domElement.className = `slide-element slide-${type}`;
        
        // Apply initial border style
        const borderWidth = {
            'thin': '1px',
            'medium': '2px',
            'thick': '4px'
        }[element.style.border.width];
        
        domElement.style.border = `${borderWidth} ${element.style.border.style} #ccc`;
    
        if (type === 'text') {
            element.textStyle = {
                font: 'normal',
                size: 'medium',
                effect: 'none'
            };
        }
    
        this.applyElementStyles(domElement, element);
    
        domElement.style.position = 'absolute';
        domElement.style.left = `${element.position.x}px`;
        domElement.style.top = `${element.position.y}px`;
        domElement.style.width = `${element.size.width}px`;

        domElement.addEventListener('mousedown', (e) => {
            // Don't change selection if clicking textarea, resize handle, or delete button
            if (e.target.tagName === 'TEXTAREA' || 
                e.target.classList.contains('resize-handle') || 
                e.target.classList.contains('delete-element-btn')) {
                return;
            }
            
            this.selectElement(domElement);
        });
        
        // Add click handler to slide content area to clear selection
        this.contentArea.querySelector('#slide-content').addEventListener('mousedown', (e) => {
            if (e.target.id === 'slide-content') {
                this.clearSelection();
            }
        });
        
        if (type === 'text') {
            domElement.style.height = `${element.size.height}px`;
            
            // Create display div
            const displayDiv = document.createElement('div');
            displayDiv.className = 'ss-text-display';
            displayDiv.style.width = '100%';
            displayDiv.style.height = '100%';
            displayDiv.style.padding = '8px';
            displayDiv.style.cursor = 'move';
            displayDiv.textContent = content || 'Double-click to edit';
            
            // Create textarea
            const textarea = document.createElement('textarea');
            textarea.value = content;
            textarea.style.width = '100%';
            textarea.style.height = '100%';
            textarea.style.resize = 'none';
            textarea.style.border = 'none';
            textarea.style.padding = '8px';
            textarea.style.backgroundColor = 'white';
            textarea.style.display = 'none';
        
            // Add elements to DOM
            domElement.appendChild(displayDiv);
            domElement.appendChild(textarea);
        
            // Store text style reference on the element itself
            domElement.textStyle = element.textStyle || {
                font: 'normal',
                size: 'medium',
                effect: 'none'
            };
        
            // Apply initial text styles to both elements
            this.applyTextStyleToElement(textarea, domElement.textStyle);
            this.applyTextStyleToElement(displayDiv, domElement.textStyle);
            
            // Event handlers
            displayDiv.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                // Apply current styles to textarea before showing it
                this.applyTextStyleToElement(textarea, domElement.textStyle);
                displayDiv.style.display = 'none';
                textarea.style.display = 'block';
                textarea.focus();
                textarea.select();
            });
            
            textarea.addEventListener('blur', () => {
                // Store the current text and styles
                element.content = textarea.value;
                element.textStyle = domElement.textStyle;
                
                // Update display div
                displayDiv.textContent = textarea.value || 'Double-click to edit';
                
                // Reapply current styles to both elements
                this.applyTextStyleToElement(textarea, domElement.textStyle);
                this.applyTextStyleToElement(displayDiv, domElement.textStyle);
                
                // Switch visibility
                textarea.style.display = 'none';
                displayDiv.style.display = 'block';
                
                this.updateCurrentSlide();
                this.saveState();
            });
            
            textarea.addEventListener('input', () => {
                element.content = textarea.value;
                // Maintain styles during editing
                this.applyTextStyleToElement(textarea, domElement.textStyle);
                this.updateCurrentSlide();
            });
            
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    textarea.blur();
                }
            });
            
            // Store references
            domElement.textarea = textarea;
            domElement.displayDiv = displayDiv;
        
        } else if (type === 'image') {
            const img = document.createElement('img');
            img.src = content;
            img.style.width = '100%';
            img.style.height = 'auto';
            domElement.appendChild(img);
        }
    
        // Add delete button (existing code)
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '×';
        deleteButton.className = 'delete-element-btn';
        deleteButton.style.cssText = `
            position: absolute;
            right: 2px;
            top: 2px;
            display: none;
            z-index: 10;
            padding: 2px 6px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        `;
        
        domElement.addEventListener('mouseenter', () => deleteButton.style.display = 'block');
        domElement.addEventListener('mouseleave', () => deleteButton.style.display = 'none');
        
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            domElement.remove();
            this.updateCurrentSlide();
        });
        
        domElement.appendChild(deleteButton);
    
        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        domElement.appendChild(resizeHandle);
    
        // Make the element draggable and resizable
        this.makeDraggable(domElement, element);
        this.makeResizable(domElement, element);
    
        if (type === 'text') {
            domElement.textStyle = element.textStyle;
        }
    
        return { element, domElement };
    }

    applyElementStyles(domElement, element) {
        // Position and size
        domElement.style.position = 'absolute';
        domElement.style.left = `${element.position.x}px`;
        domElement.style.top = `${element.position.y}px`;
        domElement.style.width = `${element.size.width}px`;
        if (element.type === 'text') {
            domElement.style.height = `${element.size.height}px`;
        }
    
        // Border styles - Updated for consistency
        // Updated applyElementStyles method border handling
        if (element.style?.border) {
            const borderWidth = {
                'thin': '1px',
                'medium': '2px',
                'thick': '4px'
            }[element.style.border.width || 'thin'];
            
            if (element.style.border.style === 'none') {
                domElement.style.borderStyle = 'none';
                domElement.style.borderWidth = '0';
            } else {
                // Apply border properties separately
                domElement.style.borderStyle = element.style.border.style || 'solid';
                domElement.style.borderWidth = borderWidth;
                domElement.style.borderColor = '#ccc';
            }
        } else {
            // Default border if none specified
            domElement.style.borderStyle = 'solid';
            domElement.style.borderWidth = '1px';
            domElement.style.borderColor = '#ccc';
        }
    
        // Rotation
        if (element.style?.rotation) {
            domElement.style.transform = `rotate(${element.style.rotation}deg)`;
        }
    
        // Z-index
        if (element.style?.zIndex !== undefined) {
            domElement.style.zIndex = element.style.zIndex;
        }
    
        // Background
        if (element.background === 'transparent') {
            domElement.classList.add('transparent');
            domElement.style.backgroundColor = 'transparent';
            if (element.type === 'text') {
                const textarea = domElement.querySelector('textarea');
                if (textarea) {
                    textarea.style.backgroundColor = 'transparent';
                }
            }
        } else {
            domElement.style.backgroundColor = 'white';
        }
    
        // Store styles on DOM element for reference
        domElement.elementStyles = { ...element.style };
        if (element.type === 'text') {
            domElement.textStyle = { ...element.textStyle };
        }
    }

    // Add dragging functionality
    makeDraggable(domElement, elementData) {
        let isDragging = false;
        let startX, startY;
        let originalX, originalY;
    
        // Add focus handling
        domElement.tabIndex = 0; // Make element focusable
        
        // Handle mousedown on the element (not the textarea)
        domElement.addEventListener('mousedown', (e) => {
            // Don't initiate drag if we're clicking the textarea, resize handle, or delete button
            if (e.target.tagName === 'TEXTAREA' || 
                e.target.classList.contains('resize-handle') || 
                e.target.classList.contains('delete-element-btn')) {
                return;
            }
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            originalX = elementData.position.x;
            originalY = elementData.position.y;
            
            // Prevent text selection during drag
            e.preventDefault();
            
            // Focus the element
            domElement.focus();
    
            const moveHandler = (e) => {
                if (!isDragging) return;
    
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
    
                elementData.position.x = originalX + deltaX;
                elementData.position.y = originalY + deltaY;
    
                domElement.style.left = `${elementData.position.x}px`;
                domElement.style.top = `${elementData.position.y}px`;
            };
    
            const upHandler = () => {
                isDragging = false;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                this.updateCurrentSlide();
                this.saveState();
            };
    
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });
    
        // Handle clicks on the textarea
        const textarea = domElement.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('click', (e) => {
                e.stopPropagation();
                textarea.focus();
            });
            
            // Prevent dragging when clicking inside textarea
            textarea.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        }
    }

    // Add resizing functionality
    makeResizable(domElement, elementData) {
        const handle = domElement.querySelector('.resize-handle');
        let isResizing = false;
        let startX, startY;
        let originalWidth, originalHeight;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            originalWidth = elementData.size.width;
            originalHeight = elementData.size.height;

            const moveHandler = (e) => {
                if (!isResizing) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                elementData.size.width = Math.max(50, originalWidth + deltaX);
                if (elementData.type === 'text') {
                    elementData.size.height = Math.max(50, originalHeight + deltaY);
                }

                domElement.style.width = `${elementData.size.width}px`;
                if (elementData.type === 'text') {
                    domElement.style.height = `${elementData.size.height}px`;
                }
            };

            const upHandler = () => {
                isResizing = false;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                this.updateCurrentSlide();
                this.saveState();
            };

            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });
    }

    setupEventListeners() {
        this.setupMenus();
        
        this.slideThumbnails = this.contentArea.querySelector('.slide-thumbnails');
        this.slideCount = this.contentArea.querySelector('#slide-count');
        this.presentationName = this.contentArea.querySelector('#presentation-name');
    
        this.closeMenus = () => {
            // Store active element
            const activeElement = document.activeElement;
            
            this.contentArea.querySelectorAll('.ss-menu-item').forEach(item => {
                item.classList.remove('active');
                const dropdown = item.querySelector('.ss-menu-dropdown');
                if (dropdown) dropdown.remove();
            });
            
            // Restore focus if it was a textarea
            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                activeElement.focus();
            }
        };
    
        const menuContainer = this.contentArea.querySelector('.slideshow-menu');
        if (menuContainer) {
            menuContainer.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent focus loss
                const menuItem = e.target.closest('.ss-menu-item');
                if (menuItem) {
                    e.stopPropagation();
                    this.handleMenuClick(menuItem);
                }
            });
        }
    
        document.addEventListener('mousedown', () => {
            this.closeMenus();
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
                { label: 'Present', action: 'present' },
                { type: 'separator' },
                { label: 'Exit', action: 'exit' }
            ],
            edit: [
                { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
                { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
                { type: 'separator' },
                { label: 'Add Slide', action: 'addSlide' },
                { label: 'Delete Slide', action: 'deleteSlide' },
                { type: 'separator' },
                { label: 'Previous Slide', action: 'prevSlide' },
                { label: 'Next Slide', action: 'nextSlide' },
                { type: 'separator' },
                { label: 'Add Text Box', action: 'addTextBox' },
                { label: 'Import Image...', action: 'importImage' },
                { type: 'separator' },
                { label: 'Text Style', action: 'textStyle', submenu: [
                    { label: 'Font', action: 'textFont', submenu: [
                        { label: 'Normal', action: 'fontNormal' },
                        { label: 'Comic', action: 'fontComic' },
                        { label: 'Fantasy', action: 'fontFantasy' },
                        { label: 'Spooky', action: 'fontCreepy' }
                    ]},
                    { label: 'Size', action: 'textSize', submenu: [
                        { label: 'Small', action: 'sizeSmall' },
                        { label: 'Medium', action: 'sizeMedium' },
                        { label: 'Large', action: 'sizeLarge' },
                        { label: 'Huge!', action: 'sizeHuge' }
                    ]},
                    { label: 'Effects', action: 'textEffect', submenu: [
                        { label: 'None', action: 'effectNone' },
                        { label: 'Rainbow', action: 'effectRainbow' },
                        { label: 'Glow', action: 'effectGlow' },
                        { label: 'Bounce', action: 'effectBounce' }
                    ]}
                ]},
                { label: 'Background', action: 'background', submenu: [
                    { label: 'Color...', action: 'bgColor' },
                    { type: 'separator' },
                    { label: 'Polka Dots', action: 'bgDots' },
                    { label: 'Stars', action: 'bgStars' },
                    { label: 'Grid', action: 'bgGrid' },
                    { label: 'Plain Color', action: 'bgNone' }
                ]},
                {
                    label: 'Element Style',
                    action: 'elementStyle',
                    submenu: [
                        {
                            label: 'Background',
                            action: 'elementBackground',
                            submenu: [
                                { label: 'Transparent', action: 'bgTransparent' },
                                { label: 'White', action: 'bgWhite' }
                            ]
                        },
                        {
                            label: 'Border',
                            action: 'elementBorder',
                            submenu: [
                                { label: 'None', action: 'borderNone' },
                                { label: 'Solid', action: 'borderSolid' },
                                { label: 'Dashed', action: 'borderDashed' },
                                { label: 'Dotted', action: 'borderDotted' },
                                { type: 'separator' },
                                { label: 'Border Width', action: 'borderWidth', submenu: [
                                    { label: 'Thin', action: 'borderThin' },
                                    { label: 'Medium', action: 'borderMedium' },
                                    { label: 'Thick', action: 'borderThick' }
                                ]}
                            ]
                        },
                        {
                            label: 'Rotation',
                            action: 'elementRotation',
                            submenu: [
                                { label: '0°', action: 'rotate0' },
                                { label: '90° Right', action: 'rotate90' },
                                { label: '90° Left', action: 'rotateNeg90' },
                                { label: '180°', action: 'rotate180' }
                            ]
                        },
                        {
                            label: 'Layout',
                            action: 'elementLayout',
                            submenu: [
                                { label: 'Bring to Front', action: 'bringToFront' },
                                { label: 'Send to Back', action: 'sendToBack' },
                                { label: 'Bring Forward', action: 'bringForward' },
                                { label: 'Send Backward', action: 'sendBackward' }
                            ]
                        }
                    ]
                }
            ]
        };
    
        this.menus = menus;
    }

    handleMenuClick(menuItem) {
        const menuType = menuItem.dataset.menu;
        if (!menuType || !this.menus[menuType]) return;
    
        // Store active element before showing menu
        const activeElement = document.activeElement;
    
        // If this menu is already active, close it
        if (menuItem.classList.contains('active')) {
            this.closeMenus();
            return;
        }
    
        // Close any open menus
        this.closeMenus();
    
        // Show this menu
        this.showMenu(menuItem, this.menus[menuType]);
        menuItem.classList.add('active');
    
        // Restore focus to previously active element
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
            activeElement.focus();
        }
    }

    handleMenuAction(action) {
        if (this.debug) console.log('Menu action:', action);
        switch(action) {
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'new':
                this.newPresentation();
                break;
            case 'open':
                this.openPresentation();
                break;
            case 'save':
                this.savePresentation();
                break;
            case 'saveAs':
                this.savePresentationAs();
                break;
            case 'present':
                this.startPresentation();
                break;
            case 'exit':
                this.exit();
                break;
            case 'addSlide':
                this.addSlide();
                break;
            case 'deleteSlide':
                this.deleteSlide();
                break;
            case 'prevSlide':
                this.previousSlide();
                break;
            case 'nextSlide':
                this.nextSlide();
                break;
            case 'addTextBox':
                this.addTextBox();
                break;
            case 'importImage':
                this.importImage();
                break;
            case 'bgColor':
                this.changeBackgroundColor();
                break;
            case 'bgDots':
                this.setBackgroundPattern('dots');
                break;
            case 'bgStars':
                this.setBackgroundPattern('stars');
                break;
            case 'bgGrid':
                this.setBackgroundPattern('grid');
                break;
            case 'bgNone':
                this.setBackgroundPattern('color');
                break;
            case 'bgTransparent':
                this.applyElementBackground('transparent');
                break;
            case 'bgWhite':
                this.applyElementBackground('white');
                break;
            // Text font cases
            case 'fontNormal': 
                if (this.debug) console.log('Applying normal font');
                this.applyTextStyle('font', 'normal'); 
                break;
            case 'fontComic': 
                if (this.debug) console.log('Applying comic font');
                this.applyTextStyle('font', 'comic'); 
                break;
            case 'fontFantasy': 
                if (this.debug) console.log('Applying fantasy font');
                this.applyTextStyle('font', 'fantasy'); 
                break;
            case 'fontCreepy': 
                if (this.debug) console.log('Applying creepy font');
                this.applyTextStyle('font', 'creepy'); 
                break;            
            // Text size cases
            case 'sizeSmall': 
                if (this.debug) console.log('Applying small size');
                this.applyTextStyle('size', 'small'); 
                break;
            case 'sizeMedium': 
                if (this.debug) console.log('Applying medium size');
                this.applyTextStyle('size', 'medium'); 
                break;
            case 'sizeLarge': 
                if (this.debug) console.log('Applying large size');
                this.applyTextStyle('size', 'large'); 
                break;
            case 'sizeHuge': 
                if (this.debug) console.log('Applying huge size');
                this.applyTextStyle('size', 'huge'); 
                break;            
            // Text effect cases
            case 'effectNone': 
                if (this.debug) console.log('Applying no effect');
                this.applyTextStyle('effect', 'none'); 
                break;
            case 'effectRainbow': 
                if (this.debug) console.log('Applying rainbow effect');
                this.applyTextStyle('effect', 'rainbow'); 
                break;
            case 'effectGlow': 
                if (this.debug) console.log('Applying glow effect');
                this.applyTextStyle('effect', 'glow'); 
                break;
            case 'effectBounce': 
                if (this.debug) console.log('Applying bounce effect');
                this.applyTextStyle('effect', 'bounce'); 
                break;
            // Border cases
            case 'borderNone':
                this.applyElementBorder('none');
                break;
            case 'borderSolid':
                this.applyElementBorder('solid');
                break;
            case 'borderDashed':
                this.applyElementBorder('dashed');
                break;
            case 'borderDotted':
                this.applyElementBorder('dotted');
                break;
            case 'borderThin':
                this.applyElementBorder(null, 'thin');
                break;
            case 'borderMedium':
                this.applyElementBorder(null, 'medium');
                break;
            case 'borderThick':
                this.applyElementBorder(null, 'thick');
                break;                
            // Rotation cases
            case 'rotate0':
                this.applyElementRotation(0);
                break;
            case 'rotate90':
                this.applyElementRotation(90);
                break;
            case 'rotateNeg90':
                this.applyElementRotation(-90);
                break;
            case 'rotate180':
                this.applyElementRotation(180);
                break;                
            // Layout cases
            case 'bringToFront':
            case 'sendToBack':
            case 'bringForward':
            case 'sendBackward':
                this.updateElementLayout(action);
                break;
                
            default:
                if (this.debug) console.log('Unknown action:', action);
                break;
        }
    }

    applyTextStyle(style, value) {
        console.log('Applying style:', style, value);
        
        const textarea = document.activeElement;
        if (!textarea || textarea.tagName !== 'TEXTAREA') {
            console.log('No textarea selected');
            alert('Please click inside a text box first!');
            return;
        }
    
        const textBox = textarea.closest('.slide-element');
        if (!textBox) {
            console.log('No slide-element parent found');
            return;
        }
    
        // Update the stored style on the DOM element
        if (!textBox.textStyle) {
            textBox.textStyle = {
                font: 'normal',
                size: 'medium',
                effect: 'none'
            };
        }
        textBox.textStyle[style] = value;
    
        // Update the element in the current slide's data
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        const elementIndex = Array.from(textBox.parentElement.children).indexOf(textBox);
        if (!currentSlide.elements[elementIndex].textStyle) {
            currentSlide.elements[elementIndex].textStyle = { ...textBox.textStyle };
        }
        currentSlide.elements[elementIndex].textStyle[style] = value;
    
        // Apply updated styles to both textarea and display div
        this.applyTextStyleToElement(textarea, textBox.textStyle);
        const displayDiv = textBox.querySelector('.ss-text-display');
        if (displayDiv) {
            this.applyTextStyleToElement(displayDiv, textBox.textStyle);
        }
    
        // Update state
        this.updateCurrentSlide();
        this.saveState();
    }
    
    // Update applyTextStyleToElement to handle both elements consistently
    applyTextStyleToElement(element, textStyle) {
        if (!element || !textStyle) return;
        
        const targetElements = [];
        const slideElement = element.closest('.slide-element');
        
        if (slideElement) {
            // Add both textarea and display div to our targets
            const textarea = slideElement.querySelector('textarea');
            const displayDiv = slideElement.querySelector('.ss-text-display');
            if (textarea) targetElements.push(textarea);
            if (displayDiv) targetElements.push(displayDiv);
        } else {
            targetElements.push(element);
        }
        
        // Apply styles to all target elements
        targetElements.forEach(el => {
            // Determine font family
            let fontFamily;
            switch (textStyle.font) {
                case 'comic': fontFamily = '"Comic Sans MS", cursive'; break;
                case 'fantasy': fontFamily = 'Papyrus, fantasy'; break;
                case 'creepy': fontFamily = '"Creepster", cursive'; break;
                default: fontFamily = 'Arial, sans-serif';
            }
    
            // Determine font size
            let fontSize;
            switch (textStyle.size) {
                case 'small': fontSize = '14px'; break;
                case 'large': fontSize = '24px'; break;
                case 'huge': fontSize = '36px'; break;
                default: fontSize = '18px';
            }
    
            // Apply base styles
            el.style.fontFamily = fontFamily;
            el.style.fontSize = fontSize;
    
            // Reset classes and add new effect
            el.classList.remove('effect-rainbow', 'effect-glow', 'effect-bounce');
            if (textStyle.effect && textStyle.effect !== 'none') {
                el.classList.add(`effect-${textStyle.effect}`);
            }
        });
    }
    
    getFontFamily(fontStyle) {
        switch (fontStyle) {
            case 'comic': return '"Comic Sans MS", cursive';
            case 'fantasy': return 'Papyrus, fantasy';
            case 'creepy': return '"Creepster", cursive';
            default: return 'Arial, sans-serif';
        }
    }
    
    getFontSize(size) {
        switch (size) {
            case 'small': return '14px';
            case 'medium': return '18px';
            case 'large': return '24px';
            case 'huge': return '36px';
            default: return '18px';
        }
    }

    // Add these new methods to handle background changes
    async changeBackgroundColor() {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex].background?.value || '#ffffff';
        
        // Handle the color change
        input.addEventListener('input', (e) => {
            const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
            currentSlide.background = {
                type: 'color',
                value: e.target.value
            };
            this.updateUI();
            this.updateCurrentSlide();
        });
        
        input.click(); // Open the color picker
    }

    setBackgroundPattern(pattern) {
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        currentSlide.background = {
            type: pattern,
            value: pattern === 'color' ? '#ffffff' : currentSlide.background?.value || '#ffffff'
        };
        this.updateUI();
        this.updateCurrentSlide();
    }

    applyElementBorder(style, width) {
        const activeElement = document.activeElement;
        let targetElement;
        
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
            targetElement = activeElement.closest('.slide-element');
        } else {
            targetElement = this.selectedElement;
        }
        
        if (!targetElement) {
            alert('Please select an element first!');
            return;
        }
    
        // Get the current slide and element index
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        const elementIndex = Array.from(targetElement.parentElement.children).indexOf(targetElement);
        
        // Ensure the element has a style object
        if (!currentSlide.elements[elementIndex].style) {
            currentSlide.elements[elementIndex].style = {};
        }
        if (!currentSlide.elements[elementIndex].style.border) {
            currentSlide.elements[elementIndex].style.border = {
                style: 'solid',
                width: 'thin'
            };
        }
        
        // Update the border properties
        if (style !== null) {
            currentSlide.elements[elementIndex].style.border.style = style;
        }
        if (width !== null) {
            currentSlide.elements[elementIndex].style.border.width = width;
        }
        
        // Get the actual pixel width
        const borderWidth = {
            'thin': '1px',
            'medium': '2px',
            'thick': '4px'
        }[currentSlide.elements[elementIndex].style.border.width || 'thin'];
        
        // Apply styles directly to the DOM element
        if (style === 'none') {
            targetElement.style.borderStyle = 'none';
            targetElement.style.borderWidth = '0';
            targetElement.style.borderColor = 'transparent';
        } else {
            targetElement.style.borderStyle = currentSlide.elements[elementIndex].style.border.style;
            targetElement.style.borderWidth = borderWidth;
            targetElement.style.borderColor = '#ccc';
        }
        
        // Also update any textarea within the element
        const textarea = targetElement.querySelector('textarea');
        if (textarea) {
            if (style === 'none') {
                textarea.style.borderStyle = 'none';
                textarea.style.borderWidth = '0';
                textarea.style.borderColor = 'transparent';
            } else {
                textarea.style.borderStyle = currentSlide.elements[elementIndex].style.border.style;
                textarea.style.borderWidth = borderWidth;
                textarea.style.borderColor = '#ccc';
            }
        }
        
        // Update state
        this.updateCurrentSlide();
        this.saveState();
    }
    
    applyElementRotation(degrees) {
        const activeElement = document.activeElement;
        let targetElement;
        
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
            targetElement = activeElement.closest('.slide-element');
        } else {
            targetElement = document.querySelector('.slide-element:focus');
        }
        
        if (!targetElement) {
            alert('Please select an element first!');
            return;
        }
    
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        const elementIndex = Array.from(targetElement.parentElement.children).indexOf(targetElement);
        
        // Update the data model
        if (!currentSlide.elements[elementIndex].style) {
            currentSlide.elements[elementIndex].style = {};
        }
        currentSlide.elements[elementIndex].style.rotation = degrees;
        
        // Apply rotation to DOM element
        targetElement.style.transform = `rotate(${degrees}deg)`;
        
        this.updateCurrentSlide();
        this.saveState();
    }
    
    updateElementLayout(action) {
        // Get the target element
        const activeElement = document.activeElement;
        let targetElement;
        
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
            targetElement = activeElement.closest('.slide-element');
        } else {
            targetElement = this.selectedElement;
        }
        
        if (!targetElement) {
            alert('Please select an element first!');
            return;
        }
    
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        const elementIndex = Array.from(targetElement.parentElement.children).indexOf(targetElement);
        
        // Get all elements and their current z-indexes
        const slideContent = this.contentArea.querySelector('#slide-content');
        const elements = Array.from(slideContent.children);
        const baseZIndex = 10; // Start z-indexes at 10 to leave room for selection
        
        switch(action) {
            case 'bringToFront':
                // Move target element to highest z-index
                elements.forEach((el, i) => {
                    el.style.zIndex = baseZIndex + i;
                });
                targetElement.style.zIndex = baseZIndex + elements.length;
                break;
                
            case 'sendToBack':
                // Move target element to lowest z-index
                targetElement.style.zIndex = baseZIndex;
                elements.forEach(el => {
                    if (el !== targetElement) {
                        el.style.zIndex = parseInt(el.style.zIndex || baseZIndex) + 1;
                    }
                });
                break;
                
            case 'bringForward':
                // Find element with next highest z-index
                const currentZ = parseInt(targetElement.style.zIndex) || baseZIndex;
                const higherElement = elements.find(el => 
                    parseInt(el.style.zIndex || baseZIndex) === currentZ + 1
                );
                if (higherElement) {
                    higherElement.style.zIndex = currentZ;
                    targetElement.style.zIndex = currentZ + 1;
                } else {
                    targetElement.style.zIndex = currentZ + 1;
                }
                break;
                
            case 'sendBackward':
                // Find element with next lowest z-index
                const currZ = parseInt(targetElement.style.zIndex) || baseZIndex;
                const lowerElement = elements.find(el => 
                    parseInt(el.style.zIndex || baseZIndex) === currZ - 1
                );
                if (lowerElement && currZ > baseZIndex) {
                    lowerElement.style.zIndex = currZ;
                    targetElement.style.zIndex = currZ - 1;
                }
                break;
        }
        
        // Update the data model with new z-index
        if (!currentSlide.elements[elementIndex].style) {
            currentSlide.elements[elementIndex].style = {};
        }
        currentSlide.elements[elementIndex].style.zIndex = parseInt(targetElement.style.zIndex) || baseZIndex;
        
        // Save state for undo/redo
        this.saveState();
        
        // Update the current slide
        this.updateCurrentSlide();
        this.saveState();
    }

    async removeImageBackground(imgElement) {
        // Create a canvas to analyze and modify the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match image
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        
        // Draw the image onto canvas
        ctx.drawImage(imgElement, 0, 0);
        
        // Get the color from top-left corner (1,1 to avoid potential edge artifacts)
        const cornerPixel = ctx.getImageData(1, 1, 1, 1).data;
        const targetR = cornerPixel[0];
        const targetG = cornerPixel[1];
        const targetB = cornerPixel[2];
        
        // Get all image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Tolerance for color matching (0-255, higher = more aggressive removal)
        const tolerance = 50;
        
        // Process all pixels
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel is close to target color
            if (Math.abs(r - targetR) < tolerance &&
                Math.abs(g - targetG) < tolerance &&
                Math.abs(b - targetB) < tolerance) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
        }
        
        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        // Return the new image as data URL
        return canvas.toDataURL('image/png');
    }

    applyElementBackground(style) {
        const activeElement = document.activeElement;
        let targetElement;
        
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
            targetElement = activeElement.closest('.slide-element');
        } else {
            targetElement = document.querySelector('.slide-element:focus');
        }
        
        if (!targetElement) {
            alert('Please select a text box or image first!');
            return;
        }
        
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        const elementIndex = Array.from(targetElement.parentElement.children).indexOf(targetElement);
        
        const isImage = targetElement.classList.contains('slide-image');
        
        if (isImage) {
            if (style === 'transparent') {
                targetElement.classList.add('transparent');
                targetElement.style.backgroundColor = 'transparent';
                imgElement.style.mixBlendMode = 'multiply';
                currentSlide.elements[elementIndex].background = 'transparent';
            } else {
                targetElement.classList.remove('transparent');
                targetElement.style.backgroundColor = 'white';
                imgElement.style.mixBlendMode = 'normal';
                currentSlide.elements[elementIndex].background = 'white';
            }
        } else {
            // Handle text elements
            if (style === 'transparent') {
                targetElement.classList.add('transparent');
                targetElement.style.backgroundColor = 'transparent';
                const textarea = targetElement.querySelector('textarea');
                if (textarea) {
                    textarea.style.backgroundColor = 'transparent';
                }
                currentSlide.elements[elementIndex].background = 'transparent';
            } else {
                targetElement.classList.remove('transparent');
                targetElement.style.backgroundColor = 'white';
                const textarea = targetElement.querySelector('textarea');
                if (textarea) {
                    textarea.style.backgroundColor = 'white';
                }
                currentSlide.elements[elementIndex].background = 'white';
            }
        }
        
        this.updateCurrentSlide();
        this.saveState();
    }

    showMenu(menuItem, items) {
        const dropdown = document.createElement('div');
        dropdown.className = 'ss-menu-dropdown';
        
        items.forEach(item => {
            if (item.type === 'separator') {
                dropdown.appendChild(document.createElement('hr'));
                return;
            }
    
            const menuEntry = document.createElement('div');
            menuEntry.className = 'ss-menu-entry';
            
            if (item.submenu) {
                menuEntry.classList.add('has-submenu');
                const label = document.createElement('span');
                label.textContent = item.label;
                menuEntry.appendChild(label);
                
                // Create submenu
                const submenu = this.createSubmenu(item.submenu);
                menuEntry.appendChild(submenu);
            } else {
                menuEntry.innerHTML = `
                    <span>${item.label}</span>
                    ${item.shortcut ? `<span class="ss-shortcut">${item.shortcut}</span>` : ''}
                `;
                
                // Add click handler directly to the menu entry
                menuEntry.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    e.preventDefault(); // Prevent focus loss
                    this.handleMenuAction(item.action);
                    this.closeMenus();
                });
            }
            
            dropdown.appendChild(menuEntry);
        });
    
        menuItem.appendChild(dropdown);
    }
    
    // Also update createSubmenu to handle clicks properly
    createSubmenu(items) {
        const submenu = document.createElement('div');
        submenu.className = 'ss-submenu';
        
        items.forEach(item => {
            if (item.type === 'separator') {
                submenu.appendChild(document.createElement('hr'));
                return;
            }
    
            const entry = document.createElement('div');
            entry.className = 'ss-menu-entry';
            
            if (item.submenu) {
                entry.classList.add('has-submenu');
                const label = document.createElement('span');
                label.textContent = item.label;
                entry.appendChild(label);
                
                // Recursively create nested submenu
                const nestedSubmenu = this.createSubmenu(item.submenu);
                entry.appendChild(nestedSubmenu);
            } else {
                const label = document.createElement('span');
                label.textContent = item.label;
                entry.appendChild(label);
                
                if (item.shortcut) {
                    const shortcut = document.createElement('span');
                    shortcut.className = 'ss-shortcut';
                    shortcut.textContent = item.shortcut;
                    entry.appendChild(shortcut);
                }
                
                // Add click handler to submenu items
                entry.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    e.preventDefault(); // Prevent focus loss
                    this.handleMenuAction(item.action);
                    this.closeMenus();
                });
            }
            
            submenu.appendChild(entry);
        });
        
        return submenu;
    }
    
    // Update the newPresentation method to properly initialize the first slide
    newPresentation() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('Do you want to save the current presentation?')) {
                return;
            }
            this.savePresentation();
        }
    
        this.currentPresentation = {
            name: 'Untitled Presentation',
            slides: [{
                elements: [],
                background: {
                    type: 'color',
                    value: '#ffffff'  // Default white background
                }
            }],
            currentSlideIndex: 0
        };
    
        this.updateUI();
    }

    addSlide() {
        const newSlide = {
            elements: [],
            background: {
                type: 'color',
                value: '#ffffff'  // Default white background
            }
        };
        this.currentPresentation.slides.push(newSlide);
        this.currentPresentation.currentSlideIndex = this.currentPresentation.slides.length - 1;
        this.updateUI();
        this.saveState()
    }

    deleteSlide() {
        if (this.currentPresentation.slides.length > 1) {
            this.currentPresentation.slides.splice(this.currentPresentation.currentSlideIndex, 1);
            
            // Adjust current slide index if necessary
            if (this.currentPresentation.currentSlideIndex >= this.currentPresentation.slides.length) {
                this.currentPresentation.currentSlideIndex = this.currentPresentation.slides.length - 1;
            }
            
            this.updateUI();
            this.saveState()
        } else {
            alert('Cannot delete the last slide');
        }
    }

    updateCurrentSlide() {
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        if (!currentSlide) return;
        
        const slideContent = this.contentArea.querySelector('#slide-content');
        if (!slideContent) return;
    
        currentSlide.elements = Array.from(slideContent.children).map(domElement => {
            const isText = domElement.classList.contains('slide-text');
            const element = {
                type: isText ? 'text' : 'image',
                position: {
                    x: parseInt(domElement.style.left) || 0,
                    y: parseInt(domElement.style.top) || 0
                },
                size: {
                    width: parseInt(domElement.style.width) || 200,
                    height: isText ? (parseInt(domElement.style.height) || 100) : 'auto'
                },
                style: {
                    border: {
                        style: domElement.style.borderStyle || 'solid',
                        width: domElement.style.borderWidth === '1px' ? 'thin' :
                               domElement.style.borderWidth === '2px' ? 'medium' :
                               domElement.style.borderWidth === '4px' ? 'thick' : 'thin'
                    },
                    rotation: parseInt(domElement.style.transform?.match(/-?\d+/)?.[0] || '0'),
                    zIndex: parseInt(domElement.style.zIndex || '1')
                },
                background: domElement.classList.contains('transparent') ? 'transparent' : 'white'
            };
    
            if (isText) {
                const textarea = domElement.querySelector('textarea');
                element.content = textarea ? textarea.value : '';
                element.textStyle = { ...domElement.textStyle };
            } else {
                const img = domElement.querySelector('img');
                element.content = img ? img.src : '';
            }
    
            return element;
        });
    
        this.saveToLocalState();
    }

    updateUI() {
        const slideContent = this.contentArea.querySelector('#slide-content');
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
    
        // Clear existing content and reset to default state
        slideContent.innerHTML = '';
        slideContent.className = 'slide-content';
        
        // Important: Only reset background if no background is specified
        if (!currentSlide.background) {
            slideContent.style.backgroundColor = '#ffffff';
        }
    
        // Apply slide-specific background and patterns
        if (currentSlide.background) {
            // Remove any existing background patterns first
            slideContent.classList.remove('bg-pattern-dots', 'bg-pattern-stars', 'bg-pattern-grid');
            
            // Apply new background
            slideContent.style.backgroundColor = currentSlide.background.value;
            if (currentSlide.background.type !== 'color') {
                slideContent.classList.add(`bg-pattern-${currentSlide.background.type}`);
            }
        }
    
        // Create all positioned elements with their specific styles
        if (currentSlide.elements) {
            currentSlide.elements.forEach(element => {
                const { domElement } = this.createDraggableElement(element.type, element.content);
    
                // Restore position and size precisely
                domElement.style.left = `${element.position.x}px`;
                domElement.style.top = `${element.position.y}px`;
                domElement.style.width = `${element.size.width}px`;
                
                // Ensure text elements restore height
                if (element.type === 'text') {
                    domElement.style.height = `${element.size.height}px`;
                    
                    // Important: Store textStyle reference on DOM element
                    domElement.textStyle = { ...element.textStyle };
                    
                    const textarea = domElement.querySelector('textarea');
                    const displayDiv = domElement.querySelector('.ss-text-display');
                    
                    if (textarea && displayDiv) {
                        // Apply saved text styles to both elements
                        this.applyTextStyleToElement(textarea, element.textStyle);
                        this.applyTextStyleToElement(displayDiv, element.textStyle);
                        
                        // Ensure content is restored
                        textarea.value = element.content;
                        displayDiv.textContent = element.content || 'Double-click to edit';
                    }
                }
    
                // Restore element styling
                if (element.style) {
                    // Border restoration
                    if (element.style.border) {
                        const borderWidth = {
                            'thin': '1px',
                            'medium': '2px',
                            'thick': '4px'
                        }[element.style.border.width || 'thin'];
                        
                        domElement.style.border = element.style.border.style === 'none' ?
                            'none' :
                            `${borderWidth} ${element.style.border.style || 'solid'} #ccc`;
                    }
                    
                    // Rotation restoration
                    if (element.style.rotation) {
                        domElement.style.transform = `rotate(${element.style.rotation}deg)`;
                    }
                    
                    // Z-index restoration
                    if (element.style.zIndex !== undefined) {
                        domElement.style.zIndex = element.style.zIndex;
                    }
                }
    
                // Background transparency restoration
                if (element.background === 'transparent') {
                    domElement.classList.add('transparent');
                    domElement.style.backgroundColor = 'transparent';
                    
                    if (element.type === 'text') {
                        const textarea = domElement.querySelector('textarea');
                        if (textarea) {
                            textarea.style.backgroundColor = 'transparent';
                        }
                    } else if (element.type === 'image') {
                        const img = domElement.querySelector('img');
                        if (img) {
                            img.style.mixBlendMode = 'multiply';
                        }
                    }
                }
    
                slideContent.appendChild(domElement);
            });
        }
    
        // Update slide count and presentation name
        this.slideCount.textContent = `Slide ${this.currentPresentation.currentSlideIndex + 1} of ${this.currentPresentation.slides.length}`;
        this.presentationName.textContent = this.currentPresentation.name;
    
        // Update thumbnails
        this.updateThumbnails();
    }

    updateThumbnails() {
        this.slideThumbnails.innerHTML = '';
        this.currentPresentation.slides.forEach((slide, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.classList.add('slide-thumbnail');
            thumbnail.textContent = `Slide ${index + 1}`;
            
            if (index === this.currentPresentation.currentSlideIndex) {
                thumbnail.classList.add('active');
            }
            
            thumbnail.addEventListener('click', () => this.goToSlide(index));
            
            this.slideThumbnails.appendChild(thumbnail);
        });
    }

    goToSlide(index) {
        this.currentPresentation.currentSlideIndex = index;
        this.updateUI();
    }

    nextSlide() {
        if (this.currentPresentation.currentSlideIndex < this.currentPresentation.slides.length - 1) {
            this.currentPresentation.currentSlideIndex++;
            this.updateUI();
        }
    }

    previousSlide() {
        if (this.currentPresentation.currentSlideIndex > 0) {
            this.currentPresentation.currentSlideIndex--;
            this.updateUI();
        }
    }

    startPresentation() {
        if (this.currentPresentation.slides.length === 0) {
            alert('No slides to present');
            return;
        }

        const presentationWindow = this.createPresentationWindow();
        this.showSlideInPresentationWindow(presentationWindow, 0);
    }

    createPresentationWindow() {
        const presentationWindow = document.createElement('div');
        presentationWindow.className = 'presentation-window';
        presentationWindow.innerHTML = `
            <div class="presentation-slide" style="position: relative;">
                <div class="presentation-slide-content"></div>
            </div>
            <div class="presentation-controls">
                <button id="prev-slide">← Prev</button>
                <button id="next-slide">Next →</button>
                <button id="exit-presentation">Exit</button>
            </div>
        `;
        document.body.appendChild(presentationWindow);
        return presentationWindow;
    }

    showSlideInPresentationWindow(presentationWindow, slideIndex) {
        if (this.debug) console.log('Showing slide in presentation mode:', slideIndex);
    
        const slideContainer = presentationWindow.querySelector('.presentation-slide');
        const slideContent = presentationWindow.querySelector('.presentation-slide-content');
        const prevButton = presentationWindow.querySelector('#prev-slide');
        const nextButton = presentationWindow.querySelector('#next-slide');
        const exitButton = presentationWindow.querySelector('#exit-presentation');
    
        // Get current slide
        const currentSlide = this.currentPresentation.slides[slideIndex];
        if (this.debug) console.log('Current slide data:', currentSlide);
        
        // Clear previous content
        slideContent.innerHTML = '';
        slideContainer.className = 'presentation-slide';
    
        // Apply slide background and patterns
        if (currentSlide.background) {
            slideContainer.style.backgroundColor = currentSlide.background.value;
            if (currentSlide.background.type !== 'color') {
                slideContainer.classList.add(`bg-pattern-${currentSlide.background.type}`);
            }
        }
    
        // Create presentation version of elements
        if (currentSlide.elements) {
            currentSlide.elements.forEach(element => {
                const presentationElement = document.createElement('div');
                presentationElement.className = `presentation-element presentation-${element.type}`;
                
                // Apply all styles consistently
                this.applyElementStyles(presentationElement, element);
    
                if (element.type === 'text') {
                    const textContent = document.createElement('div');
                    textContent.className = 'presentation-text';
                    textContent.textContent = element.content;
                    textContent.style.padding = '8px';
                    textContent.style.width = '100%';
                    textContent.style.height = '100%';
                    
                    // Apply text styles
                    if (element.textStyle) {
                        this.applyTextStyleToElement(textContent, element.textStyle);
                    }
    
                    presentationElement.appendChild(textContent);
                } else if (element.type === 'image') {
                    const img = document.createElement('img');
                    img.src = element.content;
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.display = 'block';
                    
                    if (element.background === 'transparent') {
                        img.style.mixBlendMode = 'multiply';
                    }
                    
                    presentationElement.appendChild(img);
                }
    
                slideContent.appendChild(presentationElement);
            });
        }

        // Navigation setup
        prevButton.disabled = slideIndex === 0;
        nextButton.disabled = slideIndex === this.currentPresentation.slides.length - 1;

        const prevHandler = () => {
            if (slideIndex > 0) {
                this.showSlideInPresentationWindow(presentationWindow, slideIndex - 1);
            }
        };

        const nextHandler = () => {
            if (slideIndex < this.currentPresentation.slides.length - 1) {
                this.showSlideInPresentationWindow(presentationWindow, slideIndex + 1);
            }
        };

        prevButton.removeEventListener('click', prevHandler);
        nextButton.removeEventListener('click', nextHandler);
        prevButton.addEventListener('click', prevHandler);
        nextButton.addEventListener('click', nextHandler);

        exitButton.onclick = () => {
            document.body.removeChild(presentationWindow);
        };
    }

    async openPresentation() {
        try {
            if (this.hasUnsavedChanges()) {
                if (!confirm('Do you want to save the current presentation?')) {
                    return;
                }
                await this.savePresentation();
            }
    
            const openDialog = new FileOpenDialog(fileSystem);
            openDialog.setFileTypes(['odp']); // Only show .odp files
            const file = await openDialog.show();
    
            if (file) {
                this.currentPresentation = JSON.parse(file.content);
                this.currentPresentation.name = file.name.replace('.odp', ''); // Changed from .slideshow to .odp
                this.currentPresentation.path = file.path;
                this.updateUI();
            }
        } catch (error) {
            if (error.message !== 'Open cancelled') {
                console.error('Open failed:', error);
                alert('Failed to open presentation: ' + error.message);
            }
        }
    }

    async savePresentation() {
        if (!this.currentPresentation.path) {
            return this.savePresentationAs();
        }
    
        try {
            const parentPath = fileSystem.getParentPath(this.currentPresentation.path);
            
            const finalPath = await fileSystem.saveFile(
                parentPath,
                this.currentPresentation.name,  // Name without extension
                JSON.stringify(this.currentPresentation),
                'odp'  // <- Add this! Explicitly specify odp type
            );
    
            this.currentPresentation.path = finalPath;
            this.saveToLocalState();
            this.flashMessage('Saved!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save presentation: ' + error.message);
        }
    }
    
    async savePresentationAs() {
        try {
            const cleanName = this.currentPresentation.name.replace(/\.odp$/i, '');
            
            const saveDialog = new FileSaveDialog(
                fileSystem,
                JSON.stringify(this.currentPresentation),
                cleanName,
                { type: 'slideshow' }  // Add this options object with type
            );
            
            const result = await saveDialog.show({
                defaultPath: this.defaultPath,
                defaultExtension: '.odp',  // This should help enforce the extension
                filters: ['.odp']
            });
            
            if (result) {
                // Store result.path before saving to filesystem
                const resultPath = result.path;
                const resultName = result.filename.replace(/\.odp$/i, '');
                
                // Explicitly save with odp type
                const finalPath = await fileSystem.saveFile(
                    resultPath,
                    resultName,
                    JSON.stringify(this.currentPresentation),
                    'odp'  // <- Add this! Explicitly specify odp type
                );
                
                this.currentPresentation.name = resultName;
                this.currentPresentation.path = finalPath;
                this.updateUI();
                this.saveToLocalState();
                this.flashMessage('Saved!');
            }
            
        } catch (error) {
            if (error.message !== 'Save cancelled') {
                console.error('Save failed:', error);
                alert('Failed to save presentation: ' + error.message);
            }
        }
    }

    // New method to add text box
    addTextBox() {
        console.log('Adding new text box'); // Debug log
        
        // Get the current slide
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        if (!currentSlide) {
            console.error('No current slide found');
            return;
        }
    
        // Initialize elements array if it doesn't exist
        if (!currentSlide.elements) {
            currentSlide.elements = [];
        }
    
        // Create new text box with explicit positioning
        const { element, domElement } = this.createDraggableElement('text', 'Click to edit');
        
        // Get the slide content container
        const slideContent = this.contentArea.querySelector('#slide-content');
        if (!slideContent) {
            console.error('Slide content container not found');
            return;
        }
    
        // Add the element to both the data model and DOM
        currentSlide.elements.push(element);
        slideContent.appendChild(domElement);
    
        // Focus the new text box
        const textarea = domElement.querySelector('textarea');
        if (textarea) {
            textarea.focus();
            textarea.select();
        }
    
        // Update slide state
        this.updateCurrentSlide();
        this.saveState();
    }

    // Update the importImage method
    async importImage() {
        try {
            const openDialog = new FileOpenDialog(fileSystem);
            openDialog.setFileTypes(['png', 'jpg', 'jpeg', 'gif', 'image']);
            const file = await openDialog.show();
    
            if (file) {
                // Handle the image content properly based on its type
                let imageContent;
                if (typeof file.content === 'string') {
                    imageContent = file.content.startsWith('data:image/') ? 
                        file.content : 
                        `data:image/png;base64,${file.content}`;
                } else if (file.content instanceof ArrayBuffer) {
                    const bytes = new Uint8Array(file.content);
                    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
                    imageContent = `data:image/png;base64,${btoa(binary)}`;
                } else if (Array.isArray(file.content)) {
                    const binary = String.fromCharCode.apply(null, file.content);
                    imageContent = `data:image/png;base64,${btoa(binary)}`;
                }
    
                if (imageContent) {
                    const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
                    const { element, domElement } = this.createDraggableElement('image', imageContent);
                    
                    // Add error handling for the image
                    const img = domElement.querySelector('img');
                    img.onload = async () => {
                        // Once image is loaded, process it for transparency
                        const transparentImageContent = await this.removeImageBackground(img);
                        img.src = transparentImageContent;
                        element.content = transparentImageContent;
                        this.updateCurrentSlide();
                    };
                    
                    img.onerror = () => {
                        console.error('Failed to load image:', imageContent.substring(0, 100) + '...');
                        alert('Failed to load image. The image data may be corrupted or in an unsupported format.');
                        domElement.remove();
                    };
                    
                    currentSlide.elements.push(element);
                    this.contentArea.querySelector('#slide-content').appendChild(domElement);
                    
                    // Save the current state
                    this.updateCurrentSlide();
                    this.saveState();
                }
            }
        } catch (error) {
            if (error.message !== 'Open cancelled') {
                console.error('Import failed:', error);
                alert('Failed to import image: ' + error.message);
            }
        }
    }

    loadLastPresentation() {
        const lastPresentation = localStorage.getItem('elxaos_slideshow_current');
        if (lastPresentation) {
            try {
                this.currentPresentation = JSON.parse(lastPresentation);
                this.updateUI();
            } catch {
                this.newPresentation();
            }
        } else {
            this.newPresentation();
        }
    }
    
    saveToLocalState() {
        localStorage.setItem('elxaos_slideshow_current', 
            JSON.stringify(this.currentPresentation)
        );
    }
    
    hasUnsavedChanges() {
        // Get the current presentation from local storage
        const savedState = localStorage.getItem('elxaos_slideshow_current');
        if (!savedState) return true;
        
        // Compare current state with saved state
        const currentState = JSON.stringify(this.currentPresentation);
        return currentState !== savedState;
    }

    flashMessage(message) {
        const statusElement = this.contentArea.querySelector('.slideshow-status');
        const originalText = statusElement.textContent;
        
        statusElement.textContent = message;
        setTimeout(() => {
            statusElement.textContent = originalText;
        }, 1000);
    }

    exit() {
        // Find and close the window
        const windowElement = this.contentArea.closest('.program-window');
        if (windowElement) {
            const closeEvent = new CustomEvent('windowclose', {
                detail: { windowId: windowElement.id }
            });
            document.dispatchEvent(closeEvent);
            windowElement.remove();
        }
    }
}

// Create and export default instance
export const slideshow = new Slideshow();