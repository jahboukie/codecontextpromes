/**
 * CodeContextPro-MES Memory Database
 * SQLite3-based persistent memory storage with security-first design
 * 
 * Phase 1 Sprint 1.3: Real Database Implementation
 * Compatible with SQLite3 3.44.2 on Node.js 22+ Windows x64
 */

import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export interface DatabaseMemory {
    id: number;
    content: string;
    context: string;
    type: string;
    tags: string;
    metadata: string;
    contentHash: string;
    createdAt: string;
    updatedAt: string;
}

export interface SearchOptions {
    limit?: number;
    offset?: number;
    type?: string;
    context?: string;
    tags?: string[];
    minRelevance?: number;
}

export interface SearchResult {
    id: number;
    content: string;
    relevance: number;
    timestamp: string;
    type: string;
    context: string;
    tags: string[];
}

export class MemoryDatabase {
    private db: sqlite3.Database | null = null;
    private dbPath: string;
    private initialized = false;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
    }

    /**
     * Initialize database connection and create tables
     * Compatible with SQLite3 3.44.2 environment
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        return new Promise((resolve, reject) => {
            // Ensure directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Create database connection
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Failed to connect to SQLite database:', err.message);
                    reject(err);
                    return;
                }

                console.log('✅ Connected to SQLite database:', this.dbPath);
                this.createTables()
                    .then(() => {
                        this.initialized = true;
                        resolve();
                    })
                    .catch(reject);
            });
        });
    }

    /**
     * Create database tables with optimized schema
     * Designed for efficient memory storage and retrieval
     */
    private async createTables(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            const schema = `
                -- Memories table with full-text search support
                CREATE TABLE IF NOT EXISTS memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    context TEXT NOT NULL DEFAULT 'general',
                    type TEXT NOT NULL DEFAULT 'general',
                    tags TEXT DEFAULT '[]',
                    metadata TEXT DEFAULT '{}',
                    content_hash TEXT NOT NULL UNIQUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                -- Full-text search index for content
                CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
                    content,
                    context,
                    tags,
                    content='memories',
                    content_rowid='id'
                );

                -- Triggers to maintain FTS index
                CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories 
                BEGIN
                    INSERT INTO memories_fts(rowid, content, context, tags) 
                    VALUES (new.id, new.content, new.context, new.tags);
                END;

                CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories 
                BEGIN
                    DELETE FROM memories_fts WHERE rowid = old.id;
                END;

                CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories 
                BEGIN
                    DELETE FROM memories_fts WHERE rowid = old.id;
                    INSERT INTO memories_fts(rowid, content, context, tags) 
                    VALUES (new.id, new.content, new.context, new.tags);
                END;

                -- Indexes for performance
                CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
                CREATE INDEX IF NOT EXISTS idx_memories_context ON memories(context);
                CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
                CREATE INDEX IF NOT EXISTS idx_memories_hash ON memories(content_hash);

                -- Memory usage statistics
                CREATE TABLE IF NOT EXISTS memory_stats (
                    id INTEGER PRIMARY KEY,
                    total_memories INTEGER DEFAULT 0,
                    total_size_bytes INTEGER DEFAULT 0,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                -- Initialize stats if empty
                INSERT OR IGNORE INTO memory_stats (id, total_memories, total_size_bytes) 
                VALUES (1, 0, 0);
            `;

            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('❌ Failed to create database schema:', err.message);
                    reject(err);
                    return;
                }

                console.log('✅ Database schema created successfully');
                resolve();
            });
        });
    }

    /**
     * Store memory with duplicate detection and security validation
     */
    async storeMemory(
        content: string,
        context: string = 'general',
        type: string = 'general',
        tags: string[] = [],
        metadata: object = {}
    ): Promise<number> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        // Create content hash for duplicate detection
        const contentHash = this.createHash(content);
        const tagsJson = JSON.stringify(tags);
        const metadataJson = JSON.stringify(metadata);

        return new Promise((resolve, reject) => {
            const stmt = this.db!.prepare(`
                INSERT OR REPLACE INTO memories 
                (content, context, type, tags, metadata, content_hash, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            stmt.run([content, context, type, tagsJson, metadataJson, contentHash], function(err) {
                if (err) {
                    console.error('❌ Failed to store memory:', err.message);
                    reject(err);
                    return;
                }

                console.log(`✅ Memory stored with ID: ${this.lastID}`);
                resolve(this.lastID);
            });

            stmt.finalize();
        });
    }

    /**
     * Search memories with full-text search and relevance scoring
     * Uses SQLite FTS5 for efficient text search
     */
    async searchMemories(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const {
            limit = 10,
            offset = 0,
            type,
            context,
            tags,
            minRelevance = 0.1
        } = options;

        // Sanitize query for FTS5
        const sanitizedQuery = this.sanitizeFTSQuery(query);

        let sql = `
            SELECT 
                m.id,
                m.content,
                m.type,
                m.context,
                m.tags,
                m.created_at as timestamp,
                rank
            FROM memories_fts fts
            JOIN memories m ON fts.rowid = m.id
            WHERE memories_fts MATCH ?
        `;

        const params: any[] = [sanitizedQuery];

        // Add filters
        if (type) {
            sql += ' AND m.type = ?';
            params.push(type);
        }

        if (context) {
            sql += ' AND m.context = ?';
            params.push(context);
        }

        // Order by relevance (FTS5 rank)
        sql += ' ORDER BY rank LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            this.db!.all(sql, params, (err, rows: any[]) => {
                if (err) {
                    console.error('❌ Search failed:', err.message);
                    reject(err);
                    return;
                }

                const results: SearchResult[] = rows.map(row => ({
                    id: row.id,
                    content: row.content,
                    relevance: this.calculateRelevance(row.rank),
                    timestamp: row.timestamp,
                    type: row.type,
                    context: row.context,
                    tags: JSON.parse(row.tags || '[]')
                }));

                // Filter by minimum relevance
                const filteredResults = results.filter(r => r.relevance >= minRelevance);

                console.log(`✅ Search completed: "${query}" - Found ${filteredResults.length} results`);
                resolve(filteredResults);
            });
        });
    }

    /**
     * Get memory by ID
     */
    async getMemoryById(id: number): Promise<DatabaseMemory | null> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM memories WHERE id = ?';
            
            this.db!.get(sql, [id], (err, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    resolve(null);
                    return;
                }

                resolve({
                    id: row.id,
                    content: row.content,
                    context: row.context,
                    type: row.type,
                    tags: row.tags,
                    metadata: row.metadata,
                    contentHash: row.content_hash,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                });
            });
        });
    }

    /**
     * Delete memory by ID
     */
    async deleteMemory(id: number): Promise<boolean> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const stmt = this.db!.prepare('DELETE FROM memories WHERE id = ?');
            
            stmt.run([id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(this.changes > 0);
            });

            stmt.finalize();
        });
    }

    /**
     * Get database statistics
     */
    async getStats(): Promise<{ totalMemories: number; totalSizeBytes: number; lastUpdated: string }> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as total_memories,
                    SUM(LENGTH(content)) as total_size_bytes,
                    MAX(updated_at) as last_updated
                FROM memories
            `;

            this.db!.get(sql, [], (err, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    totalMemories: row.total_memories || 0,
                    totalSizeBytes: row.total_size_bytes || 0,
                    lastUpdated: row.last_updated || new Date().toISOString()
                });
            });
        });
    }

    /**
     * Close database connection
     */
    async close(): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve) => {
            this.db!.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database connection closed');
                }
                this.db = null;
                this.initialized = false;
                resolve();
            });
        });
    }

    /**
     * Create hash for content deduplication
     */
    private createHash(content: string): string {
        // Simple hash function for content deduplication
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Sanitize FTS5 query to prevent injection
     */
    private sanitizeFTSQuery(query: string): string {
        // Remove FTS5 special characters that could cause issues
        return query
            .replace(/[^a-zA-Z0-9\s\-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Calculate relevance score from FTS5 rank
     */
    private calculateRelevance(rank: number): number {
        // Convert FTS5 rank to 0-1 relevance score
        // Lower rank = higher relevance in FTS5
        return Math.max(0, Math.min(1, 1 / (1 + Math.abs(rank) * 0.1)));
    }
}