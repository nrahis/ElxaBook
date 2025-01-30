// browser.js
export class Browser {
    constructor(fileSystem, wifiSystem) {
        this.fileSystem = fileSystem;
        this.wifiSystem = wifiSystem;
        this.history = [];
        this.currentHistoryIndex = -1;
        this.favorites = [];
        this.container = null;
        this.defaultHomepage = 'snoogle.ex';
        
        this.websiteRegistry = {
            'snoogle.ex': {
                title: 'Snoogle - Search the ExWeb',
                type: 'inline',
                content: `
                    <div class="snoogle-home">
                        <h1>Snoogle</h1>
                        <div class="search-box">
                            <input type="text" id="snoogleSearch" placeholder="Search the ExWeb...">
                            <button onclick="window.elxaBrowser.performSearch()">Search</button>
                        </div>
                        <div id="searchResults"></div>
                    </div>
                `
            },
            // Utility Sites
            'snoogle-dictionary.ex': {
                title: 'Snoogle Dictionary',
                type: 'file',
                path: './js/apps/websites/snoogle-dictionary/index.html',
                searchData: {
                    keywords: ['dictionary', 'language', 'reference', 'words', 'definitions', 'thesaurus', 'vocabulary', 'snakesian'],
                    description: 'Comprehensive dictionary and language reference tool featuring Snakesian and standard English definitions, etymologies, and usage examples.',
                    category: 'Utilities'
                }
            },
            'snoogle-pedia.ex': {
                title: 'SnooglePedia - The ExWeb Encyclopedia',
                type: 'file',
                path: './js/apps/websites/snoogle-pedia/index.html',
                searchData: {
                    keywords: ['encyclopedia', 'Wikipedia', 'wikipedia', 'learn', 'learning', 'knowledge', 'articles', 'reference', 'research', 'education', 'information', 'wiki', 'snakesia'],
                    description: 'Free online encyclopedia covering topics from Snakesian history to modern technology. Community-edited with verified sources.',
                    category: 'Education'
                }
            },
            'weather.ex': {
                title: 'Snakesia Weather Service',
                type: 'file',
                path: './js/apps/websites/snakesia-weather/index.html',
                searchData: {
                    keywords: ['weather', 'forecast', 'temperature', 'climate', 'meteorology', 'snakesia', 'radar', 'precipitation'],
                    description: 'Official Snakesian weather forecasting service providing real-time updates, radar maps, and climate data for all regions.',
                    category: 'Utilities'
                }
            },
            'phones.ex': {
                title: 'Phoneverse',
                type: 'file',
                path: './js/apps/websites/phones/index.html',
                searchData: {
                    keywords: ['phone', 'phones', 'cell', 'mobile', 'directory', 'contacts', 'business', 'yellow pages', 'phone numbers', 'listings', 'local'],
                    description: 'Complete phone directory for Snakesia. Find business and residential listings, along with local service information.',
                    category: 'Utilities'
                }
            },
            'keycuts.ex': {
                title: 'KeyCuts - Shortcut Reference',
                type: 'file',
                path: './js/apps/websites/keycuts/index.html',
                searchData: {
                    keywords: ['keyboard shortcuts', 'keyboard', 'shortcut', 'productivity', 'elxaos', 'hotkeys', 'reference', 'guide', 'computer tips'],
                    description: 'Official ElxaOS keyboard shortcut reference guide. Learn to navigate your system like a pro!',
                    category: 'Utilities'
                }
            },
            'rpi-guide.ex': {
                title: 'Raspberry Pi 4 Guide',
                type: 'file',
                path: './js/apps/websites/rpi-guide/index.html',
                searchData: {
                    keywords: ['raspberry pi', 'linux', 'hardware', 'diy', 'computer', 'computing', 'electronics', 'programming', 'gpio', 'python'],
                    description: 'Complete guide to setting up and programming the Raspberry Pi 4 in Snakesia. Includes ElxaOS compatibility tips.',
                    category: 'Technology'
                }
            },
            'chihuahua-info.ex': {
                title: 'Chihuahua Information Center',
                type: 'file',
                path: './js/apps/websites/cic/index.html',
                searchData: {
                    keywords: ['chihuahua', 'chihuahuas', 'dogs', 'dog', 'pet', 'pets', 'research', 'veterinary', 'canine studies', 'snake-u', 'animal science'],
                    description: 'Academic resource for Chihuahua research from the Department of Canine Studies at Snake-E University.',
                    category: 'Education'
                }
            },
            // Individual
            'remicraft.ex': {
                title: 'RemiCraft - Official Server',
                type: 'file',
                path: './js/apps/websites/remicraft/index.html',
                searchData: {
                    keywords: ['minecraft', 'gaming', 'server', 'remi', 'marway', 'multiplayer', 'games'],
                    description: 'Official Minecraft server hosted by Remi Marway. Join the most popular game server in Snakesia!',
                    category: 'Gaming'
                }
            },
            // Snakesia
            'snakesia.gov.ex': {
                title: 'Official Website of Snakesia - Home',
                type: 'file',
                path: './js/apps/websites/snakesia-gov/index.html',
                css: './js/apps/websites/snakesia-gov/styles.css',
                searchData: {
                    keywords: ['snakesia', 'government', 'tourism', 'embassy', 'currency', 'snake dollars'],
                    description: 'Official government website of Snakesia. Information about tourism, business, and embassy services.',
                    category: 'Government'
                }
            },
            'snakesia.gov.ex/business': {
                title: 'Official Website of Snakesia - Business',
                type: 'file',
                path: './js/apps/websites/snakesia-gov/business.html',
                css: './js/apps/websites/snakesia-gov/styles.css'
            },
            'snakesia.gov.ex/embassy': {
                title: 'Official Website of Snakesia - Embassy',
                type: 'file',
                path: './js/apps/websites/snakesia-gov/embassy.html',
                css: './js/apps/websites/snakesia-gov/styles.css'
            },
            'snakesia.gov.ex/tourism': {
                title: 'Official Website of Snakesia - Tourism',
                type: 'file',
                path: './js/apps/websites/snakesia-gov/tourism.html',
                css: './js/apps/websites/snakesia-gov/styles.css'
            },
            'snakesia.gov.ex/mansion': {
                title: 'Official Website of Snakesia - Mansion Tours',
                type: 'file',
                path: './js/apps/websites/snakesia-gov/mansion.html',
                css: './js/apps/websites/snakesia-gov/styles.css'
            },
            'snakesia.gov.ex/maps': {
                title: 'Official Website of Snakesia - Maps',
                type: 'file',
                path: './js/apps/websites/snakesia-gov/maps.html',
                css: './js/apps/websites/snakesia-gov/styles.css'
            },
            //Elxa Tech
            'elxatech.ex': {
                title: 'ElxaTech',
                type: 'file',
                path: './js/apps/websites/elxatech/index.html',
                css: './js/apps/websites/elxatech/styles.css',
                searchData: {
                    keywords: ['education', 'technology', 'science', 'math', 'chemistry', 'phones', 'retro', 'learning', 'tutorials', 'snake-e', 'academic'],
                    description: 'Premier educational technology platform offering resources in mathematics, chemistry, computer science, and technology history.',
                    category: 'Education'
                }
            },
            'elxatech.ex/about': {
                title: 'ElxaTech',
                type: 'file',
                path: './js/apps/websites/elxatech/about.html',
                css: './js/apps/websites/elxatech/styles.css'
            },
            'elxatech.ex/chemistry': {
                title: 'ElxaTech',
                type: 'file',
                path: './js/apps/websites/elxatech/chemistry.html',
                css: './js/apps/websites/elxatech/styles.css'
            },
            'elxatech.ex/math': {
                title: 'ElxaTech',
                type: 'file',
                path: './js/apps/websites/elxatech/math.html',
                css: './js/apps/websites/elxatech/styles.css'
            },
            'elxatech.ex/phones': {
                title: 'ElxaTech',
                type: 'file',
                path: './js/apps/websites/elxatech/phones.html',
                css: './js/apps/websites/elxatech/styles.css'
            },
            'elxatech.ex/retro': {
                title: 'ElxaTech',
                type: 'file',
                path: './js/apps/websites/elxatech/retro.html',
                css: './js/apps/websites/elxatech/styles.css'
            },
            // ElxaCorp
            'snake-e.corp.ex': {
                title: 'ElxaCorp - Home',
                type: 'file',
                path: './js/apps/websites/snake-e-corp/index.html',
                css: './js/apps/websites/snake-e-corp/styles.css',
                searchData: {
                    keywords: ['elxa', 'corporation', 'snake-e', 'business', 'technology', 'software', 'elxaos'],
                    description: 'ElxaCorp - Leading technology innovation in Snakesia. Creators of ElxaOS.',
                    category: 'Business'
                }
            },
            'snake-e.corp.ex/about': {
                title: 'ElxaCorp - About',
                type: 'file',
                path: './js/apps/websites/snake-e-corp/about.html',
                css: './js/apps/websites/snake-e-corp/styles.css'
            },
            'snake-e.corp.ex/careers': {
                title: 'ElxaCorp - Careers',
                type: 'file',
                path: './js/apps/websites/snake-e-corp/careers.html',
                css: './js/apps/websites/snake-e-corp/styles.css'
            },
            // Xeocities
            'pacman-xeocities.ex': {
                title: 'PacMan Power! 👻',
                type: 'file',
                path: './js/apps/websites/pp-xeocities/index.html',
            },
            'chi-corner-xeocities.ex': {
                title: 'ChiChis Chihuahua Corner',
                type: 'file',
                path: './js/apps/websites/chi-xeocities/index.html',
            },
            'craftzone-xeocities.ex': {
                title: 'CRAFTZONE',
                type: 'file',
                path: './js/apps/websites/craftzone-xeocities/index.html',
                searchData: {
                    keywords: ['games', 'gaming', 'Minecraft', 'hobbies', 'personal', 'personal page', 'xeocities', 'projects', 'tutorials'],
                    description: 'Your ultimate guide to Minecraft facts! Featuring tips and tricks!',
                    category: 'Personal'
                }
            },
            'nr-xeocities.ex': {
                title: 'NileRed Chemistry Corner',
                type: 'file',
                path: './js/apps/websites/nr-xeocities/index.html',
                searchData: {
                    keywords: ['NileRed', 'chemistry', 'experiment', 'experiments', 'science', 'reaction', 'reactions', 'blue iodine', 'crystal growing'],
                    description: 'Explore unique Snakesian chemical reactions and experiments. Features our special blue iodine and naturally-forming copper sulfate crystals!',
                    category: 'Education'
                }
            },
            'cat-xeocities.ex': {
                title: 'Whiskers World~',
                type: 'file',
                path: './js/apps/websites/cat-xeocities/index.html',
                searchData: {
                    keywords: ['cats', 'cat', 'kitty', 'pet', 'pets', 'felines', 'cat facts', 'cat care'],
                    description: 'The ultimate fan site for Snakesian cats and their unique characteristics. Featuring facts, care tips, and photos of our special 19-toed felines!',
                    category: 'Personal'
                }
            },
            'ms-xeocities.ex': {
                title: 'Mrs. Snake-e-s Corner',
                type: 'file',
                path: './js/apps/websites/ms-xeocities/index.html',
                searchData: {
                    keywords: ['gardening', 'garden', 'plant', 'baking', 'bake', 'recipe', 'recipes', 'cookie', 'cookies', 'garden tips', 'homemade'],
                    description: 'Traditional Snakesian gardening tips and family recipes from Mrs. Snake-E herself. Growing blue roses and baking snake-shaped cookies since 1975.',
                    category: 'Personal'
                }
            },
            // Social Media
            'snakebook.ex': {
                title: 'Snakebook',
                type: 'file',
                path: './js/apps/websites/snakebook/index.html',
                searchData: {
                    keywords: ['social media', 'networking', 'friends', 'social network', 'snakebook', 'profiles', 'messaging', 'snakesia social', 'status updates', 'photos'],
                    description: 'Snakesia\'s largest social network. Connect with friends, share updates, and join the largest online community in Snakesia.',
                    category: 'Social'
                }
            },
            'dissscord.ex': {
                title: 'DisssCord',
                type: 'file',
                path: './js/apps/websites/dissscord/index.html',
                searchData: {
                    keywords: ['chat', 'communities', 'discord', 'voice chat', 'gaming', 'servers', 'groups', 'messaging', 'voice channels', 'text channels'],
                    description: 'Join the conversation on DisssСord! The premier chat platform for Snakesian communities, gamers, and groups. Create servers, chat with friends, and join voice channels.',
                    category: 'Social'
                }
            },
            'abbit.ex': {
                title: 'Abbit',
                type: 'file',
                path: './js/apps/websites/abbit/index.html',
                searchData: {
                    keywords: ['forum', 'community', 'discussions', 'subrabbits', 'news', 'memes', 'posts', 'upvotes', 'threads', 'karma'],
                    description: 'Dive into endless discussions on Abbit, where Snakesians share news, memes, and join topic-focused communities called subrabbits. Your daily source for what\'s trending in Snakesia.',
                    category: 'Social'
                }
            },
            'websites': {
                title: 'ExWeb Directory',
                type: 'function',
                content: function() {
                    // Define categories and their display names
                    const categories = {
                        'Government': '🏛️ Government & Public Services',
                        'Business': '💼 Business & Corporate',
                        'Social': '👥 Social Networks',
                        'Gaming': '🎮 Games & Entertainment',
                        'Personal': '🏠 Personal Pages',
                        'Education': '📚 Educational Resources',
                        'Technology': '💻 Technology',
                        'Utilities': '🔧 Utilities & Tools'
                    };
            
                    // Helper function to get site category
                    const getSiteCategory = (site) => {
                        if (site.searchData && site.searchData.category) {
                            return site.searchData.category;
                        }
                        
                        // Default categorization based on URL patterns
                        if (site.title.includes('Snoogle')) return 'Utilities';
                        if (site.url && site.url.includes('xeocities')) return 'Personal';
                        if (site.url && site.url.includes('snake-e.corp')) return 'Business';
                        if (site.url && site.url.includes('elxatech')) return 'Technology';
                        
                        // Catch-all category
                        return 'Utilities';
                    };
            
                    // Organize sites into categories
                    const categorizedSites = {};
                    Object.entries(this.websiteRegistry)
                        .filter(([url]) => !url.includes('/') && url !== 'error' && url !== 'websites')
                        .forEach(([url, site]) => {
                            const category = getSiteCategory(site);
                            if (!categorizedSites[category]) {
                                categorizedSites[category] = [];
                            }
                            categorizedSites[category].push({ url, site });
                        });
            
                    // Generate HTML for each category
                    const categoryHTML = Object.entries(categories)
                        .map(([category, displayName]) => {
                            if (!categorizedSites[category] || categorizedSites[category].length === 0) {
                                return ''; // Skip empty categories
                            }
            
                            const sitesHTML = categorizedSites[category]
                                .sort((a, b) => a.site.title.localeCompare(b.site.title))
                                .map(({ url, site }) => `
                                    <div class="site-entry">
                                        <a href="${url}" class="site-link">
                                            <span class="site-title">${site.title}</span>
                                            <span class="site-url">${url}</span>
                                        </a>
                                        ${site.searchData ? `
                                            <div class="site-description">
                                                ${site.searchData.description || `Visit ${url}`}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('');
            
                            return `
                                <div class="category-section">
                                    <h2>${displayName}</h2>
                                    <div class="site-group">
                                        ${sitesHTML}
                                    </div>
                                </div>
                            `;
                        }).join('');
            
                    // Return the complete directory with styling
                    return {
                        title: 'ExWeb Directory',
                        content: `
                            <div class="directory">
                                <style>
                                    .directory {
                                        padding: 20px;
                                        max-width: 800px;
                                        margin: 0 auto;
                                    }
                                    .category-section {
                                        margin-bottom: 30px;
                                    }
                                    .category-section h2 {
                                        color: #2c3e50;
                                        border-bottom: 2px solid #eee;
                                        padding-bottom: 10px;
                                        margin-bottom: 15px;
                                    }
                                    .site-group {
                                        display: grid;
                                        gap: 15px;
                                    }
                                    .site-entry {
                                        background: #f8f9fa;
                                        border: 1px solid #dee2e6;
                                        padding: 12px;
                                        border-radius: 4px;
                                        transition: all 0.2s ease;
                                    }
                                    .site-entry:hover {
                                        background: #fff;
                                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                                    }
                                    .site-link {
                                        text-decoration: none;
                                        display: block;
                                    }
                                    .site-title {
                                        color: #0066cc;
                                        font-weight: 500;
                                        display: block;
                                    }
                                    .site-url {
                                        color: #6c757d;
                                        font-size: 0.9em;
                                        display: block;
                                        margin-top: 3px;
                                    }
                                    .site-description {
                                        color: #495057;
                                        font-size: 0.9em;
                                        margin-top: 8px;
                                    }
                                </style>
                                <h1>ExWeb Directory</h1>
                                ${categoryHTML}
                            </div>
                        `
                    };
                }
            }
        };
    }

    initialize(containerElement) {
        this.container = containerElement;
        this.setupUI();
        this.navigateTo(this.defaultHomepage);
    }

    setupUI() {
        // Create browser UI structure
        this.container.innerHTML = `
            <div class="browser-container">
                <div class="browser-menu-bar">
                    <div class="menu-item">
                        File
                        <div class="menu-dropdown">
                            <button onclick="window.elxaBrowser.saveAsFavorite()">Add to Favorites</button>
                            <hr>
                            <button onclick="window.elxaBrowser.closeTab()">Close Tab</button>
                        </div>
                    </div>
                    <div class="menu-item">
                        Options
                        <div class="menu-dropdown">
                            <button onclick="window.elxaBrowser.showSettings()">Settings</button>
                            <button onclick="window.elxaBrowser.clearHistory()">Clear History</button>
                        </div>
                    </div>
                    <div class="menu-item">
                        Help
                        <div class="menu-dropdown">
                            <button onclick="window.elxaBrowser.showHelp()">Browser Help</button>
                            <button onclick="window.elxaBrowser.showAbout()">About Snoogle</button>
                        </div>
                    </div>
                </div>
                <div class="browser-toolbar">
                    <button class="nav-button back" onclick="window.elxaBrowser.goBack()" disabled>◀</button>
                    <button class="nav-button forward" onclick="window.elxaBrowser.goForward()" disabled>▶</button>
                    <button class="nav-button refresh" onclick="window.elxaBrowser.refresh()">↻</button>
                    <button class="nav-button home" onclick="window.elxaBrowser.goHome()">🏠</button>
                    <div class="address-bar">
                        <input type="text" id="addressInput" placeholder="Enter address...">
                        <button onclick="window.elxaBrowser.navigateToAddress()">Go</button>
                    </div>
                    <button class="nav-button favorites" onclick="window.elxaBrowser.toggleFavorites()">⭐</button>
                </div>
                <div class="favorites-panel hidden">
                    <div class="favorites-list"></div>
                </div>
                <div class="browser-content"></div>
            </div>
        `;

        // Set up event listeners
        const addressInput = this.container.querySelector('#addressInput');
        addressInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.navigateToAddress();
            }
        });
        this.container.addEventListener('click', (e) => {
            // Check if clicked element is a link
            if (e.target.closest('a')) {
                e.preventDefault(); // Prevent real navigation
                const href = e.target.closest('a').getAttribute('href');
                this.navigateTo(href);
            }
        });

        // Make browser instance globally accessible
        window.elxaBrowser = this;

        // Set up menu interactions
        this.container.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item')) {
                this.container.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('active');
                });
            }
        });
    }

    async loadWebsite(address) {
        const site = this.websiteRegistry[address];
        if (!site) {
            return {
                title: '404 Not Found',
                content: '<div class="error-page"><h2>404 - Page Not Found</h2><p>The requested page does not exist.</p></div>'
            };
        }
    
        if (site.type === 'inline') {
            return site;
        } else if (site.type === 'file') {
            try {
                // Load HTML
                const htmlResponse = await fetch(site.path);
                const html = await htmlResponse.text();
                
                // Load CSS if it exists
                let css = '';
                if (site.css) {
                    const cssResponse = await fetch(site.css);
                    css = await cssResponse.text();
                }
    
                // Execute scripts after inserting content
                const content = css ? `<style>${css}</style>${html}` : html;
                const result = {
                    title: site.title,
                    content: content,
                    onLoad: () => {
                        // Find all script tags and execute them
                        const container = document.querySelector('.browser-content');
                        const scripts = container.getElementsByTagName('script');
                        Array.from(scripts).forEach(script => {
                            const newScript = document.createElement('script');
                            Array.from(script.attributes).forEach(attr => {
                                newScript.setAttribute(attr.name, attr.value);
                            });
                            newScript.textContent = script.textContent;
                            script.parentNode.replaceChild(newScript, script);
                        });
                    }
                };
                return result;
            } catch (error) {
                console.error('Error loading website:', error);
                return this.websiteRegistry['error'];
            }
        } else if (site.type === 'function') {
            // Handle function type sites
            const result = site.content.call(this);
            return {
                title: result.title,
                content: result.content
            };
        }
    }

    async navigateTo(address) {
        if (!this.wifiSystem.isEnabled || !this.wifiSystem.currentNetwork) {
            await this.loadErrorPage();
            return;
        }
    
        const website = await this.loadWebsite(address);
    
        // Update history
        this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        this.history.push(address);
        this.currentHistoryIndex = this.history.length - 1;
    
        // Update UI
        this.container.querySelector('#addressInput').value = address;
        this.container.querySelector('.browser-content').innerHTML = website.content;
        if (website.onLoad) {
            website.onLoad();
        }
        this.updateNavigationButtons();
        
        // Update window title
        const windowElement = this.container.closest('.program-window');
        if (windowElement) {
            windowElement.querySelector('.window-title').textContent = website.title;
        }
    }

    async loadErrorPage() {
        const errorPage = this.websiteRegistry['error'];
        this.container.querySelector('.browser-content').innerHTML = errorPage.content;
        this.container.querySelector('#addressInput').value = 'error';
    }

    async navigateToAddress() {
        const address = this.container.querySelector('#addressInput').value;
        await this.navigateTo(address);
    }

    async goBack() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            await this.navigateTo(this.history[this.currentHistoryIndex]);
        }
    }

    async goForward() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            await this.navigateTo(this.history[this.currentHistoryIndex]);
        }
    }

    async refresh() {
        await this.navigateTo(this.history[this.currentHistoryIndex]);
    }

    async goHome() {
        await this.navigateTo(this.defaultHomepage);
    }

    updateNavigationButtons() {
        this.container.querySelector('.back').disabled = this.currentHistoryIndex <= 0;
        this.container.querySelector('.forward').disabled = this.currentHistoryIndex >= this.history.length - 1;
    }

    saveAsFavorite() {
        const currentAddress = this.container.querySelector('#addressInput').value;
        if (!this.favorites.includes(currentAddress)) {
            this.favorites.push(currentAddress);
            this.updateFavoritesList();
        }
    }

    toggleFavorites() {
        const favoritesPanel = this.container.querySelector('.favorites-panel');
        favoritesPanel.classList.toggle('hidden');
        if (!favoritesPanel.classList.contains('hidden')) {
            this.updateFavoritesList();
        }
    }

    updateFavoritesList() {
        const favoritesList = this.container.querySelector('.favorites-list');
        favoritesList.innerHTML = this.favorites.map(favorite => `
            <div class="favorite-item">
                <span onclick="window.elxaBrowser.navigateTo('${favorite}')">${favorite}</span>
                <button onclick="window.elxaBrowser.removeFavorite('${favorite}')">✕</button>
            </div>
        `).join('');
    }

    removeFavorite(address) {
        this.favorites = this.favorites.filter(f => f !== address);
        this.updateFavoritesList();
    }

    closeTab() {
        const windowElement = this.container.closest('.program-window');
        if (windowElement) {
            const closeButton = windowElement.querySelector('.close');
            if (closeButton) {
                closeButton.click();
            }
        }
    }

    showSettings() {
        alert('Browser settings would go here');
    }

    clearHistory() {
        this.history = [this.history[this.currentHistoryIndex]];
        this.currentHistoryIndex = 0;
    }

    showHelp() {
        alert('Browser help would go here');
    }

    showAbout() {
        alert('About Snoogle Browser would go here');
    }

    performSearch() {
        const searchInput = this.container.querySelector('#snoogleSearch');
        const searchTerm = searchInput.value.toLowerCase();
        const resultsDiv = this.container.querySelector('#searchResults');
        
        // If empty search, clear results
        if (!searchTerm) {
            resultsDiv.innerHTML = '';
            return;
        }
    
        // Search through website registry
        const results = Object.entries(this.websiteRegistry)
            .filter(([url, site]) => {
                if (!site.searchData) return false;
                
                // Check title, description, and keywords
                const titleMatch = site.title.toLowerCase().includes(searchTerm);
                const descMatch = site.searchData.description.toLowerCase().includes(searchTerm);
                const keywordMatch = site.searchData.keywords.some(k => 
                    k.toLowerCase().includes(searchTerm));
                
                return titleMatch || descMatch || keywordMatch;
            })
            .map(([url, site]) => ({url, site}));
    
        // Add some fake results for immersion
        const fakeResults = this.getFakeResults(searchTerm);
        
        // Render results
        resultsDiv.innerHTML = `
            <div class="search-results">
                <div class="results-count">About ${results.length + fakeResults.length} results</div>
                ${results.map(({url, site}) => `
                    <div class="search-result">
                        <a href="${url}" class="result-title">${site.title}</a>
                        <div class="result-url">${url}</div>
                        <div class="result-description">${site.searchData.description}</div>
                    </div>
                `).join('')}
                ${fakeResults.map(fake => `
                    <div class="search-result fake">
                        <div class="result-title">${fake.title}</div>
                        <div class="result-url">${fake.url}</div>
                        <div class="result-description">${fake.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getFakeResults(searchTerm) {
        // Return some fake results based on search term for immersion
        const fakeResults = [];
        
        if (searchTerm.includes('game')) {
            fakeResults.push({
                title: 'RetroArcade Snakesia',
                url: 'arcade.snake.ex/games',
                description: 'Best retro arcade in downtown Snakesia! - Sorry, this page is no longer available'
            });
        }
        
        if (searchTerm.includes('snake')) {
            fakeResults.push({
                title: 'Snake-E Denali Fanclub',
                url: 'fanclub.snake.ex/denali',
                description: 'Unofficial fan site for Snake-E\'s famous Denali - Under Construction'
            });
        }
        
        return fakeResults;
    }
}