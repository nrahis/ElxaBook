import { CardSet } from './card_set.js';

export class Solitaire {
    constructor() {
        this.deck = [];
        this.foundations = Array(4).fill().map(() => []);
        this.tableaus = Array(7).fill().map(() => []);
        this.waste = [];
        this.stock = [];
        this.selectedCards = null;  // {cards: [], source: string, index: number}
        this.gameId = 'solitaire-' + Math.random().toString(36).substr(2, 9);
        this.score = 0;
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI();
        this.setupGame();
        this.setupEventListeners();
    }

    renderUI() {
        this.contentArea.innerHTML = `
            <div class="solitaire-container">
                <div class="solitaire-header">
                    <div class="score-display">Score: <span id="${this.gameId}-score">0</span></div>
                    <div class="timer-display" id="${this.gameId}-timer">00:00</div>
                    <button class="new-game-btn" id="${this.gameId}-new-game">New Game</button>
                </div>
                <div class="game-area">
                    <div class="upper-row">
                        <div class="stock-waste">
                            <div class="stock" id="${this.gameId}-stock"></div>
                            <div class="waste" id="${this.gameId}-waste"></div>
                        </div>
                        <div class="foundations">
                            ${Array(4).fill().map((_, i) => `
                                <div class="foundation" id="${this.gameId}-foundation-${i}"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tableaus">
                        ${Array(7).fill().map((_, i) => `
                            <div class="tableau" id="${this.gameId}-tableau-${i}"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getElement(id) {
        return this.contentArea.querySelector(`#${this.gameId}-${id}`);
    }

    setupGame() {
        // Create deck
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const suits = ['hearts', 'diamonds', 'spades', 'clubs'];
        
        this.deck = [];
        for (const suit of suits) {
            for (const value of values) {
                this.deck.push({ value, suit });
            }
        }
        
        this.shuffleDeck();
        this.dealCards();
        this.renderGame();
        this.startTimer();
        this.score = 0;
        this.updateScore();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        this.foundations = Array(4).fill().map(() => []);
        this.tableaus = Array(7).fill().map(() => []);
        this.waste = [];
        
        // Deal to tableaus
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.pop();
                card.faceUp = i === j;
                this.tableaus[j].push(card);
            }
        }
        
        this.stock = this.deck.map(card => ({ ...card, faceUp: false }));
        this.deck = [];
    }

    renderGame() {
        this.clearSelection();
        
        // Render stock
        const stockElement = this.getElement('stock');
        stockElement.innerHTML = '';
        if (this.stock.length > 0) {
            const cardBack = CardSet.getCard('back');
            stockElement.appendChild(cardBack);
        }

        // Render waste
        const wasteElement = this.getElement('waste');
        wasteElement.innerHTML = '';
        if (this.waste.length > 0) {
            const topCard = this.waste[this.waste.length - 1];
            const cardElement = CardSet.getCard(topCard.value, topCard.suit);
            this.makeCardClickable(cardElement, 'waste', this.waste.length - 1);
            wasteElement.appendChild(cardElement);
        }

        // Render foundations
        this.foundations.forEach((foundation, i) => {
            const foundationElement = this.getElement(`foundation-${i}`);
            foundationElement.innerHTML = '';
            if (foundation.length > 0) {
                const topCard = foundation[foundation.length - 1];
                const cardElement = CardSet.getCard(topCard.value, topCard.suit);
                this.makeCardClickable(cardElement, `foundation-${i}`, foundation.length - 1);
                foundationElement.appendChild(cardElement);
            } else {
                // Empty foundation is also clickable as a destination
                foundationElement.classList.add('clickable-empty');
                this.makeAreaClickable(foundationElement, `foundation-${i}`);
            }
        });

        // Render tableaus
        this.tableaus.forEach((tableau, i) => {
            const tableauElement = this.getElement(`tableau-${i}`);
            tableauElement.innerHTML = '';
            
            // Empty tableau is clickable as a destination
            if (tableau.length === 0) {
                tableauElement.classList.add('clickable-empty');
                this.makeAreaClickable(tableauElement, `tableau-${i}`);
            }
            
            tableau.forEach((card, cardIndex) => {
                const cardElement = card.faceUp ? 
                    CardSet.getCard(card.value, card.suit) : 
                    CardSet.getCard('back');
                cardElement.style.top = `${cardIndex * 18}px`;
                if (card.faceUp) {
                    this.makeCardClickable(cardElement, `tableau-${i}`, cardIndex);
                }
                tableauElement.appendChild(cardElement);
            });
        });
    }

