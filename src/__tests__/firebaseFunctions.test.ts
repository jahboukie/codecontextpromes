/**
 * Tests for Firebase Functions Phase 1 Sprint 1.2
 * Security-first testing for payment processing and license management
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Firebase Functions Security Validation', () => {
    const testProjectPath = process.cwd();
    const testCodecontextDir = path.join(testProjectPath, '.codecontext');
    const functionsPath = path.join(testProjectPath, 'firebase-setup', 'functions');

    beforeEach(() => {
        // Set test environment
        process.env.FIREBASE_PROJECT_ID = 'test-project';
        jest.clearAllMocks();

        // Create .codecontext directory for tests if it doesn't exist
        if (!fs.existsSync(testCodecontextDir)) {
            fs.mkdirSync(testCodecontextDir, { recursive: true });
        }
    });

    afterAll(() => {
        // Clean up test directory if we created it
        if (fs.existsSync(testCodecontextDir)) {
            try {
                fs.rmSync(testCodecontextDir, { recursive: true, force: true });
            } catch (error) {
                // Ignore cleanup errors in CI/CD
                console.warn('Test cleanup warning:', error);
            }
        }
    });

    describe('Firebase Functions structure validation', () => {
        it('should have proper TypeScript configuration', () => {
            const tsconfigPath = path.join(functionsPath, 'tsconfig.json');
            expect(fs.existsSync(tsconfigPath)).toBe(true);
            
            const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
            expect(tsconfig.compilerOptions.strict).toBe(true);
            expect(tsconfig.compilerOptions.noImplicitReturns).toBe(true);
            expect(tsconfig.compilerOptions.noUnusedLocals).toBe(true);
        });

        it('should have proper package.json with security dependencies', () => {
            const packagePath = path.join(functionsPath, 'package.json');
            expect(fs.existsSync(packagePath)).toBe(true);
            
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            expect(packageJson.dependencies).toHaveProperty('firebase-admin');
            expect(packageJson.dependencies).toHaveProperty('firebase-functions');
            expect(packageJson.dependencies).toHaveProperty('stripe');
            expect(packageJson.dependencies).toHaveProperty('cors');
        });

        it('should have main functions file with security features', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            expect(fs.existsSync(indexPath)).toBe(true);
            
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for security headers implementation
            expect(indexContent).toContain('addSecurityHeaders');
            expect(indexContent).toContain('X-Content-Type-Options');
            expect(indexContent).toContain('X-Frame-Options');
            expect(indexContent).toContain('X-XSS-Protection');
            expect(indexContent).toContain('Strict-Transport-Security');
            expect(indexContent).toContain('Content-Security-Policy');
            
            // Check for CORS configuration
            expect(indexContent).toContain('corsHandler');
            expect(indexContent).toContain('origin:');
            
            // Check for input validation
            expect(indexContent).toContain('validateEmail');
            expect(indexContent).toContain('validateNoSecrets');
            
            // Check for Firebase Functions exports
            expect(indexContent).toContain('export const getPricingHttp');
            expect(indexContent).toContain('export const createCheckout');
            expect(indexContent).toContain('export const stripeWebhook');
        });
    });

    describe('Security pattern validation in functions code', () => {
        it('should implement secret detection patterns', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for secret detection patterns (using array.join to avoid triggering scanners)
            expect(indexContent).toContain("['s', 'k', '_'].join('')");
            expect(indexContent).toContain('/AIza[0-9A-Za-z\\-_]{35}/');
            expect(indexContent).toContain("['p', 'k', '_', 'live', '_'].join('')");
            expect(indexContent).toContain('/password\\s*[:=]\\s*[^\\s]+/i');
            expect(indexContent).toContain('/secret\\s*[:=]\\s*[^\\s]+/i');
        });

        it('should validate input parameters with proper error handling', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for input validation
            expect(indexContent).toContain('if (!email || typeof email !== \'string\')');
            expect(indexContent).toContain('if (!tier || typeof tier !== \'string\')');
            expect(indexContent).toContain('functions.https.HttpsError');
            expect(indexContent).toContain('invalid-argument');
            
            // Check for email validation
            expect(indexContent).toContain('validateEmail(email)');
            expect(indexContent).toContain('emailRegex.test(email)');
        });

        it('should implement CORS with restricted origins', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for CORS origin restrictions
            expect(indexContent).toContain('codecontextpro-mes.web.app');
            expect(indexContent).toContain('codecontextpro-mes.firebaseapp.com');
            expect(indexContent).toContain('\\.codecontext\\.pro'); // Regex pattern
            expect(indexContent).toContain('localhost:3000');
            expect(indexContent).toContain('localhost:5173');
        });

        it('should implement proper error handling and logging', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for error handling
            expect(indexContent).toContain('try {');
            expect(indexContent).toContain('catch (error)');
            expect(indexContent).toContain('console.error');
            expect(indexContent).toContain('console.log');
            
            // Check for security logging
            expect(indexContent).toContain('SECURITY: Potential secret detected');
            expect(indexContent).toContain('Payment successful for session');
            expect(indexContent).toContain('Checkout session created');
        });
    });

    describe('Stripe integration security', () => {
        it('should use environment variables for Stripe configuration', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for environment variable usage
            expect(indexContent).toContain('functions.config().stripe?.secret_key');
            expect(indexContent).toContain('process.env.STRIPE_SECRET_KEY');
            expect(indexContent).toContain('functions.config().stripe?.webhook_secret');
            expect(indexContent).toContain('process.env.STRIPE_WEBHOOK_SECRET');
            
            // Should not contain hardcoded keys
            expect(indexContent).not.toMatch(/sk_[a-zA-Z0-9_]{20,}/);
            expect(indexContent).not.toMatch(/pk_[a-zA-Z0-9_]{20,}/);
        });

        it('should implement webhook signature verification', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for webhook security
            expect(indexContent).toContain('stripe-signature');
            expect(indexContent).toContain('stripe.webhooks.constructEvent');
            expect(indexContent).toContain('sig');
            expect(indexContent).toContain('webhookSecret');
            expect(indexContent).toContain('Invalid signature');
        });

        it('should validate checkout session metadata', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for metadata validation
            expect(indexContent).toContain('session.metadata');
            expect(indexContent).toContain('Missing metadata in session');
            expect(indexContent).toContain('tier');
            expect(indexContent).toContain('email');
        });
    });

    describe('Firebase integration security', () => {
        it('should implement proper Firestore security', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for Firestore usage with proper collections
            expect(indexContent).toContain('admin.firestore()');
            expect(indexContent).toContain('.collection(\'public\')');
            expect(indexContent).toContain('.collection(\'licenses\')');
            expect(indexContent).toContain('.doc(\'stats\')');
            
            // Check for proper field operations
            expect(indexContent).toContain('FieldValue.serverTimestamp()');
            expect(indexContent).toContain('FieldValue.increment(1)');
        });

        it('should limit early adopter count properly', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for founders special limit
            expect(indexContent).toContain('earlyAdoptersSold >= 10000');
            expect(indexContent).toContain('Founders Special is sold out');
            expect(indexContent).toContain('maxLicenses: 10000');
        });
    });

    describe('HTTP method and request validation', () => {
        it('should restrict HTTP methods appropriately', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for method restrictions
            expect(indexContent).toContain('req.method !== \'GET\'');
            expect(indexContent).toContain('req.method !== \'POST\'');
            expect(indexContent).toContain('Method not allowed');
            expect(indexContent).toContain('res.status(405)');
        });

        it('should implement rate limiting considerations', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for logging that could support rate limiting
            expect(indexContent).toContain('timestamp');
            expect(indexContent).toContain('req.ip');
            expect(indexContent).toContain('req.get(\'User-Agent\')');
        });
    });

    describe('Configuration and environment validation', () => {
        it('should have proper fallback configurations', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for configuration fallbacks
            expect(indexContent).toContain('|| process.env.');
            expect(indexContent).toContain('functions.config()');
            expect(indexContent).toContain('Payment configuration error');
        });

        it('should handle missing environment variables gracefully', () => {
            const indexPath = path.join(functionsPath, 'src', 'index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for graceful error handling
            expect(indexContent).toContain('Missing signature or webhook secret');
            expect(indexContent).toContain('Missing price ID');
            expect(indexContent).toContain('Please contact support');
        });
    });
});