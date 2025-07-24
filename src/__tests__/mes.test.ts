// src/__tests__/mes.test.ts
import { runMESUnitTest, executeAIGeneratedCode } from '../testing/test-mes';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';
import chalk from 'chalk';

const exec = util.promisify(cp.exec);

let mesProcess: cp.ChildProcess | null = null;
const MES_PORT = 3001; // Ensure this matches executionEngine/src/index.ts

// Helper to check if MES is running
async function isMESRunning(): Promise<boolean> {
    try {
        const response = await fetch(`http://localhost:${MES_PORT}/health`);
        return response.ok;
    } catch (e) {
        return false;
    }
}

// Start MES before all tests
beforeAll(async () => {
    console.log(chalk.cyan(`\nStarting CodeContext MES on port ${MES_PORT}...`));
    // Check if MES is already running
    if (await isMESRunning()) {
        console.log(chalk.yellow('MES already running. Skipping start.'));
        return;
    }

    // Use child_process.spawn to keep MES running in background
    mesProcess = cp.spawn('npm', ['run', 'start:mes'], {
        cwd: path.resolve(__dirname, '../../'), // Adjust to your monorepo root if start:mes is there
        stdio: 'inherit', // Pipe child process output to parent
        shell: true,
        env: { ...process.env, PORT: MES_PORT.toString() } // Ensure MES picks up the port
    });

    // Wait for MES to be ready
    let attempts = 0;
    const maxAttempts = 20;
    while (attempts < maxAttempts) {
        if (await isMESRunning()) {
            console.log(chalk.green('CodeContext MES is ready!'));
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }
    throw new Error(chalk.red('Failed to start CodeContext MES after multiple attempts.'));
}, 60000); // 60 seconds timeout for MES startup

// Stop MES after all tests if we started it
afterAll(async () => {
    if (mesProcess) {
        console.log(chalk.cyan('\nStopping CodeContext MES...'));
        mesProcess.kill('SIGTERM'); // Send termination signal
        // Give it a moment to shut down
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(chalk.green('CodeContext MES stopped.'));
    }
});

describe('CodeContext MES Integration Tests', () => {

    it('should execute a simple JavaScript code block successfully with high confidence', async () => {
        const testCode = 'console.log("Hello from MES!");\n// This should pass with high confidence.';
        const result = await executeAIGeneratedCode(testCode, 'javascript', 90);
        expect(result.output).toContain('Hello from MES!');
        expect(result.confidenceScore).toBeGreaterThanOrEqual(90);
    }, 15000); // Test timeout

    it('should handle syntax errors gracefully with low confidence', async () => {
        const testCode = 'const x = 10;\nconsole.log(x; // Missing parenthesis';
        const result = await executeAIGeneratedCode(testCode, 'javascript', 10);
        expect(result.success).toBe(false);
        expect(result.errors.join('\n')).toContain('SyntaxError');
        expect(result.confidenceScore).toBeLessThan(85); // Must be below passing confidence
    }, 15000);

    it('should execute TypeScript code with high confidence', async () => {
        const testCode = `
interface TestInterface {
    message: string;
}

const testObj: TestInterface = { message: "TypeScript test successful" };
console.log(testObj.message);
        `;
        const result = await executeAIGeneratedCode(testCode, 'typescript', 85);
        expect(result.success).toBe(true);
        expect(result.output).toContain('TypeScript test successful');
        expect(result.confidenceScore).toBeGreaterThanOrEqual(85);
    }, 20000);

    it('should meet CI/CD performance requirements (sub-3ms for simple operations)', async () => {
        const testCode = 'const result = 2 + 2; console.log(result);';
        const result = await executeAIGeneratedCode(testCode, 'javascript', 100);
        expect(result.success).toBe(true);
        expect(result.executionTime).toBeLessThan(3); // CI/CD requirement
        expect(result.confidenceScore).toBe(100); // CI/CD requirement
    }, 10000);

    // Add more tests for Python, Go, Rust, and various scenarios (dependencies, edge cases, etc.)
});
