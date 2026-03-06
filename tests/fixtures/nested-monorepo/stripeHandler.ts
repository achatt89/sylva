import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
});

// Mock Stripe handler
export async function createPaymentIntent() {
    return await stripe.paymentIntents.create({
        amount: 1000,
        currency: 'usd',
    });
}
