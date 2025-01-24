class CATHighlighter {
    constructor() {
        this.tokenRules = [
            {
                type: 'comment',
                pattern: /\/\/[^\n]*/g,
                class: 'cat-comment'
            },
            {
                type: 'string',
                pattern: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g,
                class: 'cat-string'
            },
            {
                type: 'number',
                pattern: /\b\d+\b/g,
                class: 'cat-number'
            },
            {
                type: 'keyword',
                pattern: /\b(MEOW|PURR|PAW|SCRATCH|YARN|NAP)\b/g,
                class: 'cat-keyword'
            },
            {
                // Special pattern for timer and other angle bracket syntax
                type: 'special',
                pattern: /<[^>]+>(?:=\[[^\]]*\])?/g,
                class: 'cat-function'
            }
        ];
    }

    highlight(text) {
        if (!text) return '';
        return text.split('\n').map(line => this.highlightLine(line)).join('\n');
    }

    highlightLine(line) {
        // First, escape any HTML special characters to prevent them from being interpreted
        line = line.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
                  
        // Store all the positions where highlighting should occur
        let highlights = [];
        
        // Find matches for each rule
        for (const rule of this.tokenRules) {
            let match;
            // Create a new RegExp from the pattern to reset lastIndex
            const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
            while ((match = pattern.exec(line)) !== null) {
                highlights.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    class: rule.class
                });
            }
        }

        // Sort highlights by start position
        highlights.sort((a, b) => a.start - b.start);

        // If no highlights, return the escaped line
        if (highlights.length === 0) return line;

        // Build the result
        let result = '';
        let pos = 0;

        for (const highlight of highlights) {
            // Add any text before this highlight
            if (highlight.start > pos) {
                result += line.substring(pos, highlight.start);
            }

            // Add the highlighted portion
            if (highlight.start >= pos) {
                // For special syntax like <timer>, we need to unescape the brackets
                // to show them properly while still preventing HTML interpretation
                const displayText = highlight.text
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>');
                result += `<span class="${highlight.class}">${displayText}</span>`;
                pos = highlight.end;
            }
        }

        // Add any remaining text
        if (pos < line.length) {
            result += line.substring(pos);
        }

        return result;
    }
}

export { CATHighlighter };