// Digital Universal Command Kernel (DUCK)
export class Duck {
    constructor() {
        this.commandHistory = [];
        this.historyIndex = -1;
        this.outputElement = null;
        this.inputElement = null;
        this.matrixInterval = null;
        this.responses = {
            "help": `Available commands:
  scan     - Scan for vulnerable targets
  hack     - Attempt to breach a system
  encrypt  - Encrypt a secret message
  decrypt  - Decrypt a message
  status   - Check system status
  matrix   - Toggle matrix mode
  duck     - Show a duck friend
  game     - Play a mini-game
  rainbow  - Toggle rainbow text
  clear    - Clear the terminal
  exit     - Close DUCK`,
            "scan": [
                "🦆 DUCK SCAN INITIATED...\n[■■■□□□□□□□] 30% - Found 3 computers...\n[■■■■■■□□□□] 60% - Analyzing security...\n[■■■■■■■■■■] 100% - Scan complete!\n\nFound friendly targets:\n- Mom's Cookie Recipe Database\n- Dad's Dad Joke Repository\n- Sister's Digital Diary (MAXIMUM SECURITY)",
                "🦆 SCANNING NEIGHBORHOOD...\n[■■■■□□□□□□] 40% - Found local network...\n[■■■■■■■□□□] 70% - Detected multiple devices...\n[■■■■■■■■■■] 100% - Complete!\n\nDiscovered:\n- Family Pizza Night Schedule\n- House Plant Watering System\n- Pet Food Dispenser Control\n- Neighborhood Ice Cream Truck Tracker",
                "🦆 DEEP SCAN IN PROGRESS...\n[■■□□□□□□□□] 20% - Detecting signals...\n[■■■■□□□□□□] 40% - Found something interesting...\n[■■■■■■■■■■] 100% - Scan finished!\n\nLocated Secret Systems:\n- School Lunch Menu Predictor\n- Local Park Playground Monitor\n- Traffic Light Pattern Analyzer\n- Homework Excuse Generator"
            ],
            "hack": [
                "🦆 INITIATING FRIENDLY HACK...\n[ACCESS GRANTED]\nSuccessfully hacked into Dad's Dad Joke Database!\nRetrieving random dad joke...\n\nWhy don't eggs tell jokes? They'd crack up! 🥚",
                "🦆 ATTEMPTING BREACH...\n[ACCESS GRANTED]\nGained access to Mom's Recipe Vault!\nFound secret ingredient in chocolate chip cookies:\n\n'Extra love and a pinch of magic' ❤️",
                "🦆 HACK SEQUENCE INITIATED...\n[ACCESS GRANTED]\nBreached the Ice Cream Truck's secret schedule!\nNext visit to your street: Tomorrow at 3pm 🍦",
                "🦆 SUPER HACK ENGAGED...\n[ACCESS GRANTED]\nInfiltrated the School Lunch System!\nTomorrow's dessert will be: DOUBLE CHOCOLATE PUDDING 🍫"
            ],
            "encrypt": message => {
                return `🦆 ENCRYPTING MESSAGE...\n${message.split('').map(c => c === ' ' ? '□' : '■').join('')}\n\nMessage encrypted with DUCK-256 algorithm!\nOnly other DUCK users can decode this!`;
            },
            "decrypt": message => {
                return "🦆 DECRYPTION COMPLETE!\nMessage says: 'You are awesome!'\n\n(All encrypted messages decrypt to this because you ARE awesome!)";
            },
            "status": [
                "🦆 DUCK System Status:\nPower Level: MAXIMUM\nAwesomeness: 100%\nDuck Mode: ENGAGED\nSecurity: UNBREAKABLE\nFun Level: OVERFLOWING\nQuacks Available: UNLIMITED",
                "🦆 System Check:\nDuck Power: QUACK-TASTIC\nEnergy: UNLIMITED\nHacking Skills: LEGENDARY\nCookie Level: NEEDS MORE COOKIES\nHigh Fives: READY"
            ],
            "duck": [
                `    __
   /  >
  /  /
 /  /
(  (
 \\  \\
  \\  \\
   \\__\\    QUACK!`,
                `  _      _      _
>(.)__ <(.)__ =(.)__
  (___/  (___/  (___/ `,
                `   _
,-(°>
\`\\(    WADDLE WADDLE`,
                `  __     __
<(o )___( o)>
  ( ._____. )
   V       V    SUPER DUCK!`
            ],
            "game": function() {
                return `🦆 DUCK NUMBERS GAME 🎮
I'm thinking of a number between 1 and 10...
Type 'guess [number]' to play!

Example: guess 5`;
            },
            "guess": function(number) {
                const target = Math.floor(Math.random() * 10) + 1;
                const guess = parseInt(number);
                
                if (isNaN(guess)) {
                    return "Please enter a number! Example: guess 5";
                }
                
                if (guess === target) {
                    return `🎉 CORRECT! The number was ${target}!\nYou're a master hacker! 🦆`;
                } else if (guess < target) {
                    return `Try higher! Your guess: ${guess} 🔼`;
                } else {
                    return `Try lower! Your guess: ${guess} 🔽`;
                }
            },
            "matrix": null, // Handled specially
            "rainbow": null, // Handled specially
            "clear": null,
            "exit": null
        };
    }

