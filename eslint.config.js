const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  {
    // Only lint TypeScript source files
    files: ['src/**/*.ts', 'firebase-setup/functions/src/**/*.ts'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'firebase-setup/functions/lib/**',
      'firebase-setup/public/**',
      '**/*.js', // Skip all JavaScript files (compiled/generated)
      '**/*.d.ts' // Skip TypeScript declaration files
    ],
    languageOptions: {
      parser: tsparser, // Use TypeScript parser
      ecmaVersion: 2022,
      sourceType: 'module', // TypeScript uses ES modules
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
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // Basic rules for TypeScript
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off', // Allow console.log in this project
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-redeclare': 'error',
      'no-unreachable': 'error'
    }
  }
];
