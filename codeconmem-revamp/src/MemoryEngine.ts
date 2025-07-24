/**
 * MemoryEngine - Simple SQLite3-based memory storage
 * Works everywhere: Claude, VS Code, local development
 */

import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as os from 'os';

export interface Memory {
  id: string;
  content: string;
  tag?: string;
  context?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryOptions {
  tag?: string;
  context?: string;
}

export interface MemoryStats {
  totalMemories: number;
  databaseSize: string;
  recentMemories: Memory[];
}

export class MemoryEngine {
  private dbPath: string;
  private db: sqlite3.Database | null = null;

  constructor(projectPath: string = process.cwd()) {
    // Create .codeconmem directory in project root
    const memoryDir = path.join(projectPath, '.codeconmem');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    this.dbPath = path.join(memoryDir, 'memory.db');
  }

  /**
   * Initialize the memory database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }

        // Create memories table if it doesn't exist
        this.db!.run(`
          CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            tag TEXT,
            context TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `, (err) => {
          if (err) {
            reject(new Error(`Failed to create table: ${err.message}`));
            return;
          }

          // Create search index for better performance
          this.db!.run(`
            CREATE INDEX IF NOT EXISTS idx_memories_content 
            ON memories(content)
          `, (err) => {
            if (err) {
              reject(new Error(`Failed to create index: ${err.message}`));
              return;
            }
            resolve();
          });
        });
      });
    });
  }

  /**
   * Store a memory
   */
  async remember(content: string, options: MemoryOptions = {}): Promise<string> {
    // Validate input
    if (!content || content.trim().length === 0) {
      throw new Error('Memory content cannot be empty');
    }

    if (!this.db) {
      await this.init();
    }

    const id = this.generateId();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db!.run(`
        INSERT INTO memories (id, content, tag, context, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, content, options.tag || null, options.context || null, now, now], (err) => {
        if (err) {
          reject(new Error(`Failed to store memory: ${err.message}`));
          return;
        }
        resolve(id);
      });
    });
  }

  /**
   * Recall memories by searching content
   */
  async recall(query: string, limit: number = 5): Promise<Memory[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      // Simple text search - can be enhanced with FTS later
      this.db!.all(`
        SELECT * FROM memories 
        WHERE content LIKE ? OR tag LIKE ? OR context LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `, [`%${query}%`, `%${query}%`, `%${query}%`, limit], (err, rows) => {
        if (err) {
          reject(new Error(`Failed to recall memories: ${err.message}`));
          return;
        }
        resolve(rows as Memory[]);
      });
    });
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<MemoryStats> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      // Get total count
      this.db!.get('SELECT COUNT(*) as count FROM memories', (err, row: any) => {
        if (err) {
          reject(new Error(`Failed to get stats: ${err.message}`));
          return;
        }

        const totalMemories = row.count;

        // Get recent memories
        this.db!.all(`
          SELECT * FROM memories 
          ORDER BY created_at DESC 
          LIMIT 5
        `, (err, rows) => {
          if (err) {
            reject(new Error(`Failed to get recent memories: ${err.message}`));
            return;
          }

          // Get database file size
          let databaseSize = '0 KB';
          try {
            const stats = fs.statSync(this.dbPath);
            const sizeInKB = Math.round(stats.size / 1024);
            databaseSize = `${sizeInKB} KB`;
          } catch (e) {
            // Ignore file size errors
          }

          resolve({
            totalMemories,
            databaseSize,
            recentMemories: rows as Memory[]
          });
        });
      });
    });
  }

  /**
   * Get database path
   */
  getDatabasePath(): string {
    return this.dbPath;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close(() => {
          this.db = null;
          resolve();
        });
      });
    }
  }

  /**
   * Generate unique ID for memories
   */
  private generateId(): string {
    return `mem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
}
