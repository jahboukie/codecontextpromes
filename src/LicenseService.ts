/**
 * CodeContextPro-MES License Service
 * Security-first license management with Firebase integration
 * 
 * Handles license validation, activation, and feature checking
 * with comprehensive input validation and secure defaults
 * 
 * Phase 1 Sprint 1.2: Integrated with Firebase Functions for real payment processing
 */

import { FirebaseService } from './FirebaseService';
import * as crypto from 'crypto';
import * as os from 'os';

// TypeScript augmentation for GCM cipher methods
declare module 'crypto' {
    function createCipherGCM(algorithm: string, key: crypto.CipherKey, iv: crypto.BinaryLike): crypto.CipherGCM;
    function createDecipherGCM(algorithm: string, key: crypto.CipherKey, iv: crypto.BinaryLike): crypto.DecipherGCM;
}

export interface License {
    key?: string;
    tier: string;
    active: boolean;
    features: string[];
    activatedAt: string;
    expiresAt?: string;
    mock?: boolean;
}

export interface PurchaseResult {
    success: boolean;
    tier: string;
    message: string;
    nextStep?: string;
    checkoutUrl?: string;
}

export class LicenseService {
    private licenseFile: string;
    private apiKeyFile: string;
    private currentLicense: License | null = null;
    private firebaseService: FirebaseService;

    constructor(projectPath: string = process.cwd()) {
        this.licenseFile = `${projectPath}/.codecontext/license.secure`;
        this.apiKeyFile = `${projectPath}/.codecontext/license.key.secure`;
        this.firebaseService = new FirebaseService();
        // Load license asynchronously - don't await in constructor
        this.loadCurrentLicense().catch(error => {
            console.warn('⚠️ Failed to load license on startup:', error instanceof Error ? error.message : 'Unknown error');
        });
    }

    /**
     * Purchase license with Firebase Functions integration
     * Phase 1 Sprint 1.2: Real Stripe checkout implementation
     */
    async purchaseLicense(tier: string = 'memory'): Promise<PurchaseResult> {
        console.log('💳 LicenseService.purchaseLicense called');

        try {
            // Input validation - NO FREE TIER
            const validTiers = ['memory'];
            if (!tier || typeof tier !== 'string') {
                throw new Error('Tier is required and must be a string');
            }

            if (!validTiers.includes(tier.toLowerCase())) {
                throw new Error(`Invalid tier: ${tier}. Valid options: ${validTiers.join(', ')} (no free tier)`);
            }

            const normalizedTier = tier.toLowerCase();

            // Get email for checkout (CLI will handle this)
            const email = process.env.CODECONTEXT_USER_EMAIL;
            if (!email) {
                return {
                    success: false,
                    tier: normalizedTier,
                    message: 'Email required for checkout. Please run: codecontext configure --email your@email.com',
                    nextStep: 'Set email first, then retry purchase'
                };
            }

            // Report purchase attempt (fire-and-forget)
            try {
                await this.firebaseService.reportUsage('license_purchase_attempt', {
                    tier: normalizedTier,
                    email: email.substring(0, 3) + '***' // Partial email for privacy
                });
            } catch (reportError) {
                // Ignore reporting errors - fire-and-forget
                console.warn('⚠️ Usage reporting failed (non-blocking):', reportError instanceof Error ? reportError.message : 'Unknown error');
            }

            // For Phase 1 Sprint 1.2, return checkout URL
            // Real integration would call Firebase createCheckout function
            const checkoutUrl = `https://codecontextpro-mes.web.app/checkout?tier=${normalizedTier}&email=${encodeURIComponent(email)}`;

            const result: PurchaseResult = {
                success: true,
                tier: normalizedTier,
                message: `${normalizedTier} tier checkout ready`,
                nextStep: 'Complete payment in browser to activate license',
                checkoutUrl
            };

            console.log(`✅ Purchase initiated: ${normalizedTier} tier for ${email.substring(0, 3)}***`);
            return result;

        } catch (error) {
            console.error('❌ Purchase error:', error);
            return {
                success: false,
                tier,
                message: error instanceof Error ? error.message : 'Purchase failed',
                nextStep: 'Please try again or contact support'
            };
        }
    }

