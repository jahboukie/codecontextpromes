// ESLint 9 flat config for CodeContextPro-MES
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
    {
        files: ['src/**/*.ts', 'firebase-setup/functions/src/**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module'
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                global: 'readonly',
                // Jest globals for test files
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': typescriptEslint
        },
        rules: {
            // TypeScript rules
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-inferrable-types': 'warn',

            // Security-focused general rules (built-in ESLint rules)
            'no-console': 'off', // Allow console.log for CLI tool
            'no-debugger': 'error',
            'no-alert': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-script-url': 'error',
            'no-proto': 'error',
            'no-iterator': 'error',
            'no-caller': 'error'
        }
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                global: 'readonly'
            }
        },
        rules: {
            // Security-focused general rules for JavaScript files
            'no-console': 'off',
            'no-debugger': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-script-url': 'error',
            'no-proto': 'error',
            'no-iterator': 'error',
            'no-caller': 'error'
        }
    },
    {
        ignores: [
            'dist/',
            'node_modules/',
            'firebase-setup/public/',
            'firebase-setup/functions/lib/',
            '*.d.ts',
            'tests-js/',
            '.codecontext/',
            '.firebase/',
            'coverage/'
        ]
    }
];
