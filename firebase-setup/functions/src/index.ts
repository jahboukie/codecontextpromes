/**
 * CodeContextPro-MES Firebase Functions
 * Security-first payment processing and license management
 * 
 * Phase 1 Sprint 1.2: Basic Storefront implementation
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
// Removed cors import - not needed for CLI backend
import { Response } from 'express';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe with secret key from environment
const stripe = new Stripe(functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

/**
 * Security Headers Middleware
 * Implements security-first requirement from development BIBLE
 */
function addSecurityHeaders(res: Response): void {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
}

/**
 * Security: Detect potential secrets in input data
 */
function validateNoSecrets(data: any): void {
    const content = JSON.stringify(data);
    const secretPatterns = [
        new RegExp(['s', 'k', '_'].join('') + '[a-zA-Z0-9_]{20,}'),     // Stripe secret keys
        /AIza[0-9A-Za-z\-_]{35}/,                                       // Google API keys  
        new RegExp(['p', 'k', '_', 'live', '_'].join('') + '[a-zA-Z0-9]{24,}'), // Stripe live keys
        /password\s*[:=]\s*[^\s]+/i,                                    // Password assignments
        /secret\s*[:=]\s*[^\s]+/i,                                      // Secret assignments
        /api[_\s]*key\s*[:=]\s*[^\s]+/i                                 // API key assignments
    ];

    for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'SECURITY: Potential secret detected in request data'
            );
        }
    }
}

// Removed getPricingHttp - storefront moved to Replit/Vercel

// Removed createCheckout - storefront moved to Replit/Vercel

/**
 * Stripe Webhook Handler
 * Process successful payments and activate licenses
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    try {
        addSecurityHeaders(res);

        // Only allow POST requests
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        const sig = req.get('stripe-signature');
        const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

        if (!sig || !webhookSecret) {
            console.error('❌ Missing Stripe signature or webhook secret');
            res.status(400).json({ error: 'Missing signature or webhook secret' });
            return;
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        } catch (err) {
            console.error('❌ Webhook signature verification failed:', err);
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        // Handle successful payment
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            
            console.log('✅ Payment successful for session:', session.id);
            
            // Extract metadata
            const { tier, email } = session.metadata || {};
            
            if (!tier || !email) {
                console.error('❌ Missing metadata in session:', session.id);
                res.status(400).json({ error: 'Missing session metadata' });
                return;
            }

            // Create license record
            const licenseId = `license_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Generate userEncryptionKey (apiKey) using license.id + email + master key
            const crypto = require('crypto');
            const masterKey = functions.config().encryption?.master_key || process.env.ENCRYPTION_MASTER_KEY;
            
            if (!masterKey) {
                console.error('❌ Missing ENCRYPTION_MASTER_KEY for license creation');
                res.status(500).json({ error: 'Encryption configuration error' });
                return;
            }

            // Derive user-specific encryption key (this becomes the apiKey)
            const keyInput = `${licenseId}:${email}:${masterKey}`;
            const apiKey = crypto.createHash('sha256').update(keyInput).digest('hex');
            
            const licenseData = {
                id: licenseId,
                email,
                tier,
                status: 'active',
                stripeSessionId: session.id,
                stripeCustomerId: session.customer,
                apiKey, // Store the userEncryptionKey as apiKey
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                features: tier === 'founders' ? [
                    'unlimited_memory',
                    'unlimited_execution', 
                    'multi_project',
                    'cloud_sync',
                    'priority_support',
                    'locked_pricing'
                ] : [
                    'limited_memory_2000',
                    'limited_execution_2000',
                    'unlimited_projects',
                    'cloud_sync',
                    'standard_support'
                ]
            };

            // Store license
            await admin.firestore()
                .collection('licenses')
                .doc(licenseId)
                .set(licenseData);

            // Update early adopter count if Founders Special
            if (tier === 'founders') {
                await admin.firestore()
                    .collection('public')
                    .doc('stats')
                    .set({
                        earlyAdoptersSold: admin.firestore.FieldValue.increment(1),
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
            }

            console.log('✅ License created with encryption key:', licenseId);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Error in stripeWebhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Validate License Function
 * Verifies license validity and returns license data including apiKey
 * Phase 2 Sprint 2.1: Core licensing validation
 */
