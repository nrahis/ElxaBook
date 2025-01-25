import { CONFIG } from './system/config.js';
import { SoundSystem } from './system/sound_system.js';

class ElxaMagicInterpreter {
    constructor() {
        this.config = CONFIG;
        this.soundSystem = new SoundSystem();
        this.duckMode = false;
        this.currentBase = 10;
        // Add new number pattern handling
        this.numberPattern = /^\d+$/;  // Pattern to match plain decimal numbers
        this.magicWords = {
            DUCK: ['DUCK', 'duck', 'Duck', 'Walter'],
            ABBY: ['ABBY', 'abby', 'Abby', 'Abs'],
            ELXA: ['ELXA', 'elxa', 'Elxa', 'ex', 'EX'],
            SNAKE: ['Mr.Snake-e', 'SNAKE-E', 'snake', 'Snake', 'snake-e', 'snake-E'],
            BAD: ['crap', 'poop', 'butt', 'shut up', 'hate', 'nuts']
        };

        //BAD responses
        this.badResponses = [
            "Uh oh, better watch your language!",
            "You talk to your mother with that mouth??",
            "Hey, watch it, buster!"
        ];

        // Snake-e's special responses
        this.snakeResponses = [
            "🐍 *Mr. Snake-e slithers in luxuriously* Current Elxa Technologies valuation: $999,999,999,999",
            "🐍 *adjusts tie with tail* Another brilliant innovation from Elxa Technologies!",
            "🐍 Just checked my snake wallet - only made another trillion today!",
            "🐍 *coils around golden calculator* Let me compute that for you...",
            "🐍 *checks gold-plated calculator* According to my calculations, Elxa's stock just went up another trillion!",
            "🐍 Mrs. Snake-e packed me fibonacci sequence sandwiches for lunch today! How thoughtful!",
            "🐍 *adjusts silk tie with tail* Just parked my Denali next to my solid gold supercomputer!",
            "🐍 Mr. Snake-e's Pro Tip: The secret to being a trillionaire is counting in python! *winks*",
            "🐍 *coils around executive chair* Another profitable day of making math more ssssslithery!",
            "🐍 Just got back from a board meeting in my diamond-encrusted helicopter! The graphs were exponential!",
            "🐍 Mrs. Snake-e says I need to stop buying more calculators, but how can I resist? They're prime investments!",
            "🐍 *straightens executive scales* Time to make mathematics more luxurious!",
            "🐍 Breaking news: Mr. Snake-e's net worth now requires scientific notation to display!",
            "🐍 *flicks tongue at spreadsheet* These profits are looking particularly pythonic today!",
            "🐍 Had to upgrade my Denali again - kept filling it up with too many mathematical constants!",
            "🐍 Mrs. Snake-e made her famous pi(e) for dessert. It's infinite-ly delicious!",
            "🐍 *rattles diamond-studded tail* Time to calculate today's quadrillion-dollar profits!",
            "🐍 Just commissioned a solid gold statue of the quadratic formula for my office lobby!",
            "🐍 *polishes monocle with tail* Did someone say it's time for some luxury mathematics?",
            "🐍 ElxaCorp: Where every byte has a bite! *winks with snake eye*"
        ];

        this.elxaResponses = [
            () => `✨ ${this.config.system.name} v${this.config.system.version} - Where Magic Meets Technology!`,
            () => `🌟 ${this.config.system.name} ${this.config.system.codename} says: Programming is like magic, but cooler!`,
            "🎩 *waves magic coding wand* Your code is getting more magical!",
            "🔮 Elxa's crystal ball predicts... great code in your future!",
            "⚡ Elxa power activated! Time to make some tech magic!"
        ];

        // Sound effects library
        this.soundEffects = {
            timer: {
                start: "🔊 *ding ding* Timer starting!",
                tick: "🔊 *tick tock*",
                halfway: "🔊 *boop boop* Halfway there!",
                nearEnd: "🔊 *bing bing* Almost done!",
                end: "🔊 *DING DING DING* Time's up!"
            },
            calculation: {
                processing: "🔊 *beep boop* Computing...",
                success: "🔊 *tada!* Calculation complete!",
                error: "🔊 *bzzzzt* Oops, something went wrong!"
            },
            snake: {
                enter: "🔊 *luxurious slither sounds*",
                money: "🔊 *cha-ching* *coins clinking*",
                approve: "🔊 *happy hiss* Excellent!"
            }
        };

        // Active timers storage
        this.activeTimers = new Map();
        this.timerCallbacks = new Map();
        this.defaultFontSize = '12px';
        this.currentFontSize = this.defaultFontSize;

        // Math magic storage
        this.lastCalculation = null;
        this.mathFacts = {
            primes: ["Did you know? The largest known prime number has over 24 million digits!"],
            binary: ["Fun fact: Computers use binary because transistors have two states!"],
            time: ["Time flies! Light travels about 186,282 miles per second!"],
            snakeMath: [
                "Mr. Snake-e's favorite number is infinity... because it looks like him!",
                "According to Mr. Snake-e, PI is just a circular snake eating its tail",
                "Mr. Snake-e calculated his net worth but ran out of zeros!"
            ]
        };

        this.duckResponses = [
            "QUACK! I mean... accessing mainframe...",
            "🦆 DUCK (aka Walter) is processing your request...",
            "DUCK POWER ACTIVATED! *fancy hacking noises*",
            "Warning: DUCK has detected unauthorized fun!",
            "DUCK-tecting suspicious activity... it's cookies in the cookie jar!",
            "🦆 Emergency DUCK deployment in progress... *fancy typing sounds*",
            "ALERT: DUCK has breached the firewall with bread crumbs!",
            "🦆 Deploying tactical DUCK algorithms... *quack quack quack*",
            "DUCK says: Error 404 - Hidden snacks not found in the database!",
            "🦆 Initializing DUCK override... *dramatic waddle sequence*",
            "Warning: DUCK has infiltrated the system with maximum cuteness!",
            "🦆 DUCK.exe is running... Converting all passwords to quacks...",
            "Super secret DUCK encryption enabled! *mysterious pond splashing*",
            "🦆 DUCK defensive systems online! Protecting against boring code!",
            "CAUTION: DUCK is redistributing digital bread crumbs...",
            "🦆 *DUCK unleashes powerful quack attack* System thoroughly DUCKed!"
        ];

        this.abbyResponses = [
            "Meow! Abby's virtual assistant is here to help! 🐱",
            "Abby's digital paw-print detected! Systems purring normally...",
            "🐱 Abby says: Don't forget to take breaks and pet real cats!",
            "Abby's virtual whiskers are twitching... detecting computer mice!",
            "Abby says: It's about time for cuddles, isn't it? :3",
            "Abby is proud of you for being so smart! Must be all those veggies!",
            "Abby's Paw-sonal Assistant reminds you: Remember to smile today! 🐱",
            "🐱 *purrs contentedly* Your code is looking paw-sitively wonderful!",
            "Meow! Abby's watching over your programming from her cozy cloud pillow 🌟",
            "🐱 *gentle headbutt* Abby thinks you deserve a coding break and some snuggles",
            "Abby's Virtual Assistant says: You're doing great! Time for a celebratory treat? 🍪",
            "🐱 *stretches and yawns* Another purr-fect day at Elxa Technologies!",
            "Abby's wisdom for today: Sometimes the best debug tool is a quick cat nap 😺",
            "🐱 *paw tap* Abby's sensors detect you're doing amazing work!",
            "Meow! Abby's keeping your code warm and bug-free with virtual purrs~",
            "🐱 Abby's daily reminder: You're as special as catnip and twice as nice!",
            "According to Abby's calculations, it's time for some computer cuddles! 💕",
            "🐱 *happy whisker twitch* Abby says your code is looking meow-velous!",
            "Abby's virtual tail is swishing with pride at your programming progress! ✨",
            "🐱 Abby's Debugging Service: Purrs away the bugs, leaves the hugs!",
            "Meow! Abby's digital whiskers sense great things happening at Elxa today!"
        ];

        this.explosionTypes = [
            "💥 BOOM!",
            "🎉 KABOOM!",
            "✨ POOF! *sparkles everywhere*",
            "🌈 KAPOW! *rainbow explosion*"
        ];

        // Add new properties for time and size tracking
        this.activeTimers = new Map();
        this.timerCallbacks = new Map();
        this.defaultFontSize = '12px';
        this.currentFontSize = this.defaultFontSize;
    }

