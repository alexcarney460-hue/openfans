// Placeholder — OpenFans uses Solana payments, not Stripe.
// This route is kept as a stub to avoid breaking any template references.

export async function POST(req: Request) {
  return new Response(JSON.stringify({ error: 'Not implemented — use Solana payments' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  })
}
