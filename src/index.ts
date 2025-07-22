/**
 * CodeContextPro-MES - AI Cognitive Upgrade
 * Main CLI implementation with remember/recall commands
 * 
 * Security-first implementation following Phase 1 Sprint 1.1 specification
 */

import { Command } from 'commander';
import { MemoryEngine } from './MemoryEngine';
import { FirebaseService } from './FirebaseService';
import { LicenseService } from './LicenseService';

export const version = "1.0.0";

export class CodeContextCLI {
    private memoryEngine: MemoryEngine;
    private firebaseService: FirebaseService;
    private licenseService: LicenseService;
    private program: Command;

    constructor(projectPath: string = process.cwd()) {
        this.memoryEngine = new MemoryEngine(projectPath);
        this.firebaseService = new FirebaseService();
        this.licenseService = new LicenseService(projectPath);
        this.program = new Command();
        
        this.setupCommands();
    }

    /**
     * Setup CLI commands with security validation
     */
    private setupCommands(): void {
        this.program
            .name('codecontext')
            .description('🧠 CodeContextPro-MES - AI Cognitive Upgrade')
            .version(version);

        // codecontext remember command
        this.program
            .command('remember')
            .description('Store memory in persistent context')
            .argument('<content>', 'Content to remember')
            .option('-c, --context <context>', 'Context for the memory', 'cli-command')
            .option('-t, --type <type>', 'Type of memory', 'general')
            .action(async (content: string, options) => {
                await this.handleRemember(content, options);
            });

        // codecontext recall command
        this.program
            .command('recall')
            .description('Search and retrieve memories')
            .argument('<query>', 'Search query')
            .option('-l, --limit <number>', 'Maximum number of results', '10')
            .action(async (query: string, options) => {
                await this.handleRecall(query, options);
            });

        // codecontext status command (enhanced)
        this.program
            .command('status')
            .description('Show CodeContext Pro status and license info')
            .action(async () => {
                await this.handleStatus();
            });

        // codecontext purchase command (Phase 1 Sprint 1.2)
        this.program
            .command('purchase')
            .description('Purchase CodeContext Pro license')
            .option('-t, --tier <tier>', 'License tier (free, founders, pro)', 'founders')
            .option('--email <email>', 'Email for checkout')
            .action(async (options) => {
                await this.handlePurchase(options);
            });
    }