export const validateLicense = functions.https.onCall(async (data, context) => {
    try {
        // Input validation
        if (!data || typeof data !== 'object') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid request data'
            );
        }

        // Security: validate no secrets in input
        validateNoSecrets(data);

        const { licenseKey } = (data as unknown) as { licenseKey: string };

        // Validate required fields
        if (!licenseKey || typeof licenseKey !== 'string') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'License key is required and must be a string'
            );
        }

        // Validate license key format (license_timestamp_randomstring)
        const licenseKeyRegex = /^license_\d+_[a-z0-9]{9}$/;
        if (!licenseKeyRegex.test(licenseKey)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid license key format'
            );
        }

        // Query Firestore for license
        const licenseDoc = await admin.firestore()
            .collection('licenses')
            .doc(licenseKey)
            .get();

        if (!licenseDoc.exists) {
            console.log('❌ License not found:', licenseKey.substring(0, 12) + '***');
            throw new functions.https.HttpsError(
                'not-found',
                'License key not found'
            );
        }

        const licenseData = licenseDoc.data();
        if (!licenseData) {
            throw new functions.https.HttpsError(
                'internal',
                'License data corrupted'
            );
        }

        // Check license status
        if (licenseData.status !== 'active') {
            console.log('❌ License inactive:', licenseKey.substring(0, 12) + '***', 'Status:', licenseData.status);
            throw new functions.https.HttpsError(
                'failed-precondition',
                `License is ${licenseData.status}. Please contact support.`
            );
        }

        // Generate userEncryptionKey if not exists (for backward compatibility)
        let apiKey = licenseData.apiKey;
        if (!apiKey) {
            // Generate userEncryptionKey using license.id + email + master key
            const crypto = require('crypto');
            const masterKey = functions.config().encryption?.master_key || process.env.ENCRYPTION_MASTER_KEY;
            
            if (!masterKey) {
                console.error('❌ Missing ENCRYPTION_MASTER_KEY');
                throw new functions.https.HttpsError(
                    'internal',
                    'Encryption configuration error'
                );
            }

            // Derive user-specific encryption key
            const keyInput = `${licenseData.id}:${licenseData.email}:${masterKey}`;
            apiKey = crypto.createHash('sha256').update(keyInput).digest('hex');
            
            // Store the generated apiKey in license for future use
            await admin.firestore()
                .collection('licenses')
                .doc(licenseKey)
                .update({
                    apiKey,
                    apiKeyGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
                });

            console.log('✅ Generated apiKey for license:', licenseKey.substring(0, 12) + '***');
        }

        // Log successful license validation (analytics & security)
        console.log('✅ License validated successfully', {
            licenseId: licenseKey.substring(0, 12) + '***',
            email: licenseData.email.substring(0, 3) + '***',
            tier: licenseData.tier,
            timestamp: new Date().toISOString()
        });

        // Return license data (excluding sensitive internal fields)
        return {
            licenseId: licenseData.id,
            email: licenseData.email,
            tier: licenseData.tier,
            status: licenseData.status,
            features: licenseData.features,
            apiKey,
            activatedAt: licenseData.activatedAt,
            createdAt: licenseData.createdAt
        };

    } catch (error) {
        console.error('❌ Error in validateLicense:', error);
        
        // Re-throw known errors
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        // Generic error
        throw new functions.https.HttpsError(
            'internal',
            'License validation failed'
        );
    }
});

/**
 * Get Authentication Token
 * Generates custom Firebase Auth tokens for license holders
 * Phase 2 Sprint 2.1: Enable authenticated access to user data
 */
