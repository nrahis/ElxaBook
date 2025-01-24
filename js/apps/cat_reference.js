class CATReference {
    constructor() {
        this.sections = {
            basics: {
                title: "Basic CAT Commands",
                description: "Essential commands to get started with CAT programming",
                commands: [
                    {
                        command: "MEOW",
                        syntax: 'MEOW "Hello World"',
                        description: "Prints text to the console (like console.log or print)",
                        example: 'MEOW "My first CAT program!"'
                    },
                    {
                        command: "PURR",
                        syntax: "PURR variableName = value",
                        description: "Creates a new variable (like let or var)",
                        example: "PURR myNumber = 42\nPURR myText = \"Hello!\""
                    }
                ]
            },
            math: {
                title: "Math Operations",
                description: "Commands for doing math in CAT",
                commands: [
                    {
                        command: "SCRATCH",
                        syntax: "SCRATCH number",
                        description: "Adds 1 to a number (increment)",
                        example: "PURR count = 1\nSCRATCH count  // count is now 2"
                    },
                    {
                        command: "LICK",
                        syntax: "LICK number",
                        description: "Subtracts 1 from a number (decrement)",
                        example: "PURR count = 5\nLICK count  // count is now 4"
                    }
                ]
            },
            loops: {
                title: "Loops and Repetition",
                description: "Ways to repeat code in CAT",
                commands: [
                    {
                        command: "CHASE",
                        syntax: "CHASE count TIMES { code }",
                        description: "Repeats code a specific number of times (like a for loop)",
                        example: "CHASE 3 TIMES {\n    MEOW \"Loop!\"\n}"
                    },
                    {
                        command: "HUNT",
                        syntax: "HUNT WHILE condition { code }",
                        description: "Repeats code while a condition is true (while loop)",
                        example: "PURR mice = 5\nHUNT WHILE mice > 0 {\n    LICK mice\n}"
                    }
                ]
            },
            conditions: {
                title: "Making Decisions",
                description: "Conditional statements in CAT",
                commands: [
                    {
                        command: "CURIOUS",
                        syntax: "CURIOUS IF condition { code }",
                        description: "Runs code only if condition is true (if statement)",
                        example: "CURIOUS IF mice > 0 {\n    MEOW \"Found mice!\"\n}"
                    },
                    {
                        command: "NAP",
                        syntax: "NAP OTHERWISE { code }",
                        description: "Runs code if the CURIOUS IF was false (else statement)",
                        example: "CURIOUS IF mice > 0 {\n    MEOW \"Found mice!\"\n} NAP OTHERWISE {\n    MEOW \"No mice here!\"\n}"
                    }
                ]
            }
        };
    }

    initialize(container) {
        this.container = container;
        this.render();
        this.setupSearch();
    }

    render() {
        this.container.innerHTML = `
            <div class="cat-reference">
                <div class="reference-header">
                    <h2>CAT Reference</h2>
                    <input type="text" class="reference-search" placeholder="Search commands...">
                </div>
                <div class="reference-content">
                    ${this.renderSections()}
                </div>
            </div>
        `;
    }

    renderSections() {
        return Object.entries(this.sections)
            .map(([key, section]) => `
                <div class="reference-section" data-section="${key}">
                    <h3>${section.title}</h3>
                    <p>${section.description}</p>
                    <div class="commands-list">
                        ${section.commands.map(cmd => this.renderCommand(cmd)).join('')}
                    </div>
                </div>
            `).join('');
    }

    renderCommand(cmd) {
        return `
            <div class="command-item">
                <h4>${cmd.command}</h4>
                <div class="command-syntax">
                    <code>${cmd.syntax}</code>
                </div>
                <p>${cmd.description}</p>
                <div class="command-example">
                    <h5>Example:</h5>
                    <pre><code>${cmd.example}</code></pre>
                </div>
            </div>
        `;
    }

    setupSearch() {
        const searchInput = this.container.querySelector('.reference-search');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const commandItems = this.container.querySelectorAll('.command-item');
            
            commandItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });

            // Show/hide sections based on whether they have visible commands
            const sections = this.container.querySelectorAll('.reference-section');
            sections.forEach(section => {
                const hasVisibleCommands = Array.from(section.querySelectorAll('.command-item'))
                    .some(item => item.style.display !== 'none');
                section.style.display = hasVisibleCommands ? 'block' : 'none';
            });
        });
    }
}

export { CATReference };