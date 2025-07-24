#!/usr/bin/env node

/**
 * CodeConMem CLI - Simple, reliable AI memory for developers
 * SQLite3 based, works everywhere (Claude, VS Code, etc.)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { MemoryEngine } from './MemoryEngine';
import { version } from '../package.json';

const program = new Command();

program
  .name('codeconmem')
  .description('🧠 Simple, reliable AI memory for developers')
  .version(version);

// Initialize project memory
program
  .command('init')
  .description('Initialize memory for this project')
  .action(async () => {
    try {
      const engine = new MemoryEngine();
      await engine.init();
      console.log(chalk.green('✅ Memory initialized successfully!'));
      console.log(chalk.gray(`   Database: ${engine.getDatabasePath()}`));
      console.log(chalk.gray('\n💡 Try: codeconmem remember "Your first memory"'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize memory:'));
      console.error(chalk.red(`   ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Store a memory
program
  .command('remember')
  .description('Store a memory')
  .argument('<content>', 'What to remember')
  .option('-t, --tag <tag>', 'Add a tag to this memory')
  .option('-c, --context <context>', 'Add context information')
  .action(async (content: string, options) => {
    try {
      const engine = new MemoryEngine();
      const memoryId = await engine.remember(content, {
        tag: options.tag,
        context: options.context
      });
      console.log(chalk.green('✅ Memory stored successfully!'));
      console.log(chalk.gray(`   ID: ${memoryId}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to store memory:'));
      console.error(chalk.red(`   ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Recall memories
program
  .command('recall')
  .description('Search and recall memories')
  .argument('<query>', 'What to search for')
  .option('-l, --limit <number>', 'Maximum number of results', '5')
  .action(async (query: string, options) => {
    try {
      const engine = new MemoryEngine();
      const memories = await engine.recall(query, parseInt(options.limit));
      
      if (memories.length === 0) {
        console.log(chalk.yellow('🤔 No memories found for that query'));
        console.log(chalk.gray('   Try a different search term or check your spelling'));
        return;
      }

      console.log(chalk.green(`🧠 Found ${memories.length} memories:`));
      console.log();
      
      memories.forEach((memory, index) => {
        console.log(chalk.blue(`${index + 1}. ${memory.content}`));
        if (memory.tag) {
          console.log(chalk.gray(`   Tag: ${memory.tag}`));
        }
        if (memory.context) {
          console.log(chalk.gray(`   Context: ${memory.context}`));
        }
        console.log(chalk.gray(`   Stored: ${new Date(memory.created_at).toLocaleString()}`));
        console.log();
      });
    } catch (error) {
      console.error(chalk.red('❌ Failed to recall memories:'));
      console.error(chalk.red(`   ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Show status
program
  .command('status')
  .description('Show memory status and statistics')
  .action(async () => {
    try {
      const engine = new MemoryEngine();
      const stats = await engine.getStats();
      
      console.log(chalk.blue('🧠 CodeConMem Status'));
      console.log();
      console.log(chalk.green(`📊 Total memories: ${stats.totalMemories}`));
      console.log(chalk.green(`📁 Database: ${engine.getDatabasePath()}`));
      console.log(chalk.green(`💾 Database size: ${stats.databaseSize}`));
      
      if (stats.recentMemories.length > 0) {
        console.log();
        console.log(chalk.blue('📝 Recent memories:'));
        stats.recentMemories.forEach((memory, index) => {
          const preview = memory.content.length > 50 
            ? memory.content.substring(0, 50) + '...'
            : memory.content;
          console.log(chalk.gray(`   ${index + 1}. ${preview}`));
        });
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to get status:'));
      console.error(chalk.red(`   ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Parse and execute
program.parse();