    /**
     * Handle remember command with security validation
     * Implements Phase 1 Sprint 1.1 specification
     */
    private async handleRemember(content: string, options: any): Promise<void> {
        try {
            console.log('🧠 CodeContext Pro - Remember');
            
            // License validation
            if (!this.licenseService.canPerformOperation('remember')) {
                console.error('❌ License does not allow remember operation');
                process.exit(1);
            }

            // Store memory with validation
            const memoryId = this.memoryEngine.storeMemory(
                content,
                options.context,
                options.type
            );

            // Report usage (fire-and-forget)
            await this.firebaseService.reportUsage('remember', {
                contentLength: content.length,
                context: options.context,
                type: options.type,
                memoryId
            });

            console.log(`✅ Memory stored successfully`);
            console.log(`   ID: ${memoryId}`);
            console.log(`   Context: ${options.context}`);
            console.log(`   Type: ${options.type}`);

        } catch (error) {
            console.error('❌ Failed to store memory:');
            console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    }

    /**
     * Handle recall command with security validation
     * Implements Phase 1 Sprint 1.1 specification
     */
    private async handleRecall(query: string, options: any): Promise<void> {
        try {
            console.log('🔍 CodeContext Pro - Recall');
            
            // License validation
            if (!this.licenseService.canPerformOperation('recall')) {
                console.error('❌ License does not allow recall operation');
                process.exit(1);
            }

            // Parse and validate limit
            const limit = parseInt(options.limit);
            if (isNaN(limit) || limit < 1 || limit > 100) {
                console.error('❌ Invalid limit: must be a number between 1 and 100');
                process.exit(1);
            }

            // Search memories
            const memories = await this.memoryEngine.searchMemories(query, limit);

            // Report usage (fire-and-forget)
            await this.firebaseService.reportUsage('recall', {
                query: query.substring(0, 100), // Privacy: only first 100 chars
                resultCount: memories.length,
                limit
            });

            console.log(`✅ Found ${memories.length} memories for: "${query}"`);
            
            if (memories.length === 0) {
                console.log('   No memories found. Try a different search term.');
                return;
            }

            console.log('\n📋 Results:');
            memories.forEach((memory, index) => {
                console.log(`\n${index + 1}. Memory ID: ${memory.id}`);
                console.log(`   Date: ${new Date(memory.timestamp).toLocaleDateString()}`);
                console.log(`   Relevance: ${(memory.relevance * 100).toFixed(1)}%`);
                console.log(`   Content: ${memory.content.substring(0, 200)}${memory.content.length > 200 ? '...' : ''}`);
            });

        } catch (error) {
            console.error('❌ Failed to recall memories:');
            console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    }

    /**
     * Handle status command with license information
     */
    private async handleStatus(): Promise<void> {
        try {
            console.log('📊 CodeContext Pro Status\n');

            // Project info
            const projectInfo = this.memoryEngine.getProjectInfo();
            console.log('📁 Project Information:');
            console.log(`   Path: ${projectInfo.path}`);
            console.log(`   Database: ${projectInfo.dbPath}`);

            // License status
            const licenseStatus = this.licenseService.getLicenseStatus();
            console.log('\n🎫 License Status:');
            console.log(`   Tier: ${licenseStatus.tier.toUpperCase()}`);
            console.log(`   Active: ${licenseStatus.active ? '✅' : '❌'}`);
            console.log(`   Features: ${licenseStatus.features.join(', ')}`);
            if (licenseStatus.mock) {
                console.log('   Mode: Development (Phase 1)');
            }

            // Firebase status
            const firebaseConfig = this.firebaseService.getConfig();
            console.log('\n🔥 Firebase Configuration:');
            console.log(`   Project ID: ${firebaseConfig.projectId}`);
            console.log(`   Configured: ${firebaseConfig.configured ? '✅' : '⚠️ Mock mode'}`);

            // Test Firebase connection
            const connectionOk = await this.firebaseService.testConnection();
            console.log(`   Connection: ${connectionOk ? '✅' : '❌'}`);

            console.log('\n🚀 System ready for Phase 1 development!');

        } catch (error) {
            console.error('❌ Failed to get status:');
            console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    }

    /**
     * Handle purchase command 
     * Phase 1 Sprint 1.2: Secure license purchasing
     */
    private async handlePurchase(options: any): Promise<void> {
        try {
            console.log('💳 CodeContext Pro - Purchase License');
            
            // Set email if provided
            if (options.email) {
                process.env.CODECONTEXT_USER_EMAIL = options.email;
                console.log(`   Email set to: ${options.email}`);
            }

            // Validate tier - REMOVED FREE TIER per business decision
            const tier = options.tier?.toLowerCase() || 'founders';
            const validTiers = ['founders', 'pro'];
            
            if (!validTiers.includes(tier)) {
                console.error(`❌ Invalid tier: ${tier}`);
                console.error(`   Valid options: ${validTiers.join(', ')}`);
                process.exit(1);
            }

            console.log(`   Tier: ${tier}`);
            
            // Attempt purchase
            const result = await this.licenseService.purchaseLicense(tier);
            
            if (result.success) {
                console.log(`✅ ${result.message}`);
                
                if (result.checkoutUrl) {
                    console.log(`\n🌐 Checkout URL: ${result.checkoutUrl}`);
                    console.log('   Open this URL in your browser to complete payment');
                }
                
                if (result.nextStep) {
                    console.log(`\n📋 Next step: ${result.nextStep}`);
                }
                
                // Report successful purchase initiation
                await this.firebaseService.reportUsage('license_purchase_success', {
                    tier: result.tier,
                    hasCheckout: !!result.checkoutUrl
                });
                
            } else {
                console.error(`❌ Purchase failed: ${result.message}`);
                
                if (result.nextStep) {
                    console.error(`   Next step: ${result.nextStep}`);
                }
                
                // Report failed purchase attempt
                await this.firebaseService.reportUsage('license_purchase_failure', {
                    tier: result.tier,
                    error: result.message
                });
                
                process.exit(1);
            }

        } catch (error) {
            console.error('❌ Failed to process purchase:');
            console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            // Report purchase error
            await this.firebaseService.reportUsage('license_purchase_error', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            process.exit(1);
        }
    }

    /**
     * Run the CLI application
     */
    run(argv?: string[]): void {
        this.program.parse(argv);
    }
}

/**
 * Main entry point
 */
export function main(argv?: string[]): void {
    try {
        const cli = new CodeContextCLI();
        cli.run(argv);
    } catch (error) {
        console.error('❌ Failed to initialize CodeContext Pro:');
        console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

// Export for testing
export default { version, main, CodeContextCLI };