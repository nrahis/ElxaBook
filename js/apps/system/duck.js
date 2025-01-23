// Digital Universal Command Kernel (DUCK)
export class Duck {
    constructor(wifiSystem) {
        this.wifiSystem = wifiSystem;  // Store reference to WiFi system
        this.commandHistory = [];
        this.historyIndex = -1;
        this.outputElement = null;
        this.inputElement = null;
        this.matrixInterval = null;
        this.gameState = null;  // For packet catcher game
        
        // Add new network-related commands to existing responses
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
  exit     - Close DUCK

Network Commands:
  netmap   - Display all visible networks
  netscan  - Deep scan of a specific network
  breach   - Attempt to breach network security
  secure   - Modify network security settings
  disguise - Hide or modify network appearance
  analyze  - Show detailed network analysis
  intercept - Play Packet Catcher game`,
            "scan": [
                "🦆 DUCK SCAN INITIATED...\n[■■■□□□□□□□] 30% - Found 3 computers...\n[■■■■■■□□□□] 60% - Analyzing security...\n[■■■■■■■■■■] 100% - Scan complete!\n\nFound friendly targets:\n- Mom's Cookie Recipe Database\n- Dad's Dad Joke Repository\n- Sister's Digital Diary (MAXIMUM SECURITY)",
                "🦆 SCANNING NEIGHBORHOOD...\n[■■■■□□□□□□] 40% - Found local network...\n[■■■■■■■□□□] 70% - Detected multiple devices...\n[■■■■■■■■■■] 100% - Complete!\n\nDiscovered:\n- Family Pizza Night Schedule\n- House Plant Watering System\n- Pet Food Dispenser Control\n- Neighborhood Ice Cream Truck Tracker",
                "🦆 DEEP SCAN IN PROGRESS...\n[■■□□□□□□□□] 20% - Detecting signals...\n[■■■■□□□□□□] 40% - Found something interesting...\n[■■■■■■■■■■] 100% - Scan finished!\n\nLocated Secret Systems:\n- School Lunch Menu Predictor\n- Local Park Playground Monitor\n- Traffic Light Pattern Analyzer\n- Homework Excuse Generator"
            ],
            "hack": [
                "🦆 INITIATING FRIENDLY HACK...\n[ACCESS GRANTED]\nSuccessfully hacked into Dad's Dad Joke Database!\nRetrieving random dad joke...\n\nWhy don't eggs tell jokes? They'd crack up! 🥚",
                "🦆 INITIATING DANGEROUS HACK...\n[ACCESS GRANTED]\nSuccessfully hacked into your sister's Terrible Joke Database!\nRetrieving random bad joke...\n\nWhat did the lawyer say to the other lawyer?\n\nWe're both lawyers.",
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
            "exit": null,
            "netmap": () => {
                const networks = this.wifiSystem.networks;
                let output = "🦆 SCANNING FOR NETWORKS...\n\n";
                
                networks.forEach(network => {
                    const signalBars = this.getSignalBars(network.signalStrength);
                    const securityIcon = network.security === 'none' ? '🔓' : '🔒';
                    const customTag = network.isCustom ? '[CUSTOM]' : '';
                    const connectedStatus = (this.wifiSystem.currentNetwork === network) ? '[CONNECTED]' : '';
                    
                    // Generate a fun "vulnerability" rating
                    const vulnRating = network.security === 'none' ? 'HIGH' : 
                                     network.isCustom ? 'UNKNOWN' : 'LOW';
                    
                    output += `${network.name} ${customTag} ${connectedStatus}\n`;
                    output += `└─ Signal: ${signalBars} (${network.signalStrength}dBm)\n`;
                    output += `└─ Security: ${securityIcon} ${network.security.toUpperCase()}\n`;
                    output += `└─ Vulnerability: ${vulnRating}\n\n`;
                });
                
                return output;
            },

            "netscan": (networkName) => {
                const network = this.wifiSystem.findNetwork(networkName);
                if (!network) {
                    return "🦆 ERROR: Network not found! Use 'netmap' to see available networks.";
                }

                const devices = this.generateFakeDevices();
                const ports = this.generateFakePorts();
                
                return `🦆 DEEP SCANNING ${network.name}...\n
Network Details:
└─ Status: ${this.wifiSystem.currentNetwork === network ? 'Connected' : 'Not Connected'}
└─ Security: ${network.security.toUpperCase()}
└─ Signal: ${this.getSignalBars(network.signalStrength)}

Connected Devices:
${devices}

Open Ports:
${ports}

Interesting Findings:
${this.generateInterestingFindings(network)}`;
            },

            "breach": (networkName) => {
                const network = this.wifiSystem.findNetwork(networkName);
                if (!network) {
                    return "🦆 ERROR: Network not found! Use 'netmap' to see available networks.";
                }

                if (network.security === 'none') {
                    return "🦆 WARNING: Network is unsecured - no breach needed!\nTry using 'secure' command to add protection.";
                }

                // If it's a custom network created by the user, show special message
                if (network.isCustom) {
                    return `🦆 BREACHING ${network.name}...\n
[ANALYZING SECURITY]
Password detected: ${network.password}
Security Rating: MODERATE
Recommendation: Use a stronger password!`;
                }

                // For default networks, show fun "hacking" animation
                return `🦆 ATTEMPTING TO BREACH ${network.name}...\n
[■■□□□□□□□□] 20% - Bypassing firewall...
[■■■■□□□□□□] 40% - Decoding packets...
[■■■■■■□□□□] 60% - Cracking encryption...
[■■■■■■■■□□] 80% - Almost there...
[■■■■■■■■■■] 100% - Access Denied!

SECURITY ALERT: Network too strong! Try an easier target.`;
            },

            "secure": (networkName) => {
                const network = this.wifiSystem.findNetwork(networkName);
                if (!network) {
                    return "🦆 ERROR: Network not found! Use 'netmap' to see available networks.";
                }

                if (!network.isCustom) {
                    return "🦆 ERROR: Can only modify security of custom networks!";
                }

                const securityScore = this.calculateSecurityScore(network);
                return `🦆 SECURITY ANALYSIS FOR ${network.name}:\n
Current Security Level: ${network.security.toUpperCase()}
Security Score: ${securityScore}/100
${this.getSecurityRecommendations(network)}`;
            },

            "disguise": (networkName) => {
                const network = this.wifiSystem.findNetwork(networkName);
                if (!network) {
                    return "🦆 ERROR: Network not found! Use 'netmap' to see available networks.";
                }

                if (!network.isCustom) {
                    return "🦆 ERROR: Can only disguise custom networks!";
                }

                return `🦆 NETWORK DISGUISE ACTIVATED!\n
${network.name} has been hidden from normal scans.
Create a decoy network? Use 'secure' to set it up!`;
            },

            "analyze": (networkName) => {
                const network = this.wifiSystem.findNetwork(networkName);
                if (!network) {
                    return "🦆 ERROR: Network not found! Use 'netmap' to see available networks.";
                }

                const fakeIP = this.generateFakeIP();
                const fakeMAC = this.generateFakeMAC();
                
                return `🦆 ANALYZING ${network.name}...\n
IP Address: ${fakeIP}
└─ Type: IPv4 Address
└─ Subnet Mask: 255.255.255.0
└─ Gateway: ${fakeIP.replace(/\d+$/, '1')}

MAC Address: ${fakeMAC}
└─ Manufacturer: Ducky Networks Inc.
└─ Type: Wireless Interface

Signal Strength: ${network.signalStrength}dBm
└─ Quality: ${this.getSignalQuality(network.signalStrength)}
└─ Range: ${this.calculateRange(network.signalStrength)} meters

Network Speed: ${this.calculateNetworkSpeed(network.signalStrength)} Mbps
└─ Download: ${this.calculateNetworkSpeed(network.signalStrength) * 0.8} Mbps
└─ Upload: ${this.calculateNetworkSpeed(network.signalStrength) * 0.2} Mbps`;
            },

            // New Packet Catcher game
            "intercept": () => {
                if (this.gameState) {
                    return "🦆 Game already in progress! Use 'catch' command to play.";
                }
                
                this.startPacketGame();
                return `🦆 PACKET CATCHER INITIATED!\n
Catch network packets for points! Watch out for malware!
Commands:
  catch up     - Catch packets in top lane
  catch middle - Catch packets in middle lane
  catch down   - Catch packets in bottom lane
  shield      - Temporary malware immunity
  boost       - Speed boost for 5 seconds
  end         - End the game

Game starting in 3 seconds...`;
            }
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
    
        // Handle network commands that need arguments
        if (['netscan', 'breach', 'secure', 'disguise', 'analyze'].includes(cmd)) {
            if (args.length === 0) {
                this.addOutput(`🦆 ERROR: ${cmd} command requires a network name!\nExample: ${cmd} MyNetwork`);
                return;
            }
            const networkName = args.join(' ');
            if (this.responses[cmd]) {
                this.addOutput(this.responses[cmd](networkName));
            }
            return;
        }
    
        // Handle packet catcher game commands
        if (cmd === 'catch' && this.gameState) {
            if (!['up', 'middle', 'down'].includes(args[0])) {
                this.addOutput("🦆 ERROR: Use 'catch up', 'catch middle', or 'catch down'");
                return;
            }
            // Handle catch command for the game
            this.handleCatchCommand(args[0]);
            return;
        }
    
        // Handle other game commands
        if (this.gameState && ['shield', 'boost', 'end'].includes(cmd)) {
            // Handle other game commands
            this.handleGameCommand(cmd);
            return;
        }
    
        // Handle original commands
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
    
        // Handle commands with no arguments
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

    // Helper methods for network commands
    getSignalBars(strength) {
        if (strength > 80) return '▰▰▰▰▰';
        if (strength > 60) return '▰▰▰▰▱';
        if (strength > 40) return '▰▰▰▱▱';
        if (strength > 20) return '▰▰▱▱▱';
        return '▰▱▱▱▱';
    }

    generateFakeDevices() {
        const devices = [
            'Mom\'s Laptop (Online)',
            'Dad\'s Phone (Idle)',
            'Sister\'s Tablet (Active)',
            'Smart TV (Streaming)',
            'Game Console (Playing)',
        ];
        return devices.slice(0, Math.floor(Math.random() * 3) + 2)
            .map(device => `└─ ${device}`).join('\n');
    }

    generateFakePorts() {
        const ports = [
            '80 (HTTP) - Web Traffic',
            '443 (HTTPS) - Secure Web',
            '22 (SSH) - Remote Access',
            '53 (DNS) - Name Service',
        ];
        return ports.slice(0, Math.floor(Math.random() * 3) + 1)
            .map(port => `└─ Port ${port}`).join('\n');
    }

    generateInterestingFindings(network) {
        const findings = [
            '└─ Network has strong encryption',
            '└─ Regular backup schedule detected',
            '└─ Firewall is active and stable',
            '└─ No suspicious activity found',
        ];
        return findings.slice(0, Math.floor(Math.random() * 2) + 1).join('\n');
    }

    // More helper methods to be implemented...
    calculateSecurityScore(network) {
        // Basic security score calculation
        let score = 0;
        if (network.security === 'wpa2') score += 50;
        if (network.password && network.password.length >= 8) score += 25;
        if (network.password && /[0-9]/.test(network.password)) score += 15;
        if (network.password && /[^A-Za-z0-9]/.test(network.password)) score += 10;
        return Math.min(100, score);
    }

    getSecurityRecommendations(network) {
        const recs = [];
        if (network.security !== 'wpa2') {
            recs.push('└─ Upgrade to WPA2 security');
        }
        if (!network.password || network.password.length < 8) {
            recs.push('└─ Use a longer password (8+ characters)');
        }
        if (network.password && !/[0-9]/.test(network.password)) {
            recs.push('└─ Add numbers to password');
        }
        return recs.length ? 'Recommendations:\n' + recs.join('\n') : 'Security looks good!';
    }

    generateFakeIP() {
        return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    generateFakeMAC() {
        const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        return Array(6).fill(0).map(() => hex()).join(':');
    }

    getSignalQuality(strength) {
        if (strength > 80) return 'Excellent';
        if (strength > 60) return 'Good';
        if (strength > 40) return 'Fair';
        if (strength > 20) return 'Poor';
        return 'Very Poor';
    }

    calculateRange(strength) {
        return Math.floor(strength * 1.5);
    }

    calculateNetworkSpeed(strength) {
        return Math.floor(strength * 2);
    }

    // Packet Catcher game methods to be implemented...
    startPacketGame() {
        this.gameState = {
            score: 0,
            lane: 'middle',
            packets: [],
            shieldActive: false,
            boostActive: false,
            gameInterval: null
        };

        // Start game loop
        this.gameState.gameInterval = setInterval(() => {
            this.updateGame();
        }, 1000);
    }

    updateGame() {
        // Game logic to be implemented
    } 
    
    handleCatchCommand(lane) {
        if (!this.gameState) return;
        
        this.gameState.lane = lane;
        // More game logic to be implemented
        this.addOutput(`Moved to ${lane} lane!`);
    }
    
    handleGameCommand(cmd) {
        if (!this.gameState) return;
        
        switch(cmd) {
            case 'shield':
                if (!this.gameState.shieldActive) {
                    this.gameState.shieldActive = true;
                    setTimeout(() => {
                        this.gameState.shieldActive = false;
                        this.addOutput("Shield deactivated!");
                    }, 5000);
                    this.addOutput("Shield activated for 5 seconds!");
                } else {
                    this.addOutput("Shield already active!");
                }
                break;
                
            case 'boost':
                if (!this.gameState.boostActive) {
                    this.gameState.boostActive = true;
                    setTimeout(() => {
                        this.gameState.boostActive = false;
                        this.addOutput("Speed boost ended!");
                    }, 5000);
                    this.addOutput("Speed boost activated for 5 seconds!");
                } else {
                    this.addOutput("Boost already active!");
                }
                break;
                
            case 'end':
                clearInterval(this.gameState.gameInterval);
                this.addOutput(`Game Over!\nFinal Score: ${this.gameState.score}`);
                this.gameState = null;
                break;
        }
    }
}