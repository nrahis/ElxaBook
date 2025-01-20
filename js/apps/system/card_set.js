// cardSet.js
export class CardSet {
    static toDataURL(svgString) {
        // Reuse the same cleaning/encoding logic from IconSet
        const cleanSvg = svgString.trim()
            .replace(/\s{2,}/g, ' ')
            .replace(/>\s+</g, '><');

        const encoded = cleanSvg
            .replace(/"/g, "'")
            .replace(/%/g, '%25')
            .replace(/#/g, '%23')
            .replace(/\{/g, '%7B')
            .replace(/\}/g, '%7D')
            .replace(/</g, '%3C')
            .replace(/>/g, '%3E')
            .replace(/\s+/g, ' ');

        try {
            return `data:image/svg+xml;charset=utf-8,${encoded}`;
        } catch (error) {
            console.error('Error creating card URL:', error);
            return '';
        }
    }

    static getCard(value, suit, size = 100) { // Changed default size from 140 to 100
        console.log('GetCard called with:', { value, suit, size });
        
        let svgString;
        
        if (value === 'back') {
            svgString = this.getCardBack();
        } else {
            svgString = this.getCardFront(value, suit);
        }

        if (!svgString) {
            console.error(`No SVG string found for card: ${value} of ${suit}`);
            const div = document.createElement('div');
            div.style.width = size + 'px';
            div.style.height = Math.floor(size * 1.4) + 'px'; // Maintain aspect ratio
            div.style.backgroundColor = '#d5bde6';
            div.style.border = '1px solid #a267ac';
            return div;
        }

        const img = document.createElement('img');
        img.width = size;
        img.height = Math.floor(size * 1.4); // Maintain aspect ratio
        img.className = 'playing-card';
        
        img.onerror = (e) => {
            console.error(`Failed to load card: ${value} of ${suit}`);
            img.style.display = 'none';
            const div = document.createElement('div');
            div.style.width = size + 'px';
            div.style.height = Math.floor(size * 1.4) + 'px';
            div.style.backgroundColor = '#d5bde6';
            div.style.border = '1px solid #a267ac';
            img.parentElement?.appendChild(div);
        };
        
        img.src = this.toDataURL(svgString);
        return img;
    }

    static getCardBack() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="190" viewBox="0 0 140 190">
            <!-- Base card -->
            <rect x="5" y="5" width="130" height="180" rx="10" fill="#ff99cc" stroke="#b89fc7" stroke-width="2"/>
            
            <!-- Vaporwave grid -->
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M0 0 L20 0 L20 20 L0 20 Z" fill="none" stroke="#e6d4f2" stroke-width="0.5"/>
                </pattern>
                <linearGradient id="vaporwave" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff99cc"/>
                    <stop offset="50%" style="stop-color:#89d4e3"/>
                    <stop offset="100%" style="stop-color:#a267ac"/>
                </linearGradient>
            </defs>
            
            <!-- Gradient background -->
            <rect x="15" y="15" width="110" height="160" fill="url(#vaporwave)"/>
            <rect x="15" y="15" width="110" height="160" fill="url(#grid)" opacity="0.3"/>
            
            <!-- Retro sun -->
            <circle cx="70" cy="95" r="30" fill="#ff99cc" opacity="0.8"/>
            <rect x="15" y="95" width="110" height="1" stroke="#e6d4f2" stroke-width="0.5" opacity="0.5"/>
            <rect x="15" y="85" width="110" height="1" stroke="#e6d4f2" stroke-width="0.5" opacity="0.5"/>
            <rect x="15" y="105" width="110" height="1" stroke="#e6d4f2" stroke-width="0.5" opacity="0.5"/>
        </svg>`;
    }

    static getCardFront(value, suit) {
        const suitColors = {
            hearts: '#ff4444',
            diamonds: '#ff4444',
            spades: '#333333',
            clubs: '#333333'
        };
    
        const suitSymbols = {
            hearts: this.getHeartSymbol(),
            diamonds: this.getDiamondSymbol(),
            spades: this.getSpadeSymbol(),
            clubs: this.getClubSymbol()
        };
    
        const color = suitColors[suit];
        const symbol = suitSymbols[suit];
        
        // Adjust text position based on value length
        const topXOffset = 15;
        const bottomXOffset = value.length > 1 ? 115 : 120; // Move left more for double digits
        
        return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="190" viewBox="0 0 140 190">
            <rect x="5" y="5" width="130" height="180" rx="10" fill="#ffffff" stroke="#b89fc7" stroke-width="2"/>
            
            <!-- Top value -->
            <text x="${topXOffset}" y="35" font-family="Arial" font-size="24" fill="${color}">${value}</text>
            
            <!-- Bottom value (properly oriented) -->
            <g transform="translate(${bottomXOffset}, 165)">
                <text font-family="Arial" font-size="24" fill="${color}" 
                      text-anchor="end">${value}</text>
            </g>
            
            ${symbol}
        </svg>`;
    }


    static getHeartSymbol() {
        return `
            <path d="M70 85 C50 65 20 65 20 95 C20 120 70 140 70 140 C70 140 120 120 120 95 C120 65 90 65 70 85" 
                  fill="#ff4444"/>`;
    }
    
    static getDiamondSymbol() {
        return `
            <path d="M70 60 L100 100 L70 140 L40 100 Z" 
                  fill="#ff4444"/>`;
    }
    
    static getSpadeSymbol() {
        return `
            <path d="M70 60 C40 60 30 100 70 130 C110 100 100 60 70 60 L70 60 L70 140 L85 140 L85 130 L55 130 L55 140 L70 140" 
                  fill="#333333"/>`;
    }
    
    static getClubSymbol() {
        return `
            <path d="M60 90 A15 15 0 1 1 50 75 A15 15 0 1 1 70 65 A15 15 0 1 1 90 75 A15 15 0 1 1 80 90 L80 130 L60 130 Z" 
                  fill="#333333"/>`;
    }
}