    interpretMagicCode(code) {
        let output = [];
        const lines = code.split('\n');

        for (let line of lines) {
            if (!line.trim()) continue;

            // Create an array to store all matches in this line
            let lineMatches = [];

            // Check for numbers pattern first
            if (this.numberPattern.test(line.trim())) {
                const num = parseInt(line.trim());
                lineMatches.push(...this.generateNumberFacts(num));
            }

            // Check for binary pattern
            if (/\b[01]+\b/.test(line) && !line.includes('<timer>')) {
                const binaryMatch = line.match(/\b[01]+\b/);
                lineMatches.push(...this.handleEnhancedBinary(binaryMatch[0]));
            }

            // Check for timer pattern
            const timerRegex = /<timer>=\[(\d+)(?::(\d+))?\]/;
            const timerMatch = line.match(timerRegex);
            if (timerMatch) {
                let minutes = 0;
                let seconds = 0;
                
                if (timerMatch[2] !== undefined) {
                    minutes = parseInt(timerMatch[1]);
                    seconds = parseInt(timerMatch[2]);
                } else {
                    seconds = parseInt(timerMatch[1]);
                }
                
                lineMatches.push(...this.startActiveTimer(minutes, seconds));
            }

            // Check for all magic words
            if (this.containsMagicWord(line, 'BAD')) {
                lineMatches.push(this.getRandomBadResponse());
            }

            if (this.containsMagicWord(line, 'SNAKE')) {
                lineMatches.push(this.soundEffects.snake.enter);
                lineMatches.push(this.getRandomSnakeResponse());
            }

            if (this.containsMagicWord(line, 'DUCK')) {
                lineMatches.push(this.getRandomDuckResponse());
                this.duckMode = !this.duckMode;
            }

            if (this.containsMagicWord(line, 'ABBY')) {
                lineMatches.push(this.getRandomAbbyResponse());
            }

            if (this.containsMagicWord(line, 'ELXA')) {
                lineMatches.push(this.handleElxaCommand(line));
            }

            // Handle DUCK mode last
            if (this.duckMode && !this.containsAnyMagicWord(line)) {
                lineMatches.push(this.duckify(line));
            }

            // Add all matches from this line to the output
            output.push(...lineMatches);
        }

        return output;
    }

