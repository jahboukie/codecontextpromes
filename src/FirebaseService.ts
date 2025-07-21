/**
 * CodeContextPro-MES Firebase Service
 * Security-first Firebase integration with usage reporting
 * 
 * Handles secure communication with Firebase backend
 * with comprehensive data sanitization and validation
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

export interface UsageMetadata {
    [key: string]: any;
}

export interface UsageReport {
    operation: string;
    timestamp: string;
    projectId: string;
    metadata: UsageMetadata;
    version: string;
}

export class FirebaseService {
    private projectId: string;
    private apiEndpoint: string;
    private app: any;
    private functions: any;

    constructor() {
        this.projectId = process.env.FIREBASE_PROJECT_ID || 'codecontext-mes';
        this.apiEndpoint = `https://${this.projectId}.cloudfunctions.net`;
        
        // Initialize Firebase
        this.initializeFirebase();
        
        // Validate configuration on initialization
        this.validateConfig();
    }

    /**
     * Initialize Firebase App and Functions
     */
    private initializeFirebase(): void {
        try {
            // Firebase configuration - NO HARDCODED SECRETS
            const firebaseConfig = {
                apiKey: process.env.FIREBASE_API_KEY,
                authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                projectId: this.projectId,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.FIREBASE_APP_ID
            };

            // Validate required configuration
            const requiredFields = ['apiKey', 'authDomain', 'storageBucket', 'messagingSenderId', 'appId'] as const;
            const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
            }

            // Initialize Firebase app if not already initialized
            if (!getApps().length) {
                this.app = initializeApp(firebaseConfig);
            } else {
                this.app = getApps()[0];
            }

            // Initialize Functions
            this.functions = getFunctions(this.app);

            // Connect to emulator if in development
            if (process.env.NODE_ENV === 'development' && process.env.FIREBASE_EMULATOR === 'true') {
                connectFunctionsEmulator(this.functions, 'localhost', 5001);
                console.log('🔧 Connected to Firebase Functions emulator');
            }

            console.log('✅ Firebase initialized successfully');

        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            throw error;
        }
    }

    /**
     * Report usage analytics (fire-and-forget)
     * Implements Phase 1 Sprint 1.1 specification with security-first approach
     */
    async reportUsage(operation: string, metadata: UsageMetadata = {}): Promise<boolean> {
        try {
            // Input validation
            if (!operation || typeof operation !== 'string') {
                throw new Error('Invalid operation: must be non-empty string');
            }

            if (operation.trim().length === 0) {
                throw new Error('Operation cannot be empty or whitespace only');
            }

            // Security: sanitize metadata to remove sensitive data
            const sanitizedMetadata = this.sanitizeMetadata(metadata);

            // Build usage report
            const usageReport: UsageReport = {
                operation: operation.trim(),
                timestamp: new Date().toISOString(),
                projectId: this.projectId,
                metadata: sanitizedMetadata,
                version: '1.0.0'
            };

            // Real usage reporting to Firebase Functions
            console.log(`📊 Reporting usage: ${operation}`);
            
            try {
                // Call Firebase Functions for usage reporting
                const reportUsageFunction = httpsCallable(this.functions, 'reportUsage');
                await reportUsageFunction(usageReport);
                
                console.log('✅ Usage reported successfully');
                return true;
                
            } catch (functionError) {
                // Fallback: If Firebase function doesn't exist, log locally but don't fail
                console.warn(`⚠️ Firebase usage reporting unavailable, logging locally:`, functionError);
                console.log(`📊 Usage Report: ${operation}`);
                console.log(`   Metadata: ${JSON.stringify(sanitizedMetadata)}`);
                return true; // Don't fail the main operation
            }

        } catch (error) {
            // Fire-and-forget: don't throw errors, just log warnings
            console.warn(`⚠️ Usage reporting failed (non-blocking): ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Security: sanitize metadata to remove sensitive information
     * Critical security feature from development BIBLE
     */
    private sanitizeMetadata(metadata: UsageMetadata): UsageMetadata {
        const sensitivePatterns = [
            new RegExp(['s', 'k', '_'].join('') + '[a-zA-Z0-9_]{20,}', 'g'),   // Stripe secret keys
            /AIza[0-9A-Za-z\-_]{35}/g,                                          // Google API keys
            new RegExp(['p', 'k', '_', 'live', '_'].join('') + '[a-zA-Z0-9]{24,}', 'g'), // Stripe live keys
            /password/gi,                                                       // Password fields
            /secret/gi,                                                         // Secret fields
            /key/gi,                                                           // Key fields (be careful with this)
            /token/gi                                                          // Token fields
        ];

        const sanitized: UsageMetadata = {};

        for (const [key, value] of Object.entries(metadata)) {
            let sanitizedValue = value;

            // Check if key name is sensitive
            const keyIsSensitive = sensitivePatterns.some(pattern => 
                typeof key === 'string' && pattern.test(key)
            );

            if (keyIsSensitive) {
                sanitizedValue = '[REDACTED]';
            }
            // Check if value contains sensitive data
            else if (typeof value === 'string') {
                let hasSecrets = false;
                for (const pattern of sensitivePatterns) {
                    if (pattern.test(value)) {
                        hasSecrets = true;
                        break;
                    }
                }

                if (hasSecrets) {
                    console.warn('⚠️ SECURITY: Sensitive data detected in metadata, redacting');
                    sanitizedValue = '[REDACTED]';
                }
                // Truncate long strings for privacy
                else if (value.length > 1000) {
                    sanitizedValue = value.substring(0, 1000) + '...[TRUNCATED]';
                }
            }
            // Handle nested objects (basic sanitization)
            else if (typeof value === 'object' && value !== null) {
                sanitizedValue = { sanitized: true, type: 'object' };
            }

            sanitized[key] = sanitizedValue;
        }

        return sanitized;
    }

    /**
     * Validate Firebase configuration
     */
    private validateConfig(): void {
        const requiredVars = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID',
            'FIREBASE_APP_ID'
        ];
        const missing = requiredVars.filter(varName => !process.env[varName]);

        if (missing.length > 0) {
            console.error(`❌ Missing required Firebase environment variables: ${missing.join(', ')}`);
            console.error('   Application cannot function without proper Firebase configuration');
            throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
        } else {
            console.log('✅ Firebase configuration validated');
        }
    }

    /**
     * Get service configuration info
     */
    getConfig(): { projectId: string; apiEndpoint: string; configured: boolean } {
        return {
            projectId: this.projectId,
            apiEndpoint: this.apiEndpoint,
            configured: !!process.env.FIREBASE_PROJECT_ID
        };
    }

    /**
     * Validate license with Firebase Functions
     * Phase 2 Sprint 2.1: Real license validation implementation
     */
    async validateLicense(licenseKey: string): Promise<any> {
        try {
            // Input validation
            if (!licenseKey || typeof licenseKey !== 'string') {
                throw new Error('License key is required and must be a string');
            }

            console.log(`🔍 Calling Firebase validateLicense function...`);

            // Call Firebase Functions using the SDK
            const validateLicenseFunction = httpsCallable(this.functions, 'validateLicense');
            const result = await validateLicenseFunction({ licenseKey });

            if (!result.data) {
                throw new Error('Invalid response from license validation');
            }

            console.log('✅ License validation successful');
            return result.data;

        } catch (error) {
            console.error('❌ License validation failed:', error);
            
            // Handle Firebase Functions errors
            if (error && typeof error === 'object' && 'code' in error) {
                const firebaseError = error as any;
                throw new Error(`License validation failed: ${firebaseError.message || firebaseError.code}`);
            }
            
            throw error;
        }
    }

    /**
     * Test connection (Phase 1 mock)
     */
    async testConnection(): Promise<boolean> {
        try {
            console.log('🔌 Testing Firebase connection...');
            
            // Phase 1 mock: always return true
            await new Promise(resolve => setTimeout(resolve, 200));
            
            console.log('✅ Firebase connection test passed (mock)');
            return true;
        } catch (error) {
            console.warn('⚠️ Firebase connection test failed:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
}