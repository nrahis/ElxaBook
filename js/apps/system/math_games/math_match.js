// Math Match Game
export class MathMatch {
    constructor() {
        this.difficulties = {
            easy: { pairs: 6 }, // Adjusted to 6 pairs for 12 squares
            medium: { pairs: 10 },
            hard: { pairs: 15 }
        };
        this.difficulty = 'easy';
        this.pairs = [];
        this.selected = [];
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupGame();
        this.setupEventListeners();
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="math-match-container">
                <div class="math-match-header">
                    <div class="math-match-title">Math Match</div>
                    <div class="math-match-controls">
                        <button class="difficulty-button active" data-difficulty="easy">Easy</button>
                        <button class="difficulty-button" data-difficulty="medium">Medium</button>
                        <button class="difficulty-button" data-difficulty="hard">Hard</button>
                        <button class="reset-button">Reset</button>
                    </div>
                </div>
                <div class="math-match-grid" id="game-grid"></div>
                <div class="math-match-message" id="game-message"></div>
            </div>
        `;
    }

    setupGame() {
        const { pairs } = this.difficulties[this.difficulty];
        this.pairs = this.generatePairs(pairs);
        this.shufflePairs();
        this.renderGrid();
        this.selected = [];
        this.clearMessage();
    }

    generatePairs(pairs) {
        const generatedPairs = [];
        for (let i = 0; i < pairs; i++) {
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            const solution = a + b;
            generatedPairs.push({ text: `${a} + ${b}`, type: 'problem' });
            generatedPairs.push({ text: `${solution}`, type: 'solution' });
        }
        return generatedPairs;
    }

    shufflePairs() {
        for (let i = this.pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pairs[i], this.pairs[j]] = [this.pairs[j], this.pairs[i]];
        }
    }

    renderGrid() {
        const grid = this.contentArea.querySelector('#game-grid');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(this.pairs.length))}, 1fr)`;

        this.pairs.forEach((pair, index) => {
            const cell = document.createElement('div');
            cell.className = 'math-match-cell';
            cell.dataset.index = index;
            cell.dataset.type = pair.type;
            cell.textContent = '❔';
            grid.appendChild(cell);
        });
    }

    setupEventListeners() {
        const grid = this.contentArea.querySelector('#game-grid');
        const resetButton = this.contentArea.querySelector('.reset-button');

        grid.addEventListener('click', (e) => {
            const cell = e.target.closest('.math-match-cell');
            if (!cell || this.selected.includes(cell.dataset.index)) return;

            this.handleSelection(cell);
        });

        this.contentArea.querySelectorAll('.difficulty-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.difficulty = e.target.dataset.difficulty;
                this.contentArea.querySelectorAll('.difficulty-button').forEach(b => 
                    b.classList.toggle('active', b === e.target)
                );
                this.setupGame();
            });
        });

        resetButton.addEventListener('click', () => {
            this.setupGame();
        });
    }

    handleSelection(cell) {
        const index = parseInt(cell.dataset.index);
        const pair = this.pairs[index];

        cell.textContent = pair.text;
        cell.classList.add('revealed');
        this.selected.push(index);

        if (this.selected.length === 2) {
            const [first, second] = this.selected;
            const firstPair = this.pairs[first];
            const secondPair = this.pairs[second];

            if ((firstPair.type === 'problem' && secondPair.type === 'solution' && eval(firstPair.text) === parseInt(secondPair.text)) ||
                (firstPair.type === 'solution' && secondPair.type === 'problem' && eval(secondPair.text) === parseInt(firstPair.text))) {
                setTimeout(() => {
                    this.markCorrect(first, second);
                    this.checkWin();
                }, 500);
            } else {
                setTimeout(() => {
                    this.hideCells(first, second);
                }, 500);
            }
            this.selected = [];
        }
    }

    markCorrect(first, second) {
        const grid = this.contentArea.querySelector('#game-grid');
        [first, second].forEach(index => {
            const cell = grid.querySelector(`[data-index="${index}"]`);
            cell.classList.add('correct');
            cell.textContent = '✔️';
        });
    }

    hideCells(first, second) {
        const grid = this.contentArea.querySelector('#game-grid');
        [first, second].forEach(index => {
            const cell = grid.querySelector(`[data-index="${index}"]`);
            cell.textContent = '❔';
            cell.classList.remove('revealed');
        });
    }

    checkWin() {
        const grid = this.contentArea.querySelector('#game-grid');
        const remaining = grid.querySelectorAll('.math-match-cell:not(.correct)');
        if (remaining.length === 0) {
            this.displayMessage('🎉 Congratulations! You won! 🎉');
        }
    }

    clearMessage() {
        const message = this.contentArea.querySelector('#game-message');
        message.textContent = '';
    }

    displayMessage(text) {
        const message = this.contentArea.querySelector('#game-message');
        message.textContent = text;
        message.style.display = 'block';
    }
}

export const mathMatch = new MathMatch();
