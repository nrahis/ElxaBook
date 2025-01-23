// Clock.js
export class Clock {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.timers = new Map();
        this.alarms = new Map();
        this.timerIdCounter = 0;
        this.alarmIdCounter = 0;
        this.stopwatchStartTime = null;
        this.stopwatchElapsedTime = 0;
        this.isStopwatchRunning = false;
        this.laps = [];
        
        // Sound options
        this.alarmSounds = {
            'beep': { frequency: 440, type: 'sine' },
            'birds': { frequency: 880, type: 'sine' },
            'chime': { frequency: 523.25, type: 'triangle' },
            'bells': { frequency: 698.46, type: 'square' },
            'space': { frequency: 261.63, type: 'sawtooth' }
        };
        this.currentAlarmSound = 'beep';
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.render();
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    render() {
        this.contentArea.innerHTML = `
            <div class="clk-app">
                <div class="clk-tabs">
                    <button class="clk-tab-button active" data-tab="clock">Clock</button>
                    <button class="clk-tab-button" data-tab="timer">Timer</button>
                    <button class="clk-tab-button" data-tab="stopwatch">Stopwatch</button>
                    <button class="clk-tab-button" data-tab="alarm">Alarm</button>
                </div>
                
                <div class="clk-content">
                    <!-- Clock Tab -->
                    <div class="clk-tab-pane active" id="clock-tab">
                        <div class="clk-time-display">
                            <div class="clk-digital-clock"></div>
                            <div class="clk-date-display"></div>
                        </div>
                    </div>
    
                    <!-- Timer Tab -->
                    <div class="clk-tab-pane" id="timer-tab">
                        <div class="clk-timer-controls">
                            <div class="clk-new-timer">
                                <input type="number" min="0" class="clk-timer-minutes" placeholder="Minutes">
                                <input type="number" min="0" max="59" class="clk-timer-seconds" placeholder="Seconds">
                                <input type="text" class="clk-timer-name" placeholder="Timer Name">
                                <button class="clk-new-timer-btn">Create Timer</button>
                            </div>
                            <div class="clk-timer-presets">
                                <button data-preset="60" class="clk-preset-btn">1 Min Quick Timer</button>
                                <button data-preset="300" class="clk-preset-btn">5 Min Cleanup</button>
                                <button data-preset="600" class="clk-preset-btn">10 Min Reading</button>
                                <button data-preset="120" class="clk-preset-btn">2 Min Tooth Brushing</button>
                            </div>
                        </div>
                        <div class="clk-active-timers"></div>
                    </div>
    
                    <!-- Stopwatch Tab -->
                    <div class="clk-tab-pane" id="stopwatch-tab">
                        <div class="clk-stopwatch">
                            <div class="clk-stopwatch-display">00:00.00</div>
                            <div class="clk-stopwatch-controls">
                                <button class="clk-start-btn">Start</button>
                                <button class="clk-lap-btn" disabled>Lap</button>
                                <button class="clk-reset-btn" disabled>Reset</button>
                            </div>
                            <div class="clk-lap-times"></div>
                        </div>
                    </div>
    
                    <!-- Alarm Tab -->
                    <div class="clk-tab-pane" id="alarm-tab">
                        <div class="clk-new-alarm">
                            <input type="time" class="clk-alarm-time">
                            <input type="text" class="clk-alarm-name" placeholder="Alarm Name">
                            <input type="text" class="clk-alarm-message" placeholder="Wake Up!" maxlength="20">
                            <select class="clk-alarm-sound">
                                <option value="beep">Beep</option>
                                <option value="birds">Birds</option>
                                <option value="chime">Chime</option>
                                <option value="bells">Bells</option>
                                <option value="space">Space</option>
                            </select>
                            <button class="clk-new-alarm-btn">Create Alarm</button>
                        </div>
                        <div class="clk-active-alarms"></div>
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(tabName) {
        const tabs = this.contentArea.querySelectorAll('.clk-tab-button');
        const panes = this.contentArea.querySelectorAll('.clk-tab-pane');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        panes.forEach(pane => pane.classList.remove('active'));
        
        const selectedTab = this.contentArea.querySelector(`.clk-tab-button[data-tab="${tabName}"]`);
        const selectedPane = this.contentArea.querySelector(`#${tabName}-tab`);
        
        if (selectedTab && selectedPane) {
            selectedTab.classList.add('active');
            selectedPane.classList.add('active');
        }
    }

