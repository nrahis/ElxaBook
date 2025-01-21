// Snake Equation Game
export class SnakeEquation {
    constructor() {
        this.difficulties = {
            easy: { speed: 150, operators: ['+', '-'] },
            medium: { speed: 100, operators: ['+', '-', '*', '/'] },
            hard: { speed: 75, operators: ['+', '-', '*', '/', '(', ')'] }
        };
        this.difficulty = 'easy';
        this.score = 0;
        this.snake = [];
        this.direction = 'right';
        this.food = {};
        this.operators = [];
        this.intervalId = null;
        this.isGameActive = false; // Flag to indicate if the game is active

        // Constants for game elements
        this.EMPTY = 0;
        this.SNAKE = 1;
        this.FOOD = 2;
        this.OPERATOR = 3;

        // Grid size
        this.gridSize = 20; // 20x20 grid
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupEventListeners();
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="snake-equation-container">
                <div class="snake-equation-header">
                    <div class="snake-equation-title">Snake Equation</div>
                    <div class="snake-equation-controls">
                        <button class="difficulty-button active" data-difficulty="easy">Easy</button>
                        <button class="difficulty-button" data-difficulty="medium">Medium</button>
                        <button class="difficulty-button" data-difficulty="hard">Hard</button>
                        <button class="start-button">Start</button>
                    </div>
                </div>
                <div class="snake-equation-score">Score: <span id="score">0</span></div>
                <div class="snake-equation-grid" id="game-grid"></div>
                <div class="snake-equation-message" id="game-message"></div>
            </div>
        `;
    }

    setupEventListeners() {
        // Difficulty buttons
        this.contentArea.querySelectorAll('.difficulty-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.difficulty = e.target.dataset.difficulty;
                this.contentArea.querySelectorAll('.difficulty-button').forEach(b =>
                    b.classList.toggle('active', b === e.target)
                );
                this.resetGame();
            });
        });

        // Start button
        this.contentArea.querySelector('.start-button').addEventListener('click', () => {
            this.startGame();
        });

        // Key press for snake movement
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    startGame() {
        if (this.isGameActive) return; // Prevent restarting if already active

        this.resetGame(); // Reset before starting
        this.isGameActive = true;

        this.clearMessage();
        const speed = this.difficulties[this.difficulty].speed;
        this.intervalId = setInterval(() => this.gameLoop(), speed);
    }

    resetGame() {
        clearInterval(this.intervalId);
        this.isGameActive = false;

        this.score = 0;
        this.snake = [{ x: 5, y: 5 }]; // Initial snake position
        this.direction = 'right';
        this.generateFood();
        this.generateOperators();
        this.renderGrid();

        this.updateScore();
        this.clearMessage();
    }

    gameLoop() {
        this.moveSnake();
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        this.checkFood();
        this.checkOperator();
        this.renderGrid();
    }

    moveSnake() {
        const head = { ...this.snake[0] };

        // Update head position based on direction
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.snake.unshift(head); // Add new head

        // Remove tail if not eaten food
        if (!this.checkFood()) {
            this.snake.pop();
        }
    }

    checkCollision() {
        const head = this.snake[0];

        // Wall collision
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            return true;
        }

        // Self collision (check if head collides with any body segment except the last one which is about to be removed)
        for (let i = 1; i < this.snake.length - 1; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }

        return false;
    }

    checkFood() {
        const head = this.snake[0];
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10; // Increase score for eating food
            this.updateScore();
            this.generateFood();
            return true; // Snake ate food
        }
        return false;
    }

    checkOperator() {
        const head = this.snake[0];
        const operatorIndex = this.operators.findIndex(op => op.x === head.x && op.y === head.y);
        if (operatorIndex !== -1) {
            // Handle operator collision (e.g., update equation, check if equation is valid)
            const operator = this.operators[operatorIndex];

            // Implement equation building and validation logic here

            this.operators.splice(operatorIndex, 1); // Remove the operator
            this.generateOperators(); // Replace with a new operator
        }
    }

    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize),
                value: Math.floor(Math.random() * 9) + 1 // Number from 1 to 9
            };
        } while (this.isOccupied(this.food.x, this.food.y));
    }

    generateOperators() {
        // Clear existing operators and generate new ones
        this.operators = [];
        const { operators } = this.difficulties[this.difficulty];
        for (let i = 0; i < 3; i++) { // Generate 3 operators at a time
            let operator;
            do {
                operator = {
                    x: Math.floor(Math.random() * this.gridSize),
                    y: Math.floor(Math.random() * this.gridSize),
                    value: operators[Math.floor(Math.random() * operators.length)]
                };
            } while (this.isOccupied(operator.x, operator.y));
            this.operators.push(operator);
        }
    }

    isOccupied(x, y) {
        // Check if the position is occupied by the snake, food, or other operators
        return this.snake.some(segment => segment.x === x && segment.y === y) ||
            (this.food && this.food.x === x && this.food.y === y) ||
            this.operators.some(op => op.x === x && op.y === y);
    }

    gameOver() {
        clearInterval(this.intervalId);
        this.isGameActive = false;
        this.displayMessage('Game Over! 😿 Press "Start" to try again!');
    }

    renderGrid() {
        const grid = this.contentArea.querySelector('#game-grid');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'snake-equation-cell';

                if (this.snake.some(segment => segment.x === x && segment.y === y)) {
                    if (this.snake[0].x === x && this.snake[0].y === y) {
                        cell.classList.add('snake-head'); // Style for snake head
                        cell.innerHTML = '👀'; // Emoji for snake eyes
                    } else {
                        cell.classList.add('snake-body'); // Style for snake body
                    }
                } else if (this.food.x === x && this.food.y === y) {
                    cell.classList.add('food');
                    cell.textContent = this.food.value; // Display food value
                } else if (this.operators.some(op => op.x === x && op.y === y)) {
                    const operator = this.operators.find(op => op.x === x && op.y === y);
                    cell.classList.add('operator');
                    cell.textContent = operator.value; // Display operator
                }

                grid.appendChild(cell);
            }
        }
    }

    handleKeyPress(e) {
        if (!this.isGameActive) return; // Ignore input if game is not active

        switch (e.key) {
            case 'ArrowUp':
                if (this.direction !== 'down') this.direction = 'up';
                break;
            case 'ArrowDown':
                if (this.direction !== 'up') this.direction = 'down';
                break;
            case 'ArrowLeft':
                if (this.direction !== 'right') this.direction = 'left';
                break;
            case 'ArrowRight':
                if (this.direction !== 'left') this.direction = 'right';
                break;
        }
    }

    updateScore() {
        const scoreElement = this.contentArea.querySelector('#score');
        scoreElement.textContent = this.score;
    }

    displayMessage(text) {
        const message = this.contentArea.querySelector('#game-message');
        message.textContent = text;
        message.style.display = 'block';
    }

    clearMessage() {
        const message = this.contentArea.querySelector('#game-message');
        message.textContent = '';
        message.style.display = 'none';
    }
}

export const snakeEquation = new SnakeEquation();