import { fileSystem } from '../storage.js';
import { Calculator } from './calculator.js';

export class ScientificCalculator extends Calculator {
    constructor(fileSystem) {
        super(fileSystem);
    }

    // Override renderUI to add scientific function buttons
    renderUI(contentArea) {
        super.renderUI(contentArea);
        
        // Find the calculator buttons container
        const buttonsContainer = contentArea.querySelector('.calculator-buttons');
        
        // Create a new row for scientific functions
        const scientificRow = document.createElement('div');
        scientificRow.className = 'button-row scientific-functions';
        scientificRow.innerHTML = `
            <button class="calc-button scientific" data-value="sin(">sin</button>
            <button class="calc-button scientific" data-value="cos(">cos</button>
            <button class="calc-button scientific" data-value="tan(">tan</button>
            <button class="calc-button scientific" data-value="sqrt(">√</button>
            <button class="calc-button scientific" data-value="pow(">x²</button>
        `;
        
        // Insert the new row at the beginning of the buttons container
        buttonsContainer.insertBefore(scientificRow, buttonsContainer.firstElementChild);
    }

    // Override setupEventListeners to add scientific function listeners
    setupEventListeners() {
        super.setupEventListeners();
        
        // Add listeners for scientific function buttons
        const scientificButtons = this.contentArea.querySelectorAll('.calc-button.scientific');
        scientificButtons.forEach(button => {
            button.addEventListener('click', () => this.appendScientificFunction(button.dataset.value));
        });
    }

    // Custom method to append scientific functions
    appendScientificFunction(func) {
        try {
            const value = parseFloat(this.input.value);
            
            switch(func) {
                case 'sqrt(':
                    // Square root
                    this.input.value = Math.sqrt(value).toString();
                    break;
                case 'pow(':
                    // Square the current value
                    this.input.value = Math.pow(value, 2).toString();
                    break;
                case 'sin(':
                    // Sine (converting degrees to radians)
                    this.input.value = Math.sin(value * Math.PI / 180).toString();
                    break;
                case 'cos(':
                    // Cosine (converting degrees to radians)
                    this.input.value = Math.cos(value * Math.PI / 180).toString();
                    break;
                case 'tan(':
                    // Tangent (converting degrees to radians)
                    this.input.value = Math.tan(value * Math.PI / 180).toString();
                    break;
            }
        } catch {
            // If any calculation fails, show Error
            this.input.value = 'Error';
        }
    }

    // Override calculateResult to handle more complex expressions
    calculateResult() {
        try {
            // Use a more robust evaluation method
            const result = eval(this.input.value);
            const calculation = `${this.input.value} = ${result}`;
            this.history.push(calculation);
            
            // Round to 10 decimal places and convert to string
            this.input.value = Number(result.toFixed(10)).toString();
            this.saveToLocalState();
        } catch (error) {
            this.input.value = 'Error';
        }
    }

    // Additional scientific methods
    factorial() {
        const num = parseFloat(this.input.value);
        if (Number.isInteger(num) && num >= 0) {
            let result = 1;
            for (let i = 2; i <= num; i++) {
                result *= i;
            }
            this.input.value = result.toString();
        } else {
            this.input.value = 'Error';
        }
    }

    // Degree/Radian toggle
    toggleAngleMode() {
        // This could be implemented with a global or instance variable to track mode
        // and adjust trigonometric calculations accordingly
    }
}

// Create and export the scientific calculator instance
export const scientificCalculator = new ScientificCalculator(fileSystem);