    // Stopwatch Methods
    toggleStopwatch() {
        const startBtn = this.contentArea.querySelector('.clk-start-btn');
        const lapBtn = this.contentArea.querySelector('.clk-lap-btn');
        const resetBtn = this.contentArea.querySelector('.clk-reset-btn');
        
        if (!this.isStopwatchRunning) {
            this.stopwatchStartTime = Date.now() - this.stopwatchElapsedTime;
            this.stopwatchInterval = requestAnimationFrame(this.updateStopwatch.bind(this));
            startBtn.textContent = 'Stop';
            startBtn.classList.add('active');
            lapBtn.disabled = false;
            resetBtn.disabled = true;
            this.isStopwatchRunning = true;
        } else {
            cancelAnimationFrame(this.stopwatchInterval);
            this.stopwatchElapsedTime = Date.now() - this.stopwatchStartTime;
            startBtn.textContent = 'Start';
            startBtn.classList.remove('active');
            lapBtn.disabled = true;
            resetBtn.disabled = false;
            this.isStopwatchRunning = false;
        }
    }

    updateStopwatch() {
        if (!this.isStopwatchRunning) return;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.stopwatchStartTime;
        this.updateStopwatchDisplay(elapsedTime);
        this.stopwatchInterval = requestAnimationFrame(this.updateStopwatch.bind(this));
    }

