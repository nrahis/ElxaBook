// Time Crunch - Math Game
export class TimeCrunch {
    constructor() {
        this.timeLimit = 60; // Game duration in seconds
        this.score = 0;
        this.timer = null;
        this.currentProblem = null;
        this.operators = ['+', '-', '*', '/'];
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupEventListeners();
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="time-crunch-container">
                <div class="time-crunch-header">
                    <div class="time-counter" id="time-counter">60</div>
                    <div class="score-counter" id="score-counter">Score: 0</div>
                </div>
                <div class="time-crunch-problem" id="problem">Press Start</div>
                <div class="time-crunch-input">
                    <input type="text" id="answer-input" class="answer-input" disabled />
                </div>
                <div class="time-crunch-footer">
                    <button class="tc-start-button" id="tc-start-button">Start</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const startButton = this.contentArea.querySelector('#tc-start-button');
        const answerInput = this.contentArea.querySelector('#answer-input');

        startButton.addEventListener('click', () => this.startGame());

        answerInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer(e.target.value);
                e.target.value = '';
            }
        });
    }

    startGame() {
        this.score = 0;
        this.updateScore();
        this.startTimer();
        this.generateProblem();
        this.contentArea.querySelector('#answer-input').disabled = false;
        this.contentArea.querySelector('#answer-input').focus();
    }

    startTimer() {
        this.stopTimer();
        let timeLeft = this.timeLimit;
        const timeCounter = this.contentArea.querySelector('#time-counter');

        this.timer = setInterval(() => {
            timeLeft--;
            timeCounter.textContent = timeLeft;

            if (timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    generateProblem() {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operator = this.operators[Math.floor(Math.random() * this.operators.length)];

        let problem;
        if (operator === '/' && num1 % num2 !== 0) {
            problem = `${num1 * num2} / ${num2}`; // Ensure division results in whole numbers
        } else {
            problem = `${num1} ${operator} ${num2}`;
        }

        this.currentProblem = {
            question: problem,
            answer: eval(problem), // Note: Eval is generally discouraged but fine for controlled input
        };

        this.contentArea.querySelector('#problem').textContent = problem;
    }

    checkAnswer(answer) {
        if (parseFloat(answer) === this.currentProblem.answer) {
            this.score++;
            this.updateScore();
            this.generateProblem();
        }
    }

    updateScore() {
        this.contentArea.querySelector('#score-counter').textContent = `Score: ${this.score}`;
    }

    endGame() {
        this.stopTimer();
        this.contentArea.querySelector('#problem').textContent = `Game Over! Your score: ${this.score}`;
        this.contentArea.querySelector('#answer-input').disabled = true;
    }
}

export const timeCrunch = new TimeCrunch();
