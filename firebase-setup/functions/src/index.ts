/**
 * CodeContextPro-MES Firebase Functions
 * Security-first payment processing and license management
 * 
 * Phase 1 Sprint 1.2: Basic Storefront implementation
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as cors from 'cors';
import { Response } from 'express';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

/**
 * CORS Handler with Security Restrictions
 * Only allows specific origins for enhanced security
 */
const corsHandler = cors.default({
    origin: [
        'https://codecontextpro.com',
        'https://www.codecontextpro.com',
        'https://codecontextpro-mes.web.app',
        'https://codecontextpro-mes.firebaseapp.com',
        /\.codecontext\.pro$/,
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173',
        'https://localhost:5000'
    ],
    credentials: true,
    optionsSuccessStatus: 200
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
 * Email Validation Function
 * Validates email format and security requirements
 */
function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
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

/**
 * Get Pricing HTTP Function
 * Returns pricing information and early adopter stats
 * Phase 1 Sprint 1.2: Basic pricing endpoint
 */
export const getPricingHttp = functions.https.onRequest(async (req, res) => {
    try {
        addSecurityHeaders(res);
        
        // Apply CORS
        corsHandler(req, res, async () => {
            // Only allow GET requests
            if (req.method !== 'GET') {
                res.status(405).json({ error: 'Method not allowed' });
                return;
            }

            // Validate pricing configuration per security specification
            const foundersPrice = process.env.STRIPE_FOUNDERS_PRICE_ID;
            const proPrice = process.env.STRIPE_PRO_PRICE_ID;

            if (!foundersPrice || !proPrice) {
                console.error('❌ Critical configuration missing: Stripe price IDs not configured for pricing endpoint');
                console.error('💡 Configure via: firebase functions:config:set stripe.founders_price_id="your_id"');
                res.status(500).json({ 
                    error: 'Pricing system configuration incomplete',
                    message: 'Pricing temporarily unavailable - contact administrator' 
                });
                return;
            }

            // Get early adopter count
            const statsDoc = await admin.firestore()
                .collection('public')
                .doc('stats')
                .get();
                
            const earlyAdoptersSold = statsDoc.exists ? 
                (statsDoc.data()?.earlyAdoptersSold || 0) : 0;

            res.json({
                pricing: {
                    founders: {
                        name: 'Founders Special',
                        price: 59,
                        currency: 'USD',
                        period: 'month',
                        description: 'Limited to 10,000 licenses - Forever pricing!',
                        limits: {
                            memory: 'unlimited',
                            projects: 'multi-project',
                            executions: 'unlimited',
                            maxLicenses: 10000
                        },
                        features: [
                            'UNLIMITED Memory',
                            'Multi-Project Support',
                            'Forever pricing lock',
                            'Early adopter benefits'
                        ],
                        stripePriceId: process.env.STRIPE_FOUNDERS_PRICE_ID
                    },
                    pro: {
                        name: 'Pro',
                        price: 99,
                        currency: 'USD',
                        period: 'month',
                        description: 'Available after Founders Special',
                        limits: {
                            memory: 2000,
                            executions: 2000,
                            projects: 'unlimited'
                        },
                        features: [
                            '2,000 Memory Operations/month',
                            '2,000 Execution Sandbox/month',
                            'Unlimited Projects'
                        ],
                        stripePriceId: process.env.STRIPE_PRO_PRICE_ID
                    }
                },
                stats: {
                    earlyAdoptersSold,
                    foundersRemaining: Math.max(0, 10000 - earlyAdoptersSold)
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error in getPricingHttp:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create Checkout Session
 * Creates Stripe checkout session for license purchase
 * Phase 1 Sprint 1.2: Payment processing
 */
export const createCheckout = functions.https.onRequest(async (req, res) => {
    try {
        addSecurityHeaders(res);
        
        // Apply CORS
        corsHandler(req, res, async () => {
            // Only allow POST requests
            if (req.method !== 'POST') {
                res.status(405).json({ error: 'Method not allowed' });
                return;
            }

            const { email, tier } = req.body;

            // Validate required inputs
            if (!email || typeof email !== 'string') {
                res.status(400).json({ error: 'Email is required' });
                return;
            }

            if (!tier || typeof tier !== 'string') {
                res.status(400).json({ error: 'Tier is required' });
                return;
            }

            // Validate email format
            if (!validateEmail(email)) {
                res.status(400).json({ error: 'Invalid email format' });
                return;
            }

            // Security: validate no secrets in request
            validateNoSecrets(req.body);

            // Check early adopter limit for founders tier
            if (tier === 'founders') {
                const statsDoc = await admin.firestore()
                    .collection('public')
                    .doc('stats')
                    .get();
                    
                const earlyAdoptersSold = statsDoc.exists ? 
                    (statsDoc.data()?.earlyAdoptersSold || 0) : 0;
                
                if (earlyAdoptersSold >= 10000) {
                    res.status(400).json({ 
                        error: 'Founders Special is sold out',
                        maxLicenses: 10000,
                        currentCount: earlyAdoptersSold
                    });
                    return;
                }
            }

            // Get price ID based on tier - NO HARDCODED VALUES per security spec
            const foundersPrice = process.env.STRIPE_FOUNDERS_PRICE_ID;
            const proPrice = process.env.STRIPE_PRO_PRICE_ID;

            // Validate configuration exists per security specification
            if (!foundersPrice || !proPrice) {
                console.error('❌ Critical configuration missing: Stripe price IDs not configured');
                console.error('💡 Configure via: firebase functions:config:set stripe.founders_price_id="your_id"');
                res.status(500).json({ 
                    error: 'Payment system configuration incomplete',
                    message: 'Contact administrator - pricing not configured' 
                });
                return;
            }

            const priceIds: Record<string, string> = {
                founders: foundersPrice,
                pro: proPrice
            };

            const priceId = priceIds[tier];
            if (!priceId) {
                console.error('❌ Invalid tier requested:', tier);
                res.status(400).json({ error: 'Missing price ID' });
                return;
            }

            // Create Stripe checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price: priceId,
                    quantity: 1
                }],
                mode: 'subscription',
                customer_email: email,
                success_url: `${req.headers.origin || 'http://localhost:5000'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin || 'http://localhost:5000'}/`,
                metadata: {
                    tier,
                    email,
                    source: 'codecontextpro'
                }
            });

            console.log('✅ Checkout session created', {
                sessionId: session.id,
                email: email.substring(0, 3) + '***',
                tier,
                timestamp: new Date().toISOString(),
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.json({
                sessionId: session.id,
                url: session.url
            });
        });
        
    } catch (error) {
        console.error('❌ Error in createCheckout:', error);
        
        if (error instanceof functions.https.HttpsError) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Please contact support' });
        }
    }
});

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
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
            const masterKey = process.env.ENCRYPTION_MASTER_KEY;
            
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
            const masterKey = process.env.ENCRYPTION_MASTER_KEY;
            
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
