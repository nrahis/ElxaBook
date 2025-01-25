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

    // Add this method to CATParser class, removing any duplicate parseBlock definitions

    parse(code) {
        // First tokenize the code
        const tokens = this.tokenize(code);
        
        // Create program AST
        const program = {
            type: 'Program',
            body: []
        };

        let current = 0;
        while (current < tokens.length) {
            // Skip newlines and whitespace
            if (tokens[current].type === this.TOKEN_TYPES.NEWLINE) {
                current++;
                continue;
            }

            // Parse each statement
            if (tokens[current].type === this.TOKEN_TYPES.KEYWORD) {
                switch (tokens[current].meaning) {
                    case 'print': {
                        current++; // Move past MEOW
                        const expression = this.parseExpression(tokens, current);
                        if (!expression || !expression.value) {
                            throw new Error('Expected expression after MEOW');
                        }
                        program.body.push({
                            type: 'PrintStatement',
                            value: expression.value
                        });
                        current = expression.next;
                        break;
                    }
                    
                    case 'declare': {
                        current++; // Move past PURR
                        if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                            throw new Error('Expected variable name after PURR');
                        }
                        const name = tokens[current];
                        current++;
                        
                        if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.OPERATOR || tokens[current].value !== '=') {
                            throw new Error('Expected = after variable name in PURR');
                        }
                        current++;
                        
                        const expression = this.parseExpression(tokens, current);
                        if (!expression || !expression.value) {
                            throw new Error('Expected value after = in PURR');
                        }
                        program.body.push({
                            type: 'VariableDeclaration',
                            name: name,
                            value: expression.value
                        });
                        current = expression.next;
                        break;
                    }
                    
                    case 'increment': {
                        current++; // Move past SCRATCH
                        if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                            throw new Error('Expected variable name after SCRATCH');
                        }
                        program.body.push({
                            type: 'IncrementStatement',
                            variable: tokens[current]
                        });
                        current++;
                        break;
                    }
                    
                    case 'decrement': {
                        current++; // Move past LICK
                        if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                            throw new Error('Expected variable name after LICK');
                        }
                        program.body.push({
                            type: 'DecrementStatement',
                            variable: tokens[current]
                        });
                        current++;
                        break;
                    }
                    
                    case 'while': {
                        current++; // Move past HUNT
                        if (!tokens[current] || tokens[current].meaning !== 'while_condition') {
                            throw new Error('Expected WHILE after HUNT');
                        }
                        current++; // Move past WHILE
                        
                        const condition = this.parseExpression(tokens, current);
                        if (!condition || !condition.value) {
                            throw new Error('Expected condition after HUNT WHILE');
                        }
                        current = condition.next;
                        
                        // Use existing parseBlock method
                        const block = this.parseBlock(tokens, current);
                        if (!block) {
                            throw new Error('Expected code block after HUNT WHILE condition');
                        }
                        program.body.push({
                            type: 'WhileLoop',
                            condition: condition.value,
                            body: block.statements
                        });
                        current = block.next;
                        break;
                    }
                    
                    case 'for': {
                        current++; // Move past CHASE
                        const count = this.parseExpression(tokens, current);
                        if (!count || !count.value) {
                            throw new Error('Expected number after CHASE');
                        }
                        current = count.next;
                        
                        if (!tokens[current] || tokens[current].meaning !== 'times') {
                            throw new Error('Expected TIMES after CHASE number');
                        }
                        current++; // Move past TIMES
                        
                        // Use existing parseBlock method
                        const block = this.parseBlock(tokens, current);
                        if (!block) {
                            throw new Error('Expected code block after CHASE number TIMES');
                        }
                        program.body.push({
                            type: 'ForLoop',
                            count: count.value,
                            body: block.statements
                        });
                        current = block.next;
                        break;
                    }
                    
                    default:
                        throw new Error(`Unknown keyword: ${tokens[current].value}`);
                }
            } else {
                // Skip unknown tokens
                current++;
            }
        }

        return program;
    }

    // Add this method to the CATParser class
    parseStatement(tokens, start) {
        let current = start;
        const token = tokens[current];

        if (!token) return null;

        if (token.type === this.TOKEN_TYPES.KEYWORD) {
            switch (token.meaning) {
                case 'print': {
                    current++; // Move past MEOW
                    const expression = this.parseExpression(tokens, current);
                    if (!expression || !expression.value) {
                        throw new Error('Expected expression after MEOW');
                    }
                    return {
                        value: {
                            type: 'PrintStatement',
                            value: expression.value
                        },
                        next: expression.next
                    };
                }

                case 'declare': {
                    current++; // Move past PURR
                    if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                        throw new Error('Expected variable name after PURR');
                    }
                    const name = tokens[current];
                    current++;

                    if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.OPERATOR || tokens[current].value !== '=') {
                        throw new Error('Expected = after variable name in PURR');
                    }
                    current++;

                    const expression = this.parseExpression(tokens, current);
                    if (!expression || !expression.value) {
                        throw new Error('Expected value after = in PURR');
                    }
                    return {
                        value: {
                            type: 'VariableDeclaration',
                            name: name,
                            value: expression.value
                        },
                        next: expression.next
                    };
                }

                case 'increment': {
                    current++; // Move past SCRATCH
                    if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                        throw new Error('Expected variable name after SCRATCH');
                    }
                    return {
                        value: {
                            type: 'IncrementStatement',
                            variable: tokens[current]
                        },
                        next: current + 1
                    };
                }

                case 'decrement': {
                    current++; // Move past LICK
                    if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                        throw new Error('Expected variable name after LICK');
                    }
                    return {
                        value: {
                            type: 'DecrementStatement',
                            variable: tokens[current]
                        },
                        next: current + 1
                    };
                }

                case 'while': {
                    current++; // Move past HUNT
                    if (!tokens[current] || tokens[current].meaning !== 'while_condition') {
                        throw new Error('Expected WHILE after HUNT');
                    }
                    current++; // Move past WHILE

                    const condition = this.parseExpression(tokens, current);
                    if (!condition || !condition.value) {
                        throw new Error('Expected condition after HUNT WHILE');
                    }
                    current = condition.next;

                    // Parse the block
                    const block = this.parseBlock(tokens, current);
                    if (!block) {
                        throw new Error('Expected code block after HUNT WHILE condition');
                    }
                    return {
                        value: {
                            type: 'WhileLoop',
                            condition: condition.value,
                            body: block.statements
                        },
                        next: block.next
                    };
                }

                case 'for': {
                    current++; // Move past CHASE
                    const count = this.parseExpression(tokens, current);
                    if (!count || !count.value) {
                        throw new Error('Expected number after CHASE');
                    }
                    current = count.next;

                    if (!tokens[current] || tokens[current].meaning !== 'times') {
                        throw new Error('Expected TIMES after CHASE number');
                    }
                    current++; // Move past TIMES

                    const block = this.parseBlock(tokens, current);
                    if (!block) {
                        throw new Error('Expected code block after CHASE number TIMES');
                    }
                    return {
                        value: {
                            type: 'ForLoop',
                            count: count.value,
                            body: block.statements
                        },
                        next: block.next
                    };
                }
            }
        }

        return null;
    }

    parseBlock(tokens, start) {
        let current = start;
        const statements = [];
        
        // Skip any whitespace or newlines before the brace
        while (current < tokens.length && 
               (tokens[current].type === this.TOKEN_TYPES.NEWLINE || 
                /\s/.test(tokens[current].value))) {
            current++;
        }
    
        // Check for opening brace
        if (!tokens[current] || tokens[current].value !== '{') {
            throw new Error(`Expected { at start of block, found ${tokens[current]?.value || 'end of input'}`);
        }
        current++;
    
        // Process statements until we hit closing brace
        while (current < tokens.length && tokens[current].value !== '}') {
            // Skip standalone newlines
            if (tokens[current].type === this.TOKEN_TYPES.NEWLINE) {
                current++;
                continue;
            }
    
            // Parse statements based on keyword type
            if (tokens[current].type === this.TOKEN_TYPES.KEYWORD) {
                switch (tokens[current].meaning) {
                    case 'print': {
                        current++; // Move past MEOW
                        const expression = this.parseExpression(tokens, current);
                        if (!expression || !expression.value) {
                            throw new Error('Expected expression after MEOW');
                        }
                        statements.push({
                            type: 'PrintStatement',
                            value: expression.value
                        });
                        current = expression.next;
                        break;
                    }
    
                    case 'declare': {
                        current++; // Move past PURR
                        if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                            throw new Error('Expected variable name after PURR');
                        }
                        const name = tokens[current];
                        current++;
                        
                        if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.OPERATOR || tokens[current].value !== '=') {
                            throw new Error('Expected = after variable name in PURR');
                        }
                        current++;
                        
                        const expression = this.parseExpression(tokens, current);
                        if (!expression || !expression.value) {
                            throw new Error('Expected value after = in PURR');
                        }
                        statements.push({
                            type: 'VariableDeclaration',
                            name: name,
                            value: expression.value
                        });
                        current = expression.next;
                        break;
                    }
    
                    case 'increment': {
                        current++; // Move past SCRATCH
                        if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                            throw new Error('Expected variable name after SCRATCH');
                        }
                        statements.push({
                            type: 'IncrementStatement',
                            variable: tokens[current]
                        });
                        current++;
                        break;
                    }
    
                    case 'decrement': {
                        current++; // Move past LICK
                        if (!tokens[current] || tokens[current].type !== this.TOKEN_TYPES.IDENTIFIER) {
                            throw new Error('Expected variable name after LICK');
                        }
                        statements.push({
                            type: 'DecrementStatement',
                            variable: tokens[current]
                        });
                        current++;
                        break;
                    }
    
                    case 'while': {
                        current++; // Move past HUNT
                        if (!tokens[current] || tokens[current].meaning !== 'while_condition') {
                            throw new Error('Expected WHILE after HUNT');
                        }
                        current++; // Move past WHILE
                        
                        const condition = this.parseExpression(tokens, current);
                        if (!condition || !condition.value) {
                            throw new Error('Expected condition after HUNT WHILE');
                        }
                        current = condition.next;
                        
                        const block = this.parseBlock(tokens, current);
                        if (!block) {
                            throw new Error('Expected code block after HUNT WHILE condition');
                        }
                        statements.push({
                            type: 'WhileLoop',
                            condition: condition.value,
                            body: block.statements
                        });
                        current = block.next;
                        break;
                    }
    
                    case 'for': {
                        current++; // Move past CHASE
                        const count = this.parseExpression(tokens, current);
                        if (!count || !count.value) {
                            throw new Error('Expected number after CHASE');
                        }
                        current = count.next;
                        
                        if (!tokens[current] || tokens[current].meaning !== 'times') {
                            throw new Error('Expected TIMES after CHASE number');
                        }
                        current++; // Move past TIMES
                        
                        const block = this.parseBlock(tokens, current);
                        if (!block) {
                            throw new Error('Expected code block after CHASE number TIMES');
                        }
                        statements.push({
                            type: 'ForLoop',
                            count: count.value,
                            body: block.statements
                        });
                        current = block.next;
                        break;
                    }
    
                    default:
                        throw new Error(`Unknown keyword: ${tokens[current].value}`);
                }
            } else {
                // Handle non-keyword tokens if needed
                const expression = this.parseExpression(tokens, current);
                if (expression) {
                    statements.push(expression.value);
                    current = expression.next;
                } else {
                    current++;
                }
            }
        }
    
        // Check for closing brace
        if (!tokens[current] || tokens[current].value !== '}') {
            throw new Error('Expected } at end of block');
        }
        current++;
    
        return { statements, next: current };
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