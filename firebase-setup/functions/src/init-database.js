#!/usr/bin/env node
/**
 * CodeContextPro-MES Database Initialization Script
 * SECURITY: One-time admin script to initialize production database
 * 
 * This script initializes critical documents that security rules prevent clients from creating
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with default credentials
admin.initializeApp();
const db = admin.firestore();

async function initializeDatabase() {
    console.log('🚀 Initializing CodeContextPro-MES production database...');
    
    try {
        // Initialize public/stats document for Founders Special counter
        const statsDoc = db.collection('public').doc('stats');
        const statsSnapshot = await statsDoc.get();
        
        if (!statsSnapshot.exists) {
            await statsDoc.set({
                earlyAdoptersSold: 0,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                foundersSpecialMaxLicenses: 10000,
                initialized: true,
                initializedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Created public/stats document');
        } else {
            console.log('📋 public/stats document already exists');
        }
        
        // Initialize system metadata (optional)
        const systemDoc = db.collection('system').doc('metadata');
        const systemSnapshot = await systemDoc.get();
        
        if (!systemSnapshot.exists) {
            await systemDoc.set({
                version: '1.0.0',
                environment: 'production',
                launchDate: admin.firestore.FieldValue.serverTimestamp(),
                features: {
                    foundersSpecial: true,
                    encryptedMemory: true,
                    licenseValidation: true,
                    usageTracking: true
                }
            });
            console.log('✅ Created system/metadata document');
        } else {
            console.log('📋 system/metadata document already exists');
        }
        
        console.log('🎉 Database initialization completed successfully!');
        console.log('🔒 Security rules are enforced - only Cloud Functions can modify these documents');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

// Run initialization
initializeDatabase();