export class Minesweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        this.difficulty = 'easy';
        this.emojis = {
            unopened: '🐾',
            flag: '😺',
            mine: '😴',
            boom: '😾',
            win: '😸',
            normal: '😺',
            worry: '😿'
        };
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupGame();
        this.setupEventListeners();
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="minesweeper-container">
                <div class="minesweeper-header">
                    <div class="minesweeper-counter" id="mine-counter">010</div>
                    <div class="minesweeper-face" id="game-face">😺</div>
                    <div class="minesweeper-counter" id="time-counter">000</div>
                </div>
                <div class="minesweeper-grid" id="game-grid"></div>
                <div class="minesweeper-footer">
                    <button class="difficulty-button active" data-difficulty="easy">Easy</button>
                    <button class="difficulty-button" data-difficulty="medium">Medium</button>
                    <button class="difficulty-button" data-difficulty="hard">Hard</button>
                </div>
            </div>
        `;
    }

    setupGame() {
        const { rows, cols, mines } = this.difficulties[this.difficulty];
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.flags = 0;
        this.revealed = 0;
        this.gameOver = false;
        this.firstClick = true;
        this.grid = Array(rows).fill().map(() => Array(cols).fill(0));
        this.revealed = Array(rows).fill().map(() => Array(cols).fill(false));
        this.flagged = Array(rows).fill().map(() => Array(cols).fill(false));
        
        this.createGrid();
        this.updateMineCounter();
        this.stopTimer();
        this.resetTimer();
    }

    createGrid() {
        const gridElement = this.contentArea.querySelector('#game-grid');
        gridElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        gridElement.innerHTML = '';

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'minesweeper-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.textContent = this.emojis.unopened;
                gridElement.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        const grid = this.contentArea.querySelector('#game-grid');
        const face = this.contentArea.querySelector('#game-face');
        
        grid.addEventListener('click', (e) => this.handleClick(e));
        grid.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        face.addEventListener('click', () => this.setupGame());
        
        // Mouse events for face changes
        grid.addEventListener('mousedown', () => {
            if (!this.gameOver) face.textContent = this.emojis.worry;
        });
        grid.addEventListener('mouseup', () => {
            if (!this.gameOver) face.textContent = this.emojis.normal;
        });
        document.addEventListener('mouseout', () => {
            if (!this.gameOver) face.textContent = this.emojis.normal;
        });

        // Difficulty buttons
        this.contentArea.querySelectorAll('.difficulty-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.difficulty = e.target.dataset.difficulty;
                this.contentArea.querySelectorAll('.difficulty-button').forEach(b => 
                    b.classList.toggle('active', b === e.target)
                );
                this.setupGame();
            });
        });
    }

    handleClick(e) {
        const cell = e.target.closest('.minesweeper-cell');
        if (!cell || this.gameOver) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.flagged[row][col]) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        if (this.grid[row][col] === 'mine') {
            this.gameOver = true;
            this.revealAll();
            cell.classList.add('mine');
            cell.textContent = this.emojis.boom;
            this.contentArea.querySelector('#game-face').textContent = this.emojis.boom;
            this.stopTimer();
        } else {
            this.revealCell(row, col);
            this.checkWin();
        }
    }

    handleRightClick(e) {
        e.preventDefault();
        const cell = e.target.closest('.minesweeper-cell');
        if (!cell || this.gameOver) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (!this.revealed[row][col]) {
            if (!this.flagged[row][col] && this.flags < this.mines) {
                this.flagged[row][col] = true;
                cell.textContent = this.emojis.flag;
                this.flags++;
            } else if (this.flagged[row][col]) {
                this.flagged[row][col] = false;
                cell.textContent = this.emojis.unopened;
                this.flags--;
            }
            this.updateMineCounter();
        }
    }

    placeMines(firstRow, firstCol) {
        let minesToPlace = this.mines;
        while (minesToPlace > 0) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or where there's already a mine
            if ((row !== firstRow || col !== firstCol) && this.grid[row][col] !== 'mine') {
                this.grid[row][col] = 'mine';
                minesToPlace--;
            }
        }

        // Calculate numbers
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] !== 'mine') {
                    this.grid[row][col] = this.countAdjacentMines(row, col);
                }
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                const newRow = row + r;
                const newCol = col + c;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols && 
                    this.grid[newRow][newCol] === 'mine') {
                    count++;
                }
            }
        }
        return count;
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols || 
            this.revealed[row][col] || this.flagged[row][col]) {
            return;
        }

        this.revealed[row][col] = true;
        const cell = this.contentArea.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('revealed');

        if (this.grid[row][col] === 0) {
            cell.textContent = '';
            // Reveal adjacent cells for empty spaces
            for (let r = -1; r <= 1; r++) {
                for (let c = -1; c <= 1; c++) {
                    this.revealCell(row + r, col + c);
                }
            }
        } else {
            cell.textContent = '🐾';
            cell.dataset.number = this.grid[row][col];
        }
    }

    revealAll() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.revealed[row][col] && !this.flagged[row][col]) {
                    const cell = this.contentArea.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.classList.add('revealed');
                    if (this.grid[row][col] === 'mine') {
                        cell.textContent = this.emojis.mine;
                    } else if (this.grid[row][col] > 0) {
                        cell.textContent = '🐾';
                        cell.dataset.number = this.grid[row][col];
                    } else {
                        cell.textContent = '';
                    }
                }
            }
        }
    }

    checkWin() {
        const totalCells = this.rows * this.cols;
        const revealedCount = this.revealed.flat().filter(Boolean).length;
        if (revealedCount === totalCells - this.mines) {
            this.gameOver = true;
            this.contentArea.querySelector('#game-face').textContent = this.emojis.win;
            this.stopTimer();
            // Flag any remaining unflagged mines
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.grid[row][col] === 'mine' && !this.flagged[row][col]) {
                        this.flagged[row][col] = true;
                        const cell = this.contentArea.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        cell.textContent = this.emojis.flag;
                    }
                }
            }
            this.updateMineCounter();
        }
    }

    updateMineCounter() {
        const counter = this.contentArea.querySelector('#mine-counter');
        const remaining = this.mines - this.flags;
        counter.textContent = remaining.toString().padStart(3, '0');
    }

    startTimer() {
        this.stopTimer();
        this.timeCount = 0;
        this.timer = setInterval(() => {
            this.timeCount++;
            const counter = this.contentArea.querySelector('#time-counter');
            counter.textContent = Math.min(999, this.timeCount).toString().padStart(3, '0');
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    resetTimer() {
        this.timeCount = 0;
        this.contentArea.querySelector('#time-counter').textContent = '000';
    }
}

// Create and export default instance
export const minesweeper = new Minesweeper();