import { fileSystem } from '../../storage.js';

export class Notepad {
    constructor() {
        this.currentDocument = {
            name: 'Untitled',
            content: '',
            path: '/Documents'  // Update default path
        };
        this.wordWrap = true;
        this.fontSize = 16;
    }

    initialize(contentArea) {
        this.contentArea = contentArea; // Store reference to contentArea
        this.renderUI(contentArea);
        this.setupEventListeners();
        this.loadLastDocument();
    }

    renderUI(contentArea) {
        contentArea.innerHTML = `
            <div class="notepad-container">
                <div class="notepad-menu">
                    <div class="menu-item">
                        File
                        <div class="menu-dropdown">
                            <button id="notepad-new">New</button>
                            <button id="notepad-open">Open...</button>
                            <button id="notepad-save">Save</button>
                            <button id="notepad-save-as">Save As...</button>
                            <hr>
                            <button id="notepad-exit">Exit</button>
                        </div>
                    </div>
                    <div class="menu-item">
                        Edit
                        <div class="menu-dropdown">
                            <button id="notepad-cut">Cut</button>
                            <button id="notepad-copy">Copy</button>
                            <button id="notepad-paste">Paste</button>
                            <hr>
                            <button id="notepad-select-all">Select All</button>
                        </div>
                    </div>
                    <div class="menu-item">
                        Format
                        <div class="menu-dropdown">
                            <button id="notepad-word-wrap">Word Wrap</button>
                            <button id="notepad-font-increase">Increase Font Size</button>
                            <button id="notepad-font-decrease">Decrease Font Size</button>
                        </div>
                    </div>
                    <div class="menu-item">
                        Debug
                        <div class="menu-dropdown">
                            <button id="check-storage">Check Storage</button>
                        </div>
                    </div>
                </div>
                <textarea id="notepad-textarea" spellcheck="false"></textarea>
                <div class="notepad-status">
                    <span id="char-count">Characters: 0</span>
                    <span id="current-file">Untitled</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Get elements
        this.textarea = this.contentArea.querySelector('#notepad-textarea');
        this.charCount = this.contentArea.querySelector('#char-count');
        this.currentFileDisplay = this.contentArea.querySelector('#current-file');

        // File menu
        this.contentArea.querySelector('#notepad-new').addEventListener('click', () => this.newDocument());
        this.contentArea.querySelector('#notepad-open').addEventListener('click', () => this.openDocument());
        this.contentArea.querySelector('#notepad-save').addEventListener('click', () => this.saveDocument());
        this.contentArea.querySelector('#notepad-save-as').addEventListener('click', () => this.saveDocumentAs());
        this.contentArea.querySelector('#notepad-exit').addEventListener('click', () => this.exit());

        // Edit menu
        this.contentArea.querySelector('#notepad-cut').addEventListener('click', () => document.execCommand('cut'));
        this.contentArea.querySelector('#notepad-copy').addEventListener('click', () => document.execCommand('copy'));
        this.contentArea.querySelector('#notepad-paste').addEventListener('click', () => document.execCommand('paste'));
        this.contentArea.querySelector('#notepad-select-all').addEventListener('click', () => this.textarea.select());

        // Format menu
        this.contentArea.querySelector('#notepad-word-wrap').addEventListener('click', () => this.toggleWordWrap());
        this.contentArea.querySelector('#notepad-font-increase').addEventListener('click', () => this.changeFontSize(2));
        this.contentArea.querySelector('#notepad-font-decrease').addEventListener('click', () => this.changeFontSize(-2));

        // Text change events
        this.textarea.addEventListener('input', () => this.updateCharCount());
        this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Debug
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

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item')) {
                menuItems.forEach(item => item.classList.remove('active'));
            }
        });
    }

    updateCharCount() {
        this.charCount.textContent = `Characters: ${this.textarea.value.length}`;
    }

    handleKeyDown(e) {
        // Handle Ctrl+S for save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveDocument();
        }
    }

    newDocument() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('Do you want to save changes to ' + this.currentDocument.name + '?')) {
                return;
            }
            this.saveDocument();
        }

        this.currentDocument = {
            name: 'Untitled',
            content: '',
            path: 'Documents/ElxaOS/Notes'
        };
        this.textarea.value = '';
        this.currentFileDisplay.textContent = 'Untitled';
        this.updateCharCount();
    }

    async openDocument() {
        // Prevent default file open behavior
        event?.preventDefault();
    
        const documents = fileSystem.getDocuments();
        const fileList = Object.values(documents);
    
        if (fileList.length === 0) {
            alert('No saved documents found.');
            return;
        }
    
        const fileNames = fileList.map(doc => doc.name).join('\n');
        const selected = prompt(
            'Select a file to open:\n\n' + fileNames + '\n\nEnter file name:',
            fileList[0].name
        );
    
        if (selected) {
            const doc = fileList.find(doc => doc.name === selected);
            if (doc) {
                this.currentDocument = {
                    name: doc.name,
                    content: doc.content,
                    path: doc.path || '/Documents'
                };
                this.textarea.value = doc.content;
                this.currentFileDisplay.textContent = doc.name;
                this.updateCharCount();
                this.saveToLocalState();
            } else {
                alert('File not found.');
            }
        }
    }
    
    loadLastDocument() {
        try {
            const lastDocument = localStorage.getItem('elxaos_notepad_current');
            if (lastDocument) {
                const doc = JSON.parse(lastDocument);
                // Verify the document still exists in the file system
                const existingDoc = fileSystem.getDocument(doc.path, doc.name);
                if (existingDoc) {
                    this.currentDocument = doc;
                    this.textarea.value = doc.content;
                    this.currentFileDisplay.textContent = doc.name;
                    this.updateCharCount();
                } else {
                    // If the document no longer exists, start with a new document
                    this.newDocument();
                }
            }
        } catch (error) {
            console.error('Error loading last document:', error);
            this.newDocument();
        }
    }

    saveDocument() {
        event?.preventDefault();
        
        if (this.currentDocument.name === 'Untitled') {
            this.saveDocumentAs();
            return;
        }
    
        // Ensure the path starts with a forward slash
        const path = this.currentDocument.path.startsWith('/') ? 
            this.currentDocument.path : 
            '/' + this.currentDocument.path;
        
        this.currentDocument.content = this.textarea.value;
        fileSystem.saveDocument(
            path,
            this.currentDocument.name,
            this.currentDocument.content
        );
    
        this.showSaveNotification();
        this.saveToLocalState();
    }
    
    saveDocumentAs() {
        event?.preventDefault();
        
        const fileName = prompt('Enter file name:', this.currentDocument.name);
        if (!fileName) return;
    
        this.currentDocument.name = fileName;
        // Ensure the path starts with a forward slash
        this.currentDocument.path = '/Documents';
        
        this.currentFileDisplay.textContent = fileName;
        this.currentDocument.content = this.textarea.value;
        
        fileSystem.saveDocument(
            this.currentDocument.path,
            fileName,
            this.currentDocument.content
        );
    
        this.showSaveNotification();
        this.saveToLocalState();
    }    

    showSaveNotification() {
        const originalText = this.currentFileDisplay.textContent;
        this.currentFileDisplay.textContent = 'Saved!';
        setTimeout(() => {
            this.currentFileDisplay.textContent = originalText;
        }, 1000);
    }

    saveToLocalState() {
        localStorage.setItem('elxaos_notepad_current', JSON.stringify(this.currentDocument));
    }

    hasUnsavedChanges() {
        return this.textarea.value !== this.currentDocument.content;
    }

    toggleWordWrap() {
        this.wordWrap = !this.wordWrap;
        this.textarea.style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'nowrap';
        const menuItem = this.contentArea.querySelector('#notepad-word-wrap');
        menuItem.style.backgroundColor = this.wordWrap ? '#b89fc7' : '';
        menuItem.style.color = this.wordWrap ? 'white' : '';
    }

    changeFontSize(delta) {
        this.fontSize = Math.min(Math.max(this.fontSize + delta, 12), 24);
        this.textarea.style.fontSize = `${this.fontSize}px`;
    }

    exit() {
        if (this.hasUnsavedChanges()) {
            if (confirm('Do you want to save changes to ' + this.currentDocument.name + '?')) {
                this.saveDocument();
            }
        }
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
export const notepad = new Notepad();