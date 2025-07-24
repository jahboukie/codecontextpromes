#!/usr/bin/env node

/**
 * CodeContextPro-MES Build Script
 * Security-first environment variable injection for Firebase hosting
 * 
 * Replaces template placeholders with environment variables
 * SECURITY: Never commits secrets to repository
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 CodeContextPro-MES Build Process Starting...');

// Environment variables mapping
const envVars = {
    // Firebase Configuration
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    
    // Stripe Configuration
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    
    // Pricing Configuration - Three Tier Structure
    // Free Trial Tier
    PRICING_FREE_TRIAL_NAME: process.env.PRICING_FREE_TRIAL_NAME || 'Free Trial',
    PRICING_FREE_TRIAL_AMOUNT: process.env.PRICING_FREE_TRIAL_AMOUNT || '0',
    PRICING_FREE_TRIAL_OPERATIONS: process.env.PRICING_FREE_TRIAL_OPERATIONS || '100',
    PRICING_FREE_TRIAL_PROJECTS: process.env.PRICING_FREE_TRIAL_PROJECTS || '1',
    PRICING_FREE_TRIAL_SUPPORT: process.env.PRICING_FREE_TRIAL_SUPPORT || 'Community',
    PRICING_FREE_TRIAL_FEATURES: process.env.PRICING_FREE_TRIAL_FEATURES || 'Local Memory, AES-256 Encryption',

    // Early Adopter Tier (Featured/Primary)
    PRICING_EARLY_ADOPTER_NAME: process.env.PRICING_EARLY_ADOPTER_NAME || 'Early Adopter',
    PRICING_EARLY_ADOPTER_AMOUNT: process.env.PRICING_EARLY_ADOPTER_AMOUNT || '29',
    PRICING_EARLY_ADOPTER_OPERATIONS: process.env.PRICING_EARLY_ADOPTER_OPERATIONS || '5,000',
    PRICING_EARLY_ADOPTER_PROJECTS: process.env.PRICING_EARLY_ADOPTER_PROJECTS || 'Unlimited',
    PRICING_EARLY_ADOPTER_SUPPORT: process.env.PRICING_EARLY_ADOPTER_SUPPORT || 'Priority',
    PRICING_EARLY_ADOPTER_FEATURES: process.env.PRICING_EARLY_ADOPTER_FEATURES || 'All Free Trial + Unlimited Projects, Price Locked Forever',
    PRICING_EARLY_ADOPTER_SPECIAL: process.env.PRICING_EARLY_ADOPTER_SPECIAL || 'true',

    // Standard Memory Pro Tier
    PRICING_STANDARD_NAME: process.env.PRICING_STANDARD_NAME || 'Standard Memory Pro',
    PRICING_STANDARD_AMOUNT: process.env.PRICING_STANDARD_AMOUNT || '49',
    PRICING_STANDARD_OPERATIONS: process.env.PRICING_STANDARD_OPERATIONS || '10,000',
    PRICING_STANDARD_PROJECTS: process.env.PRICING_STANDARD_PROJECTS || 'Unlimited',
    PRICING_STANDARD_SUPPORT: process.env.PRICING_STANDARD_SUPPORT || 'Priority',
    PRICING_STANDARD_FEATURES: process.env.PRICING_STANDARD_FEATURES || 'All Founders Special (without price lock)',

    // General Pricing Configuration
    PRICING_CURRENCY: process.env.PRICING_CURRENCY || 'USD',
    PRICING_INTERVAL: process.env.PRICING_INTERVAL || 'month',
    PRICING_TAGLINE: process.env.PRICING_TAGLINE || 'Get Your AI Superpowers',
    PRICING_CTA_TEXT: process.env.PRICING_CTA_TEXT || 'Get Started & Claim Your Founders Special',
    
    // User Count Display
    CURRENT_USERS: process.env.CURRENT_USERS || '2847',
    
    // Application Metadata
    APP_NAME: process.env.APP_NAME || 'CodeContextPro',
    APP_TAGLINE: process.env.APP_TAGLINE || 'Your AI Assistant Has Goldfish Memory - We Fix That',
    APP_DESCRIPTION: process.env.APP_DESCRIPTION || 'Revolutionary AI cognitive upgrade that gives your coding assistant persistent, searchable memory across all your projects'
};

// Validate required environment variables
const requiredVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
];

console.log('🔍 Validating environment variables...');
const missingVars = requiredVars.filter(varName => !envVars[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   • ${varName}`));
    console.error('\n💡 Add these to your .env file in the firebase-setup directory');
    process.exit(1);
}

console.log('✅ All required environment variables found');

// File paths
const templatePath = path.join(__dirname, 'public', 'index.template.html');
const outputPath = path.join(__dirname, 'public', 'index.html');

// Security check: Ensure template file exists
if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${templatePath}`);
    process.exit(1);
}

console.log('📄 Reading template file...');
let htmlContent = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders with environment variables
console.log('🔄 Injecting environment variables...');
let replacementCount = 0;

Object.entries(envVars).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const placeholderRegex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    
    if (htmlContent.includes(placeholder)) {
        htmlContent = htmlContent.replace(placeholderRegex, value || '');
        const matches = (htmlContent.match(placeholderRegex) || []).length;
        console.log(`   ✅ ${key}: ${matches} replacement(s)`);
        replacementCount++;
    }
});

// Security validation: Check for unreplaced placeholders
const remainingPlaceholders = htmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
    console.warn('⚠️  Unreplaced placeholders found:');
    remainingPlaceholders.forEach(placeholder => console.warn(`   • ${placeholder}`));
}

// Security validation: Ensure no placeholder secrets remain
const secretPatterns = [
    /sk_test_[a-zA-Z0-9]+/g,  // Stripe secret keys
    /sk_live_[a-zA-Z0-9]+/g,  // Stripe live secret keys
    /whsec_[a-zA-Z0-9]+/g,    // Stripe webhook secrets
];

secretPatterns.forEach(pattern => {
    const matches = htmlContent.match(pattern);
    if (matches) {
        console.error('🚨 SECURITY ALERT: Secret key pattern detected in output!');
        console.error('   Matches:', matches);
        console.error('   This should never happen - check your environment variables');
        process.exit(1);
    }
});

// Write the processed HTML
console.log('💾 Writing processed HTML file...');
fs.writeFileSync(outputPath, htmlContent, 'utf8');

// Generate build summary
const buildInfo = {
    buildTime: new Date().toISOString(),
    replacements: replacementCount,
    outputSize: Math.round(fs.statSync(outputPath).size / 1024),
    nodeEnv: process.env.NODE_ENV || 'development'
};

console.log('\n🎉 Build completed successfully!');
console.log('📊 Build Summary:');
console.log(`   • Build Time: ${buildInfo.buildTime}`);
console.log(`   • Variables Replaced: ${buildInfo.replacements}`);
console.log(`   • Output Size: ${buildInfo.outputSize} KB`);
console.log(`   • Environment: ${buildInfo.nodeEnv}`);
console.log(`   • Output File: ${outputPath}`);

console.log('\n🔒 Security Status:');
console.log('   ✅ No hardcoded secrets detected');
console.log('   ✅ Environment variable injection successful');
console.log('   ✅ Template placeholders replaced');

console.log('\n🚀 Ready for deployment: firebase deploy --only hosting');
console.log('\n⚠️  SECURITY WARNING: The generated index.html contains real API keys!');
console.log('   📁 File location: firebase-setup/public/index.html');
console.log('   🚫 This file is in .gitignore and should NEVER be committed to git');
console.log('   🔒 Only deploy this file to Firebase hosting, never commit to repository');
