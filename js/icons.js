// icons.js
export class IconSet {
    static toDataURL(svgString) {
        // Clean up whitespace and ensure consistent formatting
        const cleanSvg = svgString.trim()
            .replace(/\s{2,}/g, ' ')
            .replace(/>\s+</g, '><');

        // Create a properly URL-encoded version of the SVG
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
            console.error('Error creating data URL:', error);
            return '';
        }
    }

    static getIcon(category, type, size = 48) {
        let svgString;
        
        switch(category) {
            case 'folder':
                svgString = this.getFolderIcon(type);
                break;
            case 'system':
                svgString = this.getSystemIcon(type);
                break;
            case 'file':
                svgString = this.getFileIcon(type);
                break;
            default:
                console.warn(`Unknown category: ${category}, falling back to default file icon`);
                svgString = this.getFileIcon('default');
        }

        if (!svgString) {
            console.error(`No SVG string found for category: ${category}, type: ${type}`);
            const div = document.createElement('div');
            div.style.width = size + 'px';
            div.style.height = size + 'px';
            div.style.backgroundColor = '#d5bde6';
            div.style.border = '1px solid #a267ac';
            return div;
        }

        const img = document.createElement('img');
        img.width = size;
        img.height = size;
        img.className = 'system-icon';
        
        img.onerror = (e) => {
            console.error(`Failed to load icon for category: ${category}, type: ${type}`);
            img.style.display = 'none';
            const div = document.createElement('div');
            div.style.width = size + 'px';
            div.style.height = size + 'px';
            div.style.backgroundColor = '#d5bde6';
            div.style.border = '1px solid #a267ac';
            img.parentElement?.appendChild(div);
        };
        
        img.src = this.toDataURL(svgString);
        return img;
    }

    static getFolderIcon(type = 'default') {
        const icons = {
            default: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#d5bde6" stroke="#a267ac" stroke-width="2"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
            </svg>`,
            
            documents: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#d5bde6" stroke="#a267ac" stroke-width="2"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <rect x="15" y="22" width="18" height="2" fill="#a267ac"/>
                <rect x="15" y="27" width="18" height="2" fill="#a267ac"/>
                <rect x="15" y="32" width="12" height="2" fill="#a267ac"/>
            </svg>`,
            
            pictures: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#d5bde6" stroke="#a267ac" stroke-width="2"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <circle cx="18" cy="25" r="3" fill="#a267ac"/>
                <path d="M15 35L22 28L25 31L32 24V35H15Z" fill="#a267ac"/>
            </svg>`,
            
            music: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#d5bde6" stroke="#a267ac" stroke-width="2"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <path d="M25 20V31C25 32.6569 23.6569 34 22 34C20.3431 34 19 32.6569 19 31C19 29.3431 20.3431 28 22 28V20L30 22V29" stroke="#a267ac" stroke-width="2"/>
            </svg>`,
            
            downloads: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#d5bde6" stroke="#a267ac" stroke-width="2"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <path d="M24 20V32M24 32L20 28M24 32L28 28" stroke="#a267ac" stroke-width="2"/>
            </svg>`,
            
            recycle: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#67c9dc" stroke="#4a9bb0" stroke-width="2"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="#89d4e3" stroke="#67c9dc" stroke-width="2"/>
                <path d="M20 25H28L24 33L20 25Z" fill="#4a9bb0"/>
                <path d="M24 22V29" stroke="#4a9bb0" stroke-width="2"/>
            </svg>`
        };
        
        return icons[type] || icons.default;
    }

    static getFileIcon(type = 'default') {
        const icons = {
            default: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M10 4C10 2.89543 10.8954 2 12 2H28L38 12V44C38 45.1046 37.1046 46 36 46H12C10.8954 46 10 45.1046 10 44V4Z" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <path d="M28 2L38 12H28V2Z" fill="#d5bde6" stroke="#b89fc7" stroke-width="2"/>
            </svg>`,
            
            text: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M10 4C10 2.89543 10.8954 2 12 2H28L38 12V44C38 45.1046 37.1046 46 36 46H12C10.8954 46 10 45.1046 10 44V4Z" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <path d="M28 2L38 12H28V2Z" fill="#d5bde6" stroke="#b89fc7" stroke-width="2"/>
                <rect x="16" y="20" width="16" height="2" fill="#a267ac"/>
                <rect x="16" y="25" width="16" height="2" fill="#a267ac"/>
                <rect x="16" y="30" width="10" height="2" fill="#a267ac"/>
            </svg>`,
            
            paint: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M10 4C10 2.89543 10.8954 2 12 2H28L38 12V44C38 45.1046 37.1046 46 36 46H12C10.8954 46 10 45.1046 10 44V4Z" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <path d="M28 2L38 12H28V2Z" fill="#d5bde6" stroke="#b89fc7" stroke-width="2"/>
                <circle cx="24" cy="24" r="8" fill="none" stroke="#a267ac" stroke-width="2"/>
                <path d="M20 24C20 22 22 20 24 20" stroke="#a267ac" stroke-width="2"/>
            </svg>`
        };
        
        return icons[type] || icons.default;
    }

    static getSystemIcon(type) {
        const icons = {
            computer: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="6" width="32" height="24" rx="2" fill="#67c9dc" stroke="#4a9bb0" stroke-width="2"/>
                <rect x="16" y="30" width="16" height="8" fill="#89d4e3" stroke="#67c9dc" stroke-width="2"/>
                <rect x="12" y="38" width="24" height="4" fill="#89d4e3" stroke="#67c9dc" stroke-width="2"/>
                <rect x="12" y="10" width="24" height="16" fill="#e6d4f2"/>
            </svg>`,
            
            explorer: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="6" width="36" height="36" rx="2" fill="#d5bde6" stroke="#a267ac" stroke-width="2"/>
                <rect x="10" y="10" width="12" height="28" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <rect x="26" y="10" width="12" height="28" fill="#e6d4f2" stroke="#b89fc7" stroke-width="2"/>
                <rect x="12" y="14" width="8" height="4" fill="#a267ac"/>
                <rect x="12" y="22" width="8" height="4" fill="#a267ac"/>
                <rect x="28" y="14" width="8" height="4" fill="#a267ac"/>
                <rect x="28" y="22" width="8" height="4" fill="#a267ac"/>
            </svg>`,
            
            drive: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="12" width="36" height="24" rx="2" fill="#67c9dc" stroke="#4a9bb0" stroke-width="2"/>
                <circle cx="36" cy="28" r="2" fill="#4a9bb0"/>
                <rect x="10" y="18" width="24" height="4" fill="#89d4e3"/>
                <rect x="10" y="26" width="16" height="4" fill="#89d4e3"/>
                </svg>`
            };
            
            if (!icons[type]) {
                console.error(`System icon type not found: ${type}`);
                return null;
            }
            
            return icons[type];
        }
    }