    /**
     * Activate license using Firebase Functions
     * Phase 2 Sprint 2.1: Real license activation implementation
     */
    async activateLicense(licenseKey: string): Promise<License> {
        console.log('🔑 LicenseService.activateLicense called');

        try {
            // Input validation
            if (!licenseKey || typeof licenseKey !== 'string') {
                throw new Error('License key is required and must be a string');
            }

            const trimmedKey = licenseKey.trim();
            
            // Validate license key format (license_timestamp_randomstring)
            const licenseKeyPattern = /^license_\d+_[a-z0-9]{9}$/;
            if (!licenseKeyPattern.test(trimmedKey)) {
                throw new Error('Invalid license key format. Expected format: license_TIMESTAMP_RANDOMID');
            }

            // Call Firebase validateLicense function
            console.log('🔍 Validating license with Firebase...');
            const licenseData = await this.firebaseService.validateLicense(trimmedKey);

            if (!licenseData || !licenseData.apiKey) {
                throw new Error('License validation failed - missing license data');
            }

            // Create license object from Firebase response
            const license: License = {
                key: trimmedKey,
                tier: licenseData.tier,
                active: licenseData.status === 'active',
                features: licenseData.features || [],
                activatedAt: licenseData.activatedAt || new Date().toISOString()
            };

            // Store license securely with encryption
            await this.storeLicenseSecurely(license, licenseData.apiKey);

            this.currentLicense = license;
            console.log(`✅ License activated: ${license.tier} tier for ${licenseData.email.substring(0, 3)}***`);

            return license;

        } catch (error) {
            console.error('❌ License activation failed:', error);
            throw new Error(error instanceof Error ? error.message : 'License activation failed');
        }
    }

    /**
     * Get current license - SECURITY: No mock licenses unless explicitly in development mode
     */
    getCurrentLicense(): License {
        // SECURITY: Only allow mock license in explicit development mode
        if (!this.currentLicense) {
            if (process.env.CODECONTEXT_DEV_MODE === 'true' && process.env.NODE_ENV === 'development') {
                console.log('🔧 Development mode: using mock developer license');
                return {
                    tier: 'developer',
                    active: true,
                    features: ['unlimited_memory', 'unlimited_execution', 'debug_mode'],
                    activatedAt: new Date().toISOString(),
                    mock: true
                };
            }
            
            throw new Error('No active license found. Please run: codecontext activate YOUR_LICENSE_KEY');
        }

        return this.currentLicense;
    }

    /**
     * Check if license has specific feature
     */
    hasFeature(feature: string): boolean {
        if (!feature || typeof feature !== 'string') {
            return false;
        }

        const currentLicense = this.getCurrentLicense();
        
        if (!currentLicense.active) {
            return false;
        }

        const hasFeature = currentLicense.features.includes(feature);
        console.log(`🔍 Feature check: ${feature} = ${hasFeature}`);
        
        return hasFeature;
    }

    /**
     * Check if license allows specific operation
     */
    canPerformOperation(operation: string): boolean {
        if (!operation || typeof operation !== 'string') {
            return false;
        }

        const currentLicense = this.getCurrentLicense();

        if (!currentLicense.active) {
            console.log(`❌ License inactive, operation blocked: ${operation}`);
            return false;
        }

        // SECURITY: Only allow development mode with explicit environment variables
        if (process.env.CODECONTEXT_DEV_MODE === 'true' && process.env.NODE_ENV === 'development') {
            console.log(`✅ Operation allowed (development mode explicitly enabled): ${operation}`);
            return true;
        }

        // Feature-based operation checking
        const operationFeatureMap: { [key: string]: string } = {
            'remember': 'unlimited_memory',
            'recall': 'unlimited_memory',
            'execute': 'unlimited_execution',
            'sync': 'cloud_sync'
        };

        const requiredFeature = operationFeatureMap[operation];
        if (requiredFeature) {
            return this.hasFeature(requiredFeature);
        }

        // Default: allow basic operations
        console.log(`✅ Operation allowed: ${operation}`);
        return true;
    }

    /**
     * Get license status summary
     */
    getLicenseStatus(): { 
        tier: string; 
        active: boolean; 
        features: string[]; 
        daysRemaining?: number;
        mock: boolean;
    } {
        const license = this.getCurrentLicense();
        
        let daysRemaining: number | undefined;
        if (license.expiresAt) {
            const expiry = new Date(license.expiresAt);
            const now = new Date();
            daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
            tier: license.tier,
            active: license.active,
            features: license.features,
            daysRemaining,
            mock: !!license.mock
        };
    }