    makeCardClickable(cardElement, source, index) {
        cardElement.classList.add('clickable');
        cardElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCardClick(source, index);
        });
    }

    makeAreaClickable(element, destination) {
        element.addEventListener('click', () => {
            this.handleAreaClick(destination);
        });
    }

    handleCardClick(source, index) {
        if (!this.selectedCards) {
            // Select cards
            const cards = this.getCardsFromSource(source, index);
            if (cards && cards.length > 0) {
                this.selectedCards = { cards, source, index };
                this.highlightSelectedCards();
            }
        } else {
            // Trying to move to another card - treat it as an area click
            this.handleAreaClick(source);
        }
    }

    handleAreaClick(destination) {
        if (!this.selectedCards) return;

        const cards = this.selectedCards.cards;
        if (this.isValidMove(cards, destination)) {
            this.moveCards(cards, this.selectedCards.source, destination);
            this.updateScore(10);  // Score for successful move
            this.checkWinCondition();
        }
        
        this.renderGame();
    }

    getCardsFromSource(source, index) {
        if (source === 'waste') {
            return this.waste.length > 0 ? [this.waste[this.waste.length - 1]] : null;
        } else if (source.startsWith('foundation-')) {
            const foundationIndex = parseInt(source.split('-')[1]);
            return this.foundations[foundationIndex].length > 0 ? 
                [this.foundations[foundationIndex][this.foundations[foundationIndex].length - 1]] : null;
        } else if (source.startsWith('tableau-')) {
            const tableauIndex = parseInt(source.split('-')[1]);
            const tableau = this.tableaus[tableauIndex];
            return tableau.slice(index);
        }
        return null;
    }

    isValidMove(cards, destination) {
        if (!cards || cards.length === 0) return false;

        if (destination.startsWith('foundation-')) {
            if (cards.length !== 1) return false;
            const foundationIndex = parseInt(destination.split('-')[1]);
            return this.isValidFoundationMove(cards[0], this.foundations[foundationIndex]);
        } else if (destination.startsWith('tableau-')) {
            const tableauIndex = parseInt(destination.split('-')[1]);
            return this.isValidTableauMove(cards[0], this.tableaus[tableauIndex]);
        }
        return false;
    }

    moveCards(cards, source, destination) {
        // Remove from source
        if (source === 'waste') {
            this.waste.pop();
        } else if (source.startsWith('foundation-')) {
            const foundationIndex = parseInt(source.split('-')[1]);
            this.foundations[foundationIndex].pop();
        } else if (source.startsWith('tableau-')) {
            const tableauIndex = parseInt(source.split('-')[1]);
            this.tableaus[tableauIndex].splice(this.selectedCards.index);
        }

        // Add to destination
        if (destination.startsWith('foundation-')) {
            const foundationIndex = parseInt(destination.split('-')[1]);
            this.foundations[foundationIndex].push(cards[0]);
        } else if (destination.startsWith('tableau-')) {
            const tableauIndex = parseInt(destination.split('-')[1]);
            this.tableaus[tableauIndex].push(...cards);
        }

        // Flip top card if needed
        this.flipTopCards();
    }

    flipTopCards() {
        for (const tableau of this.tableaus) {
            if (tableau.length > 0 && !tableau[tableau.length - 1].faceUp) {
                tableau[tableau.length - 1].faceUp = true;
                this.updateScore(5);  // Score for revealing card
            }
        }
    }

    isValidFoundationMove(card, foundation) {
        if (foundation.length === 0) {
            return card.value === 'A';
        }

        const targetCard = foundation[foundation.length - 1];
        if (card.suit !== targetCard.suit) return false;

        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return values.indexOf(card.value) === values.indexOf(targetCard.value) + 1;
    }

    isValidTableauMove(card, tableau) {
        if (tableau.length === 0) {
            return card.value === 'K';
        }
    
        const targetCard = tableau[tableau.length - 1];
        if (!targetCard.faceUp) return false;
    
        // Check colors - if source is red, target must be black and vice versa
        const isMovingCardRed = card.suit === 'hearts' || card.suit === 'diamonds';
        const isTargetCardRed = targetCard.suit === 'hearts' || targetCard.suit === 'diamonds';
        
        // They MUST be opposite colors
        if (isMovingCardRed === isTargetCardRed) return false;
    
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        // We want values in ascending order - if target is J, we can put a 10 on it
        return values.indexOf(card.value) === values.indexOf(targetCard.value) - 1;
    }

    clearSelection() {
        this.selectedCards = null;
        document.querySelectorAll('.selected-card').forEach(el => 
            el.classList.remove('selected-card'));
    }

    highlightSelectedCards() {
        if (!this.selectedCards) return;
        
        let element;
        if (this.selectedCards.source === 'waste') {
            element = this.getElement('waste').firstChild;
        } else if (this.selectedCards.source.startsWith('foundation-')) {
            const foundationIndex = parseInt(this.selectedCards.source.split('-')[1]);
            element = this.getElement(`foundation-${foundationIndex}`).firstChild;
        } else if (this.selectedCards.source.startsWith('tableau-')) {
            const tableauIndex = parseInt(this.selectedCards.source.split('-')[1]);
            const tableau = this.getElement(`tableau-${tableauIndex}`);
            const cards = tableau.children;
            for (let i = this.selectedCards.index; i < cards.length; i++) {
                cards[i].classList.add('selected-card');
            }
            return;
        }
        
        if (element) {
            element.classList.add('selected-card');
        }
    }

    setupEventListeners() {
        // Stock click
        this.getElement('stock').addEventListener('click', () => {
            if (this.stock.length === 0) {
                this.stock = [...this.waste].reverse().map(card => ({ ...card, faceUp: false }));
                this.waste = [];
                this.updateScore(-100);  // Penalty for recycling waste
            } else {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
            }
            this.renderGame();
        });

        // New game button
        this.getElement('new-game').addEventListener('click', () => {
            if (confirm('Start a new game?')) {
                this.setupGame();
            }
        });
    }

    checkWinCondition() {
        const isWon = this.foundations.every(foundation => 
            foundation.length === 13 && foundation[12].value === 'K'
        );
        
        if (isWon) {
            clearInterval(this.timer);
            setTimeout(() => {
                alert(`Congratulations! You won with a score of ${this.score}!`);
                if (confirm('Start a new game?')) {
                    this.setupGame();
                }
            }, 100);
        }
    }

    updateScore(points = 0) {
        this.score += points;
        this.getElement('score').textContent = this.score;
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        let seconds = 0;
        const timerDisplay = this.getElement('timer');
        
        this.timer = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
}

export const solitaire = new Solitaire();