    initialize(contentArea) {
        contentArea.innerHTML = `
            <div class="duck-terminal">
                <div class="terminal-output"></div>
                <div class="input-line">
                    <span class="prompt">DUCK></span>
                    <input type="text" class="command-input" spellcheck="false" autocomplete="off">
                </div>
            </div>
        `;

        // Store references to elements
        this.outputElement = contentArea.querySelector('.terminal-output');
        this.inputElement = contentArea.querySelector('.command-input');

        // Add welcome message
        this.addOutput(`
            ==============================================
            🦆 DUCK - Digital Universal Command Kernel v1.0
            ==============================================
            Welcome, young hacker! Type 'help' for commands.
            Remember: With great power comes great responsibility!
            
            DUCK is ready for your command...
        `);

        // Handle command input
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.inputElement.value.trim().toLowerCase();
                if (command) {
                    this.processCommand(command);
                    this.commandHistory.push(command);
                    this.historyIndex = this.commandHistory.length;
                    this.inputElement.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.inputElement.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.inputElement.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.commandHistory.length;
                    this.inputElement.value = '';
                }
            }
        });

        // Focus input when clicking anywhere in terminal
        contentArea.querySelector('.duck-terminal').addEventListener('click', () => {
            this.inputElement.focus();
        });

        // Initial focus
        this.inputElement.focus();
    }

    processCommand(command) {
        // Echo command first
        this.addOutput(`DUCK> ${command}`);

        // Split command and arguments
        const [cmd, ...args] = command.split(' ');

        if (cmd === 'clear') {
            this.outputElement.innerHTML = '';
            return;
        }

        if (cmd === 'exit') {
            this.addOutput("Goodbye, young hacker! Keep being awesome! 🦆");
            this.stopMatrix();
            setTimeout(() => {
                const window = this.outputElement.closest('.program-window');
                const closeButton = window.querySelector('.window-button.close');
                closeButton.click();
            }, 1500);
            return;
        }

        if (cmd === 'matrix') {
            this.toggleMatrix();
            return;
        }

        if (cmd === 'rainbow') {
            this.toggleRainbow();
            return;
        }

        if (cmd === 'encrypt' && args.length > 0) {
            this.addOutput(this.responses.encrypt(args.join(' ')));
            return;
        }

        if (cmd === 'guess') {
            this.addOutput(this.responses.guess(args[0]));
            return;
        }

        if (this.responses[cmd]) {
            if (typeof this.responses[cmd] === 'function') {
                this.addOutput(this.responses[cmd]());
            } else if (Array.isArray(this.responses[cmd])) {
                const response = this.responses[cmd][Math.floor(Math.random() * this.responses[cmd].length)];
                this.addOutput(response);
            } else {
                this.addOutput(this.responses[cmd]);
            }
        } else {
            this.addOutput("🦆 ERROR: Unknown command! Type 'help' for available commands.");
        }
    }

    addOutput(text) {
        const div = document.createElement('div');
        div.textContent = text;
        this.outputElement.appendChild(div);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    toggleMatrix() {
        if (this.matrixInterval) {
            this.stopMatrix();
            this.addOutput("Matrix mode deactivated!");
        } else {
            this.addOutput("Matrix mode activated! (Type 'matrix' again to stop)");
            this.outputElement.classList.add('matrix-effect');
            
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";
            this.matrixInterval = setInterval(() => {
                const div = document.createElement('div');
                div.textContent = Array(50).fill(0).map(() => 
                    chars[Math.floor(Math.random() * chars.length)]
                ).join('');
                div.className = 'matrix-line';
                this.outputElement.appendChild(div);
                
                if (this.outputElement.children.length > 100) {
                    this.outputElement.removeChild(this.outputElement.firstChild);
                }
            }, 100);
        }
    }

    stopMatrix() {
        if (this.matrixInterval) {
            clearInterval(this.matrixInterval);
            this.matrixInterval = null;
            this.outputElement.classList.remove('matrix-effect');
        }
    }

    toggleRainbow() {
        this.outputElement.classList.toggle('rainbow-text');
        this.addOutput(this.outputElement.classList.contains('rainbow-text') 
            ? "🌈 Rainbow mode activated! Everything is better with colors!"
            : "Rainbow mode deactivated... back to regular hacking colors!");
    }
}