#!/usr/bin/env node

/**
 * EMERGENCY CUSTOMER SERVICE SCRIPT
 * Manually creates licenses for paying customers whose webhooks failed
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'codecontextpro-mes'
});

const db = admin.firestore();

// Session IDs of paying customers without licenses
const PAYING_CUSTOMERS = [
  'cs_test_a17fp4xyjXRU8skylBR1xEXB4tSu8KDlDl5Z3FXe9qH2B65t7Pr2hY2kNN',
  'cs_test_a1EcBvp17pMDEwTu8YOG0mwvHoD1Q3RjMPGq27rOOlDGfs3rCLnpYc4Lab'
];

async function createEmergencyLicense(sessionId) {
  try {
    console.log(`🚨 Creating emergency license for session: ${sessionId}`);
    
    // Generate license key
    const licenseKey = uuidv4().replace(/-/g, '').toUpperCase();
    
    // Create license document
    const licenseData = {
      email: 'demo@example.com', // Placeholder - update with real email from Stripe
      tier: 'memory',
      stripeSessionId: sessionId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      emergencyCreated: true,
      note: 'Manually created due to webhook failure - customer paid'
    };
    
    await db.collection('licenses').doc(licenseKey).set(licenseData);
    
    console.log(`✅ License created: ${licenseKey}`);
    console.log(`   Session: ${sessionId}`);
    console.log(`   Email: ${licenseData.email}`);
    
    return licenseKey;
    
  } catch (error) {
    console.error(`❌ Failed to create license for ${sessionId}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚨 EMERGENCY LICENSE CREATION SCRIPT');
  console.log('=====================================');
  console.log('Creating licenses for paying customers whose webhooks failed...\n');
  
  try {
    for (const sessionId of PAYING_CUSTOMERS) {
      await createEmergencyLicense(sessionId);
      console.log(''); // Add spacing
    }
    
    console.log('✅ All emergency licenses created successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test success pages with these session IDs');
    console.log('2. Deploy functions to fix webhook for future customers');
    console.log('3. Update license emails with real customer data from Stripe');
    
  } catch (error) {
    console.error('❌ Emergency script failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();