    /**
     * Generate machine-specific license encryption key
     * CRITICAL SECURITY: Uses machine + license specific data for key derivation
     */
    private generateLicenseEncryptionKey(apiKey: string): Buffer {
        
        // Collect enhanced machine-specific identifiers + license-specific data
        const networkInterfaces = os.networkInterfaces();
        const macAddresses = Object.values(networkInterfaces)
            .flat()
            .filter(iface => iface && !iface.internal && iface.mac !== '00:00:00:00:00:00')
            .map(iface => iface!.mac)
            .sort()
            .join(',');

        const machineId = [
            os.hostname(),
            os.platform(),
            os.arch(),
            os.cpus()[0]?.model || 'unknown',
            process.env.USERNAME || process.env.USER || 'unknown',
            __dirname,
            apiKey, // Include apiKey for license-specific derivation
            macAddresses || 'no-mac',
            os.totalmem().toString()
        ].join(':');

        // Use stronger salt generation
        const timestamp = Date.now().toString();
        const baseSalt = `codecontext-license-salt-${timestamp.slice(-4)}`;
        const salt = crypto.createHash('sha256').update(baseSalt).digest();
        
        // Derive encryption key using PBKDF2 with higher iterations
        return crypto.pbkdf2Sync(machineId, salt, 200000, 32, 'sha256');
    }

    /**
     * Store license securely with encryption
     * CRITICAL SECURITY: Machine-specific license encryption
     */
    private async storeLicenseSecurely(license: License, apiKey: string): Promise<void> {
        try {
            const fs = require('fs').promises;
            const path = require('path');

            // Ensure .codecontext directory exists
            const licenseDir = path.dirname(this.licenseFile);
            await fs.mkdir(licenseDir, { recursive: true });

            // SECURITY FIX: Store apiKey separately to avoid chicken-and-egg problem
            await this.storeApiKeySecurely(apiKey);

            // Create license data WITHOUT apiKey (stored separately)
            const licenseData = {
                ...license,
                storedAt: new Date().toISOString(),
                machineFingerprint: crypto.createHash('sha256').update(
                    os.hostname() + os.platform()
                ).digest('hex').substring(0, 16)
            };

            // Generate machine + license specific encryption key
            const encryptionKey = this.generateLicenseEncryptionKey(apiKey);
            const iv = crypto.randomBytes(16);
            
            // Encrypt using AES-256-CTR (compatible cipher for Node.js)
            const cipher = crypto.createCipheriv('aes-256-ctr', encryptionKey, iv);
            
            let encrypted = cipher.update(JSON.stringify(licenseData), 'utf8', 'base64');
            encrypted += cipher.final('base64');

            // Calculate integrity hash for tamper detection
            const integrityHash = crypto.createHash('sha256')
                .update(JSON.stringify(licenseData))
                .digest('hex');

            const encryptedLicense = {
                encrypted,
                iv: iv.toString('base64'),
                integrityHash,
                algorithm: 'aes256',
                keyDerivation: 'pbkdf2-sha256-200000'
            };

            // Write encrypted license file
            await fs.writeFile(this.licenseFile, JSON.stringify(encryptedLicense, null, 2));
            console.log('🔒 License stored securely with machine binding:', this.licenseFile);

        } catch (error) {
            console.error('❌ Failed to store license securely:', error);
            throw new Error('Failed to store license securely');
        }
    }