    updateStopwatchDisplay(elapsedTime) {
        const display = this.contentArea.querySelector('.clk-stopwatch-display');
        if (!display) return;

        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        const centiseconds = Math.floor((elapsedTime % 1000) / 10);

        display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    recordLap() {
        const lapTimesDiv = this.contentArea.querySelector('.clk-lap-times');
        const lapNumber = this.laps.length + 1;
        const currentTime = Date.now();
        const lapTime = currentTime - this.stopwatchStartTime;
        
        this.laps.push(lapTime);
        
        const lapDisplay = document.createElement('div');
        lapDisplay.className = 'clk-lap-time';
        
        // Calculate split time from previous lap
        let splitTime = lapTime;
        if (this.laps.length > 1) {
            splitTime = lapTime - this.laps[this.laps.length - 2];
        }
        
        lapDisplay.innerHTML = `
            <span class="clk-lap-number">Lap ${lapNumber}</span>
            <span class="clk-lap-split">${this.formatTime(splitTime)}</span>
            <span class="clk-lap-total">${this.formatTime(lapTime)}</span>
        `;
        
        lapTimesDiv.insertBefore(lapDisplay, lapTimesDiv.firstChild);
        lapTimesDiv.classList.add('has-laps');
    }

    resetStopwatch() {
        cancelAnimationFrame(this.stopwatchInterval);
        this.stopwatchTime = 0;
        this.stopwatchElapsedTime = 0;
        this.laps = [];
        this.isStopwatchRunning = false;
        
        const startBtn = this.contentArea.querySelector('.clk-start-btn');
        const lapBtn = this.contentArea.querySelector('.clk-lap-btn');
        const resetBtn = this.contentArea.querySelector('.clk-reset-btn');
        const lapTimesDiv = this.contentArea.querySelector('.clk-lap-times');
        const display = this.contentArea.querySelector('.clk-stopwatch-display');
        
        startBtn.textContent = 'Start';
        startBtn.classList.remove('active');
        lapBtn.disabled = true;
        resetBtn.disabled = true;
        lapTimesDiv.innerHTML = '';
        lapTimesDiv.classList.remove('has-laps');
        display.textContent = '00:00.00';
    }

    // Timer Methods
    createNewTimer(totalSeconds, name) {
        const id = this.timerIdCounter++;
        const timerContainer = document.createElement('div');
        timerContainer.className = 'clk-timer-container';
        
        const progressCircle = this.createProgressCircle();
        const timeDisplay = this.formatTime(totalSeconds * 1000);
        
        timerContainer.innerHTML = `
            <div class="clk-timer-header">
                <span class="clk-timer-name">${name}</span>
                <div class="clk-timer-display">${timeDisplay}</div>
            </div>
            <div class="clk-timer-progress">
                ${progressCircle}
            </div>
            <div class="clk-timer-controls">
                <button class="clk-start-timer">Start</button>
                <button class="clk-delete-timer">Delete</button>
            </div>
        `;

        const activeTimers = this.contentArea.querySelector('.clk-active-timers');
        activeTimers.appendChild(timerContainer);

        const startBtn = timerContainer.querySelector('.clk-start-timer');
        const deleteBtn = timerContainer.querySelector('.clk-delete-timer');
        
        startBtn.addEventListener('click', () => this.startTimer(id, timerContainer, totalSeconds));
        deleteBtn.addEventListener('click', () => {
            this.stopTimer(id);
            timerContainer.remove();
        });
    }

    createProgressCircle() {
        return `
            <svg class="clk-progress-ring" width="120" height="120">
                <circle class="clk-progress-ring-bg" cx="60" cy="60" r="54" />
                <circle class="clk-progress-ring-circle" cx="60" cy="60" r="54" />
            </svg>
        `;
    }

    startTimer(id, container, totalSeconds) {
        if (this.timers.has(id)) return;

        const display = container.querySelector('.clk-timer-display');
        const startBtn = container.querySelector('.clk-start-timer');
        const progressCircle = container.querySelector('.clk-progress-ring-circle');
        const circumference = 2 * Math.PI * 54; // r=54 from SVG
        
        startBtn.textContent = 'Stop';
        let timeLeft = totalSeconds;
        let startTime = Date.now();
        const endTime = startTime + (totalSeconds * 1000);

        const updateTimer = () => {
            const now = Date.now();
            timeLeft = Math.ceil((endTime - now) / 1000);
            
            if (timeLeft <= 0) {
                this.stopTimer(id);
                startBtn.textContent = 'Start';
                this.timerComplete(container);
                return;
            }

            // Update display
            display.textContent = this.formatTime(timeLeft * 1000);
            
            // Update progress circle
            const progress = 1 - (timeLeft / totalSeconds);
            const dashOffset = circumference * (1 - progress);
            progressCircle.style.strokeDashoffset = dashOffset;

            // Add pulse animation when near completion
            if (timeLeft <= 5) {
                container.classList.add('clk-timer-ending');
            }
        };

        // Initial setup
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;
        
        // Start animation
        const timer = setInterval(updateTimer, 50); // Smoother updates
        this.timers.set(id, timer);

        startBtn.onclick = () => {
            this.stopTimer(id);
            startBtn.textContent = 'Start';
            container.classList.remove('clk-timer-ending');
            startBtn.onclick = () => this.startTimer(id, container, totalSeconds);
        };
    }

    stopTimer(id) {
        const timer = this.timers.get(id);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(id);
        }
    }

    timerComplete(container) {
        container.classList.add('clk-timer-complete');
        this.playSound('timer');
        
        // Show completion message with animation
        const message = document.createElement('div');
        message.className = 'clk-timer-complete-message';
        message.textContent = 'Time\'s Up!';
        container.appendChild(message);

        // Remove message and animation after 5 seconds
        setTimeout(() => {
            container.classList.remove('clk-timer-complete', 'clk-timer-ending');
            message.remove();
        }, 5000);
    }

    // Alarm Methods
// Sound system and alarm methods fixes

