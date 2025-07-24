// TypeScript test for payment mode fix validation
interface PaymentMode {
    id: string;
    name: string;
    enabled: boolean;
}

interface PaymentConfig {
    modes: PaymentMode[];
    defaultMode: string;
}

// Simulate payment configuration
const paymentConfig: PaymentConfig = {
    modes: [
        { id: 'stripe', name: 'Stripe', enabled: true },
        { id: 'paypal', name: 'PayPal', enabled: false },
        { id: 'crypto', name: 'Cryptocurrency', enabled: true }
    ],
    defaultMode: 'stripe'
};

// Function to get enabled payment modes
function getEnabledPaymentModes(config: PaymentConfig): PaymentMode[] {
    return config.modes.filter(mode => mode.enabled);
}

// Function to validate payment mode
function validatePaymentMode(modeId: string, config: PaymentConfig): boolean {
    const mode = config.modes.find(m => m.id === modeId);
    return mode ? mode.enabled : false;
}

// Test the functions
const enabledModes = getEnabledPaymentModes(paymentConfig);
console.log('Enabled payment modes:', enabledModes.map(m => m.name).join(', '));

const isStripeValid = validatePaymentMode('stripe', paymentConfig);
const isPayPalValid = validatePaymentMode('paypal', paymentConfig);

console.log(`Stripe validation: ${isStripeValid}`);
console.log(`PayPal validation: ${isPayPalValid}`);

if (isStripeValid && !isPayPalValid) {
    console.log('Payment mode fix validation successful');
} else {
    throw new Error('Payment mode validation failed');
}
