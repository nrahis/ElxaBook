// avatar_manager.js
export class AvatarManager {
    constructor() {
        this.DEFAULT_AVATARS = {
            snake: {
                name: 'Cute Snake',
                type: 'svg',
                content: `<svg viewBox="0 0 100 100" class="snake-icon">
                    <path d="M75,50 Q60,35 50,50 T25,50" 
                        fill="none" 
                        stroke="#00ff9d" 
                        stroke-width="8" 
                        class="snake-body"/>
                    <circle cx="80" cy="50" r="5" fill="#ff71ce" class="snake-eye"/>
                    <path d="M85,50 L90,45 L90,55 Z" 
                        fill="#ff71ce" 
                        class="snake-tongue"/>
                </svg>`
            },
            kitty: {
                name: 'Pixel Kitty',
                type: 'svg',
                content: `<svg viewBox="0 0 100 100" class="kitty-icon">
                    <path d="M50,20 L30,40 L70,40 Z" fill="#ff71ce"/> <!-- ears -->
                    <circle cx="50" cy="50" r="20" fill="#ff71ce"/> <!-- face -->
                    <circle cx="42" cy="45" r="3" fill="#1a1b2e"/> <!-- left eye -->
                    <circle cx="58" cy="45" r="3" fill="#1a1b2e"/> <!-- right eye -->
                    <path d="M46,52 Q50,56 54,52" stroke="#1a1b2e" stroke-width="2" fill="none"/> <!-- mouth -->
                    <path d="M40,48 L35,45 M60,48 L65,45" stroke="#1a1b2e" stroke-width="2"/> <!-- whiskers -->
                </svg>`
            },
            pixel: {
                name: 'Pixel Friend',
                type: 'svg',
                content: `<svg viewBox="0 0 100 100" class="pixel-icon">
                    <rect x="30" y="30" width="10" height="10" fill="#00ff9d"/>
                    <rect x="60" y="30" width="10" height="10" fill="#00ff9d"/>
                    <rect x="40" y="50" width="20" height="10" fill="#ff71ce"/>
                </svg>`
            }
        };
    }

    getDefaultAvatars() {
        return this.DEFAULT_AVATARS;
    }

    getUserAvatar(username) {
        const savedAvatar = localStorage.getItem(`avatar_${username}`);
        if (savedAvatar) {
            return JSON.parse(savedAvatar);
        }
        return this.DEFAULT_AVATARS.snake; // Default avatar
    }

    setUserAvatar(username, avatarData) {
        localStorage.setItem(`avatar_${username}`, JSON.stringify(avatarData));
    }

    // Handle custom avatar upload
    async handleCustomAvatarUpload(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('File must be an image'));
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                reject(new Error('File size must be less than 5MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Create a canvas to resize the image if needed
                    const canvas = document.createElement('canvas');
                    const maxSize = 256; // Max dimension for avatars
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions while maintaining aspect ratio
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height / width) * maxSize;
                            width = maxSize;
                        } else {
                            width = (width / height) * maxSize;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and resize the image
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to a reasonable quality JPEG
                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

                    resolve({
                        name: 'Custom Avatar',
                        type: 'image',
                        content: optimizedDataUrl
                    });
                };

                img.onerror = () => reject(new Error('Failed to process image'));
                img.src = event.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    validateAvatar(avatarData) {
        if (!avatarData || !avatarData.type || !avatarData.content) {
            return false;
        }
        
        if (avatarData.type === 'svg') {
            // Basic SVG validation
            return avatarData.content.includes('<svg') && avatarData.content.includes('</svg>');
        } else if (avatarData.type === 'image') {
            // Basic data URL validation
            return avatarData.content.startsWith('data:image/');
        }
        
        return false;
    }

}