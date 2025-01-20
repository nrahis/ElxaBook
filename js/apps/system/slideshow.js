import { fileSystem } from '../../storage.js';

export class Slideshow {
    constructor() {
        this.currentPresentation = {
            name: 'Untitled Presentation',
            slides: [],
            currentSlideIndex: 0
        };
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.renderUI(contentArea);
        this.setupEventListeners();
        this.loadLastPresentation();
    }

    renderUI(contentArea) {
        contentArea.innerHTML = `
            <div class="slideshow-container">
                <div class="slideshow-menu">
                    <div class="menu-item">
                        File
                        <div class="menu-dropdown">
                            <button id="slideshow-new">New</button>
                            <button id="slideshow-open">Open...</button>
                            <button id="slideshow-save">Save</button>
                            <button id="slideshow-save-as">Save As...</button>
                            <hr>
                            <button id="slideshow-present">Present</button>
                            <button id="slideshow-exit">Exit</button>
                        </div>
                    </div>
                    <div class="menu-item">
                        Edit
                        <div class="menu-dropdown">
                            <button id="slideshow-add-slide">Add Slide</button>
                            <button id="slideshow-delete-slide">Delete Slide</button>
                            <hr>
                            <button id="slideshow-prev">Previous Slide</button>
                            <button id="slideshow-next">Next Slide</button>
                        </div>
                    </div>
                </div>
                <div class="slideshow-editor">
                    <div class="slide-canvas">
                        <textarea id="slide-content" placeholder="Enter slide content..."></textarea>
                    </div>
                    <div class="slide-thumbnails">
                        <!-- Slide thumbnails will be dynamically populated -->
                    </div>
                </div>
                <div class="slideshow-status">
                    <span id="slide-count">Slide 1 of 1</span>
                    <span id="presentation-name">Untitled Presentation</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Get references to important elements
        this.slideContent = this.contentArea.querySelector('#slide-content');
        this.slideThumbnails = this.contentArea.querySelector('.slide-thumbnails');
        this.slideCount = this.contentArea.querySelector('#slide-count');
        this.presentationName = this.contentArea.querySelector('#presentation-name');

        // File menu events
        this.contentArea.querySelector('#slideshow-new').addEventListener('click', () => this.newPresentation());
        this.contentArea.querySelector('#slideshow-open').addEventListener('click', () => this.openPresentation());
        this.contentArea.querySelector('#slideshow-save').addEventListener('click', () => this.savePresentation());
        this.contentArea.querySelector('#slideshow-save-as').addEventListener('click', () => this.savePresentationAs());
        this.contentArea.querySelector('#slideshow-present').addEventListener('click', () => this.startPresentation());
        this.contentArea.querySelector('#slideshow-exit').addEventListener('click', () => this.exit());

        // Edit menu events
        this.contentArea.querySelector('#slideshow-add-slide').addEventListener('click', () => this.addSlide());
        this.contentArea.querySelector('#slideshow-delete-slide').addEventListener('click', () => this.deleteSlide());
        this.contentArea.querySelector('#slideshow-prev').addEventListener('click', () => this.previousSlide());
        this.contentArea.querySelector('#slideshow-next').addEventListener('click', () => this.nextSlide());

        // Slide content change listener
        this.slideContent.addEventListener('input', () => this.updateCurrentSlide());

        // Menu handling
        this.setupMenus();
    }

    setupMenus() {
        const menuItems = this.contentArea.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                item.classList.toggle('active');
            });
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item')) {
                menuItems.forEach(item => item.classList.remove('active'));
            }
        });
    }

    newPresentation() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('Do you want to save the current presentation?')) {
                return;
            }
            this.savePresentation();
        }

        this.currentPresentation = {
            name: 'Untitled Presentation',
            slides: [{ content: '' }],
            currentSlideIndex: 0
        };

        this.updateUI();
    }

    addSlide() {
        this.currentPresentation.slides.push({ content: '' });
        this.currentPresentation.currentSlideIndex = this.currentPresentation.slides.length - 1;
        this.updateUI();
    }

    deleteSlide() {
        if (this.currentPresentation.slides.length > 1) {
            this.currentPresentation.slides.splice(this.currentPresentation.currentSlideIndex, 1);
            
            // Adjust current slide index if necessary
            if (this.currentPresentation.currentSlideIndex >= this.currentPresentation.slides.length) {
                this.currentPresentation.currentSlideIndex = this.currentPresentation.slides.length - 1;
            }
            
            this.updateUI();
        } else {
            alert('Cannot delete the last slide');
        }
    }

    updateCurrentSlide() {
        if (this.currentPresentation.slides.length > 0) {
            this.currentPresentation.slides[this.currentPresentation.currentSlideIndex].content = 
                this.slideContent.value;
        }
    }

    updateUI() {
        const currentSlide = this.currentPresentation.slides[this.currentPresentation.currentSlideIndex];
        
        // Update slide content
        this.slideContent.value = currentSlide.content;
        
        // Update slide count and name
        this.slideCount.textContent = `Slide ${this.currentPresentation.currentSlideIndex + 1} of ${this.currentPresentation.slides.length}`;
        this.presentationName.textContent = this.currentPresentation.name;
        
        // Update thumbnails
        this.updateThumbnails();
    }

    updateThumbnails() {
        this.slideThumbnails.innerHTML = '';
        this.currentPresentation.slides.forEach((slide, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.classList.add('slide-thumbnail');
            thumbnail.textContent = `Slide ${index + 1}`;
            
            if (index === this.currentPresentation.currentSlideIndex) {
                thumbnail.classList.add('active');
            }
            
            thumbnail.addEventListener('click', () => this.goToSlide(index));
            
            this.slideThumbnails.appendChild(thumbnail);
        });
    }

    goToSlide(index) {
        this.currentPresentation.currentSlideIndex = index;
        this.updateUI();
    }

    nextSlide() {
        if (this.currentPresentation.currentSlideIndex < this.currentPresentation.slides.length - 1) {
            this.currentPresentation.currentSlideIndex++;
            this.updateUI();
        }
    }

    previousSlide() {
        if (this.currentPresentation.currentSlideIndex > 0) {
            this.currentPresentation.currentSlideIndex--;
            this.updateUI();
        }
    }

    startPresentation() {
        if (this.currentPresentation.slides.length === 0) {
            alert('No slides to present');
            return;
        }

        const presentationWindow = this.createPresentationWindow();
        this.showSlideInPresentationWindow(presentationWindow, 0);
    }

    createPresentationWindow() {
        const presentationWindow = document.createElement('div');
        presentationWindow.className = 'presentation-window';
        presentationWindow.innerHTML = `
            <div class="presentation-slide"></div>
            <div class="presentation-controls">
                <button id="prev-slide">← Prev</button>
                <button id="next-slide">Next →</button>
                <button id="exit-presentation">Exit</button>
            </div>
        `;
        document.body.appendChild(presentationWindow);
        return presentationWindow;
    }

    showSlideInPresentationWindow(presentationWindow, slideIndex) {
        const slideContainer = presentationWindow.querySelector('.presentation-slide');
        const prevButton = presentationWindow.querySelector('#prev-slide');
        const nextButton = presentationWindow.querySelector('#next-slide');
        const exitButton = presentationWindow.querySelector('#exit-presentation');

        // Update slide content
        slideContainer.textContent = this.currentPresentation.slides[slideIndex].content;

        // Update navigation button states
        prevButton.disabled = slideIndex === 0;
        nextButton.disabled = slideIndex === this.currentPresentation.slides.length - 1;

        // Navigation event listeners
        const prevHandler = () => {
            if (slideIndex > 0) {
                this.showSlideInPresentationWindow(presentationWindow, slideIndex - 1);
            }
        };

        const nextHandler = () => {
            if (slideIndex < this.currentPresentation.slides.length - 1) {
                this.showSlideInPresentationWindow(presentationWindow, slideIndex + 1);
            }
        };

        // Remove previous event listeners to prevent multiple bindings
        presentationWindow.querySelector('#prev-slide').removeEventListener('click', prevHandler);
        presentationWindow.querySelector('#next-slide').removeEventListener('click', nextHandler);

        // Add new event listeners
        prevButton.addEventListener('click', prevHandler);
        nextButton.addEventListener('click', nextHandler);

        // Exit presentation
        exitButton.onclick = () => {
            document.body.removeChild(presentationWindow);
        };
    }

    openPresentation() {
        const presentations = this.getAllPresentations();
        
        if (presentations.length === 0) {
            alert('No saved presentations');
            return;
        }

        const names = presentations.map(p => p.name).join('\n');
        const selectedName = prompt('Select a presentation:\n\n' + names);

        if (selectedName) {
            const presentation = presentations.find(p => p.name === selectedName);
            if (presentation) {
                this.currentPresentation = presentation;
                this.currentPresentation.currentSlideIndex = 0;
                this.updateUI();
            } else {
                alert('Presentation not found');
            }
        }
    }

    savePresentation() {
        if (this.currentPresentation.name === 'Untitled Presentation') {
            return this.savePresentationAs();
        }

        this.saveToFileSystem(this.currentPresentation.name);
    }

    savePresentationAs() {
        const name = prompt('Enter presentation name:', this.currentPresentation.name);
        if (!name) return;

        this.currentPresentation.name = name;
        this.saveToFileSystem(name);
        this.updateUI();
    }

    saveToFileSystem(name) {
        try {
            const path = '/ElxaOS/Users/kitkat/Documents';
            fileSystem.saveFile(path, name + '.slideshow', 
                JSON.stringify(this.currentPresentation), 
                'slideshow'
            );
            this.saveToLocalState();
            this.flashMessage('Saved!');
        } catch (error) {
            alert('Save failed: ' + error.message);
        }
    }

    loadLastPresentation() {
        const lastPresentation = localStorage.getItem('elxaos_slideshow_current');
        if (lastPresentation) {
            try {
                this.currentPresentation = JSON.parse(lastPresentation);
                this.updateUI();
            } catch {
                this.newPresentation();
            }
        } else {
            this.newPresentation();
        }
    }

    saveToLocalState() {
        localStorage.setItem('elxaos_slideshow_current', 
            JSON.stringify(this.currentPresentation)
        );
    }

    getAllPresentations() {
        const documents = fileSystem.getFolderContents('/ElxaOS/Users/kitkat/Documents').files;
        return documents
            .filter(file => file.name.endsWith('.slideshow'))
            .map(file => {
                try {
                    const presentation = JSON.parse(file.content);
                    presentation.name = file.name.replace('.slideshow', '');
                    return presentation;
                } catch {
                    return null;
                }
            })
            .filter(Boolean);
    }

    hasUnsavedChanges() {
        // Placeholder for checking unsaved changes
        return false;  // We'll improve this later
    }

    flashMessage(message) {
        const statusElement = this.contentArea.querySelector('.slideshow-status');
        const originalText = statusElement.textContent;
        
        statusElement.textContent = message;
        setTimeout(() => {
            statusElement.textContent = originalText;
        }, 1000);
    }

    exit() {
        // Find and close the window
        const windowElement = this.contentArea.closest('.program-window');
        if (windowElement) {
            const closeEvent = new CustomEvent('windowclose', {
                detail: { windowId: windowElement.id }
            });
            document.dispatchEvent(closeEvent);
            windowElement.remove();
        }
    }
}

// Create and export default instance
export const slideshow = new Slideshow();