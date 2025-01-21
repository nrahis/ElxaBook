// calendar.js
export class Calendar {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.events = this.loadEvents();
        this.activeTab = 'calendar';
        this.icons = {
            birthday: '🎂',
            party: '🎉',
            game: '🎮',
            star: '⭐',
            heart: '💖',
            music: '🎵',
            sport: '⚽',
            book: '📚',
            movie: '🎬',
            food: '🍕'
        };

        this.funFacts = [
            "Did you know? A year on Jupiter is almost 12 Earth years long!",
            "Fun fact: Penguins can't fly, but they're excellent swimmers!",
            "Wow! A rainbow forms a complete circle when viewed from above!",
            "Amazing! Your heart beats about 100,000 times every day!",
            "Cool fact: Cats spend 70% of their lives sleeping!",
            "Did you know? The first oranges weren't orange!",
            "Fun fact: Butterflies taste with their feet!",
            "Wow! A snail can sleep for three years!",
            "Amazing! Honey never spoils - ever!",
            "Cool fact: Dolphins have names for each other!"
        ];
        this.currentFact = 0;
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.render();
        this.setupEventListeners();
        this.refreshCalendar();
    }

    loadEvents() {
        const savedEvents = localStorage.getItem('elxaos_calendar_events');
        return savedEvents ? JSON.parse(savedEvents) : [];
    }

    saveEvents() {
        localStorage.setItem('elxaos_calendar_events', JSON.stringify(this.events));
    }

    initialize(contentArea) {
        this.contentArea = contentArea;
        this.render();
        this.setupEventListeners();
        this.refreshCalendar();
    }

    render() {
        this.contentArea.innerHTML = `
            <div class="calendar-app">
                <div class="calendar-header">
                    <div class="calendar-tabs">
                        <button class="tab-btn active" data-tab="calendar">Calendar</button>
                        <button class="tab-btn" data-tab="upcoming">Coming Up!</button>
                    </div>
                    <div class="month-navigation">
                        <button class="nav-btn prev-month">◀</button>
                        <h2 class="current-month"></h2>
                        <button class="nav-btn next-month">▶</button>
                    </div>
                </div>
                <div class="calendar-content">
                    <div class="calendar-main">
                        <div class="tab-content calendar-tab ${this.activeTab === 'calendar' ? '' : 'hidden'}">
                            <div class="calendar-grid">
                                <div class="weekdays">
                                    <div>Sun</div>
                                    <div>Mon</div>
                                    <div>Tue</div>
                                    <div>Wed</div>
                                    <div>Thu</div>
                                    <div>Fri</div>
                                    <div>Sat</div>
                                </div>
                                <div class="days"></div>
                            </div>
                            
                            <div class="fun-zone">
                                <div class="cat-container">
                                    <img src="/assets/rainbowcat.gif" class="cat-gif" alt="Cute cat">
                                </div>
                                <div class="fun-fact-box">
                                    <div class="fact-text">${this.funFacts[0]}</div>
                                    <button class="new-fact-btn">Tell me something else! ✨</button>
                                </div>
                            </div>
                        </div>

                        <div class="tab-content upcoming-tab ${this.activeTab === 'upcoming' ? '' : 'hidden'}">
                            <h3>Upcoming Events</h3>
                            <div class="upcoming-events"></div>
                        </div>
                    </div>

                    <div class="today-panel">
                        <h3>Today's Events</h3>
                        <div class="today-events"></div>
                    </div>
                </div>

                <!-- Event Dialog -->
                <div class="event-dialog hidden">
                    <div class="dialog-content">
                        <h3 class="dialog-title">New Event</h3>
                        <input type="text" class="event-title" placeholder="Event Title">
                        <div class="event-datetime">
                            <input type="date" class="event-date">
                            <input type="time" class="event-time">
                        </div>
                        <textarea class="event-description" placeholder="Description (optional)"></textarea>
                        <div class="icon-selector">
                            <h4>Choose an Icon:</h4>
                            <div class="icon-grid"></div>
                        </div>
                        <div class="dialog-buttons">
                            <button class="delete-event hidden">Delete</button>
                            <button class="save-event">Save</button>
                            <button class="cancel-event">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Fix the dialog button handlers
    setupEventListeners() {
        const prevBtn = this.contentArea.querySelector('.prev-month');
        const nextBtn = this.contentArea.querySelector('.next-month');
        const tabBtns = this.contentArea.querySelectorAll('.tab-btn');

        prevBtn.addEventListener('click', () => this.changeMonth(-1));
        nextBtn.addEventListener('click', () => this.changeMonth(1));

        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.refreshCalendar();
            });
        });

        // Event dialog listeners
        const dialog = this.contentArea.querySelector('.event-dialog');
        const saveBtn = dialog.querySelector('.save-event');
        const cancelBtn = dialog.querySelector('.cancel-event');
        const deleteBtn = dialog.querySelector('.delete-event');

        saveBtn.addEventListener('click', () => this.saveNewEvent());
        cancelBtn.addEventListener('click', () => this.hideEventDialog());
        deleteBtn.addEventListener('click', () => this.deleteEvent());

        // Setup icon grid
        this.setupIconGrid();

        // Add fun fact button listener
        const factBtn = this.contentArea.querySelector('.new-fact-btn');
        factBtn.addEventListener('click', () => {
            // Update fact text
            this.currentFact = (this.currentFact + 1) % this.funFacts.length;
            const factText = this.contentArea.querySelector('.fact-text');
            factText.style.opacity = '0';
            setTimeout(() => {
                factText.textContent = this.funFacts[this.currentFact];
                factText.style.opacity = '1';
            }, 300);
            
            // Animate the cat GIF
            const catGif = this.contentArea.querySelector('.cat-gif');
            catGif.style.animation = 'none';
            catGif.offsetHeight; // Trigger reflow
            catGif.style.animation = 'bounce 0.5s ease';
        });
    }

    // Add the missing hideEventDialog method
    hideEventDialog() {
        const dialog = this.contentArea.querySelector('.event-dialog');
        dialog.classList.add('hidden');
    }

    setupIconGrid() {
        const iconGrid = this.contentArea.querySelector('.icon-grid');
        Object.entries(this.icons).forEach(([key, icon]) => {
            const iconBtn = document.createElement('button');
            iconBtn.className = 'icon-option';
            iconBtn.innerHTML = icon;
            iconBtn.dataset.icon = key;
            iconBtn.addEventListener('click', () => this.selectIcon(iconBtn));
            iconGrid.appendChild(iconBtn);
        });
    }


    showEventDialog(date, existingEvent = null) {
        const dialog = this.contentArea.querySelector('.event-dialog');
        const titleInput = dialog.querySelector('.event-title');
        const dateInput = dialog.querySelector('.event-date');
        const timeInput = dialog.querySelector('.event-time');
        const descInput = dialog.querySelector('.event-description');
        const deleteBtn = dialog.querySelector('.delete-event');
        const dialogTitle = dialog.querySelector('.dialog-title');

        dialog.classList.remove('hidden');
        
        if (existingEvent) {
            dialogTitle.textContent = 'Edit Event';
            titleInput.value = existingEvent.title;
            dateInput.value = existingEvent.date;
            timeInput.value = existingEvent.time || '';
            descInput.value = existingEvent.description || '';
            deleteBtn.classList.remove('hidden');
            dialog.dataset.eventId = existingEvent.id;
            
            const iconBtn = dialog.querySelector(`[data-icon="${existingEvent.icon}"]`);
            if (iconBtn) this.selectIcon(iconBtn);
        } else {
            dialogTitle.textContent = 'New Event';
            titleInput.value = '';
            dateInput.value = date.toISOString().split('T')[0];
            timeInput.value = '';
            descInput.value = '';
            deleteBtn.classList.add('hidden');
            delete dialog.dataset.eventId;
        }
    }

    deleteEvent() {
        const dialog = this.contentArea.querySelector('.event-dialog');
        const eventId = parseInt(dialog.dataset.eventId);
        
        this.events = this.events.filter(event => event.id !== eventId);
        this.saveEvents();
        this.hideEventDialog();
        this.refreshCalendar();
    }

    refreshCalendar() {
        // Show/hide month navigation based on active tab
        const monthNav = this.contentArea.querySelector('.month-navigation');
        monthNav.style.display = this.activeTab === 'calendar' ? 'flex' : 'none';

        if (this.activeTab === 'calendar') {
            // Update month display and calendar grid
            const monthDisplay = this.contentArea.querySelector('.current-month');
            const daysGrid = this.contentArea.querySelector('.days');
            const month = this.selectedDate.getMonth();
            const year = this.selectedDate.getFullYear();

            monthDisplay.textContent = new Date(year, month, 1)
                .toLocaleDateString('default', { month: 'long', year: 'numeric' });

            daysGrid.innerHTML = '';
            
            // Add empty cells for days before start of month
            const firstDay = new Date(year, month, 1).getDay();
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'day empty';
                daysGrid.appendChild(emptyDay);
            }

            // Add days of month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'day';
                
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = this.events.filter(event => event.date === dateStr);
                
                if (dayEvents.length > 0) {
                    const eventIndicator = document.createElement('div');
                    eventIndicator.className = 'event-indicator';
                    eventIndicator.innerHTML = dayEvents.map(event => this.icons[event.icon]).join(' ');
                    dayCell.appendChild(eventIndicator);
                }

                const dayNumber = document.createElement('span');
                dayNumber.textContent = day;
                dayCell.appendChild(dayNumber);

                if (this.currentDate.getDate() === day && 
                    this.currentDate.getMonth() === month && 
                    this.currentDate.getFullYear() === year) {
                    dayCell.classList.add('current-day');
                }

                // Day click handler
                dayCell.addEventListener('click', () => {
                    const clickedDate = new Date(year, month, day);
                    const existingEvent = dayEvents[0]; // Get first event if any exists
                    this.showEventDialog(clickedDate, existingEvent);
                });

                daysGrid.appendChild(dayCell);
            }
        } else {
            // Update upcoming events tab with improved layout
            this.updateUpcomingEvents();
        }
    
        // Hide tabs content based on active tab
        const calendarTab = this.contentArea.querySelector('.calendar-tab');
        const upcomingTab = this.contentArea.querySelector('.upcoming-tab');
        
        calendarTab.classList.toggle('hidden', this.activeTab !== 'calendar');
        upcomingTab.classList.toggle('hidden', this.activeTab !== 'upcoming');
        // Update the today panel
        this.updateTodayPanel();
    }

    updateTodayPanel() {
        const todayEventsDiv = this.contentArea.querySelector('.today-events');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayEvents = this.events
            .filter(event => {
                const eventDate = new Date(event.date + 'T00:00:00'); // Ensure consistent timezone handling
                return eventDate.toDateString() === today.toDateString(); // Compare date strings instead of components
            })
            .sort((a, b) => {
                if (!a.time) return 1;
                if (!b.time) return -1;
                return a.time.localeCompare(b.time);
            });
    
        if (todayEvents.length === 0) {
            todayEventsDiv.innerHTML = '<p class="no-events">No events scheduled for today</p>';
            return;
        }
    
        todayEventsDiv.innerHTML = todayEvents.map(event => `
            <div class="today-event" data-event-id="${event.id}">
                <div class="event-time">${event.time || 'All Day'}</div>
                <div class="event-content">
                    <span class="event-icon">${this.icons[event.icon]}</span>
                    <div class="event-info">
                        <div class="event-title">${event.title}</div>
                        ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    
        // Add click handlers for editing events
        todayEventsDiv.querySelectorAll('.today-event').forEach(eventElement => {
            eventElement.addEventListener('click', () => {
                const eventId = parseInt(eventElement.dataset.eventId);
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    this.showEventDialog(new Date(event.date), event);
                }
            });
        });
    }

    updateUpcomingEvents() {
        const upcomingEventsDiv = this.contentArea.querySelector('.upcoming-events');
        upcomingEventsDiv.innerHTML = '';
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const upcomingEvents = this.events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    
        // Group events by month
        const eventsByMonth = {};
        upcomingEvents.forEach(event => {
            const date = new Date(event.date);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!eventsByMonth[monthYear]) {
                eventsByMonth[monthYear] = [];
            }
            eventsByMonth[monthYear].push(event);
        });
    
        // If no events, show a message
        if (upcomingEvents.length === 0) {
            upcomingEventsDiv.innerHTML = `
                <div class="no-events-message">
                    No upcoming events. Click on a day in the calendar to add one!
                </div>
            `;
            return;
        }
    
        // Create month groups
        Object.entries(eventsByMonth).forEach(([monthYear, events]) => {
            const monthSection = document.createElement('div');
            monthSection.className = 'upcoming-month-section';
            
            monthSection.innerHTML = `
                <h4 class="month-header">${monthYear}</h4>
                <div class="month-events"></div>
            `;
    
            const monthEventsDiv = monthSection.querySelector('.month-events');
            
            events.forEach(event => {
                const eventDate = new Date(event.date);
                const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                
                const eventDiv = document.createElement('div');
                eventDiv.className = 'upcoming-event';
                eventDiv.innerHTML = `
                    <div class="event-date-column">
                        <span class="event-day">${eventDate.getDate()}</span>
                        <span class="event-weekday">${eventDate.toLocaleDateString('default', { weekday: 'short' })}</span>
                    </div>
                    <div class="event-icon">${this.icons[event.icon]}</div>
                    <div class="event-details">
                        <span class="event-title">${event.title}</span>
                        <span class="days-until">
                            ${daysUntil === 0 ? 'Today!' : 
                              daysUntil === 1 ? 'Tomorrow!' : 
                              `in ${daysUntil} days`}
                        </span>
                        ${event.description ? `<span class="event-description">${event.description}</span>` : ''}
                    </div>
                `;
                
                // Allow editing events
                eventDiv.addEventListener('click', () => {
                    this.showEventDialog(eventDate, event);
                });
                
                monthEventsDiv.appendChild(eventDiv);
            });
    
            upcomingEventsDiv.appendChild(monthSection);
        });
    }

    updateCountdown() {
        const nextEventsDiv = this.contentArea.querySelector('.next-events');
        nextEventsDiv.innerHTML = '';

        // Get upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingEvents = this.events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        upcomingEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
            
            const eventDiv = document.createElement('div');
            eventDiv.className = 'countdown-event';
            eventDiv.innerHTML = `
                <span class="event-icon">${this.icons[event.icon]}</span>
                <span class="event-info">
                    ${event.title}
                    <span class="days-until">
                        ${daysUntil === 0 ? 'Today!' : 
                          daysUntil === 1 ? 'Tomorrow!' : 
                          `in ${daysUntil} days`}
                    </span>
                </span>
            `;
            nextEventsDiv.appendChild(eventDiv);
        });
    }

    changeMonth(delta) {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + delta);
        this.refreshCalendar();
    }

    showAddEventDialog() {
        const dialog = this.contentArea.querySelector('.event-dialog');
        dialog.classList.remove('hidden');
        
        // Set default date to selected date
        const dateInput = dialog.querySelector('.event-date');
        dateInput.value = this.selectedDate.toISOString().split('T')[0];
    }

    hideAddEventDialog() {
        const dialog = this.contentArea.querySelector('.event-dialog');
        dialog.classList.add('hidden');
    }

    selectIcon(iconBtn) {
        // Remove selected class from all icons
        this.contentArea.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        // Add selected class to clicked icon
        iconBtn.classList.add('selected');
    }

    saveNewEvent() {
        const dialog = this.contentArea.querySelector('.event-dialog');
        const title = dialog.querySelector('.event-title').value;
        const date = dialog.querySelector('.event-date').value;
        const time = dialog.querySelector('.event-time').value;
        const description = dialog.querySelector('.event-description').value;
        const selectedIcon = dialog.querySelector('.icon-option.selected');

        if (!title || !date) return;

        const eventId = dialog.dataset.eventId ? parseInt(dialog.dataset.eventId) : Date.now();
        
        if (dialog.dataset.eventId) {
            this.events = this.events.filter(event => event.id !== eventId);
        }

        const event = {
            id: eventId,
            title,
            date,
            time,
            description,
            icon: selectedIcon ? selectedIcon.dataset.icon : 'star'
        };

        this.events.push(event);
        this.saveEvents();
        this.hideEventDialog();
        this.refreshCalendar();
        this.updateTodayPanel();
    }

    loadEvents() {
        const savedEvents = localStorage.getItem('elxaos_calendar_events');
        return savedEvents ? JSON.parse(savedEvents) : [];
    }

    saveEvents() {
        localStorage.setItem('elxaos_calendar_events', JSON.stringify(this.events));
    }


}