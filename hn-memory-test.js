#!/usr/bin/env node

// CodeContext Memory-Only CLI - HN Launch Version Test
// Simplified persistent memory for AI coding assistants

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SimpleMemoryEngine {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.dbPath = path.join(projectPath, '.ai-memory', 'memory.db');
    this.db = null;
  }

  async init() {
    // Create directory
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) reject(err);
        else this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    const sql = `
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        context TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        tags TEXT
      );
      
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async remember(content, context = '', tags = []) {
    const id = uuidv4();
    const tagsStr = tags.join(',');
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO memories (id, content, context, tags) VALUES (?, ?, ?, ?)',
        [id, content, context, tagsStr],
        function(err) {
          if (err) reject(err);
          else resolve({ id, content, context, tags });
        }
      );
    });
  }

  async recall(query = '') {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM memories';
      let params = [];
      
      if (query) {
        sql += ' WHERE content LIKE ? OR context LIKE ? OR tags LIKE ?';
        params = [`%${query}%`, `%${query}%`, `%${query}%`];
      }
      
      sql += ' ORDER BY timestamp DESC LIMIT 10';
      
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async status() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM memories', (err, row) => {
        if (err) reject(err);
        else {
          const stats = fs.statSync(this.dbPath);
          resolve({
            memories: row.count,
            dbSize: Math.round(stats.size / 1024) + 'KB',
            location: this.dbPath
          });
        }
      });
    });
  }
}

// Test the memory engine
async function test() {
  console.log('🧠 Testing Simple Memory Engine for HN Launch...\n');
  
  const memory = new SimpleMemoryEngine();
  await memory.init();
  
  // Test remember
  await memory.remember(
    'User prefers React with TypeScript for frontend development',
    'project setup discussion',
    ['react', 'typescript', 'frontend']
  );
  
  await memory.remember(
    'API endpoints should use Express.js with proper error handling',
    'backend architecture decision',
    ['express', 'api', 'backend']
  );
  
  // Test recall
  console.log('📝 All memories:');
  const allMemories = await memory.recall();
  allMemories.forEach(m => {
    console.log(`- ${m.content} (${m.context})`);
  });
  
  console.log('\n🔍 Search for "React":');
  const reactMemories = await memory.recall('React');
  reactMemories.forEach(m => {
    console.log(`- ${m.content}`);
  });
  
  // Test status
  console.log('\n📊 Memory Status:');
  const status = await memory.status();
  console.log(JSON.stringify(status, null, 2));
  
  console.log('\n✅ Simple Memory Engine test complete!');
  console.log('Ready for HN launch - persistent memory without complexity');
}

// Run test if called directly
if (require.main === module) {
  test().catch(console.error);
}

module.exports = { SimpleMemoryEngine };