    createNewAlarm() {
        const timeInput = this.contentArea.querySelector('.clk-alarm-time');
        const nameInput = this.contentArea.querySelector('.clk-alarm-name');
        const messageInput = this.contentArea.querySelector('.clk-alarm-message');
        const soundSelect = this.contentArea.querySelector('.clk-alarm-sound');
        
        if (!timeInput.value) return;

        const id = this.alarmIdCounter++;
        const alarmContainer = document.createElement('div');
        alarmContainer.className = 'clk-alarm-container';
        
        // Get message or use default
        const message = messageInput.value.trim() || 'Wake Up!';
        
        alarmContainer.innerHTML = `
            <div class="clk-alarm-info">
                <span class="clk-alarm-name">${nameInput.value || 'Alarm'}</span>
                <span class="clk-alarm-time">${timeInput.value}</span>
                <span class="clk-alarm-message-display">${message}</span>
                <span class="clk-alarm-sound-type">${soundSelect.value}</span>
            </div>
            <div class="clk-alarm-controls">
                <button class="clk-toggle-alarm">Enable</button>
                <button class="clk-delete-alarm">Delete</button>
            </div>
        `;

        const activeAlarms = this.contentArea.querySelector('.clk-active-alarms');
        activeAlarms.appendChild(alarmContainer);

        // Store the alarm data
        const alarmData = {
            id,
            time: timeInput.value,
            name: nameInput.value || 'Alarm',
            message: message,
            sound: soundSelect.value,
            container: alarmContainer,
            interval: null
        };

        // Bind the event listeners
        const toggleBtn = alarmContainer.querySelector('.clk-toggle-alarm');
        const deleteBtn = alarmContainer.querySelector('.clk-delete-alarm');
        
        toggleBtn.addEventListener('click', () => {
            this.toggleAlarm(alarmData);
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteAlarm(alarmData);
        });

        // Reset inputs
        timeInput.value = '';
        nameInput.value = '';
        messageInput.value = '';
    }

    toggleAlarm(alarmData) {
        const toggleBtn = alarmData.container.querySelector('.clk-toggle-alarm');
        
        if (this.alarms.has(alarmData.id)) {
            // Disable alarm
            this.stopAlarm(alarmData.id);
            toggleBtn.textContent = 'Enable';
            alarmData.container.classList.remove('clk-alarm-active');
        } else {
            // Enable alarm
            const [hours, minutes] = alarmData.time.split(':');
            const alarmCheck = setInterval(() => {
                const now = new Date();
                if (now.getHours() === parseInt(hours) && now.getMinutes() === parseInt(minutes)) {
                    this.alarmTriggered(alarmData);
                }
            }, 1000);

            alarmData.interval = alarmCheck;
            this.alarms.set(alarmData.id, alarmData);
            toggleBtn.textContent = 'Disable';
            alarmData.container.classList.add('clk-alarm-active');
        }
    }

    deleteAlarm(alarmData) {
        this.stopAlarm(alarmData.id);
        alarmData.container.remove();
    }

    stopAlarm(id) {
        const alarmData = this.alarms.get(id);
        if (alarmData) {
            clearInterval(alarmData.interval);
            this.alarms.delete(id);
        }
    }

    alarmTriggered(alarmData) {
        alarmData.container.classList.add('clk-alarm-triggered');
        this.playSound(alarmData.sound);
        
        const message = document.createElement('div');
        message.className = 'clk-alarm-triggered-message';
        message.textContent = alarmData.message;
        alarmData.container.appendChild(message);
    
        setTimeout(() => {
            alarmData.container.classList.remove('clk-alarm-triggered');
            message.remove();
        }, 5000);
    }

    // Fixed sound system with more distinct sounds
    playSound(type = 'beep') {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        switch(type) {
            case 'birds':
                this.playBirdSound(audioContext);
                break;
            case 'chime':
                this.playChimeSound(audioContext);
                break;
            case 'bells':
                this.playBellSound(audioContext);
                break;
            case 'space':
                this.playSpaceSound(audioContext);
                break;
            default:
                this.playBeepSound(audioContext);
        }
    }

