#!/bin/bash

# Firebase Functions Configuration Script
# Sets up production environment variables per security specification
# Usage: ./configure-production.sh

echo "🔧 Configuring Firebase Functions for production..."
echo "📋 Per security specification: Zero Hardcoding of Secrets"

# Stripe Configuration
echo "💳 Setting up Stripe configuration..."
firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY"
firebase functions:config:set stripe.webhook_secret="YOUR_STRIPE_WEBHOOK_SECRET"
firebase functions:config:set stripe.founders_price_id="price_1Rn9xXELGHd3NbdJcbNXl8bk"
firebase functions:config:set stripe.pro_price_id="price_1RnA4NELGHd3NbdJyONiR48N"

# Encryption Configuration
echo "🔒 Setting up encryption configuration..."
firebase functions:config:set encryption.master_key="YOUR_ENCRYPTION_MASTER_KEY"

echo "✅ Configuration complete!"
echo ""
echo "📝 Next steps:"
echo "1. Replace YOUR_* placeholders with actual values"
echo "2. Run: firebase deploy --only functions"
echo "3. Verify functions are working"
echo ""
echo "🔍 View current config: firebase functions:config:get"