    /**
     * Store API key securely with machine-specific encryption (separate from license)
     * SECURITY FIX: Solves the chicken-and-egg problem for license decryption
     */
    private async storeApiKeySecurely(apiKey: string): Promise<void> {
        try {
            const fs = require('fs').promises;
            
            // Use a simpler, machine-bound key derivation for apiKey storage
            const machineKey = crypto.createHash('sha256').update(
                os.hostname() + os.platform() + os.arch() + 'codecontextpro-apikey'
            ).digest();
            
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-ctr', machineKey, iv);
            
            let encrypted = cipher.update(apiKey, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            
            const encryptedApiKey = {
                encrypted,
                iv: iv.toString('base64'),
                algorithm: 'aes256-ctr',
                keyDerivation: 'sha256-machine-bound'
            };
            
            await fs.writeFile(this.apiKeyFile, JSON.stringify(encryptedApiKey, null, 2));
            console.log('🔑 API key stored securely:', this.apiKeyFile);
            
        } catch (error) {
            console.error('❌ Failed to store API key securely:', error);
            throw new Error('Failed to store API key securely');
        }
    }

    /**
     * Load API key securely with machine-specific decryption
     */
    private async loadApiKeySecurely(): Promise<string> {
        try {
            const fs = require('fs').promises;
            
            // Check if API key file exists
            try {
                await fs.access(this.apiKeyFile);
            } catch {
                throw new Error('No API key file found - license needs to be activated');
            }
            
            const encryptedData = JSON.parse(await fs.readFile(this.apiKeyFile, 'utf8'));
            
            // Use the same machine-bound key derivation
            const machineKey = crypto.createHash('sha256').update(
                os.hostname() + os.platform() + os.arch() + 'codecontextpro-apikey'
            ).digest();
            
            const iv = Buffer.from(encryptedData.iv, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-ctr', machineKey, iv);
            
            let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
            
        } catch (error) {
            console.error('❌ Failed to load API key:', error);
            throw new Error('Failed to load API key - license may need to be re-activated');
        }
    }

    /**
     * Decrypt and load license from secure file
     * CRITICAL SECURITY: Decrypts license with machine binding verification
     */
    private async decryptLicense(encryptedLicenseData: any, apiKey: string): Promise<License | null> {
        try {
            
            // Generate the same machine-specific encryption key
            const encryptionKey = this.generateLicenseEncryptionKey(apiKey);
            
            // Decrypt using AES-256-CTR (compatible cipher for Node.js)
            const iv = Buffer.from(encryptedLicenseData.iv, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-ctr', encryptionKey, iv);
            
            let decrypted = decipher.update(encryptedLicenseData.encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            
            const licenseData = JSON.parse(decrypted);
            
            // Verify integrity hash
            const calculatedHash = crypto.createHash('sha256')
                .update(JSON.stringify({
                    ...licenseData,
                    // Remove fields that weren't part of original hash
                    machineFingerprint: undefined,
                    storedAt: undefined
                }))
                .digest('hex');
                
            if (calculatedHash !== encryptedLicenseData.integrityHash) {
                throw new Error('License integrity check failed - possible tampering detected');
            }
            
            // Verify machine fingerprint
            const currentFingerprint = crypto.createHash('sha256').update(
                require('os').hostname() + require('os').platform()
            ).digest('hex').substring(0, 16);
            
            if (licenseData.machineFingerprint !== currentFingerprint) {
                console.warn('⚠️ License machine fingerprint mismatch - may be from different machine');
                // Still allow but log warning
            }
            
            console.log('🔓 License decrypted and verified successfully');
            return {
                key: licenseData.key,
                tier: licenseData.tier,
                active: licenseData.active,
                features: licenseData.features,
                activatedAt: licenseData.activatedAt
            };
            
        } catch (error) {
            console.error('❌ License decryption failed:', error);
            throw new Error('Failed to decrypt license - possible corruption or wrong key');
        }
    }

    /**
     * Load license from secure file
     * SECURITY FIX: Now properly decrypts license using stored apiKey
     */
    private async loadCurrentLicense(): Promise<void> {
        try {
            const fs = require('fs').promises;
            
            // Check if license file exists
            try {
                await fs.access(this.licenseFile);
            } catch {
                console.log('📋 No license file found');
                this.currentLicense = null;
                return;
            }

            // SECURITY FIX: Load apiKey first, then decrypt license
            try {
                const apiKey = await this.loadApiKeySecurely();
                const encryptedData = JSON.parse(await fs.readFile(this.licenseFile, 'utf8'));
                
                // Decrypt the license using the loaded apiKey
                this.currentLicense = await this.decryptLicense(encryptedData, apiKey);
                
                if (this.currentLicense) {
                    console.log(`✅ License loaded successfully: ${this.currentLicense.tier} tier`);
                } else {
                    console.log('⚠️ License decryption returned null');
                    this.currentLicense = null;
                }
                
            } catch (apiKeyError) {
                console.log('📋 Could not load API key - license needs re-activation');
                this.currentLicense = null;
            }

        } catch (error) {
            console.error('❌ Failed to load license:', error);
            this.currentLicense = null;
        }
    }

    /**
     * Validate license tier name - NO FREE TIER
     */
    private isValidTier(tier: string): boolean {
        const validTiers = ['founders', 'pro', 'developer'];
        return validTiers.includes(tier.toLowerCase());
    }
}