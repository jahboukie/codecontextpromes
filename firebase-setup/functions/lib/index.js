"use strict";
/**
 * CodeContextPro-MES Firebase Functions
 * Security-first payment processing and license management
 *
 * Phase 1 Sprint 1.2: Basic Storefront implementation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.createCheckout = exports.getPricingHttp = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Stripe with secret key from environment
const stripe = new stripe_1.default(((_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key) || process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
// CORS configuration - restrict to known origins
const corsHandler = (0, cors_1.default)({
    origin: [
        'https://codecontextpro-mes.web.app',
        'https://codecontextpro-mes.firebaseapp.com',
        /^https:\/\/.*\.codecontext\.pro$/,
        // Development origins
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true
});
/**
 * Security Headers Middleware
 * Implements security-first requirement from development BIBLE
 */
function addSecurityHeaders(res) {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'",
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
}
/**
 * Input validation helper
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320; // RFC 5321 limit
}
/**
 * Security: Detect potential secrets in input data
 */
function validateNoSecrets(data) {
    const content = JSON.stringify(data);
    const secretPatterns = [
        new RegExp(['s', 'k', '_'].join('') + '[a-zA-Z0-9_]{20,}'), // Stripe secret keys
        /AIza[0-9A-Za-z\-_]{35}/, // Google API keys  
        new RegExp(['p', 'k', '_', 'live', '_'].join('') + '[a-zA-Z0-9]{24,}'), // Stripe live keys
        /password\s*[:=]\s*[^\s]+/i, // Password assignments
        /secret\s*[:=]\s*[^\s]+/i, // Secret assignments
        /api[_\s]*key\s*[:=]\s*[^\s]+/i // API key assignments
    ];
    for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
            throw new functions.https.HttpsError('invalid-argument', 'SECURITY: Potential secret detected in request data');
        }
    }
}
/**
 * Get Pricing Information and Early Adopter Stats
 * Public endpoint for storefront display
 */
