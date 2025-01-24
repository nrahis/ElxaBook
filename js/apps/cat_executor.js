class CATExecutor {
    constructor(magicInterpreter) {
        this.magicInterpreter = magicInterpreter;
        this.variables = new Map();
        this.output = [];
        this.OPERATORS = ['+', '-', '*', '/', '=', '>', '<', '>=', '<=', '==', '!='];
        
        // Track whether magic words have been processed for a given string
        this.processedMagicStrings = new Set();
    }

    execute(ast) {
        this.output = [];
        this.processedMagicStrings.clear(); // Reset processed strings for new execution
        
        for (const node of ast.body) {
            this.executeNode(node);
        }
        return this.output;
    }

    executeNode(node) {
        switch (node.type) {
            case 'PrintStatement': {
                const value = this.evaluateExpression(node.value);
                this.output.push(`${value}`);
                
                // Check for magic words in the original string literals
                if (node.value.type === 'STRING' && !this.processedMagicStrings.has(node.value.value)) {
                    const magicOutput = this.processMagicWords(node.value.value);
                    this.processedMagicStrings.add(node.value.value);
                    if (magicOutput.length > 0) {
                        this.output.push(...magicOutput);
                    }
                }
                break;
            }

            case 'VariableDeclaration': {
                const value = this.evaluateExpression(node.value);
                this.variables.set(node.name.value, value);
                
                // Check for magic words in string values only when initially declared
                if (node.value.type === 'STRING' && !this.processedMagicStrings.has(node.value.value)) {
                    const magicOutput = this.processMagicWords(node.value.value);
                    this.processedMagicStrings.add(node.value.value);
                    if (magicOutput.length > 0) {
                        this.output.push(...magicOutput);
                    }
                }
                break;
            }

            case 'IncrementStatement': {
                const varName = node.variable.value;
                const currentValue = this.getVariableValue(varName);
                if (typeof currentValue !== 'number') {
                    throw new Error(`Cannot increment non-numeric value: ${varName}`);
                }
                this.variables.set(varName, currentValue + 1);
                break;
            }

            case 'DecrementStatement': {
                const varName = node.variable.value;
                const currentValue = this.getVariableValue(varName);
                if (typeof currentValue !== 'number') {
                    throw new Error(`Cannot decrement non-numeric value: ${varName}`);
                }
                this.variables.set(varName, currentValue - 1);
                break;
            }

            case 'WhileLoop': {
                while (this.evaluateExpression(node.condition)) {
                    for (const statement of node.body) {
                        this.executeNode(statement);
                    }
                }
                break;
            }

            case 'ForLoop': {
                const count = this.evaluateExpression(node.count);
                for (let i = 0; i < count; i++) {
                    for (const statement of node.body) {
                        this.executeNode(statement);
                    }
                }
                break;
            }

            case 'IfStatement': {
                if (this.evaluateExpression(node.condition)) {
                    for (const statement of node.consequent) {
                        this.executeNode(statement);
                    }
                } else if (node.alternate) {
                    for (const statement of node.alternate) {
                        this.executeNode(statement);
                    }
                }
                break;
            }

            case 'FunctionCall': {
                const result = this.evaluateFunction(node.name, node.arguments);
                return result;
            }
        }
    }

    evaluateExpression(expr) {
        if (!expr) return null;

        switch (expr.type) {
            case 'STRING':
                return expr.value;
                
            case 'NUMBER':
                return Number(expr.value);
                
            case 'IDENTIFIER': {
                const value = this.getVariableValue(expr.value);
                return !isNaN(value) && typeof value === 'string' ? 
                       Number(value) : value;
            }
                
            case 'OPERATOR': {
                const left = this.evaluateExpression(expr.left);
                const right = this.evaluateExpression(expr.right);
                
                switch (expr.value) {
                    case '+':
                        // Handle string concatenation and numeric addition
                        if (typeof left === 'string' || typeof right === 'string') {
                            return `${left}${right}`;
                        }
                        return Number(left) + Number(right);
                    case '-':
                        return Number(left) - Number(right);
                    case '*':
                        return Number(left) * Number(right);
                    case '/':
                        return Number(left) / Number(right);
                    case '>':
                        return Number(left) > Number(right);
                    case '<':
                        return Number(left) < Number(right);
                    case '>=':
                        return Number(left) >= Number(right);
                    case '<=':
                        return Number(left) <= Number(right);
                    case '==':
                        return left == right;
                    case '!=':
                        return left != right;
                    case '=':
                        return right;
                }
                break;
            }
                
            case 'FunctionCall':
                return this.evaluateFunction(expr.name, expr.arguments);
        }
        
        return null;
    }

    evaluateFunction(name, args) {
        const evaluatedArgs = args.map(arg => this.evaluateExpression(arg));
        
        const functions = {
            'ROUND': (x) => Math.round(Number(x)),
            'RANDOM': () => Math.random(),
            'UPPERCASE': (str) => String(str).toUpperCase(),
            'LOWERCASE': (str) => String(str).toLowerCase(),
            'LENGTH': (str) => String(str).length,
            'FLOOR': (x) => Math.floor(Number(x)),
            'CEIL': (x) => Math.ceil(Number(x)),
            'ABS': (x) => Math.abs(Number(x)),
            'MIN': (...args) => Math.min(...args.map(Number)),
            'MAX': (...args) => Math.max(...args.map(Number)),
            'SQRT': (x) => Math.sqrt(Number(x)),
            'POW': (base, exp) => Math.pow(Number(base), Number(exp)),
            'SUBSTRING': (str, start, end) => String(str).substring(Number(start), end ? Number(end) : undefined)
        };

        const func = functions[name];
        if (!func) {
            throw new Error(`Unknown function: ${name}`);
        }

        return func(...evaluatedArgs);
    }

    processMagicWords(str) {
        if (!str || typeof str !== 'string' || !this.magicInterpreter) {
            return [];
        }

        // Check if the string contains any magic words
        const hasMagicWords = Object.values(this.magicInterpreter.magicWords)
            .some(words => words.some(word => str.includes(word)));

        if (hasMagicWords) {
            return this.magicInterpreter.interpretMagicCode(str);
        }

        return [];
    }

    getVariableValue(name) {
        if (!this.variables.has(name)) {
            this.variables.set(name, 0);
            return 0;
        }
        return this.variables.get(name);
    }
}

export { CATExecutor };