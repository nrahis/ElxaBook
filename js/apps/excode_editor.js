import { CATReference } from './cat_reference.js';
import { CATHighlighter } from './cat_highlighter.js';
import { CATParser } from './cat_parser.js';
import { CATExecutor } from './cat_executor.js';
import { ElxaMagicInterpreter } from './elxa_magic_interpreter.js';

class EXCode {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.currentDocument = {
            name: 'Untitled.cat',
            content: '',
            path: null
        };
        this.fontSize = 16;
        this.modified = false;
        this.defaultPath = `/ElxaOS/Users/${fileSystem.currentUsername}/Documents`;
        this.reference = new CATReference();
        this.showingReference = false;
        this.highlighter = new CATHighlighter();
        this.updateHighlightDebounced = this.debounce(this.updateHighlight.bind(this), 50);
        
        // Create new instances of parser and executor
        this.parser = new CATParser();
        this.magicInterpreter = new ElxaMagicInterpreter();
        this.executor = new CATExecutor(this.magicInterpreter);

    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupTabSwitching();
        this.setupEventListeners();
        this.loadLastSession();
        this.updateHighlight(); // Initial highlight
    }

    switchTab(tabName) {
        // Update tab active states
        this.elements.tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    
        // Update content visibility
        this.elements.tabContents.forEach(content => {
            if (content.dataset.content === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    
        // If switching to help tab, ensure reference is initialized
        if (tabName === 'help' && !this.referenceInitialized) {
            this.reference.initialize(this.elements.helpPanel);
            this.referenceInitialized = true;
        }
    }
    
    // Add this to the initialize method of EXCode, after this.renderUI():
    setupTabSwitching() {
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    renderUI() {
        // Previous UI rendering code remains the same until the editor container
        this.contentArea.innerHTML = `
            <div class="ex-code-container">
                <div class="ex-code-sidebar">
                    <div class="sidebar-tabs">
                        <div class="tab active" data-tab="files">Files</div>
                        <div class="tab" data-tab="help">Help</div>
                    </div>
                    <div class="sidebar-content">
                        <div class="ex-code-files tab-content active" data-content="files">
                            <div class="sidebar-header">EXPLORER</div>
                            <div class="file-tree"></div>
                        </div>
                        <div class="ex-code-help tab-content" data-content="help">
                            <!-- Reference content will be inserted here -->
                        </div>
                    </div>
                </div>
                <div class="ex-code-main">
                    <div class="ex-code-menubar">
                        <div class="ex-code-menu-item" data-menu="file">File</div>
                        <div class="ex-code-menu-item" data-menu="edit">Edit</div>
                        <div class="ex-code-menu-item" data-menu="view">View</div>
                        <div class="ex-code-menu-item" data-menu="run">Run</div>
                        <div class="ex-code-menu-item" data-menu="help">Help</div>
                    </div>
                    <div class="ex-code-editor-container">
                        <div class="editor-wrapper">
                            <div class="line-numbers"></div>
                            <div class="editor-content">
                                <pre class="syntax-highlighter"></pre>
                                <textarea class="ex-code-editor" spellcheck="false"></textarea>
                            </div>
                        </div>
                        <div class="context-help"></div>
                    </div>
                    <div class="ex-code-console">
                        <div class="console-header">Console</div>
                        <div class="console-output"></div>
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            editor: this.contentArea.querySelector('.ex-code-editor'),
            lineNumbers: this.contentArea.querySelector('.line-numbers'),
            menubar: this.contentArea.querySelector('.ex-code-menubar'),
            fileTree: this.contentArea.querySelector('.file-tree'),
            console: this.contentArea.querySelector('.ex-code-console'),
            consoleHeader: this.contentArea.querySelector('.console-header'), // Add this line
            consoleOutput: this.contentArea.querySelector('.console-output'),
            helpPanel: this.contentArea.querySelector('.ex-code-help'),
            contextHelp: this.contentArea.querySelector('.context-help'),
            tabs: this.contentArea.querySelectorAll('.sidebar-tabs .tab'),
            tabContents: this.contentArea.querySelectorAll('.tab-content'),
            highlighter: this.contentArea.querySelector('.syntax-highlighter'),
            editorWrapper: this.contentArea.querySelector('.editor-wrapper')
        };

        // Initialize the reference panel
        this.reference.initialize(this.elements.helpPanel);

        // Set initial font size
        this.updateFontSize();
        
        // Initialize with some line numbers
        this.updateLineNumbers();
    }

    updateFontSize() {
        const elements = [
            this.elements.editor,
            this.elements.highlighter,
            this.elements.lineNumbers
        ];
        
        elements.forEach(element => {
            if (element) {
                element.style.fontSize = `${this.fontSize}px`;
                element.style.lineHeight = '1.5';
            }
        });
    }

    updateHighlight() {
        if (!this.elements.editor || !this.elements.highlighter) return;
        
        const text = this.elements.editor.value;
        const highlightedContent = this.highlighter.highlight(text);
        
        // Only update if content has changed
        if (this.elements.highlighter.innerHTML !== highlightedContent) {
            this.elements.highlighter.innerHTML = highlightedContent;
        }
    }

    updateEditorPreserveCursor() {
        const cursorPos = this.elements.editor.selectionStart;
        const text = this.elements.editor.value;
        
        // Update highlighter with raw text
        if (this.elements.highlighter) {
            this.elements.highlighter.innerHTML = this.highlighter.highlight(text);
        }
        
        // Restore cursor position
        this.elements.editor.setSelectionRange(cursorPos, cursorPos);
    }

    setupEventListeners() {

        // console resize
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        this.elements.consoleHeader.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = this.elements.console.offsetHeight;
            
            document.documentElement.style.cursor = 'ns-resize';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaY = startY - e.clientY;
            const newHeight = Math.max(100, Math.min(startHeight + deltaY, window.innerHeight * 0.8));
            this.elements.console.style.height = newHeight + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.documentElement.style.cursor = 'default';
        });

        // Handle text input
        this.elements.editor.addEventListener('input', (e) => {
            // Preserve the raw input value
            const text = e.target.value;
            this.handleTextChange();
            this.updateLineNumbers();
            
            // Use requestAnimationFrame for smooth updates
            requestAnimationFrame(() => {
                if (this.elements.highlighter) {
                    this.elements.highlighter.innerHTML = this.highlighter.highlight(text);
                }
            });
        });

        // Ensure highlighting updates on key events too
        this.elements.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
                // Use requestAnimationFrame for smooth updates
                requestAnimationFrame(() => {
                    this.updateHighlight();
                    this.updateLineNumbers();
                });
            }
            
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.elements.editor.selectionStart;
                const end = this.elements.editor.selectionEnd;
                this.elements.editor.value = this.elements.editor.value.substring(0, start) + '    ' + 
                                           this.elements.editor.value.substring(end);
                this.elements.editor.selectionStart = this.elements.editor.selectionEnd = start + 4;
                this.updateHighlight();
            }
        });

        // Enhanced scroll synchronization
        this.elements.editor.addEventListener('scroll', () => {
            if (this.elements.highlighter) {
                this.elements.highlighter.scrollTop = this.elements.editor.scrollTop;
                this.elements.highlighter.scrollLeft = this.elements.editor.scrollLeft;
            }
            if (this.elements.lineNumbers) {
                this.elements.lineNumbers.scrollTop = this.elements.editor.scrollTop;
            }
        });

        // Handle horizontal scrolling as well
        this.elements.editor.addEventListener('mouseover', () => {
            this.elements.editor.style.overflowX = 'auto';
        });

        this.elements.editor.addEventListener('mouseout', () => {
            if (!this.elements.editor.matches(':focus')) {
                this.elements.editor.style.overflowX = 'hidden';
            }
        });

        // Keep horizontal scroll visible while focused
        this.elements.editor.addEventListener('focus', () => {
            this.elements.editor.style.overflowX = 'auto';
        });

        this.elements.editor.addEventListener('blur', () => {
            if (!this.elements.editor.matches(':hover')) {
                this.elements.editor.style.overflowX = 'hidden';
            }
        });

        // Handle tab key for indentation
        this.elements.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.elements.editor.selectionStart;
                const end = this.elements.editor.selectionEnd;
                this.elements.editor.value = this.elements.editor.value.substring(0, start) + '    ' + 
                                           this.elements.editor.value.substring(end);
                this.elements.editor.selectionStart = this.elements.editor.selectionEnd = start + 4;
                this.updateHighlightDebounced();
            }
        });

        // Add tab switching functionality
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Context-sensitive help
        this.elements.editor.addEventListener('input', () => {
            this.showContextHelp();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggleHelpPanel();
            }
        });

            // Add cursor position tracking
        this.elements.editor.addEventListener('keyup', (e) => {
            this.updateHighlight();
            this.updateCurrentLine();
        });

        this.elements.editor.addEventListener('click', () => {
            this.updateCurrentLine();
        });

        this.elements.editor.addEventListener('focus', () => {
            this.updateCurrentLine();
        });

        // Setup menus
        this.setupMenus();
    }

    updateCurrentLine() {
        // Get current line number
        const text = this.elements.editor.value;
        const pos = this.elements.editor.selectionStart;
        const lines = text.substr(0, pos).split('\n');
        const currentLineNumber = lines.length;
    
        // First pass: remove all current-line classes without modifying content
        const allHighlights = this.elements.highlighter.querySelectorAll('.current-line');
        allHighlights.forEach(highlight => {
            const content = highlight.innerHTML;
            const parent = highlight.parentElement;
            if (parent) {
                const span = document.createElement('span');
                span.innerHTML = content;
                parent.replaceChild(span, highlight);
            }
        });
    
        // Second pass: add highlight to current line
        const allLines = this.elements.highlighter.innerHTML.split('\n');
        if (allLines[currentLineNumber - 1] !== undefined) {
            allLines[currentLineNumber - 1] = 
                `<div class="current-line">${allLines[currentLineNumber - 1]}</div>`;
            this.elements.highlighter.innerHTML = allLines.join('\n');
        }
    }

    handleTextChange() {
        this.modified = true;
        // Additional text change handling...
    }

// ... previous code ...

    setupMenus() {
        const menus = {
            file: [
                { label: 'New File', action: 'new', shortcut: 'Ctrl+N' },
                { label: 'Open...', action: 'open', shortcut: 'Ctrl+O' },
                { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
                { label: 'Save As...', action: 'saveAs' }
            ],
            edit: [
                { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
                { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
                { type: 'separator' },
                { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
                { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
                { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' }
            ],
            view: [
                { label: 'Increase Font Size', action: 'increaseFontSize', shortcut: 'Ctrl+Plus' },
                { label: 'Decrease Font Size', action: 'decreaseFontSize', shortcut: 'Ctrl+Minus' },
                { label: 'Reset Font Size', action: 'resetFontSize' }
            ],
            run: [
                { label: 'Run Program', action: 'run', shortcut: 'F5' },
                { label: 'Clear Console', action: 'clearConsole' }
            ],
            help: [
                { label: 'Toggle Reference Panel', action: 'toggleHelp', shortcut: 'F1' },
                { label: 'Quick Command List', action: 'showCommands' },
                { type: 'separator' },
                { label: 'About CAT Language', action: 'aboutCAT' }
            ]
        };

        // Add click handlers for menu items
        this.elements.menubar.querySelectorAll('.ex-code-menu-item').forEach(menuItem => {
            const menuName = menuItem.dataset.menu;
            const menuItems = menus[menuName];

            menuItem.addEventListener('click', (e) => {
                this.showMenu(e.target, menuItems);
            });
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.handleMenuAction('save');
                        break;
                    case 'n':
                        e.preventDefault();
                        this.handleMenuAction('new');
                        break;
                    case 'o':
                        e.preventDefault();
                        this.handleMenuAction('open');
                        break;
                    case '+':
                        e.preventDefault();
                        this.handleMenuAction('increaseFontSize');
                        break;
                    case '-':
                        e.preventDefault();
                        this.handleMenuAction('decreaseFontSize');
                        break;
                }
            } else if (e.key === 'F5') {
                e.preventDefault();
                this.handleMenuAction('run');
            }
        });
    }

    showMenu(target, items) {
        // Remove any existing menu
        this.removeActiveMenu();

        // Create menu element
        const menu = document.createElement('div');
        menu.className = 'ex-code-dropdown-menu';

        // Add menu items
        items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.innerHTML = `
                    <span>${item.label}</span>
                    ${item.shortcut ? `<span class="shortcut">${item.shortcut}</span>` : ''}
                `;
                menuItem.addEventListener('click', () => {
                    this.handleMenuAction(item.action);
                    this.removeActiveMenu();
                });
                menu.appendChild(menuItem);
            }
        });

        // Position and show menu
        const rect = target.getBoundingClientRect();
        menu.style.top = `${rect.bottom}px`;
        menu.style.left = `${rect.left}px`;
        document.body.appendChild(menu);

        // Add click outside listener
        setTimeout(() => {
            document.addEventListener('click', this.removeActiveMenu.bind(this), { once: true });
        }, 0);
    }

    removeActiveMenu() {
        const activeMenu = document.querySelector('.ex-code-dropdown-menu');
        if (activeMenu) {
            activeMenu.remove();
        }
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new':
                this.newFile();
                break;
            case 'open':
                this.openFile();
                break;
            case 'save':
                this.saveFile();
                break;
            case 'saveAs':
                this.saveFileAs();
                break;
            case 'increaseFontSize':
                this.fontSize = Math.min(this.fontSize + 2, 32);
                this.updateFontSize();
                break;
            case 'decreaseFontSize':
                this.fontSize = Math.max(this.fontSize - 2, 8);
                this.updateFontSize();
                break;
            case 'resetFontSize':
                this.fontSize = 16;
                this.updateFontSize();
                break;
            case 'run':
                this.runProgram();
                break;
            case 'clearConsole':
                this.clearConsole();
                break;
            case 'toggleHelp':
                this.toggleHelpPanel();
                break;
            case 'showCommands':
                this.showQuickCommands();
                break;
            case 'aboutCAT':
                this.showAboutCAT();
                break;
        }
    }

    updateLineNumbers() {
        const lines = this.elements.editor.value.split('\n');
        const lineNumbersHtml = lines.map((_, i) => 
            `<div class="line-number" style="height: 1.5em">${i + 1}</div>`
        ).join('');
        this.elements.lineNumbers.innerHTML = lineNumbersHtml;
        
        // Ensure line numbers container has same padding as editor
        this.elements.lineNumbers.style.paddingTop = 
            window.getComputedStyle(this.elements.editor).paddingTop;
    }

    showContextHelp() {
        const cursorPos = this.elements.editor.selectionStart;
        const text = this.elements.editor.value;
        const currentLine = text.substr(0, cursorPos).split('\n').pop();
        const words = currentLine.trim().split(/\s+/);
        const currentWord = words[words.length - 1];

        if (currentWord && currentWord.length > 0) {
            const matchingCommand = this.findMatchingCommand(currentWord);
            if (matchingCommand) {
                this.showContextHelpPopup(matchingCommand);
            } else {
                this.hideContextHelp();
            }
        } else {
            this.hideContextHelp();
        }
    }

    findMatchingCommand(word) {
        for (const section of Object.values(this.reference.sections)) {
            const command = section.commands.find(cmd => 
                cmd.command.toLowerCase().startsWith(word.toLowerCase())
            );
            if (command) return command;
        }
        return null;
    }

    showContextHelpPopup(command) {
        this.elements.contextHelp.innerHTML = `
            <div class="context-help-content">
                <h4>${command.command}</h4>
                <code>${command.syntax}</code>
                <p>${command.description}</p>
            </div>
        `;
        this.elements.contextHelp.style.display = 'block';
    }

    hideContextHelp() {
        this.elements.contextHelp.style.display = 'none';
    }

    async saveFile() {
        if (!this.currentDocument.path) {
            await this.saveFileAs();
            return;
        }
        try {
            await this.fileSystem.writeFile(this.currentDocument.path, this.elements.editor.value);
            this.modified = false;
            this.writeToConsole(`Saved ${this.currentDocument.name}`);
        } catch (error) {
            this.writeToConsole(`Error saving file: ${error.message}`);
        }
    }

    async saveFileAs() {
        try {
            const path = await this.fileSystem.showSaveDialog({
                defaultPath: this.defaultPath,
                filters: [{ name: 'CAT Files', extensions: ['cat'] }]
            });
            if (path) {
                this.currentDocument.path = path;
                this.currentDocument.name = path.split('/').pop();
                await this.saveFile();
            }
        } catch (error) {
            this.writeToConsole(`Error saving file: ${error.message}`);
        }
    }

    async openFile() {
        try {
            const path = await this.fileSystem.showOpenDialog({
                defaultPath: this.defaultPath,
                filters: [{ name: 'CAT Files', extensions: ['cat'] }]
            });
            if (path) {
                const content = await this.fileSystem.readFile(path);
                this.currentDocument = {
                    name: path.split('/').pop(),
                    content: content,
                    path: path
                };
                this.elements.editor.value = content;
                this.modified = false;
                this.updateHighlight();
                this.updateLineNumbers();
                this.writeToConsole(`Opened ${this.currentDocument.name}`);
            }
        } catch (error) {
            this.writeToConsole(`Error opening file: ${error.message}`);
        }
    }

    newFile() {
        if (this.modified) {
            // Implement save prompt
            // For now, just create new file
        }
        this.currentDocument = {
            name: 'Untitled.cat',
            content: '',
            path: null
        };
        this.elements.editor.value = '';
        this.modified = false;
        this.updateHighlight();
        this.updateLineNumbers();
    }

    runProgram() {
        const code = this.elements.editor.value;
        
        if (!code.trim()) {
            this.writeToConsole("Nothing to run! Try writing some code first.");
            return;
        }
    
        this.writeToConsole("Running program...\n");
    
        // Initialize execution flags and storage
        let hasValidCATCode = false;
        let hasMagicWords = false;
        let parsedAst = null;
        let parsingError = null;
    
        // Step 1: Try to parse as CAT code first
        try {
            const tokens = this.parser.tokenize(code);
            parsedAst = {
                type: 'Program',
                body: []
            };
            
            let current = 0;
            while (current < tokens.length) {
                // Skip newlines
                if (tokens[current].type === this.parser.TOKEN_TYPES.NEWLINE) {
                    current++;
                    continue;
                }
    
                if (tokens[current].type === this.parser.TOKEN_TYPES.KEYWORD) {
                    const statement = this.parser.parseStatement(tokens, current);
                    if (statement) {
                        parsedAst.body.push(statement.value);
                        current = statement.next;
                        hasValidCATCode = true;
                    } else {
                        current++;
                    }
                } else {
                    current++;
                }
            }
        } catch (error) {
            parsingError = error;
            hasValidCATCode = false;
        }
    
        // Step 2: Check for magic words
        const magicPatterns = {
            duck: /(DUCK|duck|Duck|Walter)/i,
            abby: /(ABBY|abby|Abby|Abs)/i,
            elxa: /(ELXA|elxa|Elxa|ex|EX)/i,
            snake: /(Mr\.Snake-e|SNAKE-E|snake|Snake|snake-e|snake-E)/i,
            bad: /(crap|poop|butt|shut up|hate|nuts)/i,
            numbers: /\b\d+\b/,
            binary: /\b[01]+\b/,
            timer: /<timer>=\[\d+(?::\d+)?\]/
        };
    
        hasMagicWords = Object.values(magicPatterns).some(pattern => pattern.test(code));
    
        // Step 3: Execute code based on what we found
        try {
            // Execute CAT code if valid
            if (hasValidCATCode && parsedAst && parsedAst.body) {
                // Ensure executor has magic interpreter
                if (!this.executor.magicInterpreter) {
                    this.executor.magicInterpreter = this.magicInterpreter;
                }
    
                // Reset executor state
                this.executor.variables.clear();
    
                // Execute the CAT code
                const catOutput = this.executor.execute(parsedAst);
                
                // Display CAT output
                catOutput.forEach(line => {
                    if (line && line.trim()) {
                        this.writeToConsole(line);
                    }
                });
    
                // Display final variable state
                const variables = Array.from(this.executor.variables.entries())
                    .map(([name, value]) => `${name} = ${value}`)
                    .join('\n');
                    
                if (variables) {
                    this.writeToConsole("\nProgram variables:");
                    this.writeToConsole(variables);
                }
            }
    
            // Process magic words if present - do this regardless of CAT code validity
            if (hasMagicWords) {
                // Create separate instance for magic interpretation to avoid interference
                const magicInterpreter = new ElxaMagicInterpreter();
                const magicOutput = magicInterpreter.interpretMagicCode(code);
                
                // Set up timer callback
                const handleTimerUpdate = (updates) => {
                    updates.forEach(update => this.writeToConsole(update));
                };
                
                // Register callbacks for any active timers
                for (const [timerId] of magicInterpreter.activeTimers) {
                    magicInterpreter.timerCallbacks.set(timerId, handleTimerUpdate);
                }
                
                // Output magic responses
                magicOutput.forEach(line => {
                    if (line && line.trim()) {
                        this.writeToConsole(line);
                    }
                });
            }
    
            // If neither CAT nor magic words were found
            if (!hasValidCATCode && !hasMagicWords) {
                this.writeToConsole("😺 Meow! I'm not sure what to do with this code.");
                this.writeToConsole("Try:");
                this.writeToConsole("- Using CAT commands like MEOW or PURR");
                this.writeToConsole("- Writing some magic words like 'Abby' or 'DUCK'");
                this.writeToConsole("- Or combine them both!");
                return;
            }
    
            // Only show finished message if we actually executed something
            if (hasValidCATCode || hasMagicWords) {
                this.writeToConsole("\nProgram finished! 😺");
            }
    
        } catch (error) {
            this.writeToConsole(`🙀 Oops! Something went wrong: ${error.message}`);
            
            if (error.line) {
                const friendly = this.parser.formatError(error);
                this.writeToConsole(`Line ${friendly.line}: ${friendly.message}`);
            }
        }
    }

    writeToConsole(text) {
        const line = document.createElement('div');
        line.className = 'console-line';
        line.textContent = text;
        this.elements.consoleOutput.appendChild(line);
        this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
    }

    clearConsole() {
        this.elements.consoleOutput.innerHTML = '';
    }

    loadLastSession() {
        try {
            const lastSession = localStorage.getItem('excode_last_session');
            if (lastSession) {
                const session = JSON.parse(lastSession);
                this.currentDocument = session.currentDocument || this.currentDocument;
                this.fontSize = session.fontSize || this.fontSize;
                
                if (this.elements && this.elements.editor) {
                    this.elements.editor.value = this.currentDocument.content;
                    this.updateFontSize();
                    this.updateLineNumbers();
                    this.updateHighlight();
                }
            }
        } catch (error) {
            console.warn('Failed to load last session:', error);
        }
    }

    saveSession() {
        try {
            const session = {
                currentDocument: this.currentDocument,
                fontSize: this.fontSize
            };
            localStorage.setItem('excode_last_session', JSON.stringify(session));
        } catch (error) {
            console.warn('Failed to save session:', error);
        }
    }
}

export { EXCode };