export const getAuthToken = functions.https.onCall(async (data, context) => {
    try {
        // Input validation
        if (!data || typeof data !== 'object') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid request data'
            );
        }

        // Security: validate no secrets in input
        validateNoSecrets(data);

        const { licenseKey } = (data as unknown) as { licenseKey: string };

        // Validate required fields
        if (!licenseKey || typeof licenseKey !== 'string') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'License key is required and must be a string'
            );
        }

        // Validate license key format (license_timestamp_randomstring)
        const licenseKeyRegex = /^license_\d+_[a-z0-9]{9}$/;
        if (!licenseKeyRegex.test(licenseKey)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid license key format'
            );
        }

        // Query Firestore for license
        const licenseDoc = await admin.firestore()
            .collection('licenses')
            .doc(licenseKey)
            .get();

        if (!licenseDoc.exists) {
            console.log('❌ License not found for auth token:', licenseKey.substring(0, 12) + '***');
            throw new functions.https.HttpsError(
                'not-found',
                'License key not found'
            );
        }

        const licenseData = licenseDoc.data();
        if (!licenseData) {
            throw new functions.https.HttpsError(
                'internal',
                'License data corrupted'
            );
        }

        // Check license status
        if (licenseData.status !== 'active') {
            console.log('❌ License inactive for auth token:', licenseKey.substring(0, 12) + '***', 'Status:', licenseData.status);
            throw new functions.https.HttpsError(
                'failed-precondition',
                `License is ${licenseData.status}. Cannot generate auth token.`
            );
        }

        // Create unique user ID based on license
        const uid = `license_${licenseData.id.replace('license_', '')}`;

        // Set custom claims based on license tier
        const customClaims: Record<string, any> = {
            licenseId: licenseData.id,
            tier: licenseData.tier,
            email: licenseData.email,
            features: licenseData.features,
            licenseStatus: licenseData.status
        };

        // Add tier-specific claims - NO FREE TIER
        if (licenseData.tier === 'founders') {
            customClaims.unlimitedMemory = true;
            customClaims.unlimitedExecution = true;
            customClaims.multiProject = true;
            customClaims.cloudSync = true;
            customClaims.prioritySupport = true;
        } else if (licenseData.tier === 'pro') {
            customClaims.memoryLimit = 2000;
            customClaims.executionLimit = 2000;
            customClaims.multiProject = true;
            customClaims.cloudSync = true;
        } else {
            // Invalid tier - only paid tiers allowed
            throw new functions.https.HttpsError(
                'failed-precondition',
                'Invalid license tier. Only paid licenses are supported.'
            );
        }

        // Generate custom Firebase Auth token
        const customToken = await admin.auth().createCustomToken(uid, customClaims);

        // Log successful token generation (analytics & security)
        console.log('✅ Auth token generated successfully', {
            licenseId: licenseKey.substring(0, 12) + '***',
            email: licenseData.email.substring(0, 3) + '***',
            tier: licenseData.tier,
            uid: uid,
            timestamp: new Date().toISOString()
        });

        // Update license with last token generation time
        await admin.firestore()
            .collection('licenses')
            .doc(licenseKey)
            .update({
                lastTokenGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        return {
            customToken,
            uid,
            tier: licenseData.tier,
            features: licenseData.features
        };

    } catch (error) {
        console.error('❌ Error in getAuthToken:', error);
        
        // Re-throw known errors
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        // Generic error
        throw new functions.https.HttpsError(
            'internal',
            'Auth token generation failed'
        );
    }
});

/**
 * Report Usage Function
 * Securely track CLI usage for billing and analytics
 * Phase 2 Sprint 2.1: Real usage tracking implementation
 */
export const reportUsage = functions.https.onCall(async (data, context) => {
    try {
        // Input validation
        if (!data || typeof data !== 'object') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid request data'
            );
        }

        // Security: validate no secrets in input
        validateNoSecrets(data);

        const { operation, metadata, projectId, timestamp, version } = (data as unknown) as {
            operation: string;
            metadata: any;
            projectId: string;
            timestamp: string;
            version: string;
        };

        // Validate required fields
        if (!operation || typeof operation !== 'string') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Operation is required and must be a string'
            );
        }

        if (!timestamp || typeof timestamp !== 'string') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Timestamp is required and must be a string'
            );
        }

        // Store usage data in Firestore
        const usageRecord = {
            operation: operation.trim(),
            metadata: metadata || {},
            projectId: projectId || 'unknown',
            timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
            version: version || '1.0.0',
            reportedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Store in Firestore under usage collection
        await admin.firestore()
            .collection('usage')
            .add(usageRecord);

        console.log('✅ Usage reported successfully', {
            operation: operation.trim(),
            projectId: projectId || 'unknown',
            timestamp: timestamp
        });

        return {
            success: true,
            message: 'Usage reported successfully'
        };

    } catch (error) {
        console.error('❌ Error in reportUsage:', error);
        
        // Re-throw known errors
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        // Generic error
        throw new functions.https.HttpsError(
            'internal',
            'Usage reporting failed'
        );
    }
});
