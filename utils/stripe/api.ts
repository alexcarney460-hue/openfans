// Stripe is not used — OpenFans uses Solana/USDC payments.
// These stubs prevent build errors from leftover template imports.

export async function getStripePlan(_email: string): Promise<string> {
  return 'none'
}

export async function createStripeCustomer(
  _id: string,
  _email: string,
  _name?: string,
): Promise<string> {
  return 'not-implemented'
}

export async function createStripeCheckoutSession(
  _email: string,
): Promise<string> {
  return ''
}

export async function generateStripeBillingPortalLink(
  _email: string,
): Promise<string> {
  return ''
}
