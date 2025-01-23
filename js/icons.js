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
        console.log('GetIcon called with:', { category, type, size }); // Debug log
        
        let svgString;
        
        switch(category) {
            case 'folder':
                svgString = this.getFolderIcon(type);
                break;
            case 'system':
                svgString = this.getSystemIcon(type);
                break;
            case 'program':  // Add this case
                // Get program name from the file info object
                const programName = type?.program;
                console.log('Program file detected:', { programName }); // Debug log
                svgString = this.getFileIcon(programName);
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
    
    // In case we need to debug the SVG creation, add this log to toDataURL:
    static toDataURL(svgString) {
        if (!svgString) {
            console.error('Received empty SVG string');
            return '';
        }
        
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

    static getFolderIcon(type = 'default') {
        const icons = {
            default: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="folderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#e6d5b8"/>
                        <stop offset="100%" style="stop-color:#d4c4a8"/>
                    </linearGradient>
                    <linearGradient id="folderFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f0e0c6"/>
                        <stop offset="100%" style="stop-color:#e6d5b8"/>
                    </linearGradient>
                </defs>
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="url(#folderGrad)"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="url(#folderFrontGrad)"/>
            </svg>`,
            
            documents: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="docFolderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#e6d5b8"/>
                        <stop offset="100%" style="stop-color:#d4c4a8"/>
                    </linearGradient>
                    <linearGradient id="docFolderFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f0e0c6"/>
                        <stop offset="100%" style="stop-color:#e6d5b8"/>
                    </linearGradient>
                </defs>
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="url(#docFolderGrad)"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="url(#docFolderFrontGrad)"/>
                <rect x="15" y="22" width="18" height="2" fill="#8b7355" fill-opacity="0.8"/>
                <rect x="15" y="27" width="18" height="2" fill="#8b7355" fill-opacity="0.8"/>
                <rect x="15" y="32" width="12" height="2" fill="#8b7355" fill-opacity="0.8"/>
            </svg>`,

            pictures: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="picFolderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#e6d5b8"/>
                        <stop offset="100%" style="stop-color:#d4c4a8"/>
                    </linearGradient>
                    <linearGradient id="picFolderFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f0e0c6"/>
                        <stop offset="100%" style="stop-color:#e6d5b8"/>
                    </linearGradient>
                </defs>
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="url(#picFolderGrad)"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="url(#picFolderFrontGrad)"/>
                <circle cx="18" cy="25" r="3" fill="#8b7355" fill-opacity="0.8"/>
                <path d="M15 35L22 28L25 31L32 24V35H15Z" fill="#8b7355" fill-opacity="0.8"/>
            </svg>`,
            

            downloads: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="downloadFolderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#e6d5b8"/>
                        <stop offset="100%" style="stop-color:#d4c4a8"/>
                    </linearGradient>
                    <linearGradient id="downloadFolderFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f0e0c6"/>
                        <stop offset="100%" style="stop-color:#e6d5b8"/>
                    </linearGradient>
                </defs>
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="url(#downloadFolderGrad)"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="url(#downloadFolderFrontGrad)"/>
                <path d="M24 20V32M24 32L20 28M24 32L28 28" stroke="#8b7355" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,

            music: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="musicFolderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#e6d5b8"/>
                        <stop offset="100%" style="stop-color:#d4c4a8"/>
                    </linearGradient>
                    <linearGradient id="musicFolderFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f0e0c6"/>
                        <stop offset="100%" style="stop-color:#e6d5b8"/>
                    </linearGradient>
                </defs>
                <path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="url(#musicFolderGrad)"/>
                <path d="M5 15H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V15Z" fill="url(#musicFolderFrontGrad)"/>
                <path d="M28 20L28 31" stroke="#8b7355" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="25" cy="31" r="3" fill="#8b7355"/>
                <path d="M28 20C28 20 31 21 34 20" stroke="#8b7355" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`,

            recycle: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="binGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#a8a8a8"/>
                        <stop offset="100%" style="stop-color:#8a8a8a"/>
                    </linearGradient>
                    <linearGradient id="lidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#b8b8b8"/>
                        <stop offset="100%" style="stop-color:#9a9a9a"/>
                    </linearGradient>
                </defs>
                <!-- Bin body -->
                <path d="M14 14h20v26c0 1.1-0.9 2-2 2H16c-1.1 0-2-0.9-2-2V14z" fill="url(#binGrad)"/>
                <!-- Lid -->
                <path d="M12 8h24c1.1 0 2 0.9 2 2v4H10v-4c0-1.1 0.9-2 2-2z" fill="url(#lidGrad)"/>
                <!-- Handle -->
                <path d="M20 6h8v2h-8v-2z" fill="#787878"/>
                <!-- Delete lines -->
                <rect x="18" y="18" width="2" height="20" fill="#666666"/>
                <rect x="23" y="18" width="2" height="20" fill="#666666"/>
                <rect x="28" y="18" width="2" height="20" fill="#666666"/>
            </svg>`
        };
        
        return icons[type] || icons.default;
    }

    static getFileIcon(type = 'default') {
        // First, define all our icons
        const icons = {
            default: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="fileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f5f5f5"/>
                        <stop offset="100%" style="stop-color:#ededed"/>
                    </linearGradient>
                    <linearGradient id="cornerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#e0e0e0"/>
                        <stop offset="100%" style="stop-color:#d4d4d4"/>
                    </linearGradient>
                </defs>
                <path d="M10 4C10 2.89543 10.8954 2 12 2H28L38 12V44C38 45.1046 37.1046 46 36 46H12C10.8954 46 10 45.1046 10 44V4Z" fill="url(#fileGrad)"/>
                <path d="M28 2L38 12H28V2Z" fill="url(#cornerGrad)"/>
            </svg>`,

            txt: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="textFileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f5f5f5"/>
                        <stop offset="100%" style="stop-color:#ededed"/>
                    </linearGradient>
                    <linearGradient id="textCornerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#e0e0e0"/>
                        <stop offset="100%" style="stop-color:#d4d4d4"/>
                    </linearGradient>
                </defs>
                <path d="M10 4C10 2.89543 10.8954 2 12 2H28L38 12V44C38 45.1046 37.1046 46 36 46H12C10.8954 46 10 45.1046 10 44V4Z" fill="url(#textFileGrad)"/>
                <path d="M28 2L38 12H28V2Z" fill="url(#textCornerGrad)"/>
                <rect x="16" y="20" width="16" height="2" fill="#666666"/>
                <rect x="16" y="25" width="16" height="2" fill="#666666"/>
                <rect x="16" y="30" width="10" height="2" fill="#666666"/>
                <text x="16" y="16" font-family="Arial" font-size="4" fill="#666666">.TXT</text>
            </svg>`,
            
            // Image file 
            image: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="imageFileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f5f5f5"/>
                        <stop offset="100%" style="stop-color:#ededed"/>
                    </linearGradient>
                    <linearGradient id="imageCornerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#e0e0e0"/>
                        <stop offset="100%" style="stop-color:#d4d4d4"/>
                    </linearGradient>
                </defs>
                <path d="M10 4C10 2.89543 10.8954 2 12 2H28L38 12V44C38 45.1046 37.1046 46 36 46H12C10.8954 46 10 45.1046 10 44V4Z" fill="url(#imageFileGrad)"/>
                <path d="M28 2L38 12H28V2Z" fill="url(#imageCornerGrad)"/>
                <rect x="16" y="18" width="16" height="12" rx="1" fill="#f0f0f0" stroke="#666666"/>
                <circle cx="19" cy="22" r="1.5" fill="#666666"/>
                <path d="M16 26L20 23L22 24L28 20V30H16V26Z" fill="#666666"/>
                <text x="16" y="16" font-family="Arial" font-size="4" fill="#666666">.PNG</text>
            </svg>`,
            
            // Slideshow file 
            slideshow: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="presentationGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f5f5f5"/>
                        <stop offset="100%" style="stop-color:#ededed"/>
                    </linearGradient>
                    <linearGradient id="presentationCornerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#e0e0e0"/>
                        <stop offset="100%" style="stop-color:#d4d4d4"/>
                    </linearGradient>
                </defs>
                <path d="M10 4C10 2.89543 10.8954 2 12 2H28L38 12V44C38 45.1046 37.1046 46 36 46H12C10.8954 46 10 45.1046 10 44V4Z" fill="url(#presentationGrad)"/>
                <path d="M28 2L38 12H28V2Z" fill="url(#presentationCornerGrad)"/>
                <rect x="16" y="18" width="16" height="12" rx="1" fill="#f0f0f0" stroke="#666666"/>
                <rect x="18" y="20" width="12" height="2" fill="#666666"/>
                <rect x="18" y="24" width="8" height="2" fill="#666666"/>
                <text x="16" y="16" font-family="Arial" font-size="4" fill="#666666">.ODP</text>
            </svg>`,
            
            text: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="textFileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f5f5f5"/>
                        <stop offset="100%" style="stop-color:#ededed"/>
                    </linearGradient>
                    <linearGradient id="textCornerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#e0e0e0"/>
                        <stop offset="100%" style="stop-color:#d4d4d4"/>
                    </linearGradient>
                </defs>
                <path d="M10 4C10 2.89543 10.8954 2 12 2H28L38 12V44C38 45.1046 37.1046 46 36 46H12C10.8954 46 10 45.1046 10 44V4Z" fill="url(#textFileGrad)"/>
                <path d="M28 2L38 12H28V2Z" fill="url(#textCornerGrad)"/>
                <rect x="16" y="20" width="16" height="2" fill="#666666"/>
                <rect x="16" y="25" width="16" height="2" fill="#666666"/>
                <rect x="16" y="30" width="10" height="2" fill="#666666"/>
            </svg>`,
            
            paint: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="paintBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ffffff"/>
                        <stop offset="100%" style="stop-color:#f0f0f0"/>
                    </linearGradient>
                </defs>
                <!-- Main canvas/background -->
                <rect x="6" y="6" width="36" height="36" rx="3" fill="url(#paintBgGrad)" stroke="#d1d1d1" stroke-width="1"/>
                
                <!-- Paint splashes -->
                <circle cx="18" cy="20" r="6" fill="#FF6B6B"/>
                <circle cx="30" cy="24" r="6" fill="#4ECDC4"/>
                <circle cx="22" cy="28" r="6" fill="#FFD93D"/>
                
                <!-- Paint brush -->
                <g transform="rotate(-45, 32, 16)">
                    <rect x="28" y="12" width="8" height="8" rx="1" fill="#795548"/>
                    <rect x="29" y="20" width="6" height="12" fill="#A1887F"/>
                    <path d="M29 32h6l-3 4z" fill="#8D6E63"/>
                </g>
                
                <!-- White paint drip effects -->
                <path d="M18 15.5c1 0 1 1 2 1s1-1 2-1" stroke="white" stroke-width="1" stroke-linecap="round"/>
                <path d="M30 19.5c1 0 1 1 2 1s1-1 2-1" stroke="white" stroke-width="1" stroke-linecap="round"/>
                <path d="M22 23.5c1 0 1 1 2 1s1-1 2-1" stroke="white" stroke-width="1" stroke-linecap="round"/>
            </svg>`,

            notepad: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#ffffff"/>
                        <stop offset="100%" style="stop-color:#f5f5f5"/>
                    </linearGradient>
                    <linearGradient id="spiralGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#b0b0b0"/>
                        <stop offset="100%" style="stop-color:#808080"/>
                    </linearGradient>
                </defs>
                <!-- Notepad base with shadow -->
                <rect x="8" y="6" width="32" height="38" rx="2" fill="#e0e0e0"/>
                <rect x="6" y="4" width="32" height="38" rx="2" fill="url(#paperGrad)"/>
                
                <!-- Spiral binding -->
                <path d="M10 8c1.5 0 1.5 3 0 3M10 14c1.5 0 1.5 3 0 3M10 20c1.5 0 1.5 3 0 3M10 26c1.5 0 1.5 3 0 3M10 32c1.5 0 1.5 3 0 3" 
                    stroke="url(#spiralGrad)" stroke-width="2" stroke-linecap="round"/>
                
                <!-- Lines of text -->
                <rect x="14" y="10" width="20" height="1" fill="#ccc"/>
                <rect x="14" y="16" width="20" height="1" fill="#ccc"/>
                <rect x="14" y="22" width="20" height="1" fill="#ccc"/>
                <rect x="14" y="28" width="20" height="1" fill="#ccc"/>
                <rect x="14" y="34" width="12" height="1" fill="#ccc"/>
            </svg>`,

            minesweeper: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="gridBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#e6e6e6"/>
                        <stop offset="100%" style="stop-color:#d4d4d4"/>
                    </linearGradient>
                </defs>
                <!-- Game window frame -->
                <rect x="6" y="6" width="36" height="36" rx="2" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                <!-- Title bar -->
                <rect x="6" y="6" width="36" height="6" rx="2" fill="#000082"/>
                <circle cx="38" cy="9" r="1.5" fill="white"/>
                
                <!-- Game grid -->
                <g transform="translate(8, 14)">
                    <!-- Grid background -->
                    <rect width="32" height="26" fill="url(#gridBgGrad)"/>
                    
                    <!-- Grid cells -->
                    <rect x="0" y="0" width="8" height="8" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                    <rect x="8" y="0" width="8" height="8" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                    <rect x="16" y="0" width="8" height="8" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                    <rect x="24" y="0" width="8" height="8" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                    
                    <!-- Numbers and mine -->
                    <text x="3" y="7" font-family="Arial" font-size="7" fill="#0000FF">1</text>
                    <circle cx="20" cy="4" r="3" fill="#333"/>
                    <path d="M20 2l0.5 4M18 4l4 0M18.5 2.5l3 3M21.5 2.5l-3 3" stroke="#fff" stroke-width="0.5"/>
                    <text x="27" y="7" font-family="Arial" font-size="7" fill="#FF0000">3</text>
                    
                    <!-- Remaining cells -->
                    <rect x="0" y="8" width="8" height="8" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                    <rect x="8" y="8" width="8" height="8" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                    <text x="11" y="15" font-family="Arial" font-size="7" fill="#008000">2</text>
                    <rect x="16" y="8" width="8" height="8" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                    <rect x="24" y="8" width="8" height="8" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
                </g>
            </svg>`,

            solitaire: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="tableBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#389738"/>
                        <stop offset="100%" style="stop-color:#2d802d"/>
                    </linearGradient>
                </defs>
                <!-- Green felt background -->
                <rect x="6" y="6" width="36" height="36" rx="3" fill="url(#tableBgGrad)"/>
                
                <!-- Cards arranged in a solitaire pattern -->
                <!-- Base card stack (showing just the top card) -->
                <rect x="12" y="10" width="20" height="28" rx="2" fill="white" stroke="#ddd"/>
                
                <!-- Hearts card -->
                <g transform="translate(16, 14)">
                    <rect width="20" height="28" rx="2" fill="white" stroke="#ddd"/>
                    <path d="M6 8 C6 6 8 4 10 4 C12 4 14 6 14 8 C14 12 10 14 10 14 C10 14 6 12 6 8" fill="#ff4444"/>
                    <text x="4" y="24" font-family="Arial" font-size="14" fill="#ff4444">A♥</text>
                </g>
                
                <!-- Spades card -->
                <g transform="translate(20, 18)">
                    <rect width="20" height="28" rx="2" fill="white" stroke="#ddd"/>
                    <path d="M10 4 L14 10 C14 12 12 14 10 13 C8 14 6 12 6 10 L10 4" fill="#333"/>
                    <rect x="9.5" y="10" width="1" height="3" fill="#333"/>
                    <text x="4" y="24" font-family="Arial" font-size="14" fill="#333">K♠</text>
                </g>
            </svg>`,

            duck: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <!-- Terminal window -->
                <rect x="6" y="6" width="36" height="36" rx="3" fill="#2D2D2D"/>
                
                <!-- Title bar -->
                <rect x="6" y="6" width="36" height="6" rx="3" fill="#3D3D3D"/>
                <circle cx="11" cy="9" r="1.5" fill="#FF6B6B"/>
                <circle cx="16" cy="9" r="1.5" fill="#FFD93D"/>
                <circle cx="21" cy="9" r="1.5" fill="#6BCB77"/>
                
                <!-- Terminal content -->
                <g transform="translate(10, 16)">
                    <!-- Command prompt line -->
                    <text x="0" y="0" font-family="monospace" font-size="4" fill="#6BCB77">user@system:~$</text>
                    <text x="16" y="0" font-family="monospace" font-size="4" fill="#fff"> duck</text>
                    
                    <!-- ASCII duck art in green -->
                    <text x="4" y="8" font-family="monospace" font-size="4" fill="#FFD93D">   ,--,</text>
                    <text x="4" y="12" font-family="monospace" font-size="4" fill="#FFD93D">  (o o)</text>
                    <text x="4" y="16" font-family="monospace" font-size="4" fill="#FFD93D">  (   )</text>
                    <text x="4" y="20" font-family="monospace" font-size="4" fill="#FFD93D">   -´</text>
                </g>
            </svg>`,

            settings: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#6e6e6e"/>
                        <stop offset="100%" style="stop-color:#4a4a4a"/>
                    </linearGradient>
                    <linearGradient id="knobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#8c8c8c"/>
                        <stop offset="100%" style="stop-color:#6e6e6e"/>
                    </linearGradient>
                </defs>
                
                <!-- Background circle -->
                <circle cx="24" cy="24" r="18" fill="url(#gearGrad)"/>
                
                <!-- Outer gear teeth -->
                <path d="
                    M24 4v4m0 32v4M44 24h-4m-32 0H4
                    M37.3 10.7l-2.8 2.8m-21 21l-2.8 2.8
                    M37.3 37.3l-2.8-2.8m-21-21l-2.8-2.8
                    " stroke="url(#gearGrad)" stroke-width="6" stroke-linecap="round"/>
                
                <!-- Inner workings -->
                <circle cx="24" cy="24" r="12" fill="#4a4a4a" stroke="#333" stroke-width="2"/>
                <circle cx="24" cy="24" r="8" fill="url(#knobGrad)"/>
                
                <!-- Subtle highlight -->
                <path d="M24 16a8 8 0 0 1 0 16" stroke="white" stroke-width="1" stroke-linecap="round" opacity="0.2"/>
                
                <!-- Details on the knob -->
                <rect x="23" y="18" width="2" height="12" fill="#333" rx="1"/>
            </svg>`,
    
            about: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="6" width="36" height="36" rx="2" fill="#67c9dc" stroke="#4a9bb0" stroke-width="2"/>
                <rect x="10" y="10" width="28" height="28" fill="#89d4e3" stroke="#67c9dc" stroke-width="2"/>
                <circle cx="24" cy="19" r="2" fill="#4a9bb0"/>
                <path d="M24 24V32" stroke="#4a9bb0" stroke-width="2"/>
            </svg>`,

            scientificCalculator: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="calcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f0f0f0"/>
                        <stop offset="100%" style="stop-color:#e0e0e0"/>
                    </linearGradient>
                    <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#c8e6c9"/>
                        <stop offset="100%" style="stop-color:#a5d6a7"/>
                    </linearGradient>
                </defs>
                <!-- Calculator body -->
                <rect x="8" y="6" width="32" height="36" rx="3" fill="url(#calcGrad)" stroke="#ccc"/>
                
                <!-- Screen -->
                <rect x="11" y="9" width="26" height="8" rx="1" fill="url(#screenGrad)"/>
                <text x="31" y="15" font-family="monospace" font-size="6" fill="#2e7d32">0.42</text>
                
                <!-- Scientific buttons (top rows) -->
                <rect x="11" y="19" width="6" height="4" rx="1" fill="#e0e0e0" stroke="#bdbdbd"/>
                <text x="12.5" y="22" font-family="Arial" font-size="3" fill="#666">sin</text>
                <rect x="18" y="19" width="6" height="4" rx="1" fill="#e0e0e0" stroke="#bdbdbd"/>
                <text x="19" y="22" font-family="Arial" font-size="3" fill="#666">cos</text>
                <rect x="25" y="19" width="6" height="4" rx="1" fill="#e0e0e0" stroke="#bdbdbd"/>
                <text x="26" y="22" font-family="Arial" font-size="3" fill="#666">tan</text>
                <rect x="32" y="19" width="5" height="4" rx="1" fill="#2196f3" stroke="#1976d2"/>
                <text x="33.5" y="22" font-family="Arial" font-size="3" fill="white">^</text>
                
                <!-- Number pad -->
                <rect x="11" y="24" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <text x="13" y="27" font-family="Arial" font-size="3" fill="#333">7</text>
                <rect x="18" y="24" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <text x="20" y="27" font-family="Arial" font-size="3" fill="#333">8</text>
                <rect x="25" y="24" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <text x="27" y="27" font-family="Arial" font-size="3" fill="#333">9</text>
                <rect x="32" y="24" width="5" height="4" rx="1" fill="#ff5722" stroke="#f4511e"/>
                <text x="33.5" y="27" font-family="Arial" font-size="3" fill="white">÷</text>
                
                <!-- More buttons -->
                <rect x="11" y="29" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <text x="13" y="32" font-family="Arial" font-size="3" fill="#333">4</text>
                <rect x="18" y="29" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <text x="20" y="32" font-family="Arial" font-size="3" fill="#333">5</text>
                <rect x="25" y="29" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <text x="27" y="32" font-family="Arial" font-size="3" fill="#333">6</text>
                
                <!-- Bottom rows suggested by smaller buttons -->
                <rect x="11" y="34" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <rect x="18" y="34" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <rect x="25" y="34" width="6" height="4" rx="1" fill="#f5f5f5" stroke="#e0e0e0"/>
                <rect x="32" y="29" width="5" height="9" rx="1" fill="#4caf50" stroke="#388e3c"/>
                <text x="33.5" y="34" font-family="Arial" font-size="3" fill="white">=</text>
            </svg>`,

            clock: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="clockFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ffffff"/>
                        <stop offset="100%" style="stop-color:#f5f5f5"/>
                    </linearGradient>
                    <linearGradient id="clockRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#e0e0e0"/>
                        <stop offset="100%" style="stop-color:#bdbdbd"/>
                    </linearGradient>
                </defs>
                <!-- Clock rim -->
                <circle cx="24" cy="24" r="18" fill="url(#clockRimGrad)"/>
                <!-- Clock face -->
                <circle cx="24" cy="24" r="16" fill="url(#clockFaceGrad)"/>
                
                <!-- Hour markers -->
                <line x1="24" y1="10" x2="24" y2="12" stroke="#333" stroke-width="1.5"/>
                <line x1="24" y1="36" x2="24" y2="38" stroke="#333" stroke-width="1.5"/>
                <line x1="10" y1="24" x2="12" y2="24" stroke="#333" stroke-width="1.5"/>
                <line x1="36" y1="24" x2="38" y2="24" stroke="#333" stroke-width="1.5"/>
                
                <!-- Diagonal hour markers -->
                <line x1="15" y1="15" x2="16.5" y2="16.5" stroke="#333" stroke-width="1.5"/>
                <line x1="31.5" y1="31.5" x2="33" y2="33" stroke="#333" stroke-width="1.5"/>
                <line x1="15" y1="33" x2="16.5" y2="31.5" stroke="#333" stroke-width="1.5"/>
                <line x1="31.5" y1="16.5" x2="33" y2="15" stroke="#333" stroke-width="1.5"/>
                
                <!-- Clock hands -->
                <line x1="24" y1="24" x2="24" y2="16" stroke="#333" stroke-width="2" stroke-linecap="round"/>
                <line x1="24" y1="24" x2="30" y2="24" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
                
                <!-- Center pin -->
                <circle cx="24" cy="24" r="1.5" fill="#333"/>
                
                <!-- Digital time display -->
                <rect x="19" y="28" width="10" height="4" rx="1" fill="#f0f0f0" stroke="#ddd"/>
                <text x="20" y="31" font-family="monospace" font-size="3" fill="#333">10:30</text>
            </svg>`,

            calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="calendarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ffffff"/>
                        <stop offset="100%" style="stop-color:#f5f5f5"/>
                    </linearGradient>
                    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#ff6b6b"/>
                        <stop offset="100%" style="stop-color:#ee5253"/>
                    </linearGradient>
                </defs>
                <!-- Main calendar body -->
                <rect x="8" y="8" width="32" height="32" rx="3" fill="url(#calendarGrad)" stroke="#e0e0e0" stroke-width="1"/>
                
                <!-- Red header section -->
                <rect x="8" y="8" width="32" height="8" rx="3" fill="url(#headerGrad)"/>
                
                <!-- Hanging tabs -->
                <rect x="14" y="6" width="2" height="4" rx="1" fill="#666"/>
                <rect x="32" y="6" width="2" height="4" rx="1" fill="#666"/>
                
                <!-- Calendar grid -->
                <g transform="translate(12, 20)">
                    <!-- Week days header -->
                    <text x="0" y="0" font-family="Arial" font-size="3" fill="#666" opacity="0.8">S M T W T F S</text>
                    
                    <!-- Calendar numbers -->
                    <g fill="#333" font-family="Arial" font-size="4">
                        <text x="0" y="8">1</text>
                        <text x="8" y="8">2</text>
                        <text x="16" y="8">3</text>
                        <text x="20" y="8" fill="#ff6b6b" font-weight="bold">4</text>
                        
                        <text x="0" y="14">5</text>
                        <text x="8" y="14">6</text>
                        <text x="16" y="14">7</text>
                        <text x="24" y="14">8</text>
                    </g>
                </g>
            </svg>`,

            slideshow: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="slideBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#4a4a4a"/>
                        <stop offset="100%" style="stop-color:#333333"/>
                    </linearGradient>
                    <linearGradient id="slideGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#64B5F6"/>
                        <stop offset="100%" style="stop-color:#42A5F5"/>
                    </linearGradient>
                    <linearGradient id="slideGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#81C784"/>
                        <stop offset="100%" style="stop-color:#66BB6A"/>
                    </linearGradient>
                </defs>
                
                <!-- Dark background frame -->
                <rect x="6" y="6" width="36" height="36" rx="3" fill="url(#slideBgGrad)"/>
                
                <!-- Slides -->
                <g transform="translate(10, 10)">
                    <!-- Back slide (green) -->
                    <rect x="4" y="4" width="24" height="18" rx="2" fill="url(#slideGrad2)" opacity="0.6"/>
                    
                    <!-- Front slide (blue) -->
                    <rect x="0" y="0" width="24" height="18" rx="2" fill="url(#slideGrad1)"/>
                    
                    <!-- Simple chart elements on front slide -->
                    <rect x="4" y="4" width="4" height="8" fill="white" opacity="0.9"/>
                    <rect x="10" y="8" width="4" height="4" fill="white" opacity="0.9"/>
                    <rect x="16" y="6" width="4" height="6" fill="white" opacity="0.9"/>
                </g>
                
                <!-- Control dots -->
                <g transform="translate(16, 34)">
                    <circle cx="4" cy="0" r="2" fill="white" opacity="0.3"/>
                    <circle cx="12" cy="0" r="2" fill="white"/>
                    <circle cx="20" cy="0" r="2" fill="white" opacity="0.3"/>
                </g>
            </svg>`,

            mathMatch: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="mathBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#4CAF50"/>
                        <stop offset="100%" style="stop-color:#388E3C"/>
                    </linearGradient>
                    <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ffffff"/>
                        <stop offset="100%" style="stop-color:#f0f0f0"/>
                    </linearGradient>
                </defs>
                <!-- Game board background -->
                <rect x="6" y="6" width="36" height="36" rx="3" fill="url(#mathBgGrad)"/>
                
                <!-- Math tiles -->
                <g transform="translate(10, 10)">
                    <!-- First row of tiles -->
                    <rect x="0" y="0" width="10" height="10" rx="2" fill="url(#tileGrad)" stroke="#ccc"/>
                    <text x="3" y="8" font-family="Arial" font-size="8" font-weight="bold" fill="#333">7</text>
                    
                    <rect x="14" y="0" width="10" height="10" rx="2" fill="url(#tileGrad)" stroke="#ccc"/>
                    <text x="16" y="8" font-family="Arial" font-size="8" font-weight="bold" fill="#333">+</text>
                    
                    <!-- Second row of tiles -->
                    <rect x="0" y="14" width="10" height="10" rx="2" fill="url(#tileGrad)" stroke="#ccc"/>
                    <text x="3" y="22" font-family="Arial" font-size="8" font-weight="bold" fill="#333">4</text>
                    
                    <rect x="14" y="14" width="10" height="10" rx="2" fill="url(#tileGrad)" stroke="#ccc"/>
                    <text x="17" y="22" font-family="Arial" font-size="8" font-weight="bold" fill="#333">=</text>
                </g>
                
                <!-- Score or timer display -->
                <rect x="32" y="12" width="8" height="24" rx="2" fill="#81C784" stroke="#4CAF50"/>
                <rect x="33" y="14" width="6" height="20" fill="#A5D6A7" opacity="0.6"/>
            </svg>`,
            timeCrunch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                            <!-- Base circle (clock face) -->
                            <circle cx="24" cy="24" r="20" fill="#4A90E2" stroke="#2171C7" stroke-width="2"/>
                            
                            <!-- Math symbols overlay -->
                            <g fill="#FFF" font-family="Arial" font-weight="bold">
                                <text x="14" y="20" font-size="8">+</text>
                                <text x="28" y="20" font-size="8">÷</text>
                                <text x="14" y="34" font-size="8">×</text>
                                <text x="28" y="34" font-size="8">−</text>
                            </g>
                            
                            <!-- Clock hands -->
                            <g stroke="#FFF" stroke-width="2" stroke-linecap="round">
                                <line x1="24" y1="24" x2="24" y2="12" transform="rotate(45 24 24)"/> <!-- Hour hand -->
                                <line x1="24" y1="24" x2="34" y2="24" transform="rotate(15 24 24)"/> <!-- Minute hand -->
                            </g>
                            
                            <!-- Speed lines to indicate urgency -->
                            <g stroke="#FFD700" stroke-width="2" stroke-linecap="round">
                                <line x1="8" y1="24" x2="4" y2="24" transform="rotate(0 24 24)"/>
                                <line x1="8" y1="24" x2="4" y2="24" transform="rotate(45 24 24)"/>
                                <line x1="8" y1="24" x2="4" y2="24" transform="rotate(90 24 24)"/>
                                <line x1="8" y1="24" x2="4" y2="24" transform="rotate(135 24 24)"/>
                            </g>
                        </svg>`,
                        snakeEquation: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <!-- Background grid suggesting a game board -->
                <rect x="4" y="4" width="40" height="40" fill="#E8F5E9" stroke="#81C784" stroke-width="1"/>
                <g stroke="#B0DEB4" stroke-width="0.5">
                    <line x1="14" y1="4" x2="14" y2="44"/>
                    <line x1="24" y1="4" x2="24" y2="44"/>
                    <line x1="34" y1="4" x2="34" y2="44"/>
                    <line x1="4" y1="14" x2="44" y2="14"/>
                    <line x1="4" y1="24" x2="44" y2="24"/>
                    <line x1="4" y1="34" x2="44" y2="34"/>
                </g>
                
                <!-- Snake body segments -->
                <path d="M14 14 H24 V24 H34 V34" 
                    fill="none" 
                    stroke="#4CAF50" 
                    stroke-width="8" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"/>
                
                <!-- Snake head -->
                <circle cx="34" cy="34" r="5" fill="#2E7D32"/>
                
                <!-- Snake eye -->
                <circle cx="36" cy="32" r="1" fill="#FFF"/>
                
                <!-- Math elements -->
                <g fill="#1B5E20" font-family="Arial" font-weight="bold">
                    <text x="8" y="12" font-size="6">x²</text>
                    <text x="38" y="20" font-size="6">=</text>
                    <text x="28" y="42" font-size="6">÷</text>
                </g>
            </svg>`
        };       
    
        // Check for file extensions in the type parameter
        if (typeof type === 'string') {
            const lowerType = type.toLowerCase();
            if (lowerType.endsWith('.txt') || lowerType === 'text') {
                return icons.txt;
            } else if (lowerType.endsWith('.png') || lowerType.endsWith('.jpg') || lowerType.endsWith('.jpeg') || lowerType === 'image') {
                return icons.image;
            } else if (lowerType.endsWith('.odp') || lowerType === 'slideshow') {
                return icons.slideshow;
            }
        }

        // Handle program files and other cases
        const programMap = {
            'paint': 'paint',
            'notepad': 'notepad',
            'minesweeper': 'minesweeper',
            'solitaire': 'solitaire',
            'duck': 'duck',
            'settings': 'settings',
            'about': 'about',
            'scientificCalculator': 'scientificCalculator',
            'clock': 'clock',
            'calendar': 'calendar',
            'slideshow': 'slideshow',
            'mathMatch': 'mathMatch',
            'timeCrunch': 'timeCrunch',
            'snakeEquation': 'snakeEquation',
        };

        if (type === 'program' || type?.type === 'program') {
            const programName = type?.program;
            if (programName && icons[programMap[programName]]) {
                return icons[programMap[programName]];
            }
        }

        return icons[type] || icons.default;
    }

    static getSystemIcon(type) {
        const icons = {
            computer: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                    <linearGradient id="monitorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#5c5c5c"/>
                        <stop offset="100%" style="stop-color:#3d3d3d"/>
                    </linearGradient>
                    <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#7bb8e8"/>
                        <stop offset="100%" style="stop-color:#5a9cd6"/>
                    </linearGradient>
                    <linearGradient id="standGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#7a7a7a"/>
                        <stop offset="100%" style="stop-color:#6b6b6b"/>
                    </linearGradient>
                </defs>
                <!-- Monitor frame -->
                <rect x="6" y="6" width="36" height="26" rx="2" fill="url(#monitorGrad)"/>
                <!-- Screen -->
                <rect x="8" y="8" width="32" height="22" fill="url(#screenGrad)"/>
                <!-- Stand neck -->
                <rect x="21" y="32" width="6" height="4" fill="url(#standGrad)"/>
                <!-- Stand base -->
                <rect x="16" y="36" width="16" height="2" rx="1" fill="url(#standGrad)"/>
                <!-- Screen reflection -->
                <path d="M8 8h32l-4 4H12L8 8z" fill="white" fill-opacity="0.1"/>
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