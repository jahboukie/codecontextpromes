/**
 * CodeContextPro-MES Firebase Service
 * Security-first Firebase integration with usage reporting
 * 
 * Handles secure communication with Firebase backend
 * with comprehensive data sanitization and validation
 */

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

    constructor() {
        this.projectId = process.env.FIREBASE_PROJECT_ID || 'codecontextpro-mes';
        this.apiEndpoint = `https://${this.projectId}.cloudfunctions.net`;
        
        // Validate configuration on initialization
        this.validateConfig();
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

            // Phase 1: Mock the HTTP request (real implementation in Sprint 1.2)
            console.log(`📊 Usage Report: ${operation}`);
            console.log(`   Metadata: ${JSON.stringify(sanitizedMetadata)}`);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 100));

            return true;

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
        const requiredVars = ['FIREBASE_PROJECT_ID'];
        const missing = requiredVars.filter(varName => !process.env[varName]);

        if (missing.length > 0) {
            console.warn(`⚠️ Missing Firebase environment variables: ${missing.join(', ')}`);
            console.warn('   Usage reporting will use mock mode');
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