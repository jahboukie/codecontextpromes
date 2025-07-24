// execution-engine/src/index.ts
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main execution endpoint
app.post('/execute', async (req, res) => {
    const request: ExecutionRequest = req.body;
    const startTime = Date.now();

    try {
        console.log(`Executing ${request.language} code for request ${request.id}`);
        
        const result = await executeCode(request);
        const executionTime = Date.now() - startTime;
        
        const response: ExecutionResult = {
            success: result.success,
            output: result.output,
            errors: result.errors,
            executionTime: executionTime
        };

        res.json(response);
    } catch (error) {
        const executionTime = Date.now() - startTime;
        const response: ExecutionResult = {
            success: false,
            output: '',
            errors: [error instanceof Error ? error.message : String(error)],
            executionTime: executionTime
        };
        res.json(response);
    }
});

async function executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `codecontext_${request.id}_${Date.now()}`);
    
    try {
        let command: string;
        let fileName: string;

        switch (request.language) {
            case 'javascript':
                fileName = `${tempFile}.js`;
                await fs.promises.writeFile(fileName, request.code);
                command = `node "${fileName}"`;
                break;
            
            case 'typescript':
                fileName = `${tempFile}.ts`;
                await fs.promises.writeFile(fileName, request.code);
                command = `npx ts-node "${fileName}"`;
                break;
            
            case 'python':
                fileName = `${tempFile}.py`;
                await fs.promises.writeFile(fileName, request.code);
                command = `python "${fileName}"`;
                break;
            
            default:
                throw new Error(`Unsupported language: ${request.language}`);
        }

        const { stdout, stderr } = await execAsync(command, {
            timeout: request.timeout || 5000,
            cwd: tempDir
        });

        // Clean up temp file
        try {
            await fs.promises.unlink(fileName);
        } catch (e) {
            // Ignore cleanup errors
        }

        return {
            success: true,
            output: stdout,
            errors: stderr ? [stderr] : [],
            executionTime: 0 // Will be set by caller
        };

    } catch (error: any) {
        // Clean up temp file on error
        try {
            const fileName = `${tempFile}.${getFileExtension(request.language)}`;
            await fs.promises.unlink(fileName);
        } catch (e) {
            // Ignore cleanup errors
        }

        return {
            success: false,
            output: '',
            errors: [error.message || String(error)],
            executionTime: 0 // Will be set by caller
        };
    }
}

function getFileExtension(language: string): string {
    switch (language) {
        case 'javascript': return 'js';
        case 'typescript': return 'ts';
        case 'python': return 'py';
        case 'go': return 'go';
        case 'rust': return 'rs';
        default: return 'txt';
    }
}

app.listen(PORT, () => {
    console.log(`CodeContext Execution Engine running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Execute endpoint: http://localhost:${PORT}/execute`);
});