    playBeepSound(audioContext) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioContext.currentTime);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        osc.start();
        setTimeout(() => osc.stop(), 500);
    }

    playBirdSound(audioContext) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        // Bird chirp pattern
        for (let i = 0; i < 3; i++) {
            const time = audioContext.currentTime + (i * 0.2);
            osc.frequency.setValueAtTime(1200, time);
            osc.frequency.exponentialRampToValueAtTime(900, time + 0.1);
        }
        
        osc.start();
        setTimeout(() => osc.stop(), 1000);
    }

    playChimeSound(audioContext) {
        const notes = [523.25, 659.25, 783.99, 987.77];
        const duration = 200;
        
        notes.forEach((note, index) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(note, audioContext.currentTime);
                gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                osc.start();
                setTimeout(() => osc.stop(), duration);
            }, index * duration);
        });
    }

    playBellSound(audioContext) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioContext.currentTime);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        osc.start();
        setTimeout(() => osc.stop(), 1000);
    }

    playSpaceSound(audioContext) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        
        osc.start();
        setTimeout(() => osc.stop(), 500);
    }

    createBirdSound(oscillator, gainNode) {
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.2);
        oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.4);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
    }

    createChimeSound(oscillator, gainNode) {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        let time = audioContext.currentTime;
        notes.forEach((note, index) => {
            oscillator.frequency.setValueAtTime(note, time + index * 0.2);
        });
        oscillator.start();
        setTimeout(() => oscillator.stop(), notes.length * 200);
    }

    createBellSound(oscillator, gainNode) {
        oscillator.frequency.setValueAtTime(698.46, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 1000);
    }

    createSpaceSound(oscillator, gainNode) {
        oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 2);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 2000);
    }

    // Utility Methods
    formatTime(ms) {
        if (ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((ms % 1000) / 10);
        
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    updateClock() {
        const clockDisplay = this.contentArea.querySelector('.clk-digital-clock');
        const dateDisplay = this.contentArea.querySelector('.clk-date-display');
        
        if (clockDisplay && dateDisplay) {
            const now = new Date();
            clockDisplay.textContent = now.toLocaleTimeString();
            dateDisplay.textContent = now.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }

    setupEventListeners() {
        // Tab switching
        const tabs = this.contentArea.querySelectorAll('.clk-tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Timer controls
        const newTimerBtn = this.contentArea.querySelector('.clk-new-timer-btn');
        newTimerBtn?.addEventListener('click', () => {
            const minutesInput = this.contentArea.querySelector('.clk-timer-minutes');
            const secondsInput = this.contentArea.querySelector('.clk-timer-seconds');
            const nameInput = this.contentArea.querySelector('.clk-timer-name');
            
            const minutes = parseInt(minutesInput.value) || 0;
            const seconds = parseInt(secondsInput.value) || 0;
            const name = nameInput.value || 'Timer';
            
            if (minutes > 0 || seconds > 0) {
                this.createNewTimer(minutes * 60 + seconds, name);
            }
            
            minutesInput.value = '';
            secondsInput.value = '';
            nameInput.value = '';
        });

        // Timer presets
        const presetBtns = this.contentArea.querySelectorAll('.clk-timer-presets button');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const seconds = parseInt(btn.dataset.preset);
                this.createNewTimer(seconds, btn.textContent);
            });
        });

        // Stopwatch controls
        const startBtn = this.contentArea.querySelector('.clk-start-btn');
        const lapBtn = this.contentArea.querySelector('.clk-lap-btn');
        const resetBtn = this.contentArea.querySelector('.clk-reset-btn');

        startBtn?.addEventListener('click', () => this.toggleStopwatch());
        lapBtn?.addEventListener('click', () => this.recordLap());
        resetBtn?.addEventListener('click', () => this.resetStopwatch());

        // Alarm controls
        const newAlarmBtn = this.contentArea.querySelector('.clk-new-alarm-btn');
        newAlarmBtn?.addEventListener('click', () => this.createNewAlarm());
    }
}