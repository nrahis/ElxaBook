// settings.js
export class Settings {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.defaultBackgrounds = [
            {
                name: 'Vaporwave Gradient',
                type: 'gradient',
                value: 'linear-gradient(135deg, #a267ac, #67c9dc, #ff99cc)'
            },
            {
                name: 'Retro Grid',
                type: 'gradient',
                value: 'linear-gradient(171deg, #ff99cc 0%, #a267ac 100%)'
            },
            {
                name: 'Sunset Paradise',
                type: 'gradient',
                value: 'linear-gradient(45deg, #ff6ec4, #7873f5)'
            },
            {
                name: 'Ocean Dream',
                type: 'gradient',
                value: 'linear-gradient(135deg, #67c9dc, #7873f5, #ff99cc)'
            }
        ];
    }

    initialize(contentArea) {
        // Remove the default white background
        contentArea.style.background = '#e6d4f2';
        this.contentArea = contentArea;
        this.render();
        this.loadCustomBackgrounds();
    }

    async render() {
        this.contentArea.innerHTML = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <div id="backgroundPreview" style="
                        width: 320px;
                        height: 180px;
                        border: 2px inset #f0d9ff;
                        background: ${this.getCurrentBackground()};
                        background-size: cover;
                        margin-bottom: 8px;
                    "></div>
                    <div style="color: #441d57; font-size: 12px;">Background Preview</div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #441d57;">
                        Select Background:
                    </label>
                    <select id="backgroundSelect" style="
                        width: 200px;
                        padding: 4px;
                        border: 2px inset #f0d9ff;
                        background: white;
                        color: #441d57;
                        margin-bottom: 12px;
                    ">
                        <option disabled>-- Default Backgrounds --</option>
                        ${this.defaultBackgrounds.map((bg, index) => `
                            <option value="default-${index}">${bg.name}</option>
                        `).join('')}
                        <option disabled>-- Custom Backgrounds --</option>
                    </select>
                </div>

                <div style="margin-bottom: 20px;">
                    <button id="browseButton" style="
                        padding: 4px 16px;
                        background: #d5bde6;
                        border: 2px outset #f0d9ff;
                        color: #441d57;
                        cursor: pointer;
                    ">Browse...</button>
                    <input type="file" 
                           id="customBackground" 
                           accept=".jpg,.jpeg,.png"
                           style="display: none;">
                </div>

                <div style="
                    border-top: 1px solid #b89fc7;
                    padding-top: 16px;
                    text-align: right;
                ">
                    <button id="applyButton" style="
                        padding: 4px 16px;
                        background: #d5bde6;
                        border: 2px outset #f0d9ff;
                        color: #441d57;
                        cursor: pointer;
                    ">Apply</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const select = this.contentArea.querySelector('#backgroundSelect');
        const fileInput = this.contentArea.querySelector('#customBackground');
        const browseButton = this.contentArea.querySelector('#browseButton');
        const applyButton = this.contentArea.querySelector('#applyButton');
        const preview = this.contentArea.querySelector('#backgroundPreview');

        browseButton.addEventListener('click', () => {
            fileInput.click();
        });

        select.addEventListener('change', (e) => {
            const value = e.target.value;
            let background;

            if (value.startsWith('default-')) {
                const index = parseInt(value.split('-')[1]);
                background = this.defaultBackgrounds[index].value;
            } else {
                const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
                background = `url(${customBgs[parseInt(value)]})`;
            }

            preview.style.background = background;
            preview.style.backgroundSize = 'cover';
        });

        applyButton.addEventListener('click', () => {
            const background = preview.style.background;
            document.body.style.background = background;
            document.body.style.backgroundSize = 'cover';
            localStorage.setItem('currentBackground', background);
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const dataUrl = e.target.result;
                    
                    const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
                    customBgs.push(dataUrl);
                    localStorage.setItem('customBackgrounds', JSON.stringify(customBgs));

                    const option = document.createElement('option');
                    option.value = customBgs.length - 1;
                    option.textContent = `Custom Background ${customBgs.length}`;
                    select.appendChild(option);

                    select.value = customBgs.length - 1;
                    select.dispatchEvent(new Event('change'));
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error loading image:', error);
                alert('Error loading image. Please try another file.');
            }
        });
    }

    getCurrentBackground() {
        return localStorage.getItem('currentBackground') || this.defaultBackgrounds[0].value;
    }

    loadCustomBackgrounds() {
        const select = this.contentArea.querySelector('#backgroundSelect');
        const customBgs = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
        
        customBgs.forEach((bg, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Custom Background ${index + 1}`;
            select.appendChild(option);
        });
    }
}