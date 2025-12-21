# Exemple Stripe
import stripe

stripe.api_key = "sk_test_..."

def create_payment_intent(amount: int, currency: str = "usd"):
    intent = stripe.PaymentIntent.create(
        amount=amount,
        currency=currency
    )
    return intent