exports.getPricingHttp = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        var _a;
        try {
            addSecurityHeaders(res);
            // Only allow GET requests
            if (req.method !== 'GET') {
                res.status(405).json({ error: 'Method not allowed' });
                return;
            }
            // Get early adopter count from Firestore
            const statsDoc = await admin.firestore()
                .collection('public')
                .doc('stats')
                .get();
            const earlyAdoptersSold = statsDoc.exists ?
                (((_a = statsDoc.data()) === null || _a === void 0 ? void 0 : _a.earlyAdoptersSold) || 0) : 0;
            const pricingData = {
                tiers: {
                    free: {
                        name: 'Free',
                        price: 0,
                        currency: 'USD',
                        features: [
                            '20 Memory Operations/month',
                            '20 Execution Sandbox/month',
                            'Single Project Support',
                            'Basic VS Code Integration'
                        ],
                        limits: {
                            memory: 20,
                            execution: 20,
                            projects: 1
                        }
                    },
                    founders: {
                        name: 'Founders Special',
                        price: 59,
                        currency: 'USD',
                        features: [
                            'UNLIMITED Memory & Execution',
                            'Multi-Project Support',
                            'Cloud Sync',
                            'Priority Support',
                            'Locked pricing forever'
                        ],
                        limits: {
                            memory: -1, // Unlimited
                            execution: -1, // Unlimited
                            projects: -1 // Unlimited
                        },
                        maxLicenses: 10000,
                        sold: earlyAdoptersSold
                    },
                    pro: {
                        name: 'Pro',
                        price: 199,
                        currency: 'USD',
                        features: [
                            '2,000 Memory Operations/month',
                            '2,000 Execution Sandbox/month',
                            'Unlimited Projects',
                            'Cloud Sync',
                            'Standard Support'
                        ],
                        limits: {
                            memory: 2000,
                            execution: 2000,
                            projects: -1 // Unlimited
                        },
                        available: false // Not available during Founders Special
                    }
                },
                earlyAdoptersSold,
                foundersRemaining: Math.max(0, 10000 - earlyAdoptersSold)
            };
            // Log successful pricing request (analytics)
            console.log('📊 Pricing data requested', {
                timestamp: new Date().toISOString(),
                earlyAdoptersSold,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });
            res.status(200).json(pricingData);
        }
        catch (error) {
            console.error('❌ Error in getPricingHttp:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});
/**
 * Create Stripe Checkout Session
 * Secure payment processing with comprehensive validation
 */
exports.createCheckout = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    try {
        // Input validation
        if (!data || typeof data !== 'object') {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid request data');
        }
        // Security: validate no secrets in input
        validateNoSecrets(data);
        const { email, tier } = data;
        // Validate required fields
        if (!email || typeof email !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Email is required and must be a string');
        }
        if (!tier || typeof tier !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Tier is required and must be a string');
        }
        // Validate email format
        if (!validateEmail(email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }
        // Validate tier
        const validTiers = ['founders', 'pro'];
        if (!validTiers.includes(tier)) {
            throw new functions.https.HttpsError('invalid-argument', `Invalid tier: ${tier}. Valid tiers: ${validTiers.join(', ')}`);
        }
        // Check if Founders Special is still available
        if (tier === 'founders') {
            const statsDoc = await admin.firestore()
                .collection('public')
                .doc('stats')
                .get();
            const earlyAdoptersSold = statsDoc.exists ?
                (((_a = statsDoc.data()) === null || _a === void 0 ? void 0 : _a.earlyAdoptersSold) || 0) : 0;
            if (earlyAdoptersSold >= 10000) {
                throw new functions.https.HttpsError('failed-precondition', 'Founders Special is sold out. Please check back for Pro tier availability.');
            }
        }
        // Get price ID from environment config
        const priceId = tier === 'founders' ?
            ((_b = functions.config().stripe) === null || _b === void 0 ? void 0 : _b.founders_price_id) || process.env.STRIPE_FOUNDERS_PRICE_ID :
            ((_c = functions.config().stripe) === null || _c === void 0 ? void 0 : _c.pro_price_id) || process.env.STRIPE_PRO_PRICE_ID;
        if (!priceId) {
            console.error(`❌ Missing price ID for tier: ${tier}`);
            throw new functions.https.HttpsError('internal', 'Payment configuration error. Please contact support.');
        }
        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `https://${((_d = functions.config().app) === null || _d === void 0 ? void 0 : _d.domain) || 'codecontextpro-mes.web.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://${((_e = functions.config().app) === null || _e === void 0 ? void 0 : _e.domain) || 'codecontextpro-mes.web.app'}/?canceled=true`,
            metadata: {
                tier,
                email,
                created_by: 'codecontextpro-functions',
                version: '1.0.0'
            },
            subscription_data: {
                metadata: {
                    tier,
                    email,
                    license_type: tier
                }
            }
        });
        // Log successful checkout creation (analytics)
        console.log('✅ Checkout session created', {
            sessionId: session.id,
            email: email.substring(0, 3) + '***', // Partial email for privacy
            tier,
            timestamp: new Date().toISOString()
        });
        return {
            sessionId: session.id,
            url: session.url
        };
    }
    catch (error) {
        console.error('❌ Error in createCheckout:', error);
        // Re-throw known errors
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Handle Stripe errors
        if (error instanceof Error && 'type' in error) {
            throw new functions.https.HttpsError('internal', `Payment processing error: ${error.message}`);
        }
        // Generic error
        throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
    }
});
/**
 * Stripe Webhook Handler
 * Process successful payments and activate licenses
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    try {
        addSecurityHeaders(res);
        // Only allow POST requests
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const sig = req.get('stripe-signature');
        const webhookSecret = ((_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.webhook_secret) || process.env.STRIPE_WEBHOOK_SECRET;
        if (!sig || !webhookSecret) {
            console.error('❌ Missing Stripe signature or webhook secret');
            res.status(400).json({ error: 'Missing signature or webhook secret' });
            return;
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        }
        catch (err) {
            console.error('❌ Webhook signature verification failed:', err);
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }
        // Handle successful payment
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
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
            const licenseData = {
                id: licenseId,
                email,
                tier,
                status: 'active',
                stripeSessionId: session.id,
                stripeCustomerId: session.customer,
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
            console.log('✅ License created:', licenseId);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('❌ Error in stripeWebhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
//# sourceMappingURL=index.js.map