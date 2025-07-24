/**
 * MemoryEngine Tests
 * Simple, reliable tests for our SQLite3 memory system
 */

import { MemoryEngine } from '../MemoryEngine';
import * as fs from 'fs';
import * as path from 'path';

describe('MemoryEngine', () => {
  let engine: MemoryEngine;
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = path.join(__dirname, 'test-memory');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    engine = new MemoryEngine(testDir);
  });

  afterEach(async () => {
    // Clean up
    await engine.close();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(engine.init()).resolves.not.toThrow();
    });

    it('should create database file', async () => {
      await engine.init();
      const dbPath = engine.getDatabasePath();
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it('should return correct database path', () => {
      const dbPath = engine.getDatabasePath();
      expect(dbPath).toContain('.codeconmem');
      expect(dbPath).toContain('memory.db');
    });
  });

  describe('Memory Operations', () => {
    beforeEach(async () => {
      await engine.init();
    });

    it('should store a memory successfully', async () => {
      const memoryId = await engine.remember('Test memory content');
      expect(memoryId).toBeDefined();
      expect(memoryId).toMatch(/^mem_\d+_[a-f0-9]{8}$/);
    });

    it('should store memory with options', async () => {
      const memoryId = await engine.remember('Test memory with options', {
        tag: 'test-tag',
        context: 'test-context'
      });
      expect(memoryId).toBeDefined();
    });

    it('should recall memories by content', async () => {
      await engine.remember('This is a test memory');
      await engine.remember('Another memory about testing');
      await engine.remember('Something completely different');

      const memories = await engine.recall('test');
      expect(memories.length).toBeGreaterThan(0);
      expect(memories.some(m => m.content.includes('test'))).toBe(true);
    });

    it('should recall memories by tag', async () => {
      await engine.remember('Tagged memory', { tag: 'important' });
      await engine.remember('Another memory', { tag: 'normal' });

      const memories = await engine.recall('important');
      expect(memories.length).toBe(1);
      expect(memories[0].tag).toBe('important');
    });

    it('should limit recall results', async () => {
      // Store multiple memories
      for (let i = 0; i < 10; i++) {
        await engine.remember(`Test memory ${i}`);
      }

      const memories = await engine.recall('Test', 3);
      expect(memories.length).toBe(3);
    });

    it('should return empty array for no matches', async () => {
      await engine.remember('Some memory');
      const memories = await engine.recall('nonexistent');
      expect(memories).toEqual([]);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await engine.init();
    });

    it('should return correct stats for empty database', async () => {
      const stats = await engine.getStats();
      expect(stats.totalMemories).toBe(0);
      expect(stats.recentMemories).toEqual([]);
      expect(stats.databaseSize).toMatch(/\d+ KB/);
    });

    it('should return correct stats with memories', async () => {
      await engine.remember('First memory');
      await engine.remember('Second memory');

      const stats = await engine.getStats();
      expect(stats.totalMemories).toBe(2);
      expect(stats.recentMemories.length).toBe(2);
    });

    it('should limit recent memories to 5', async () => {
      // Store 10 memories
      for (let i = 0; i < 10; i++) {
        await engine.remember(`Memory ${i}`);
      }

      const stats = await engine.getStats();
      expect(stats.totalMemories).toBe(10);
      expect(stats.recentMemories.length).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid content gracefully', async () => {
      await engine.init();
      await expect(engine.remember('')).rejects.toThrow();
    });

    it('should handle database connection errors gracefully', async () => {
      // Try to use engine without initialization
      await expect(engine.recall('test')).rejects.toThrow();
    });
  });
});
