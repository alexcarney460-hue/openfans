import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/utils/db/db'
import { usersTable } from '@/utils/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
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
            role: 'subscriber',
          })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
