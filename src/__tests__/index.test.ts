/**
 * Tests for CodeContextPro-MES main module
 * Security-first testing approach
 */

import { version, main } from '../index';

describe('CodeContextPro-MES Core', () => {
  describe('version', () => {
    it('should export version string', () => {
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning
    });

    it('should match package.json version', () => {
      // Security: Ensure version consistency
      expect(version).toBe('1.0.0');
    });
  });

  describe('main function', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should be defined and callable', () => {
      expect(main).toBeDefined();
      expect(typeof main).toBe('function');
    });

    it('should output brand message when called', () => {
      main();
      
      expect(consoleSpy).toHaveBeenCalledWith('🧠 CodeContextPro-MES');
      expect(consoleSpy).toHaveBeenCalledWith('Security-first AI development tool');
    });

    it('should not throw errors', () => {
      expect(() => main()).not.toThrow();
    });
  });

  describe('security compliance', () => {
    it('should not expose sensitive information', () => {
      // Security test: Ensure no secrets in exports
      const moduleExports = Object.keys(require('../index'));
      const sensitiveTerms = ['password', 'secret', 'key', 'token', 'api'];
      
      moduleExports.forEach(exportName => {
        sensitiveTerms.forEach(term => {
          expect(exportName.toLowerCase()).not.toContain(term);
        });
      });
    });

    it('should have security-focused messaging', () => {
      const output: string[] = [];
      jest.spyOn(console, 'log').mockImplementation((msg) => {
        output.push(msg);
      });

      main();

      const allOutput = output.join(' ');
      expect(allOutput.toLowerCase()).toContain('security');
      
      jest.restoreAllMocks();
    });
  });
});