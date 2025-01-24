export class SnakeEquation {
    constructor() {
        this.difficulties = {
            easy: { 
                speed: 200,
                maxOperators: 1,
                maxNumbers: 5,
                baseScore: 10,
                equationBonus: 50,
                targetEquationsPerLevel: 3  // Equations needed to level up
            },
            medium: { 
                speed: 150, 
                maxOperators: 2,
                maxNumbers: 10,
                baseScore: 20,
                equationBonus: 100,
                targetEquationsPerLevel: 4
            },
            hard: { 
                speed: 120, 
                maxOperators: 3,
                maxNumbers: 15,
                baseScore: 30,
                equationBonus: 200,
                targetEquationsPerLevel: 5
            }
        };
        
        // Add these new properties
        this.currentLevel = 1;
        this.equationsCompleted = 0;
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

    generateTarget() {
        const { maxNumbers } = this.difficulties[this.difficulty];
        // Make sure target is achievable with available numbers
        if (this.difficulty === 'easy') {
            // For easy mode, always make target the sum of two numbers between 1 and maxNumbers
            const num1 = Math.floor(Math.random() * maxNumbers) + 1;
            const num2 = Math.floor(Math.random() * maxNumbers) + 1;
            this.targetValue = num1 + num2;
        } else {
            this.targetValue = Math.floor(Math.random() * maxNumbers) + 1;
        }
        this.contentArea.querySelector('.target-value').textContent = this.targetValue;
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        
        // Set contentArea to fill its parent
        this.contentArea.style.height = '100%';
        this.contentArea.style.display = 'flex';
        this.contentArea.style.overflow = 'hidden';
        
        this.renderUI();
        this.setupEventListeners();
        
        // Add resize observer to both contentArea and its parent
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => this.resizeCanvas());
        });
        
        resizeObserver.observe(contentArea);
        if (contentArea.parentElement) {
            resizeObserver.observe(contentArea.parentElement);
        }
        
        // Force initial resize
        requestAnimationFrame(() => this.resizeCanvas());
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
        // First clear any existing content
        this.contentArea.innerHTML = '';
        
        // Create and add the container
        const container = document.createElement('div');
        container.className = 'snake-equation-container';
        
        // Set container to fill available space
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflow = 'hidden';
        
        container.innerHTML = `
            <div class="game-header">
                <div class="controls">
                    <button class="difficulty-btn active" data-difficulty="easy">EASY</button>
                    <button class="difficulty-btn" data-difficulty="medium">MEDIUM</button>
                    <button class="difficulty-btn" data-difficulty="hard">HARD</button>
                    <button class="start-btn">START GAME</button>
                </div>
                <div class="game-info">
                    <div class="score-display">Score: <span class="score">0</span></div>
                    <div class="level-display">Level: <span class="level">1</span></div>
                    <div class="progress-display">Progress: <span class="equations-completed">0</span>/<span class="equations-target">3</span></div>
                </div>
            </div>
            <div class="high-scores">
                <div class="high-scores-title">HIGH SCORES</div>
                <div class="high-scores-list"></div>
            </div>
            <div class="target-equation">Target: <span class="target-value">?</span></div>
            <div class="current-equation">Current: <span class="equation-display"></span></div>
            <canvas class="game-canvas"></canvas>
            <div class="game-message"></div>
            <div class="game-over-overlay">
                <div class="game-over-content">
                    <div class="game-over-message"></div>
                    <div class="final-score"></div>
                    <div class="new-high-score hidden">NEW HIGH SCORE!</div>
                    <button class="retry-btn">TRY AGAIN</button>
                </div>
            </div>
        `;
        
        this.contentArea.appendChild(container);
        
        // Initialize canvas
        this.canvas = container.querySelector('.game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initial canvas size
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        this.updateHighScoresDisplay();
        
        // Force an initial resize
        requestAnimationFrame(() => this.resizeCanvas());
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
        // First ensure proper canvas initialization
        this.resizeCanvas();
        
        // Calculate initial snake position based on actual grid size
        const centerX = Math.floor((this.canvas.width / this.gridSize) / 2);
        const centerY = Math.floor((this.canvas.height / this.gridSize) / 2);
        
        // Reset all game state
        this.snake = [{ x: centerX, y: centerY }];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.currentEquation = [];
        this.food = []; // Clear existing food
        this.currentLevel = 1;
        this.equationsCompleted = 0;
        
        // Clear any existing intervals and timers
        if (this.gameInterval) clearInterval(this.gameInterval);
        if (this.powerUpTimer) clearTimeout(this.powerUpTimer);
        
        // Reset power-up state
        this.powerUps = [];
        this.powerUpActive = null;
        
        // Initialize game elements
        this.generateTarget();
        this.spawnFood(); // This will spawn both regular food and equation parts
        
        // Draw initial state before starting interval
        this.draw();
        
        // Start game loop with current difficulty speed
        this.gameInterval = setInterval(() => {
            this.update();
            this.draw();
        }, this.difficulties[this.difficulty].speed);
        
        // Update UI elements
        this.updateScore();
        this.updateLevelDisplay();
        this.contentArea.querySelector('.start-btn').textContent = 'RESTART';
        this.contentArea.querySelector('.game-over-overlay').style.display = 'none';
        
        // Initialize power-ups
        this.spawnPowerUp();
    }

    resizeCanvas() {
        // Get the container and its dimensions
        const container = this.contentArea.querySelector('.snake-equation-container');
        const containerWidth = container.clientWidth;
        
        // Calculate available height (subtract height of other elements)
        const gameHeader = this.contentArea.querySelector('.game-header');
        const targetEquation = this.contentArea.querySelector('.target-equation');
        const currentEquation = this.contentArea.querySelector('.current-equation');
        const highScores = this.contentArea.querySelector('.high-scores');
        
        const usedHeight = 
            (gameHeader ? gameHeader.offsetHeight : 0) +
            (targetEquation ? targetEquation.offsetHeight : 0) +
            (currentEquation ? currentEquation.offsetHeight : 0) +
            (highScores ? highScores.offsetHeight : 0) +
            60; // Additional padding/margins
        
        const availableHeight = container.clientHeight - usedHeight;
        
        // Calculate the canvas size (use the smaller of width or available height)
        const size = Math.min(containerWidth - 40, availableHeight);
        
        // Set minimum size to prevent tiny canvas
        const minSize = 300;
        const finalSize = Math.max(size, minSize);
        
        // Update canvas dimensions
        this.canvas.width = finalSize;
        this.canvas.height = finalSize;
        
        // Update the CSS as well to ensure proper display
        this.canvas.style.width = `${finalSize}px`;
        this.canvas.style.height = `${finalSize}px`;
        
        // Update grid size based on new canvas size
        this.gridSize = finalSize / 20; // Maintain 20x20 grid
        
        // Redraw the game
        if (this.snake && this.snake.length > 0) {
            this.draw();
        }
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
        
        // Update the score one final time before checking high score
        this.updateScore();
        
        // Check for high score
        const isNewHighScore = this.checkNewHighScore();
        if (isNewHighScore) {
            this.saveHighScore(this.score);
            this.updateHighScoresDisplay();
        }
    
        // Get the overlay and add flash effect
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

    spawnEquationParts() {
        const { maxNumbers, maxOperators } = this.difficulties[this.difficulty];
        const desiredParts = 4;
        const currentParts = this.food.filter(f => f.type === 'number' || f.type === 'operator').length;
        const partsToAdd = desiredParts - currentParts;
    
        for (let i = 0; i < partsToAdd; i++) {
            const isNumber = Math.random() < 0.6;  // 60% chance for number
            let validPosition = false;
            let newItem;
    
            while (!validPosition) {
                let value;
                if (isNumber) {
                    // Generate number based on current level
                    const maxNum = Math.min(maxNumbers, 3 + this.currentLevel);
                    value = Math.floor(Math.random() * maxNum) + 1;
                } else {
                    // Always include both + and - operators
                    const operators = ['+', '-'];
                    if (maxOperators >= 3 && this.currentLevel > 3) {
                        operators.push('*');  // Add multiplication at higher levels
                    }
                    value = operators[Math.floor(Math.random() * operators.length)];
                }
    
                newItem = {
                    x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                    y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                    value: value,
                    type: isNumber ? 'number' : 'operator',
                    points: 5
                };
    
                validPosition = !this.snake.some(segment => 
                    segment.x === newItem.x && segment.y === newItem.y
                ) && !this.food.some(food => 
                    food.x === newItem.x && food.y === newItem.y
                );
            }
    
            this.food.push(newItem);
        }
    }
    
    // Add method to check level progression
    checkLevelProgress() {
        const targetEquations = this.difficulties[this.difficulty].targetEquationsPerLevel;
        if (this.equationsCompleted >= targetEquations) {
            this.currentLevel++;
            this.equationsCompleted = 0;
            this.showTemporaryMessage(`LEVEL ${this.currentLevel}! Speed increased!`);
            
            // Increase game speed
            clearInterval(this.gameInterval);
            const newSpeed = Math.max(
                this.difficulties[this.difficulty].speed - (this.currentLevel * 10),
                50  // Minimum speed limit
            );
            
            this.gameInterval = setInterval(() => {
                this.update();
                this.draw();
            }, newSpeed);
    
            // Update UI
            this.updateLevelDisplay();
        }
    }
    
    // Add method to update level display
    updateLevelDisplay() {
        const levelDisplay = this.contentArea.querySelector('.level');
        const equationsCompleted = this.contentArea.querySelector('.equations-completed');
        const equationsTarget = this.contentArea.querySelector('.equations-target');
        
        if (levelDisplay) levelDisplay.textContent = this.currentLevel;
        if (equationsCompleted) equationsCompleted.textContent = this.equationsCompleted;
        if (equationsTarget) {
            equationsTarget.textContent = this.difficulties[this.difficulty].targetEquationsPerLevel;
        }
    }
    
    // Update the spawnFood method to handle only regular food
    spawnFood() {
        // Count existing regular food items
        const regularFoodCount = this.food.filter(f => f.type === 'food').length;
        
        // Only spawn new regular food if none exists
        if (regularFoodCount === 0) {
            let validPosition = false;
            let newFood;
        
            while (!validPosition) {
                newFood = {
                    x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                    y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                    value: Math.floor(Math.random() * 9) + 1,  // Simple single digit for food
                    type: 'food',
                    points: this.difficulties[this.difficulty].baseScore
                };
        
                validPosition = !this.snake.some(segment => 
                    segment.x === newFood.x && segment.y === newFood.y
                ) && !this.food.some(food => 
                    food.x === newFood.x && food.y === newFood.y
                );
            }
        
            this.food.push(newFood);
        }
    
        // Check if we need equation parts
        const equationParts = this.food.filter(f => f.type === 'number' || f.type === 'operator');
        if (equationParts.length === 0) {
            this.spawnEquationParts();
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
    
        // Check for food collision and handle it
        let foodEaten = false;
        for (let i = this.food.length - 1; i >= 0; i--) {
            if (this.food[i].x === head.x && this.food[i].y === head.y) {
                const foodItem = this.food[i];
                
                // Award points based on food type
                let pointsEarned = foodItem.points;
                if (this.powerUpActive?.type === 'doublePoints') {
                    pointsEarned *= 2;
                }
                this.score += pointsEarned;
                this.updateScore();
                
                // Remove the eaten food
                this.food.splice(i, 1);
    
                if (foodItem.type === 'food') {
                    foodEaten = true;
                } else {
                    // Handle equation pieces
                    this.currentEquation.push(foodItem);
                    this.checkEquation();
                }
            }
        }
    
        // If no food was eaten, remove the tail
        if (!foodEaten) {
            this.snake.pop();
        }
    
        // Check if we need to spawn more food or equation parts
        this.spawnFood();
    }

    checkEquation() {
        const equation = this.currentEquation.map(item => item.value).join(' ');
        const equationDisplay = this.contentArea.querySelector('.equation-display');
        equationDisplay.textContent = equation;
    
        if (this.currentEquation.length >= 3 && 
            this.currentEquation[0].type === 'number' && 
            this.currentEquation[1].type === 'operator' && 
            this.currentEquation[2].type === 'number') {
            
            try {
                const result = eval(equation);
                if (Math.abs(result - this.targetValue) < 0.0001) {
                    // Get bonus from difficulty settings
                    let bonus = this.difficulties[this.difficulty].equationBonus;
                    if (this.powerUpActive?.type === 'doublePoints') {
                        bonus *= 2;
                    }
                    
                    // Award points
                    this.score += bonus;
                    this.updateScore();
                    
                    // Clear current equation
                    this.currentEquation = [];
                    equationDisplay.textContent = '';
                    
                    // Generate new target
                    this.generateTarget();
                    
                    // Show success message
                    this.showTemporaryMessage(`EQUATION COMPLETE! +${bonus} points!`);
                    
                    // Increment equations completed and check level progress
                    this.equationsCompleted++;
                    this.updateLevelDisplay();
                    this.checkLevelProgress();

                    // Clear all equation parts first
                    this.food = this.food.filter(f => f.type === 'food');
                    
                    // Spawn new equation parts with a slight delay
                    setTimeout(() => {
                        this.spawnEquationParts();
                    }, 500);
                }
            } catch (e) {
                // Invalid equation, continue playing
                console.log('Invalid equation:', e);
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
        // Ensure canvas context exists
        if (!this.ctx || !this.canvas || !this.canvas.width || !this.canvas.height) {
            console.error('Canvas not properly initialized');
            return;
        }
        
        // Clear canvas with background
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#0f0f3f';
        this.ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let i = 0; i < this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let i = 0; i < this.canvas.height; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
        
        // Calculate font size based on grid size
        const fontSize = Math.max(this.gridSize * 0.8, 8);
        
        // Draw snake with head highlighted
        if (this.snake && this.snake.length > 0) {
            this.snake.forEach((segment, index) => {
                // Ensure segment coordinates are valid
                if (segment.x >= 0 && segment.x < this.canvas.width / this.gridSize &&
                    segment.y >= 0 && segment.y < this.canvas.height / this.gridSize) {
                    this.ctx.fillStyle = index === 0 ? '#00ff00' : '#00cc00';
                    this.ctx.fillRect(
                        segment.x * this.gridSize,
                        segment.y * this.gridSize,
                        this.gridSize - 1,
                        this.gridSize - 1
                    );
                }
            });
        }
        
        // Draw food and equation pieces
        if (this.food && this.food.length > 0) {
            this.food.forEach(food => {
                // Ensure food coordinates are valid
                if (food.x >= 0 && food.x < this.canvas.width / this.gridSize &&
                    food.y >= 0 && food.y < this.canvas.height / this.gridSize) {
                    const x = food.x * this.gridSize;
                    const y = food.y * this.gridSize;
                    const size = this.gridSize - 1;
                    
                    // Draw different shapes based on food type
                    if (food.type === 'food') {
                        // Regular food - red circle
                        this.ctx.fillStyle = '#ff0000';
                        this.ctx.beginPath();
                        this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                        this.ctx.fill();
                        // Add stem
                        this.ctx.fillStyle = '#008000';
                        this.ctx.fillRect(x + size/2 - 2, y, 4, 4);
                    } else if (food.type === 'number') {
                        // Numbers - purple diamond
                        this.ctx.fillStyle = '#ff00ff';
                        this.ctx.beginPath();
                        this.ctx.moveTo(x + size/2, y);
                        this.ctx.lineTo(x + size, y + size/2);
                        this.ctx.lineTo(x + size/2, y + size);
                        this.ctx.lineTo(x, y + size/2);
                        this.ctx.closePath();
                        this.ctx.fill();
                    } else if (food.type === 'operator') {
                        // Operators - cyan hexagon
                        this.ctx.fillStyle = '#00ffff';
                        this.ctx.beginPath();
                        const centerX = x + size/2;
                        const centerY = y + size/2;
                        const radius = size/2;
                        for (let i = 0; i < 6; i++) {
                            const angle = (i * Math.PI) / 3;
                            const pointX = centerX + radius * Math.cos(angle);
                            const pointY = centerY + radius * Math.sin(angle);
                            if (i === 0) this.ctx.moveTo(pointX, pointY);
                            else this.ctx.lineTo(pointX, pointY);
                        }
                        this.ctx.closePath();
                        this.ctx.fill();
                    }
                    
                    // Draw the value
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `${fontSize}px "Press Start 2P"`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(
                        food.value.toString(),
                        x + size/2,
                        y + size/2
                    );
                }
            });
        }
        
        // Draw power-ups if they exist
        if (this.powerUps && this.powerUps.length > 0) {
            this.powerUps.forEach(powerUp => {
                const x = powerUp.x * this.gridSize;
                const y = powerUp.y * this.gridSize;
                const size = this.gridSize - 1;
                
                // Draw power-up background
                this.ctx.fillStyle = powerUp.color;
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw power-up symbol
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = `${fontSize}px "Press Start 2P"`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(powerUp.symbol, x + size/2, y + size/2);
            });
        }
    }
    

    updateScore() {
        const scoreDisplay = this.contentArea.querySelector('.score');
        const finalScoreDisplay = this.contentArea.querySelector('.final-score');
        
        if (scoreDisplay) {
            scoreDisplay.textContent = this.score;
        }
        
        // Update final score if game over screen is showing
        if (finalScoreDisplay) {
            finalScoreDisplay.textContent = `Final Score: ${this.score}`;
        }
    }
}

export const snakeEquation = new SnakeEquation();