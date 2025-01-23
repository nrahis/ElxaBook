import { fileSystem } from '../../storage.js';
import { FileOpenDialog } from '../../dialogs/file_open_dialog.js';
import { FileSaveDialog } from '../../dialogs/file_save_dialog.js';

class Notepad {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.currentDocument = {
            name: 'Untitled.txt',
            content: '',
            path: null
        };
        this.wordWrap = true;
        this.fontSize = 16;
        this.modified = false;
        this.defaultPath = `/ElxaOS/Users/${fileSystem.currentUsername}/Documents`;
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupEventListeners();
        this.loadLastSession();
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="ex-notepad-container">
                <div class="ex-notepad-menubar">
                    <div class="ex-notepad-menu-item" data-menu="file">File</div>
                    <div class="ex-notepad-menu-item" data-menu="edit">Edit</div>
                    <div class="ex-notepad-menu-item" data-menu="format">Format</div>
                    <div class="ex-notepad-menu-item" data-menu="help">Help</div>
                </div>
                <textarea class="ex-notepad-textarea" spellcheck="false"></textarea>
                <div class="ex-notepad-status">
                    <span class="ex-notepad-status-modified"></span>
                    <span class="ex-notepad-status-info">
                        <span class="ex-notepad-char-count">Characters: 0</span>
                        <span class="ex-notepad-cursor-position">Ln 1, Col 1</span>
                    </span>
                </div>
            </div>
        `;

        this.elements = {
            textarea: this.contentArea.querySelector('.ex-notepad-textarea'),
            menubar: this.contentArea.querySelector('.ex-notepad-menubar'),
            statusModified: this.contentArea.querySelector('.ex-notepad-status-modified'),
            charCount: this.contentArea.querySelector('.ex-notepad-char-count'),
            cursorPosition: this.contentArea.querySelector('.ex-notepad-cursor-position')
        };
    }

    setupEventListeners() {
        // Menu handling
        this.setupMenus();
        
        // Text changes
        this.elements.textarea.addEventListener('input', () => {
            this.handleTextChange();
            this.updateCharCount();
        });

        this.elements.textarea.addEventListener('keydown', (e) => {
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
                }
            }
        });

        // Cursor position tracking
        this.elements.textarea.addEventListener('keyup', () => this.updateCursorPosition());
        this.elements.textarea.addEventListener('click', () => this.updateCursorPosition());
        this.elements.textarea.addEventListener('select', () => this.updateCursorPosition());

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
                { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
                { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
                { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
                { label: 'Delete', action: 'delete', shortcut: 'Del' },
                { type: 'separator' },
                { label: 'Select All', action: 'selectAll', shortcut: 'Ctrl+A' }
            ],
            format: [
                { label: 'Word Wrap', action: 'wordWrap', type: 'checkbox', checked: this.wordWrap },
                { type: 'separator' },
                { label: 'Font Size', submenu: [
                    { label: 'Increase', action: 'increaseFontSize', shortcut: 'Ctrl+Plus' },
                    { label: 'Decrease', action: 'decreaseFontSize', shortcut: 'Ctrl+Minus' },
                    { label: 'Reset', action: 'resetFontSize' }
                ]}
            ],
            help: [
                { label: 'About Notepad', action: 'about' }
            ]
        };

        let activeMenu = null;
        const menuItems = this.elements.menubar.querySelectorAll('.ex-notepad-menu-item');
        
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
            if (!e.target.closest('.ex-notepad-menu-item') && 
                !e.target.closest('.ex-notepad-menu-dropdown')) {
                this.closeMenus();
                activeMenu = null;
            }
        });
    }

    showMenu(menuItem, items) {
        const dropdown = document.createElement('div');
        dropdown.className = 'ex-notepad-menu-dropdown';
        
        items.forEach(item => {
            if (item.type === 'separator') {
                dropdown.appendChild(document.createElement('hr'));
                return;
            }

            const menuEntry = document.createElement('div');
            menuEntry.className = 'ex-notepad-menu-entry';
            
            if (item.submenu) {
                menuEntry.classList.add('has-submenu');
                menuEntry.innerHTML = `
                    <span>${item.label}</span>
                    <div class="ex-notepad-submenu">${this.createSubmenu(item.submenu)}</div>
                `;
            } else {
                menuEntry.innerHTML = `
                    <span>${item.label}</span>
                    ${item.shortcut ? `<span class="ex-notepad-shortcut">${item.shortcut}</span>` : ''}
                `;
                
                if (item.type === 'checkbox') {
                    menuEntry.classList.add('checkbox');
                    if (item.checked) menuEntry.classList.add('checked');
                }
                
                menuEntry.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleMenuAction(item.action);
                    this.closeMenus();
                });
            }
            
            dropdown.appendChild(menuEntry);
        });

        menuItem.appendChild(dropdown);
        menuItem.classList.add('active');
    }

    createSubmenu(items) {
        const submenu = document.createElement('div');
        submenu.className = 'ex-notepad-submenu';
        
        items.forEach(item => {
            const entry = document.createElement('div');
            entry.className = 'ex-notepad-menu-entry';
            
            entry.innerHTML = `
                <span>${item.label}</span>
                ${item.shortcut ? `<span class="ex-notepad-shortcut">${item.shortcut}</span>` : ''}
            `;
            
            entry.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleMenuAction(item.action);
                this.closeMenus();
            });
            
            submenu.appendChild(entry);
        });
        
        return submenu.outerHTML;
    }

    closeMenus() {
        this.elements.menubar.querySelectorAll('.ex-notepad-menu-item').forEach(item => {
            item.classList.remove('active');
            const dropdown = item.querySelector('.ex-notepad-menu-dropdown');
            if (dropdown) dropdown.remove();
        });
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new':
                this.newDocument();
                break;
            case 'open':
                this.openDocument();
                break;
            case 'save':
                this.saveDocument();
                break;
            case 'saveAs':
                this.saveDocumentAs();
                break;
            case 'exit':
                this.closeWindow();
                break;
            case 'wordWrap':
                this.toggleWordWrap();
                break;
            case 'increaseFontSize':
                this.changeFontSize(2);
                break;
            case 'decreaseFontSize':
                this.changeFontSize(-2);
                break;
            case 'resetFontSize':
                this.resetFontSize();
                break;
            case 'about':
                this.showAbout();
                break;
            case 'undo':
                document.execCommand('undo');
                break;
            case 'redo':
                document.execCommand('redo');
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
            case 'delete':
                document.execCommand('delete');
                break;
            case 'selectAll':
                this.elements.textarea.select();
                break;
        }
    }

    handleTextChange() {
        if (!this.modified) {
            this.modified = true;
            this.updateModifiedStatus();
        }
    }

    updateCharCount() {
        const count = this.elements.textarea.value.length;
        this.elements.charCount.textContent = `Characters: ${count}`;
    }

    updateCursorPosition() {
        const text = this.elements.textarea.value;
        const position = this.elements.textarea.selectionStart;
        
        // Calculate line and column
        const lines = text.substr(0, position).split('\n');
        const currentLine = lines.length;
        const currentColumn = lines[lines.length - 1].length + 1;
        
        this.elements.cursorPosition.textContent = `Ln ${currentLine}, Col ${currentColumn}`;
    }

    // Document management methods remain the same as they don't involve CSS classes
    async newDocument() {
        if (this.modified && await this.confirmSave()) {
            await this.saveDocument();
        }
        
        this.currentDocument = {
            name: 'Untitled.txt',
            content: '',
            path: null
        };
        this.elements.textarea.value = '';
        this.modified = false;
        this.updateTitle();
        this.updateModifiedStatus();
        this.updateCharCount();
    }

    updateModifiedStatus() {
        this.elements.statusModified.textContent = this.modified ? '●' : '';
        this.updateTitle();
    }

    updateTitle() {
        const windowElement = this.contentArea.closest('.program-window');
        if (windowElement) {
            const titleElement = windowElement.querySelector('.window-title');
            if (titleElement) {
                titleElement.textContent = `${this.currentDocument.name}${this.modified ? ' *' : ''} - Notepad`;
            }
        }
    }

    toggleWordWrap() {
        this.wordWrap = !this.wordWrap;
        this.elements.textarea.style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre';
        
        // Update menu checkbox
        const menuItem = this.elements.menubar.querySelector('[data-action="wordWrap"]');
        if (menuItem) {
            menuItem.classList.toggle('checked', this.wordWrap);
        }
    }

    changeFontSize(delta) {
        this.fontSize = Math.max(8, Math.min(72, this.fontSize + delta));
        this.elements.textarea.style.fontSize = `${this.fontSize}px`;
    }

    resetFontSize() {
        this.fontSize = 16;
        this.elements.textarea.style.fontSize = `${this.fontSize}px`;
    }

    showAbout() {
        alert(
            `'Notepad for ${CONFIG.system.name}\n\n' +
            '${CONFIG.system.fullVersion()}0\n' +
            'A simple text editor for ${CONFIG.system.name}\n\n' +
            '${CONFIG.system.copyright()}'`
        );
    }

    async openDocument() {
        try {
            // Check for unsaved changes first
            if (this.isModified) {
                const save = confirm('Do you want to save changes to the current document?');
                if (save) {
                    await this.saveDocument();
                }
            }
    
            const openDialog = new FileOpenDialog(this.fileSystem);
            const file = await openDialog.show();
            
            // Load the selected file
            this.currentFile = file;
            this.textarea.value = file.content;
            this.updateTitle();
            this.setModified(false);
            
        } catch (error) {
            if (error.message !== 'Open cancelled') {
                console.error('Open failed:', error);
                alert('Failed to open file: ' + error.message);
            }
        }
    }

    async saveDocument() {
        if (this.currentFile) {
            // Direct save if we already have a file
            try {
                this.fileSystem.saveFile(
                    this.currentFile.path,
                    this.currentFile.name,
                    this.elements.textarea.value, // Use this.elements.textarea instead of this.textarea
                    'text'
                );
                this.modified = false;
                this.updateModifiedStatus();
            } catch (error) {
                console.error('Save failed:', error);
                alert('Failed to save file: ' + error.message);
            }
        } else {
            // If no current file, do Save As
            await this.saveDocumentAs();
        }
    }
    
    async saveDocumentAs() {
        try {
            const saveDialog = new FileSaveDialog(
                this.fileSystem,
                this.elements.textarea.value, // Use this.elements.textarea instead of this.textarea
                this.currentDocument.name || 'Untitled.txt'
            );
            
            const result = await saveDialog.show();
            
            // Update the current file reference
            this.currentDocument = {
                name: result.filename,
                content: this.elements.textarea.value,
                path: result.path
            };
            this.modified = false;
            this.updateModifiedStatus();
            this.updateTitle();
            
        } catch (error) {
            if (error.message !== 'Save cancelled') {
                console.error('Save failed:', error);
                alert('Failed to save file: ' + error.message);
            }
        }
    }

    confirmSave() {
        return confirm('Do you want to save changes to ' + this.currentDocument.name + '?');
    }

    loadLastSession() {
        try {
            const lastSession = localStorage.getItem('elxaos_notepad_session');
            if (lastSession) {
                const session = JSON.parse(lastSession);
                // Verify the file still exists
                const file = fileSystem.getFile(session.path);
                if (file) {
                    this.currentDocument = {
                        name: session.name,
                        content: file.content,
                        path: session.path
                    };
                    this.elements.textarea.value = file.content;
                    this.updateTitle();
                    this.updateCharCount();
                }
            }
        } catch (error) {
            console.error('Failed to load last session:', error);
        }
    }

    saveSession() {
        if (this.currentDocument.path) {
            localStorage.setItem('elxaos_notepad_session', JSON.stringify({
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
export { Notepad };