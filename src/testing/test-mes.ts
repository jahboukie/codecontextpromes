// src/testing/test-mes.ts
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

// Assume the execution engine is running as a local server for this script
// In a real setup, you might instantiate it directly or connect via HTTP.
const MES_ENDPOINT = 'http://localhost:3001/execute'; // Adjust if needed

interface ExecutionRequest {
    id: string;
    language: 'javascript' | 'typescript' | 'python' | 'go' | 'rust';
    code: string;
    timeout: number;
}

interface ExecutionResult {
    success: boolean;
    output: string;
    errors: string[];
    executionTime: number;
}

interface MESExecResult {
    success: boolean;
    output: string;
    errors: string[];
    executionTime: number;
    confidenceScore: number; // Custom field for AI confidence
}

// Function to execute code via the MES service
async function executeCodeViaMES(request: ExecutionRequest): Promise<MESExecResult> {
    try {
        console.log(chalk.blue(`Sending code to MES for execution: ${request.id || 'N/A'}`));
        const response = await fetch(MES_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Potentially add API key if MES endpoint is protected
                // 'Authorization': `Bearer YOUR_MES_API_KEY`
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MES execution failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as ExecutionResult;

        // Simulate confidence score based on success and performance (placeholder logic)
        let confidence = 0;
        if (result.success) {
            confidence = 90; // Base for success
            if (result.executionTime < 3) confidence = 100; // Super fast
            else if (result.executionTime < 100) confidence = 95; // Fast
        } else {
            confidence = 30; // Base for failure
            if (result.errors.some(e => e.includes('SyntaxError'))) confidence = 10; // Low for syntax
        }

        console.log(chalk.green(`MES returned result for ${request.id}: Success=${result.success}, Time=${result.executionTime}ms, Confidence=${confidence}%`));

        return {
            success: result.success,
            output: result.output,
            errors: result.errors,
            executionTime: result.executionTime,
            confidenceScore: confidence,
        };

    } catch (error) {
        console.error(chalk.red('Failed to communicate with MES:', error));
        return {
            success: false,
            output: '',
            errors: [error instanceof Error ? error.message : String(error)],
            executionTime: 0,
            confidenceScore: 0,
        };
    }
}

// Function to run a specific test case from the sandbox-tests directory
export async function runMESUnitTest(
    testFileName: string,
    language: 'javascript' | 'typescript' | 'python' | 'go' | 'rust',
    expectedConfidence: number = 85,
    requiredPass: boolean = true
): Promise<MESExecResult> {
    const testFilePath = path.resolve(__dirname, `../../execution-engine/src/sandbox-tests/${testFileName}`); // Adjust path
    const code = await fs.readFile(testFilePath, 'utf8');
    const testId = `mes-test-${testFileName.replace(/\.ts$/, '')}-${Date.now()}`;

    console.log(chalk.yellow(`\nRunning MES Unit Test: ${testFileName}`));

    const request: ExecutionRequest = {
        id: testId,
        language: language,
        code: code,
        timeout: 5000, // 5 seconds
    };

    const result = await executeCodeViaMES(request);

    if (requiredPass && !result.success) {
        throw new Error(chalk.red(`MES Unit Test ${testFileName} FAILED: Code execution failed. Errors: ${result.errors.join('\n')}`));
    }
    if (result.confidenceScore < expectedConfidence) {
        throw new Error(chalk.red(`MES Unit Test ${testFileName} FAILED: Confidence (${result.confidenceScore}%) below expected (${expectedConfidence}%)`));
    }

    console.log(chalk.green(`MES Unit Test ${testFileName} PASSED with confidence ${result.confidenceScore}% (Time: ${result.executionTime}ms)`));
    return result;
}

// Function to execute arbitrary code for AI-driven iteration
export async function executeAIGeneratedCode(
    code: string,
    language: 'javascript' | 'typescript' | 'python' | 'go' | 'rust',
    expectedConfidence: number = 85
): Promise<MESExecResult> {
    const testId = `ai-generated-${Date.now()}`;
    
    console.log(chalk.yellow(`\nExecuting AI-generated code for validation`));

    const request: ExecutionRequest = {
        id: testId,
        language: language,
        code: code,
        timeout: 5000,
    };

    const result = await executeCodeViaMES(request);
    
    console.log(chalk.blue(`AI Code Execution Result: Success=${result.success}, Confidence=${result.confidenceScore}%`));
    
    return result;
}
