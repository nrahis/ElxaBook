// Clock.js
export class Clock {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.timers = new Map();
        this.alarms = new Map();
        this.timerIdCounter = 0;
        this.alarmIdCounter = 0;
        this.stopwatchInterval = null;
        this.stopwatchTime = 0;
        this.stopwatchStartTime = 0;  // Add this
        this.isStopwatchRunning = false;
        this.laps = [];
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.render();
        this.setupEventListeners();
    }

    render() {
        // Remove Calendar tab and update styling to match Windows theme
        this.contentArea.innerHTML = `
            <div class="clock-app">
                <div class="clock-tabs">
                    <button class="tab-button active" data-tab="clock">Clock</button>
                    <button class="tab-button" data-tab="timer">Timer</button>
                    <button class="tab-button" data-tab="stopwatch">Stopwatch</button>
                    <button class="tab-button" data-tab="alarm">Alarm</button>
                </div>
    
                <div class="tab-content">
                    <!-- Clock Tab -->
                    <div class="tab-pane active" id="clock-tab">
                        <div class="digital-clock"></div>
                        <div class="date-display"></div>
                    </div>
    
                    <!-- Timer Tab -->
                    <div class="tab-pane" id="timer-tab">
                        <div class="timer-controls">
                            <div class="new-timer-form">
                                <input type="number" min="0" class="timer-minutes" placeholder="Minutes">
                                <input type="number" min="0" max="59" class="timer-seconds" placeholder="Seconds">
                                <input type="text" class="timer-name" placeholder="Timer Name">
                                <button class="new-timer-btn">Create Timer</button>
                            </div>
                        </div>
                        <div class="active-timers"></div>
                        <div class="timer-presets">
                            <button data-preset="300">5 Minute Cleanup</button>
                            <button data-preset="600">10 Minute Reading</button>
                            <button data-preset="120">2 Minute Tooth Brushing</button>
                        </div>
                    </div>
    
                    <!-- Stopwatch Tab -->
                    <div class="tab-pane" id="stopwatch-tab">
                        <div class="stopwatch-display">00:00:00</div>
                        <div class="stopwatch-controls">
                            <button class="start-btn">Start</button>
                            <button class="lap-btn" disabled>Lap</button>
                            <button class="reset-btn" disabled>Reset</button>
                        </div>
                        <div class="lap-times"></div>
                    </div>
    
                    <!-- Alarm Tab -->
                    <div class="tab-pane" id="alarm-tab">
                        <div class="new-alarm-form">
                            <input type="time" class="alarm-time">
                            <input type="text" class="alarm-name" placeholder="Alarm Name">
                            <button class="new-alarm-btn">Create Alarm</button>
                        </div>
                        <div class="active-alarms"></div>
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(tabName) {
        const tabs = this.contentArea.querySelectorAll('.tab-button');
        const panes = this.contentArea.querySelectorAll('.tab-pane');
        
        // Remove active class from all tabs and panes
        tabs.forEach(tab => tab.classList.remove('active'));
        panes.forEach(pane => pane.classList.remove('active'));

        // Add active class to selected tab and pane
        const selectedTab = this.contentArea.querySelector(`.tab-button[data-tab="${tabName}"]`);
        const selectedPane = this.contentArea.querySelector(`#${tabName}-tab`);
        
        if (selectedTab && selectedPane) {
            selectedTab.classList.add('active');
            selectedPane.classList.add('active');
        }
    }

    setupEventListeners() {
        // Tab switching
        const tabs = this.contentArea.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Timer controls
        const newTimerBtn = this.contentArea.querySelector('.new-timer-btn');
        newTimerBtn?.addEventListener('click', () => {
            const minutesInput = this.contentArea.querySelector('.timer-minutes');
            const secondsInput = this.contentArea.querySelector('.timer-seconds');
            const nameInput = this.contentArea.querySelector('.timer-name');
            
            const minutes = parseInt(minutesInput.value) || 0;
            const seconds = parseInt(secondsInput.value) || 0;
            const name = nameInput.value || 'Timer';
            
            if (minutes > 0 || seconds > 0) {
                this.createNewTimer(minutes * 60 + seconds, name);
            }
            
            // Reset inputs
            minutesInput.value = '';
            secondsInput.value = '';
            nameInput.value = '';
        });

        // Timer presets
        const presetBtns = this.contentArea.querySelectorAll('.timer-presets button');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const seconds = parseInt(btn.dataset.preset);
                this.createNewTimer(seconds, this.getPresetName(seconds));
            });
        });

        // Stopwatch controls
        const startBtn = this.contentArea.querySelector('.stopwatch-tab .start-btn');
        const lapBtn = this.contentArea.querySelector('.stopwatch-tab .lap-btn');
        const resetBtn = this.contentArea.querySelector('.stopwatch-tab .reset-btn');

        startBtn?.addEventListener('click', () => this.toggleStopwatch());
        lapBtn?.addEventListener('click', () => this.recordLap());
        resetBtn?.addEventListener('click', () => this.resetStopwatch());

        // Alarm controls
        const newAlarmBtn = this.contentArea.querySelector('.new-alarm-btn');
        newAlarmBtn?.addEventListener('click', () => this.createNewAlarm());

        // Clock update
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    // Stopwatch functions
    toggleStopwatch() {
        const startBtn = this.contentArea.querySelector('.stopwatch-tab .start-btn');
        const lapBtn = this.contentArea.querySelector('.stopwatch-tab .lap-btn');
        const resetBtn = this.contentArea.querySelector('.stopwatch-tab .reset-btn');
    
        if (!this.isStopwatchRunning) {
            // Start the stopwatch
            this.stopwatchStartTime = Date.now() - this.stopwatchTime;
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime = Date.now() - this.stopwatchStartTime;
                this.updateStopwatchDisplay();
            }, 10);
            startBtn.textContent = 'Stop';
            lapBtn.disabled = false;
            resetBtn.disabled = true;
            this.isStopwatchRunning = true;
        } else {
            // Stop the stopwatch
            clearInterval(this.stopwatchInterval);
            startBtn.textContent = 'Start';
            lapBtn.disabled = true;
            resetBtn.disabled = false;
            this.isStopwatchRunning = false;
        }
    }
    
    updateStopwatchDisplay() {
        const display = this.contentArea.querySelector('.stopwatch-display');
        if (!display) return;
    
        const totalMs = this.stopwatchTime;
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const ms = Math.floor((totalMs % 1000) / 10);
    
        display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }
    
    recordLap() {
        const lapTimesDiv = this.contentArea.querySelector('.lap-times');
        const lapNumber = this.laps.length + 1;
        const lapTime = this.stopwatchTime;
        
        this.laps.push(lapTime);
        
        // Show lap times container
        lapTimesDiv.classList.add('has-laps');
        
        const lapDisplay = document.createElement('div');
        lapDisplay.className = 'lap-time';
        lapDisplay.textContent = `Lap ${lapNumber}: ${this.formatTime(lapTime)}`;
        lapTimesDiv.insertBefore(lapDisplay, lapTimesDiv.firstChild);
    }
    
    resetStopwatch() {
        clearInterval(this.stopwatchInterval);
        this.stopwatchTime = 0;
        this.laps = [];
        this.isStopwatchRunning = false;
        
        const startBtn = this.contentArea.querySelector('.stopwatch-tab .start-btn');
        const lapBtn = this.contentArea.querySelector('.stopwatch-tab .lap-btn');
        const resetBtn = this.contentArea.querySelector('.stopwatch-tab .reset-btn');
        const lapTimesDiv = this.contentArea.querySelector('.lap-times');
        
        startBtn.textContent = 'Start';
        lapBtn.disabled = true;
        resetBtn.disabled = true;
        lapTimesDiv.innerHTML = '';
        lapTimesDiv.classList.remove('has-laps'); // Hide lap times container
        
        this.updateStopwatchDisplay();
    }
    
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    }

    // Additional methods for Clock class

    // Timer methods
    createNewTimer(totalSeconds, name) {
        const id = this.timerIdCounter++;
        const timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        timerContainer.innerHTML = `
            <div class="timer-header">
                <span class="timer-name">${name}</span>
            </div>
            <div class="timer-display">
                ${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}
            </div>
            <div class="timer-controls">
                <button class="start-timer">Start</button>
                <button class="delete-timer">Delete</button>
            </div>
        `;

        const activeTimers = this.contentArea.querySelector('.active-timers');
        activeTimers.appendChild(timerContainer);

        // Add event listeners
        const startBtn = timerContainer.querySelector('.start-timer');
        const deleteBtn = timerContainer.querySelector('.delete-timer');
        
        startBtn.addEventListener('click', () => this.startTimer(id, timerContainer, totalSeconds));
        deleteBtn.addEventListener('click', () => {
            this.stopTimer(id);
            timerContainer.remove();
        });
    }

    startTimer(id, container, totalSeconds) {
        if (this.timers.has(id)) {
            return; // Timer already running
        }

        const display = container.querySelector('.timer-display');
        const startBtn = container.querySelector('.start-timer');
        startBtn.textContent = 'Stop';

        let timeLeft = totalSeconds;
        this.updateTimerDisplay(display, timeLeft);

        const timer = setInterval(() => {
            timeLeft--;
            this.updateTimerDisplay(display, timeLeft);

            if (timeLeft <= 0) {
                this.stopTimer(id);
                startBtn.textContent = 'Start';
                this.timerComplete(container);
            }
        }, 1000);

        this.timers.set(id, timer);

        startBtn.onclick = () => {
            this.stopTimer(id);
            startBtn.textContent = 'Start';
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

    updateTimerDisplay(display, timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    timerComplete(container) {
        container.classList.add('timer-complete');
        
        // Play a beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A4 note
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500); // Beep for 500ms
        
        // Show completion message
        const message = document.createElement('div');
        message.className = 'timer-complete-message';
        message.textContent = 'Timer Complete!';
        container.appendChild(message);

        // Remove message and animation after 5 seconds
        setTimeout(() => {
            container.classList.remove('timer-complete');
            message.remove();
        }, 5000);
    }

    getPresetName(seconds) {
        switch(seconds) {
            case 300: return "5 Minute Cleanup";
            case 600: return "10 Minute Reading";
            case 120: return "2 Minute Tooth Brushing";
            default: return "Custom Timer";
        }
    }

    // Alarm methods
    createNewAlarm() {
        const timeInput = this.contentArea.querySelector('.alarm-time');
        const nameInput = this.contentArea.querySelector('.alarm-name');
        
        if (!timeInput.value) return;
    
        const id = this.alarmIdCounter++;
        const alarmContainer = document.createElement('div');
        alarmContainer.className = 'alarm-container';
        alarmContainer.innerHTML = `
            <div class="alarm-info">
                <span class="alarm-name">${nameInput.value || 'Alarm'}</span>
                <span class="alarm-time">${timeInput.value}</span>
            </div>
            <div class="alarm-controls">
                <button class="toggle-alarm">Enable</button>
                <button class="delete-alarm">Delete</button>
            </div>
        `;
    
        const activeAlarms = this.contentArea.querySelector('.active-alarms');
        activeAlarms.classList.add('has-alarms'); // Show the container
        activeAlarms.appendChild(alarmContainer);
    
        const toggleBtn = alarmContainer.querySelector('.toggle-alarm');
        const deleteBtn = alarmContainer.querySelector('.delete-alarm');
        
        toggleBtn.addEventListener('click', () => this.toggleAlarm(id, alarmContainer));
        deleteBtn.addEventListener('click', () => {
            this.stopAlarm(id);
            alarmContainer.remove();
            // Hide container if no alarms left
            if (!activeAlarms.querySelector('.alarm-container')) {
                activeAlarms.classList.remove('has-alarms');
            }
        });
    
        // Reset inputs
        timeInput.value = '';
        nameInput.value = '';
    }

    toggleAlarm(id, container) {
        const toggleBtn = container.querySelector('.toggle-alarm');
        const timeDisplay = container.querySelector('.alarm-time').textContent;
        
        if (this.alarms.has(id)) {
            this.stopAlarm(id);
            toggleBtn.textContent = 'Enable';
            container.classList.remove('alarm-active');
        } else {
            const [hours, minutes] = timeDisplay.split(':');
            const alarmCheck = setInterval(() => {
                const now = new Date();
                if (now.getHours() === parseInt(hours) && now.getMinutes() === parseInt(minutes)) {
                    this.alarmTriggered(container);
                    this.stopAlarm(id);
                    toggleBtn.textContent = 'Enable';
                    container.classList.remove('alarm-active');
                }
            }, 1000);

            this.alarms.set(id, alarmCheck);
            toggleBtn.textContent = 'Disable';
            container.classList.add('alarm-active');
        }
    }

    stopAlarm(id) {
        const alarm = this.alarms.get(id);
        if (alarm) {
            clearInterval(alarm);
            this.alarms.delete(id);
        }
    }

    alarmTriggered(container) {
        container.classList.add('alarm-triggered');
        
        // Play alarm sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.value = 880; // A5 note
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        setTimeout(() => oscillator.stop(), 1000); // Alarm sound for 1 second
        
        // Show alarm message
        const message = document.createElement('div');
        message.className = 'alarm-triggered-message';
        message.textContent = 'Alarm!';
        container.appendChild(message);

        // Remove message and animation after 5 seconds
        setTimeout(() => {
            container.classList.remove('alarm-triggered');
            message.remove();
        }, 5000);
    }

    // Clock update method (already included in main class but adding here for completeness)
    updateClock() {
        const clockDisplay = this.contentArea.querySelector('.digital-clock');
        const dateDisplay = this.contentArea.querySelector('.date-display');
        
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
}