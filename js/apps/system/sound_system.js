// sound_system.js
class SoundSystem {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Simple beep sound with configurable parameters
    beep(frequency = 440, duration = 0.1, type = 'sine', volume = 0.1) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Predefined sound effects
    playTimerStart() {
        this.beep(880, 0.1, 'sine', 0.1);  // High beep
        setTimeout(() => this.beep(1100, 0.1, 'sine', 0.1), 150);  // Higher beep
    }

    playTimerTick() {
        this.beep(440, 0.05, 'sine', 0.05);  // Soft tick
    }

    playTimerEnd() {
        this.beep(880, 0.1, 'sine', 0.1);
        setTimeout(() => this.beep(660, 0.1, 'sine', 0.1), 100);
        setTimeout(() => this.beep(440, 0.2, 'sine', 0.1), 200);
    }

    playSuccess() {
        this.beep(440, 0.1, 'sine', 0.1);
        setTimeout(() => this.beep(660, 0.1, 'sine', 0.1), 100);
        setTimeout(() => this.beep(880, 0.2, 'sine', 0.1), 200);
    }

    playError() {
        this.beep(440, 0.2, 'square', 0.1);
        setTimeout(() => this.beep(220, 0.2, 'square', 0.1), 200);
    }

    // Character specific sounds
    playDuck() {
        // Duck quack - frequency sweep
        const duration = 0.2;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playElxa() {
        // Magical sparkle sound
        const duration = 0.5;
        [880, 1320, 1760].forEach((freq, i) => {
            setTimeout(() => this.beep(freq, 0.1, 'sine', 0.05), i * 100);
        });
    }

    playSnake() {
        // Slither sound - frequency sweep
        const duration = 0.3;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playAbby() {
        // Cat purr/meow - frequency sweep up
        const duration = 0.2;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
}

export { SoundSystem };