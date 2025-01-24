class CATParser {
    constructor() {
        this.TOKEN_TYPES = {
            KEYWORD: 'KEYWORD',
            STRING: 'STRING',
            NUMBER: 'NUMBER',
            IDENTIFIER: 'IDENTIFIER',
            OPERATOR: 'OPERATOR',
            PUNCTUATION: 'PUNCTUATION',
            FUNCTION: 'FUNCTION',
            NEWLINE: 'NEWLINE',
            COMPARISON: 'COMPARISON'
        };

        this.BUILT_IN_FUNCTIONS = [
            'ROUND', 'RANDOM', 'UPPERCASE', 'LOWERCASE',
            'LENGTH', 'FLOOR', 'CEIL', 'ABS', 'MIN', 'MAX',
            'SQRT', 'POW', 'SUBSTRING'
        ];

        this.KEYWORDS = {
            'MEOW': 'print',
            'PURR': 'declare',
            'SCRATCH': 'increment',
            'LICK': 'decrement',
            'CHASE': 'for',
            'TIMES': 'times',
            'HUNT': 'while',
            'WHILE': 'while_condition',
            'CURIOUS': 'if',
            'IF': 'if_condition',
            'NAP': 'else',
            'OTHERWISE': 'else_clause'
        };

        // Split operators by precedence
        this.COMPARISON_OPERATORS = ['>', '<', '>=', '<=', '==', '!='];
        this.ARITHMETIC_OPERATORS = ['+', '-', '*', '/'];
        this.ASSIGNMENT_OPERATORS = ['='];
        this.ALL_OPERATORS = [...this.COMPARISON_OPERATORS, ...this.ARITHMETIC_OPERATORS, ...this.ASSIGNMENT_OPERATORS];
    }

    tokenize(code) {
        let tokens = [];
        let current = 0;
        
        while (current < code.length) {
            let char = code[current];

            // Handle whitespace and newlines
            if (/\s/.test(char)) {
                if (char === '\n') {
                    tokens.push({ type: this.TOKEN_TYPES.NEWLINE });
                }
                current++;
                continue;
            }

            // Handle strings with escape characters
            if (char === '"' || char === "'") {
                let value = '';
                const quote = char;
                current++;

                while (current < code.length && code[current] !== quote) {
                    if (code[current] === '\\' && current + 1 < code.length) {
                        current++;
                        switch (code[current]) {
                            case 'n': value += '\n'; break;
                            case 't': value += '\t'; break;
                            case 'r': value += '\r'; break;
                            default: value += code[current];
                        }
                    } else {
                        value += code[current];
                    }
                    current++;
                }
                current++;

                tokens.push({
                    type: this.TOKEN_TYPES.STRING,
                    value: value
                });
                continue;
            }

            // Handle brackets and punctuation
            if (/[{}()\[\],]/.test(char)) {
                tokens.push({
                    type: this.TOKEN_TYPES.PUNCTUATION,
                    value: char
                });
                current++;
                continue;
            }

            // Handle numbers (including decimals)
            if (/[0-9]/.test(char)) {
                let value = '';
                let hasDecimal = false;

                while (current < code.length && 
                      (/[0-9]/.test(code[current]) || 
                       (code[current] === '.' && !hasDecimal))) {
                    if (code[current] === '.') hasDecimal = true;
                    value += code[current];
                    current++;
                }

                tokens.push({
                    type: this.TOKEN_TYPES.NUMBER,
                    value: parseFloat(value)
                });
                continue;
            }

            // Handle operators (including multi-character operators)
            let operator = '';
            while (current < code.length && 
                   this.ALL_OPERATORS.some(op => op.startsWith(operator + code[current]))) {
                operator += code[current];
                current++;
            }
            
            if (operator) {
                const type = this.COMPARISON_OPERATORS.includes(operator) ? 
                            this.TOKEN_TYPES.COMPARISON : 
                            this.TOKEN_TYPES.OPERATOR;
                tokens.push({ type, value: operator });
                continue;
            }

            // Handle identifiers, keywords, and functions
            if (/[A-Z_]/i.test(char)) {
                let value = '';
                while (current < code.length && /[A-Z0-9_]/i.test(code[current])) {
                    value += code[current];
                    current++;
                }

                // Look ahead for function calls
                let lookAhead = current;
                while (lookAhead < code.length && /\s/.test(code[lookAhead])) {
                    lookAhead++;
                }

                if (this.BUILT_IN_FUNCTIONS.includes(value) && code[lookAhead] === '(') {
                    tokens.push({
                        type: this.TOKEN_TYPES.FUNCTION,
                        value: value
                    });
                } else if (this.KEYWORDS[value]) {
                    tokens.push({
                        type: this.TOKEN_TYPES.KEYWORD,
                        value: value,
                        meaning: this.KEYWORDS[value]
                    });
                } else {
                    tokens.push({
                        type: this.TOKEN_TYPES.IDENTIFIER,
                        value: value
                    });
                }
                continue;
            }

            current++;
        }

        return tokens;
    }

    parse(code) {
        const tokens = this.tokenize(code);
        const ast = {
            type: 'Program',
            body: []
        };

        let current = 0;

        while (current < tokens.length) {
            const token = tokens[current];

            if (token.type === this.TOKEN_TYPES.NEWLINE) {
                current++;
                continue;
            }

            if (token.type === this.TOKEN_TYPES.KEYWORD) {
                switch (token.meaning) {
                    case 'print': {
                        current++;
                        const expression = this.parseExpression(tokens, current);
                        current = expression.next;
                        ast.body.push({
                            type: 'PrintStatement',
                            value: expression.value
                        });
                        break;
                    }
                    case 'declare': {
                        const varName = tokens[++current];
                        const operator = tokens[++current];
                        current++;
                        const expression = this.parseExpression(tokens, current);
                        current = expression.next;
                        ast.body.push({
                            type: 'VariableDeclaration',
                            name: varName,
                            operator: operator,
                            value: expression.value
                        });
                        break;
                    }
                    case 'increment': {
                        const variable = tokens[++current];
                        current++;
                        ast.body.push({
                            type: 'IncrementStatement',
                            variable: variable
                        });
                        break;
                    }
                    case 'decrement': {
                        const variable = tokens[++current];
                        current++;
                        ast.body.push({
                            type: 'DecrementStatement',
                            variable: variable
                        });
                        break;
                    }
                    case 'while': {
                        current++; // Skip WHILE keyword
                        const condition = this.parseExpression(tokens, current);
                        current = condition.next;
                        const block = this.parseBlock(tokens, current);
                        current = block.next;
                        ast.body.push({
                            type: 'WhileLoop',
                            condition: condition.value,
                            body: block.statements
                        });
                        break;
                    }
                    case 'for': {
                        current++;
                        const count = this.parseExpression(tokens, current);
                        current = count.next;
                        // Skip 'TIMES' keyword
                        while (current < tokens.length && 
                               (tokens[current].type === this.TOKEN_TYPES.NEWLINE ||
                                tokens[current].value === 'TIMES')) {
                            current++;
                        }
                        const block = this.parseBlock(tokens, current);
                        current = block.next;
                        ast.body.push({
                            type: 'ForLoop',
                            count: count.value,
                            body: block.statements
                        });
                        break;
                    }
                }
            } else {
                // Handle standalone expressions
                const expression = this.parseExpression(tokens, current);
                if (expression.value) {
                    ast.body.push(expression.value);
                }
                current = expression.next;
            }
        }

        return ast;
    }

    parseExpression(tokens, start) {
        let current = start;
        let expr = this.parsePrimary(tokens, current);
        
        if (!expr) {
            return { value: null, next: current + 1 };
        }
        
        current = expr.next;

        // Handle operator precedence
        while (current < tokens.length) {
            const token = tokens[current];
            
            if (!token || token.type === this.TOKEN_TYPES.NEWLINE || 
                token.value === '}' || token.value === ')') {
                break;
            }

            if (token.type === this.TOKEN_TYPES.OPERATOR || 
                token.type === this.TOKEN_TYPES.COMPARISON) {
                const operator = token;
                current++;
                const right = this.parsePrimary(tokens, current);
                if (!right) break;
                
                current = right.next;
                expr = {
                    value: {
                        type: 'OPERATOR',
                        value: operator.value,
                        left: expr.value,
                        right: right.value
                    },
                    next: current
                };
            } else {
                break;
            }
        }

        return expr;
    }

    parsePrimary(tokens, start) {
        let current = start;
        const token = tokens[current];

        if (!token) return null;

        switch (token.type) {
            case this.TOKEN_TYPES.NUMBER:
            case this.TOKEN_TYPES.STRING:
            case this.TOKEN_TYPES.IDENTIFIER:
                return { value: token, next: current + 1 };

            case this.TOKEN_TYPES.FUNCTION: {
                const funcName = token.value;
                current++; // Move past function name
                
                // Expect opening parenthesis
                if (tokens[current].value !== '(') {
                    throw new Error(`Expected ( after function ${funcName}`);
                }
                current++;

                const args = [];
                while (current < tokens.length && tokens[current].value !== ')') {
                    if (tokens[current].value === ',') {
                        current++;
                        continue;
                    }
                    const arg = this.parseExpression(tokens, current);
                    if (!arg) break;
                    args.push(arg.value);
                    current = arg.next;
                }

                // Expect closing parenthesis
                if (tokens[current].value !== ')') {
                    throw new Error(`Expected ) after function arguments`);
                }
                current++;

                return {
                    value: {
                        type: 'FunctionCall',
                        name: funcName,
                        arguments: args
                    },
                    next: current
                };
            }
        }

        return null;
    }

    parseBlock(tokens, start) {
        let current = start;
        const statements = [];
        
        // Expect and skip opening brace
        if (!tokens[current] || tokens[current].value !== '{') {
            throw new Error('Expected { at start of block');
        }
        current++;

        while (current < tokens.length && tokens[current].value !== '}') {
            // Skip newlines
            if (tokens[current].type === this.TOKEN_TYPES.NEWLINE) {
                current++;
                continue;
            }

            if (tokens[current].type === this.TOKEN_TYPES.KEYWORD) {
                switch (tokens[current].meaning) {
                    case 'print': {
                        current++;
                        const expression = this.parseExpression(tokens, current);
                        current = expression.next;
                        statements.push({
                            type: 'PrintStatement',
                            value: expression.value
                        });
                        break;
                    }
                    case 'increment': {
                        const variable = tokens[++current];
                        current++;
                        statements.push({
                            type: 'IncrementStatement',
                            variable: variable
                        });
                        break;
                    }
                    case 'decrement': {
                        const variable = tokens[++current];
                        current++;
                        statements.push({
                            type: 'DecrementStatement',
                            variable: variable
                        });
                        break;
                    }
                    default: {
                        const expression = this.parseExpression(tokens, current);
                        if (expression.value) {
                            statements.push(expression.value);
                        }
                        current = expression.next;
                    }
                }
            } else {
                const expression = this.parseExpression(tokens, current);
                if (expression.value) {
                    statements.push(expression.value);
                }
                current = expression.next;
            }
        }

        // Expect and skip closing brace
        if (!tokens[current] || tokens[current].value !== '}') {
            throw new Error('Expected } at end of block');
        }
        current++;

        return { statements, next: current };
    }

    validate(ast) {
        const errors = [];
        
        const validateNode = (node, context = {}) => {
            switch (node.type) {
                case 'PrintStatement':
                    if (!node.value) {
                        errors.push({
                            line: context.line || 1,
                            message: 'MEOW command expects something to print'
                        });
                    }
                    break;
                    
                case 'VariableDeclaration':
                    if (!node.name || node.name.type !== 'IDENTIFIER') {
                        errors.push({
                            line: context.line || 1,
                            message: 'PURR command expects a valid variable name'
                        });
                    }
                    if (!node.value) {
                        errors.push({
                            line: context.line || 1,
                            message: 'Invalid value in variable declaration'
                        });
                    }
                    break;
                    
                case 'WhileLoop':
                    if (!node.condition) {
                        errors.push({
                            line: context.line || 1,
                            message: 'HUNT WHILE requires a condition'
                        });
                    }
                    if (!Array.isArray(node.body)) {
                        errors.push({
                            line: context.line || 1,
                            message: 'HUNT WHILE requires a code block in { }'
                        });
                    }
                    break;
                    
                case 'ForLoop':
                    if (!node.count) {
                        errors.push({
                            line: context.line || 1,
                            message: 'CHASE requires a number of times to repeat'
                        });
                    }
                    if (!Array.isArray(node.body)) {
                        errors.push({
                            line: context.line || 1,
                            message: 'CHASE requires a code block in { }'
                        });
                    }
                    break;

                case 'FunctionCall':
                    if (!this.BUILT_IN_FUNCTIONS.includes(node.name)) {
                        errors.push({
                            line: context.line || 1,
                            message: `Unknown function: ${node.name}`
                        });
                    }
                    break;

                case 'OPERATOR':
                    if (!node.left || !node.right) {
                        errors.push({
                            line: context.line || 1,
                            message: `Operator ${node.value} requires values on both sides`
                        });
                    }
                    break;
            }

            // Recursively validate nested structures
            if (node.body && Array.isArray(node.body)) {
                node.body.forEach(childNode => validateNode(childNode, context));
            }
            if (node.consequent && Array.isArray(node.consequent)) {
                node.consequent.forEach(childNode => validateNode(childNode, context));
            }
            if (node.alternate && Array.isArray(node.alternate)) {
                node.alternate.forEach(childNode => validateNode(childNode, context));
            }
        };

        ast.body.forEach((node, index) => {
            validateNode(node, { line: index + 1 });
        });

        return errors;
    }

    formatError(error) {
        const friendlyMessages = {
            'MEOW command expects something to print': 
                "Oops! MEOW needs something to say - try putting your message in quotes like: MEOW \"Hello!\"",
            'PURR command expects a valid variable name':
                "Hmm... when using PURR to create something new, give it a nice name like: PURR myNumber = 42",
            'Invalid value in variable declaration':
                "The value you're trying to store doesn't look quite right. Try using a number or some text in quotes!",
            'HUNT WHILE requires a condition':
                "HUNT WHILE needs to know when to stop! Try something like: HUNT WHILE counter <= 10",
            'HUNT WHILE requires a code block in { }':
                "Don't forget to put your HUNT WHILE code inside curly braces { }",
            'CHASE requires a number of times to repeat':
                "CHASE needs to know how many times to repeat! Try: CHASE 5 TIMES",
            'CHASE requires a code block in { }':
                "Don't forget to put your CHASE code inside curly braces { }"
        };

        // Handle function errors specially
        if (error.message.startsWith('Unknown function:')) {
            return {
                line: error.line,
                message: `Oops! ${error.message}. Available functions are: ${this.BUILT_IN_FUNCTIONS.join(', ')}`,
                original: error.message
            };
        }

        // Handle operator errors specially
        if (error.message.includes('Operator')) {
            return {
                line: error.line,
                message: `Make sure you have values on both sides of your ${error.message.split(' ')[1]} operator!`,
                original: error.message
            };
        }

        return {
            line: error.line,
            message: friendlyMessages[error.message] || error.message,
            original: error.message
        };
    }

    getLineNumber(nodeIndex) {
        return nodeIndex + 1;
    }

    // Helper method to check if a token is a valid operator
    isOperator(token) {
        return token && (token.type === this.TOKEN_TYPES.OPERATOR || 
                        token.type === this.TOKEN_TYPES.COMPARISON);
    }

    // Helper method to get operator precedence
    getOperatorPrecedence(operator) {
        const precedence = {
            '*': 3,
            '/': 3,
            '+': 2,
            '-': 2,
            '>': 1,
            '<': 1,
            '>=': 1,
            '<=': 1,
            '==': 1,
            '!=': 1,
            '=': 0
        };
        return precedence[operator] || 0;
    }
}

export { CATParser };