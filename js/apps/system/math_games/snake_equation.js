export class SnakeEquation {
    constructor() {
        this.difficulties = {
            easy: { speed: 200, operators: ['+', '-'] },
            medium: { speed: 150, operators: ['+', '-', '*'] },
            hard: { speed: 100, operators: ['+', '-', '*', '/'] }
        };
        this.difficulty = 'easy';
        this.gridSize = { width: 16, height: 12 }; // Game grid dimensions (now only used for logic)
        // REMOVED this.cellSize (not needed, size controlled by CSS)
        this.gameStatus = 'paused'; 
        this.score = 0;
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.equation = [];
        this.target = 0;
        this.timer = null;

        this.emojis = {
            snakeHead: '🐍',
            snakeBody: '🟩',
            food: '🐾',
            win: '😸',
            lose: '😿',
            math: '🔢'
        };
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupEventListeners();
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="se-snake-equation-container">
                <div class="se-snake-equation-header">
                    <div class="se-score-container">Score: <span id="se-score">0</span></div>
                    <div class="se-status-container" id="se-game-status">${this.emojis.math}</div>
                </div>
                <div class="se-game-grid" id="se-game-grid"></div>
                <div class="se-target-container">Target: <span id="se-target"></span></div>
                <div class="se-equation-container" id="se-equation"></div>
                <div class="se-snake-equation-footer">
                    <button class="se-difficulty-button active" data-difficulty="easy">Easy</button>
                    <button class="se-difficulty-button" data-difficulty="medium">Medium</button>
                    <button class="se-difficulty-button" data-difficulty="hard">Hard</button>
                    <button id="se-start-button">Start</button>
                </div>
            </div>
        `;

        this.updateGameStatus(this.gameStatus);
        this.setupGrid();
    }

    setupGrid() {
        const grid = this.contentArea.querySelector('#se-game-grid');
        // MODIFIED: Set only number of columns, height is auto-calculated by CSS
        grid.style.gridTemplateColumns = `repeat(${this.gridSize.width}, 1fr)`;
        grid.innerHTML = ''; // Clear any existing cells

        for (let y = 0; y < this.gridSize.height; y++) {
            for (let x = 0; x < this.gridSize.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'se-game-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                grid.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        // Difficulty buttons
        this.contentArea.querySelectorAll('.se-difficulty-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.difficulty = e.target.dataset.difficulty;
                this.contentArea.querySelectorAll('.se-difficulty-button').forEach(b =>
                    b.classList.toggle('active', b === e.target)
                );
                this.resetGame();
            });
        });

        // Start button
        this.contentArea.querySelector('#se-start-button').addEventListener('click', () => {
            if (this.gameStatus === 'paused' || this.gameStatus === 'over' || this.gameStatus === 'won') {
                this.startGame();
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameStatus === 'running') {
                switch (e.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        if (this.direction !== 'down') this.direction = 'up';
                        break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        if (this.direction !== 'up') this.direction = 'down';
                        break;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        if (this.direction !== 'right') this.direction = 'left';
                        break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        if (this.direction !== 'left') this.direction = 'right';
                        break;
                }
            }
        });
    }

    startGame() {
        this.resetGame();
        this.gameStatus = 'running';
        this.updateGameStatus(this.gameStatus);
        this.generateFood();
        this.generateTarget();
        this.moveSnake(); // Start the movement
    }

    resetGame() {
        this.stopTimer();
        this.score = 0;
        this.direction = 'right';
        this.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }]; // Initial snake
        this.equation = [];
        this.target = 0;

        this.updateScore();
        this.renderSnake();
        this.updateEquationDisplay();
        this.clearAllFood();

        // Reset Start Button Text
        const startButton = this.contentArea.querySelector('#se-start-button');
        startButton.textContent = 'Start';

        if (this.gameStatus !== 'running') {
            this.gameStatus = 'paused';
            this.updateGameStatus('paused');
        }
    }

    moveSnake() {
        this.stopTimer();
        const { speed } = this.difficulties[this.difficulty];
        this.timer = setInterval(() => {
            const head = { ...this.snake[0] };

            // Move the head
            switch (this.direction) {
                case 'up': head.y--; break;
                case 'down': head.y++; break;
                case 'left': head.x--; break;
                case 'right': head.x++; break;
            }

            // Check for collisions (game over)
            if (this.isCollision(head)) {
                this.gameOver();
                return;
            }

            this.snake.unshift(head); // Add new head

            // Check if food is eaten
            if (head.x === this.food.x && head.y === this.food.y) {
                this.eatFood();
            } else {
                this.snake.pop(); // Remove tail
            }

            this.renderSnake();
        }, speed);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    isCollision(head) {
        return (
            head.x < 0 || head.x >= this.gridSize.width ||
            head.y < 0 || head.y >= this.gridSize.height ||
            this.snake.some((part, index) => index !== 0 && part.x === head.x && part.y === head.y)
        );
    }

    eatFood() {
        if (typeof this.food.value === 'number') {
            this.equation.push(this.food.value);
        } else if (this.food.value) { // operator
            this.equation.push(this.food.value);
        }

        this.updateEquationDisplay();

        if (this.equation.length >= 3) { // Check equation when at least 3 elements
            this.evaluateEquation();
        }

        this.generateFood();
    }

    generateFood() {
        this.clearAllFood();
        const availableOperators = this.difficulties[this.difficulty].operators;
        const randomOperator = availableOperators[Math.floor(Math.random() * availableOperators.length)];
        const randomNumber = Math.floor(Math.random() * 10); // 0-9

        // Alternate between numbers and operators
        const foodType = (this.equation.length === 0 || typeof this.equation[this.equation.length - 1] === 'number') ? 'operator' : 'number';

        do {
            this.food = {
                x: Math.floor(Math.random() * this.gridSize.width),
                y: Math.floor(Math.random() * this.gridSize.height),
                value: foodType === 'number' ? randomNumber : randomOperator
            };
        } while (this.snake.some(part => part.x === this.food.x && part.y === this.food.y));

        this.renderFood();
    }

    renderFood() {
        // No need to clear previous food position here anymore, we're doing it in generateFood()

        const cell = this.contentArea.querySelector(`.se-game-cell[data-x="${this.food.x}"][data-y="${this.food.y}"]`);
        if (cell) {
            cell.textContent = this.emojis.food;
            cell.dataset.food = this.food.value;
        }
    }

    renderSnake() {
        this.contentArea.querySelectorAll('.se-game-cell').forEach(cell => {
            if (!cell.dataset.food) {
                cell.textContent = ''; // Clear all cells not containing food
            }
            delete cell.dataset.snake;
            delete cell.dataset.head;
        });

        this.snake.forEach((part, index) => {
            const cell = this.contentArea.querySelector(`.se-game-cell[data-x="${part.x}"][data-y="${part.y}"]`);
            if (cell) {
                if (index === 0) {
                    cell.textContent = this.emojis.snakeHead; // Snake head
                    cell.dataset.head = 'true';
                } else {
                    cell.textContent = this.emojis.snakeBody; // Snake body
                }
                cell.dataset.snake = 'true';
            }
        });
    }

    clearCell(cellData) {
        const cell = this.contentArea.querySelector(`.se-game-cell[data-x="${cellData.x}"][data-y="${cellData.y}"]`);
        if (cell) {
            cell.textContent = '';
            delete cell.dataset.food;
        }
    }

    clearAllFood() {
        this.contentArea.querySelectorAll('.se-game-cell').forEach(cell => {
            if (cell.dataset.food) {
                cell.textContent = '';
                delete cell.dataset.food;
            }
        });
    }

    evaluateEquation() {
        try {
            const result = this.calculateEquation();
            if (result === this.target) {
                this.score++;
                this.updateScore();
                this.equation = []; // Clear equation
                this.updateEquationDisplay();
                this.generateTarget();
            } else if (!this.isValidEquation(this.equation)) {
                this.gameOver();
            } else if (result !== this.target && this.equation.length >= 5) {
                this.gameOver();
            }
        } catch (error) {
            this.gameOver();
        }
    }

    calculateEquation() {
        let equationString = this.equation.join('');
        // Basic handling for division by zero
        if (equationString.includes('/0')) {
            throw new Error('Division by zero');
        }

        // Replace x with * for multiplication, so eval() can understand
        equationString = equationString.replace(/x/g, '*');

        return Function('"use strict";return (' + equationString + ')')();
    }

    isValidEquation(equation) {
        // Check if the equation alternates between numbers and operators
        for (let i = 0; i < equation.length; i++) {
            if (i % 2 === 0) { // Even positions should be numbers
                if (typeof equation[i] !== 'number') return false;
            } else { // Odd positions should be operators
                if (typeof equation[i] !== 'string' || !this.difficulties[this.difficulty].operators.includes(equation[i])) return false;
            }
        }

        return true;
    }

    generateTarget() {
        this.target = Math.floor(Math.random() * 20) + 1; // Target between 1-20
        this.contentArea.querySelector('#se-target').textContent = this.target;
    }

    updateEquationDisplay() {
        this.contentArea.querySelector('#se-equation').textContent = this.equation.join(' ');
    }

    updateScore() {
        this.contentArea.querySelector('#se-score').textContent = this.score;
    }

    gameOver() {
        this.gameStatus = 'over';
        this.updateGameStatus(this.gameStatus);
        this.stopTimer();

        // Update Start Button Text
        const startButton = this.contentArea.querySelector('#se-start-button');
        startButton.textContent = 'Restart';
    }

    updateGameStatus(status) {
        const statusDisplay = this.contentArea.querySelector('#se-game-status');
        const startButton = this.contentArea.querySelector('#se-start-button');

        // ADD minimum width to status container
        statusDisplay.style.minWidth = "80px"; // Adjust this value if needed

        switch (status) {
            case 'paused':
                statusDisplay.textContent = 'Paused';
                startButton.textContent = 'Start';
                break;
            case 'running':
                statusDisplay.textContent = 'Running';
                break;
            case 'over':
                statusDisplay.textContent = this.emojis.lose;
                startButton.textContent = 'Restart';
                break;
            case 'won':
                statusDisplay.textContent = this.emojis.win;
                startButton.textContent = 'Restart';
                break;
            default:
                statusDisplay.textContent = this.emojis.math;
        }
    }
}

// Create and export default instance
export const snakeEquation = new SnakeEquation();