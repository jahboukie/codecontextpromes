/**
 * CodeContextPro-MES License Service
 * Security-first license management with stub implementation for Phase 1
 * 
 * Handles license validation, activation, and feature checking
 * with comprehensive input validation and secure defaults
 */

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
    private currentLicense: License | null = null;

    constructor(projectPath: string = process.cwd()) {
        this.licenseFile = `${projectPath}/.codecontext/license.secure`;
        this.loadCurrentLicense();
    }

    /**
     * Purchase license (Phase 1 stub implementation)
     * Will be fully implemented in Sprint 1.2
     */
    async purchaseLicense(tier: string = 'founders'): Promise<PurchaseResult> {
        console.log('💳 LicenseService.purchaseLicense called');

        // Input validation
        const validTiers = ['free', 'founders', 'pro'];
        if (!tier || typeof tier !== 'string') {
            throw new Error('Tier is required and must be a string');
        }

        if (!validTiers.includes(tier.toLowerCase())) {
            throw new Error(`Invalid tier: ${tier}. Valid options: ${validTiers.join(', ')}`);
        }

        const normalizedTier = tier.toLowerCase();

        // Phase 1 mock implementation
        const mockResult: PurchaseResult = {
            success: true,
            tier: normalizedTier,
            message: `Phase 1 Mock: ${normalizedTier} tier purchase initiated`,
            nextStep: 'License purchase will be implemented in Sprint 1.2 with Stripe integration',
            checkoutUrl: 'https://checkout.stripe.com/mock-url'
        };

        console.log(`✅ Purchase initiated (mock): ${normalizedTier} tier`);
        return mockResult;
    }

    /**
     * Activate license (Phase 1 stub implementation)
     * Will be fully implemented in Sprint 1.2
     */
    async activateLicense(licenseKey: string): Promise<License> {
        console.log('🔑 LicenseService.activateLicense called');

        // Input validation
        if (!licenseKey || typeof licenseKey !== 'string') {
            throw new Error('License key is required and must be a string');
        }

        if (licenseKey.trim().length < 10) {
            throw new Error('Invalid license key format (minimum 10 characters)');
        }

        // Security: validate license key format (basic check)
        const licenseKeyPattern = /^[a-zA-Z0-9\-_]{10,}$/;
        if (!licenseKeyPattern.test(licenseKey.trim())) {
            throw new Error('Invalid license key format (contains invalid characters)');
        }

        // Phase 1 mock implementation
        const mockLicense: License = {
            key: licenseKey.trim(),
            tier: 'founders',
            active: true,
            features: ['unlimited_memory', 'unlimited_execution', 'cloud_sync'],
            activatedAt: new Date().toISOString(),
            mock: true
        };

        this.currentLicense = mockLicense;
        console.log(`✅ License activated (mock): ${mockLicense.tier} tier`);

        return mockLicense;
    }

    /**
     * Get current license (Phase 1 returns developer tier for development)
     */
    getCurrentLicense(): License {
        // Phase 1: return developer tier for active development
        if (!this.currentLicense) {
            this.currentLicense = {
                tier: 'developer',
                active: true,
                features: ['unlimited_memory', 'unlimited_execution', 'debug_mode'],
                activatedAt: new Date().toISOString(),
                mock: true
            };
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

        // Phase 1: allow all operations during development
        if (currentLicense.mock) {
            console.log(`✅ Operation allowed (development mode): ${operation}`);
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
     * Load license from secure file (Phase 1 stub)
     */
    private loadCurrentLicense(): void {
        // Phase 1: no actual file loading, use mock license
        console.log('📋 Loading license (mock mode for Phase 1)');
        this.currentLicense = null; // Will be created in getCurrentLicense()
    }

    /**
     * Validate license tier name
     */
    private isValidTier(tier: string): boolean {
        const validTiers = ['free', 'founders', 'pro', 'developer'];
        return validTiers.includes(tier.toLowerCase());
    }
}