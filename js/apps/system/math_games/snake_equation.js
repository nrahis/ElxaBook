export class SnakeEquation {
    constructor() {
        this.difficulties = {
            easy: { speed: 150, maxOperators: 1, maxNumbers: 10 },
            medium: { speed: 120, maxOperators: 2, maxNumbers: 20 },
            hard: { speed: 90, maxOperators: 3, maxNumbers: 30 }
        };
        this.difficulty = 'easy';
        this.snake = [];
        this.food = [];
        this.powerUps = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameInterval = null;
        this.currentEquation = [];
        this.score = 0;
        this.gridSize = 20;
        this.targetValue = 0;
        this.powerUpActive = null;
        this.powerUpTimer = null;

        this.highScores = {
            easy: this.loadHighScores('easy'),
            medium: this.loadHighScores('medium'),
            hard: this.loadHighScores('hard')
        };
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupEventListeners();
    }

    loadHighScores(difficulty) {
        const scores = localStorage.getItem(`snakeEquation_highScores_${difficulty}`);
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScore(score) {
        const scores = this.highScores[this.difficulty];
        scores.push(score);
        scores.sort((a, b) => b - a); // Sort in descending order
        if (scores.length > 5) scores.length = 5; // Keep only top 5
        this.highScores[this.difficulty] = scores;
        localStorage.setItem(
            `snakeEquation_highScores_${this.difficulty}`,
            JSON.stringify(scores)
        );
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="snake-equation-container">
                <div class="game-header">
                    <div class="controls">
                        <button class="difficulty-btn active" data-difficulty="easy">EASY</button>
                        <button class="difficulty-btn" data-difficulty="medium">MEDIUM</button>
                        <button class="difficulty-btn" data-difficulty="hard">HARD</button>
                        <button class="start-btn">START GAME</button>
                    </div>
                    <div class="score-display">Score: <span class="score">0</span></div>
                </div>
                <div class="high-scores">
                    <div class="high-scores-title">HIGH SCORES</div>
                    <div class="high-scores-list"></div>
                </div>
                <div class="target-equation">
                    Target: <span class="target-value">?</span>
                </div>
                <div class="current-equation">
                    Current: <span class="equation-display"></span>
                </div>
                <canvas class="game-canvas"></canvas>
                <div class="game-over-overlay">
                    <div class="game-over-content">
                        <div class="game-over-message"></div>
                        <div class="final-score"></div>
                        <div class="new-high-score hidden">NEW HIGH SCORE!</div>
                        <button class="retry-btn">TRY AGAIN</button>
                    </div>
                </div>
            </div>
        `;

        this.canvas = this.contentArea.querySelector('.game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        this.updateHighScoresDisplay();
    }

    updateHighScoresDisplay() {
        const highScoresList = this.contentArea.querySelector('.high-scores-list');
        const scores = this.highScores[this.difficulty];
        
        highScoresList.innerHTML = scores.length > 0 
            ? scores.map((score, index) => `<div>${index + 1}. ${score}</div>`).join('')
            : '<div>No scores yet</div>';
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        this.contentArea.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficulty = btn.dataset.difficulty;
                this.contentArea.querySelectorAll('.difficulty-btn').forEach(b => 
                    b.classList.toggle('active', b === btn)
                );
            });
        });

        this.contentArea.querySelector('.start-btn').addEventListener('click', () => {
            this.startGame();
        });

        this.contentArea.querySelector('.retry-btn').addEventListener('click', () => {
            this.contentArea.querySelector('.game-over-overlay').style.display = 'none';
            this.startGame();
        });
    }

    startGame() {
        // Reset game state
        this.snake = [{ x: 10, y: 10 }];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.currentEquation = [];
        this.generateTarget();
        this.spawnFood();

        // Clear previous interval if exists
        if (this.gameInterval) clearInterval(this.gameInterval);

        // Start game loop
        this.gameInterval = setInterval(() => {
            this.update();
            this.draw();
        }, this.difficulties[this.difficulty].speed);

        // Update UI
        this.updateScore();
        this.contentArea.querySelector('.start-btn').textContent = 'RESTART';

        this.powerUps = [];
        this.powerUpActive = null;
        if (this.powerUpTimer) clearTimeout(this.powerUpTimer);
        this.spawnPowerUp();

        this.contentArea.querySelector('.game-over-overlay').style.display = 'none';
    }

    showTemporaryMessage(message) {
        const overlay = this.contentArea.querySelector('.game-over-overlay');
        const messageEl = overlay.querySelector('.game-over-message');
        messageEl.textContent = message;
        messageEl.style.color = '#00ff00';  // Success color
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 1500);
    }

    gameOver(message) {
        clearInterval(this.gameInterval);
        
        // Check for high score
        const isNewHighScore = this.checkNewHighScore();
        if (isNewHighScore) {
            this.saveHighScore(this.score);
            this.updateHighScoresDisplay();
        }

        // Flash the screen red
        const overlay = this.contentArea.querySelector('.game-over-overlay');
        overlay.classList.add('flash');
        
        // Update game over content
        const content = this.contentArea.querySelector('.game-over-content');
        content.querySelector('.game-over-message').textContent = message;
        content.querySelector('.final-score').textContent = `Final Score: ${this.score}`;
        content.querySelector('.new-high-score').classList.toggle('hidden', !isNewHighScore);
        
        // Show the overlay
        setTimeout(() => {
            overlay.classList.remove('flash');
            overlay.style.display = 'flex';
        }, 500);
    }

    checkNewHighScore() {
        const scores = this.highScores[this.difficulty];
        return scores.length < 5 || this.score > Math.min(...scores);
    }

    generateTarget() {
        const { maxNumbers } = this.difficulties[this.difficulty];
        this.targetValue = Math.floor(Math.random() * maxNumbers) + 1;
        this.contentArea.querySelector('.target-value').textContent = this.targetValue;
    }

    spawnFood() {
        const { maxNumbers, maxOperators } = this.difficulties[this.difficulty];
        this.food = [];

        // Add numbers
        for (let i = 0; i < 3; i++) {
            this.food.push({
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                value: Math.floor(Math.random() * maxNumbers) + 1,
                type: 'number'
            });
        }

        // Add operators
        const operators = maxOperators === 1 ? ['+'] : 
                         maxOperators === 2 ? ['+', '-'] : 
                         ['+', '-', '*'];
        
        for (let i = 0; i < 2; i++) {
            this.food.push({
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                value: operators[Math.floor(Math.random() * operators.length)],
                type: 'operator'
            });
        }
    }

    handleKeyPress(e) {
        switch(e.key.toLowerCase()) {
            case 'arrowup':
            case 'w':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'arrowdown':
            case 's':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'arrowleft':
            case 'a':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'arrowright':
            case 'd':
                if (this.direction !== 'left') this.nextDirection = 'right';
                break;
        }
    }

    spawnPowerUp() {
        const powerUpTypes = [
            { type: 'slowTime', color: '#ffff00', symbol: '⌛', duration: 5000 },
            { type: 'shield', color: '#4169e1', symbol: '🛡️', duration: 3000 },
            { type: 'doublePoints', color: '#ffa500', symbol: '2×', duration: 7000 }
        ];

        // Remove old power-ups
        this.powerUps = [];

        // 20% chance to spawn a power-up
        if (Math.random() < 0.2) {
            const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            this.powerUps.push({
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                ...powerUp
            });
        }

        // Schedule next power-up spawn
        setTimeout(() => this.spawnPowerUp(), 10000);
    }

    activatePowerUp(powerUp) {
        this.powerUpActive = powerUp;

        // Clear any existing power-up timer
        if (this.powerUpTimer) clearTimeout(this.powerUpTimer);

        // Apply power-up effect
        switch (powerUp.type) {
            case 'slowTime':
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => {
                    this.update();
                    this.draw();
                }, this.difficulties[this.difficulty].speed * 1.5);
                break;
            case 'doublePoints':
                // Effect handled in score calculation
                break;
            case 'shield':
                // Effect handled in collision detection
                break;
        }

        // Set timer to end power-up
        this.powerUpTimer = setTimeout(() => {
            this.deactivatePowerUp();
        }, powerUp.duration);

        // Visual feedback
        const message = `${powerUp.type.toUpperCase()} ACTIVATED!`;
        this.showTemporaryMessage(message);
    }

    deactivatePowerUp() {
        if (this.powerUpActive?.type === 'slowTime') {
            clearInterval(this.gameInterval);
            this.gameInterval = setInterval(() => {
                this.update();
                this.draw();
            }, this.difficulties[this.difficulty].speed);
        }
        this.powerUpActive = null;
    }

    showTemporaryMessage(message) {
        const messageEl = this.contentArea.querySelector('.game-message');
        messageEl.textContent = message;
        messageEl.style.display = 'block';
        messageEl.style.color = '#00ff00';  // Success color
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 1500);
    }

    update() {
        // Update snake direction
        this.direction = this.nextDirection;

        // Calculate new head position
        const head = { ...this.snake[0] };
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check for collisions with walls or self
        if (this.checkCollision(head)) {
            this.gameOver('Game Over! Your snake crashed!');
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check for power-up collision
        const powerUpIndex = this.powerUps.findIndex(p => p.x === head.x && p.y === head.y);
        if (powerUpIndex !== -1) {
            const powerUp = this.powerUps[powerUpIndex];
            this.activatePowerUp(powerUp);
            this.powerUps.splice(powerUpIndex, 1);
        }

        // Check for food collision
        const foodIndex = this.food.findIndex(f => f.x === head.x && f.y === head.y);
        if (foodIndex !== -1) {
            const foodItem = this.food[foodIndex];
            this.currentEquation.push(foodItem);
            this.food.splice(foodIndex, 1);
            
            // Check if we need more food
            if (this.food.length === 0) {
                this.spawnFood();
            }

            // Check equation
            this.checkEquation();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }

    checkEquation() {
        const equation = this.currentEquation.map(item => item.value).join(' ');
        const equationDisplay = this.contentArea.querySelector('.equation-display');
        equationDisplay.textContent = equation;

        // Only evaluate if we have a valid equation (number-operator-number)
        if (this.currentEquation.length >= 3 && 
            this.currentEquation[0].type === 'number' && 
            this.currentEquation[1].type === 'operator' && 
            this.currentEquation[2].type === 'number') {
            
            try {
                const result = eval(equation);
                if (result === this.targetValue) {
                    this.score += 100;
                    this.updateScore();
                    this.currentEquation = [];
                    equationDisplay.textContent = '';
                    this.generateTarget();
                    this.spawnFood();
                }
            } catch (e) {
                // Invalid equation, continue playing
            }
        }
    }

    checkCollision(head) {
        // Wall collision
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return this.powerUpActive?.type !== 'shield';  // Shield prevents wall collision
        }

        // Self collision (skip if shield is active)
        return this.powerUpActive?.type !== 'shield' && 
               this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#0f0f3f';
        for (let i = 0; i < this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#00ff00' : '#00cc00';
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw power-up status if active
        if (this.powerUpActive) {
            this.ctx.fillStyle = this.powerUpActive.color;
            this.ctx.font = '12px "Press Start 2P"';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(
                `${this.powerUpActive.type.toUpperCase()} ACTIVE!`,
                this.canvas.width - 10,
                20
            );
        }

        // Draw food
        this.food.forEach(food => {
            this.ctx.fillStyle = food.type === 'number' ? '#ff00ff' : '#00ffff';
            this.ctx.fillRect(
                food.x * this.gridSize,
                food.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            // Draw food value
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                food.value.toString(),
                food.x * this.gridSize + this.gridSize/2,
                food.y * this.gridSize + this.gridSize/2 + 5
            );
        });
    }

    updateScore() {
        this.contentArea.querySelector('.score').textContent = this.score;
    }
}

export const snakeEquation = new SnakeEquation();