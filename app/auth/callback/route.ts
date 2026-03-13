import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/utils/db/db'
import { usersTable } from '@/utils/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminEmail } from '@/utils/admin'
import { sanitizeRedirectPath } from '@/utils/redirect'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  const next = sanitizeRedirectPath(rawNext)

  if (code) {
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('OAuth code exchange error:', error.message)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if user already exists in DB
        const existing = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, user.id))

        if (existing.length === 0) {
          // Create user record
          const emailPrefix = user.email?.split('@')[0] ?? `user${Date.now()}`
          const displayName =
            user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'

          await db.insert(usersTable).values({
            id: user.id,
            email: user.email!,
            username: emailPrefix,
            display_name: displayName,
            avatar_url: user.user_metadata?.picture ?? user.user_metadata?.avatar_url ?? null,
            role: isAdminEmail(user.email ?? '') ? 'admin' : 'subscriber',
          })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      // Validate x-forwarded-host against the origin to prevent host injection
      const originHost = new URL(origin).host
      const trustedHost =
        forwardedHost && forwardedHost === originHost ? forwardedHost : null

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (trustedHost) {
        return NextResponse.redirect(`https://${trustedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (err) {
      console.error('OAuth callback error:', err instanceof Error ? err.message : err)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
