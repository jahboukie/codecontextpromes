#!/usr/bin/env node
/**
 * CodeContextPro-MES Secure Build Script
 * Injects environment variables into public/index.html from template
 * SECURITY: Ensures no secrets are committed to repository
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔨 CodeContextPro-MES Secure Build Process');

// Security check: Ensure we're not in production without proper config
if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PROJECT_ID) {
  console.error('❌ SECURITY ERROR: Production build requires FIREBASE_PROJECT_ID');
  process.exit(1);
}

// Required environment variables (PUBLIC - safe for client-side)
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN', 
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'STRIPE_PUBLISHABLE_KEY'
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('   Please check your .env file or environment configuration.');
  process.exit(1);
}

// Security validation: Check for accidental secret keys in env
const secrets = ['SECRET', 'PRIVATE', 'sk_', 'rk_'];
Object.keys(process.env).forEach(key => {
  if (secrets.some(secret => key.includes(secret))) {
    console.warn(`⚠️  WARNING: Potentially sensitive environment variable: ${key}`);
  }
});

try {
  // Read template file
  const templatePath = path.join(__dirname, 'public', 'index.template.html');
  const outputPath = path.join(__dirname, 'public', 'index.html');
  
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${templatePath}`);
    process.exit(1);
  }
  
  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  
  // Replace environment variables in template
  requiredEnvVars.forEach(varName => {
    const placeholder = `{{${varName}}}`;
    const value = process.env[varName];
    
    if (htmlContent.includes(placeholder)) {
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      console.log(`✅ Injected ${varName}`);
    }
  });
  
  // Security check: Ensure no unreplaced placeholders remain
  const remainingPlaceholders = htmlContent.match(/{{[^}]+}}/g);
  if (remainingPlaceholders) {
    console.error('❌ SECURITY ERROR: Unreplaced placeholders found:');
    remainingPlaceholders.forEach(placeholder => console.error(`   - ${placeholder}`));
    process.exit(1);
  }
  
  // Write processed file
  fs.writeFileSync(outputPath, htmlContent);
  console.log(`✅ Successfully built ${outputPath}`);
  
  // Security verification
  const builtSize = fs.statSync(outputPath).size;
  console.log(`📊 Built file size: ${builtSize} bytes`);
  
  if (builtSize < 1000) {
    console.warn('⚠️  WARNING: Built file seems unusually small - verify template content');
  }
  
  console.log('🎉 Secure build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}