    // Add new helper method to check for any magic word
    containsAnyMagicWord(line) {
        return Object.keys(this.magicWords).some(key => 
            this.containsMagicWord(line, key)
        );
    }

    handleElxaCommand(line) {
        this.soundSystem.playElxa();  // Play actual sound
        const response = this.elxaResponses[Math.floor(Math.random() * this.elxaResponses.length)];
        const snakeComment = Math.random() < 0.3 ? 
            "\n🐍 Mr. Snake-e: Ah yes, Elxa magic... very profitable!" : "";
        
        return `✨ ${response}${snakeComment}`;
    }

    startActiveTimer(minutes, seconds) {
        const output = [];
        const totalSeconds = minutes * 60 + seconds;
        const timerId = Date.now();
        
        // Convert numbers to strings and pad with zeros
        const displayMinutes = minutes.toString();
        const displaySeconds = seconds.toString().padStart(2, '0');
        
        output.push(this.soundEffects.timer.start);
        output.push(`⏰ Starting timer for ${displayMinutes}:${displaySeconds}!`);

        let timeLeft = totalSeconds;
        const timer = setInterval(() => {
            timeLeft--;
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            
            if (timeLeft === Math.floor(totalSeconds / 2)) {
                this.timerCallbacks.get(timerId)([this.soundEffects.timer.halfway]);
            }
            
            if (timeLeft === 10) {
                this.timerCallbacks.get(timerId)([this.soundEffects.timer.nearEnd]);
            }

            if (timeLeft <= 0) {
                clearInterval(timer);
                this.timerCallbacks.get(timerId)([
                    this.soundEffects.timer.end,
                    "🐍 Mr. Snake-e says: Time is money, and we've spent it wisely!"
                ]);
                this.activeTimers.delete(timerId);
                this.timerCallbacks.delete(timerId);
            } else {
                // Convert numbers to strings and pad with zeros for display
                const displayMins = mins.toString();
                const displaySecs = secs.toString().padStart(2, '0');
                const display = `🕒 ${displayMins}:${displaySecs}`;
                this.timerCallbacks.get(timerId)([display]);
            }
        }, 1000);

        this.activeTimers.set(timerId, timer);
        return output;
    }

