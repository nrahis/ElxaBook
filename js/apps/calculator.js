import { fileSystem } from '../storage.js';

export class Calculator {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.currentExpression = '';
        this.memory = 0;
        this.history = [];
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI(contentArea);
        this.setupEventListeners();
        this.setupMenus();
        this.loadLastState();
    }

    renderUI(contentArea) {
        contentArea.innerHTML = `
            <div class="calculator-container">
                <div class="calculator-menu">
                    <div class="menu-item">
                        Edit
                        <div class="menu-dropdown">
                            <button id="calc-copy">Copy</button>
                            <button id="calc-paste">Paste</button>
                            <hr>
                            <button id="calc-history">View History</button>
                            <button id="calc-clear-history">Clear History</button>
                        </div>
                    </div>
                </div>
                <div class="calculator-display">
                    <input type="text" id="calculator-input" readonly>
                    <div id="memory-indicator" class="memory-indicator"></div>
                </div>
                <div class="calculator-buttons">
                    <div class="button-row">
                        <button class="calc-button" data-value="7">7</button>
                        <button class="calc-button" data-value="8">8</button>
                        <button class="calc-button" data-value="9">9</button>
                        <button class="calc-button operator" data-value="/">/</button>
                        <button class="calc-button memory" id="calc-memory-plus">M+</button>
                    </div>
                    <div class="button-row">
                        <button class="calc-button" data-value="4">4</button>
                        <button class="calc-button" data-value="5">5</button>
                        <button class="calc-button" data-value="6">6</button>
                        <button class="calc-button operator" data-value="*">*</button>
                        <button class="calc-button memory" id="calc-memory-minus">M-</button>
                    </div>
                    <div class="button-row">
                        <button class="calc-button" data-value="1">1</button>
                        <button class="calc-button" data-value="2">2</button>
                        <button class="calc-button" data-value="3">3</button>
                        <button class="calc-button operator" data-value="-">-</button>
                        <button class="calc-button" id="calc-clear">C</button>
                    </div>
                    <div class="button-row">
                        <button class="calc-button" data-value="0">0</button>
                        <button class="calc-button" data-value=".">.</button>
                        <button class="calc-button" id="calc-equals">=</button>
                        <button class="calc-button operator" data-value="+">+</button>
                        <button class="calc-button" id="calc-backspace">⌫</button>
                    </div>
                </div>
            </div>
        `.trim(); // Use trim() to remove any potential white space
    }

    setupEventListeners() {
        // Number and operator buttons
        const buttons = this.contentArea.querySelectorAll('.calc-button:not(.memory):not(#calc-clear):not(#calc-equals):not(#calc-backspace)');
        buttons.forEach(button => {
            button.addEventListener('click', () => this.appendToDisplay(button.dataset.value));
        });
    
        // Clear button
        this.contentArea.querySelector('#calc-clear').addEventListener('click', () => this.clearDisplay());
    
        // Equals button
        this.contentArea.querySelector('#calc-equals').addEventListener('click', () => this.calculateResult());
    
        // Backspace button
        this.contentArea.querySelector('#calc-backspace').addEventListener('click', () => this.backspace());
    
        // Edit menu buttons
        this.contentArea.querySelector('#calc-copy').addEventListener('click', () => this.copyToClipboard());
        this.contentArea.querySelector('#calc-paste').addEventListener('click', () => this.pasteFromClipboard());
        this.contentArea.querySelector('#calc-history').addEventListener('click', () => this.showHistory());
        this.contentArea.querySelector('#calc-clear-history').addEventListener('click', () => this.clearHistory());
    
        // Memory buttons
        this.contentArea.querySelector('#calc-memory-plus').addEventListener('click', () => this.memoryAdd());
        this.contentArea.querySelector('#calc-memory-minus').addEventListener('click', () => this.memorySubtract());
    
        // Input reference
        this.input = this.contentArea.querySelector('#calculator-input');
        this.memoryIndicator = this.contentArea.querySelector('#memory-indicator');
        
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

    copyToClipboard() {
        const value = this.input.value;
        navigator.clipboard.writeText(value).then(() => {
            this.flashMessage('Copied!');
        });
    }

    pasteFromClipboard() {
        navigator.clipboard.readText().then((text) => {
            // Only paste if it's a valid number
            if (!isNaN(text)) {
                this.input.value = text.trim();
            } else {
                this.flashMessage('Invalid number!');
            }
        }).catch(() => {
            this.flashMessage('Paste failed');
        });
    }

    showHistory() {
        if (this.history.length === 0) {
            alert('No calculation history');
            return;
        }

        const historyText = this.history.join('\n');
        alert(`Calculation History:\n${historyText}`);
    }

    clearHistory() {
        this.history = [];
        this.flashMessage('History Cleared');
    }

    calculateResult() {
        try {
            const result = eval(this.input.value);
            const calculation = `${this.input.value} = ${result}`;
            this.history.push(calculation);
            this.input.value = Number(result.toFixed(10)).toString();
            this.saveToLocalState(); // Save state after calculation
        } catch (error) {
            this.input.value = 'Error';
        }
    }

    appendToDisplay(value) {
        // Prevent multiple decimal points
        if (value === '.' && this.input.value.includes('.')) return;
        
        // Prevent leading zeros
        if (this.input.value === '0' && value !== '.') {
            this.input.value = value;
        } else {
            this.input.value += value;
        }
    }

    clearDisplay() {
        this.input.value = '0';
        this.currentExpression = '';
    }

    backspace() {
        this.input.value = this.input.value.slice(0, -1) || '0';
    }

    memoryAdd() {
        const current = parseFloat(this.input.value);
        if (!isNaN(current)) {
            this.memory += current;
            this.updateMemoryIndicator();
        }
    }

    memorySubtract() {
        const current = parseFloat(this.input.value);
        if (!isNaN(current)) {
            this.memory -= current;
            this.updateMemoryIndicator();
        }
    }

    memoryClear() {
        this.memory = 0;
        this.updateMemoryIndicator();
    }

    memoryRecall() {
        this.input.value = this.memory.toString();
    }

    memoryStore() {
        const current = parseFloat(this.input.value);
        if (!isNaN(current)) {
            this.memory = current;
            this.updateMemoryIndicator();
        }
    }

    updateMemoryIndicator() {
        this.memoryIndicator.textContent = this.memory !== 0 ? `M: ${this.memory}` : '';
    }

    // Local state management
    saveToLocalState() {
        const state = {
            currentValue: this.input.value,
            memory: this.memory,
            history: this.history
        };
        localStorage.setItem('elxaos_calculator_state', JSON.stringify(state));
    }

    loadLastState() {
        const savedState = localStorage.getItem('elxaos_calculator_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.input.value = state.currentValue || '0';
            this.memory = state.memory || 0;
            this.history = state.history || [];
            this.updateMemoryIndicator();
        } else {
            this.input.value = '0';
        }
    }

    flashMessage(message) {
        const originalValue = this.input.value;
        this.input.value = message;
        setTimeout(() => {
            this.input.value = originalValue;
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
export const calculator = new Calculator(fileSystem);