    handleEnhancedBinary(binaryStr) {
        const output = [];
        const decimal = parseInt(binaryStr, 2);
        
        output.push(this.soundEffects.calculation.processing);
        output.push(`🤖 Binary sequence detected: ${binaryStr}`);
        output.push(`🔢 Decimal value: ${decimal}`);
        
        // Enhanced number facts
        output.push(...this.generateNumberFacts(decimal));
        
        // Snake-e's mathematical wisdom
        if (decimal > 1000000) {
            output.push(this.soundEffects.snake.money);
            output.push("🐍 Mr. Snake-e: That's a big number, but still smaller than my bank account!");
        }

        return output;
    }

    handleBinaryConversion(binaryStr) {
        // For backward compatibility, just call the new method
        return this.handleEnhancedBinary(binaryStr);
    }

    generateNumberFacts(num) {
        const facts = [];
        
        // Basic properties
        if (this.isPrime(num)) {
            facts.push(`✨ ${num} is a prime number! Mr. Snake-e collects those!`);
        }
        if (this.isPerfectSquare(num)) {
            facts.push(`🎯 ${num} is a perfect square (${Math.sqrt(num)} × ${Math.sqrt(num)})!`);
        }
        if (this.isFibonacci(num)) {
            facts.push(`🌀 ${num} is in the Fibonacci sequence! Nature's code!`);
        }
        
        // Fun with bases
        facts.push(`📝 ${num} in binary: ${num.toString(2)}`);
        facts.push(`🎨 ${num} in hexadecimal: 0x${num.toString(16).toUpperCase()}`);
        facts.push(`🎲 ${num} in octal: 0o${num.toString(8)}`);

        // Snake-e's special numbers
        if (num === 42) {
            facts.push("🐍 Mr. Snake-e: Ah, the answer to everything!");
        }
        if (num === 404) {
            facts.push("🐍 Mr. Snake-e: Error 404 - My missing billions found!");
        }

        return facts;
    }

    isPerfectSquare(num) {
        const sqrt = Math.sqrt(num);
        return sqrt === Math.floor(sqrt);
    }

    isFibonacci(num) {
        return this.isPerfectSquare(5 * num * num + 4) || 
               this.isPerfectSquare(5 * num * num - 4);
    }

    containsMagicWord(line, wordKey) {
        return this.magicWords[wordKey].some(word => line.includes(word));
    }

    getRandomSnakeResponse() {
        this.soundSystem.playSnake();
        return this.snakeResponses[Math.floor(Math.random() * this.snakeResponses.length)];
    }
    
    getRandomDuckResponse() {
        this.soundSystem.playDuck();
        return this.duckResponses[Math.floor(Math.random() * this.duckResponses.length)];
    }

    getRandomBadResponse() {
        return this.badResponses[Math.floor(Math.random() * this.badResponses.length)];
    }
    
    getRandomAbbyResponse() {
        this.soundSystem.playAbby();
        return this.abbyResponses[Math.floor(Math.random() * this.abbyResponses.length)];
    }

    getFutureTime(secondsFromNow) {
        const future = new Date(Date.now() + secondsFromNow * 1000);
        return future.toLocaleTimeString();
    }

    isPrime(num) {
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return num > 1;
    }

    duckify(line) {
        const hackingTerms = [
            "accessing mainframe...",
            "bypassing security...",
            "encrypting cookies...",
            "downloading more RAM...",
            "enhanced by DUCK technology..."
        ];
        return `🦆 DUCK: ${hackingTerms[Math.floor(Math.random() * hackingTerms.length)]}`;
    }
}

export { ElxaMagicInterpreter };