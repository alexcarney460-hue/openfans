"use server"
import { createClient } from '@/utils/supabase/server'
import { redirect } from "next/navigation"
import { revalidatePath } from 'next/cache'
import { db } from '@/utils/db/db'
import { usersTable, affiliatesTable, referralsTable } from '@/utils/db/schema'
import { eq, sql } from 'drizzle-orm'
import { isAdminEmail } from '@/utils/admin'
import { sanitizeRedirectPath } from '@/utils/redirect'


const PUBLIC_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8

function validatePassword(password: string): string | null {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter"
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter"
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number"
    }
    return null
}

function validateEmail(email: string): string | null {
    if (!email || !EMAIL_REGEX.test(email)) {
        return "Please enter a valid email address"
    }
    return null
}

export async function resetPassword(currentState: { message: string }, formData: FormData) {
    const supabase = createClient()
    const passwordData = {
        password: formData.get('password') as string,
        confirm_password: formData.get('confirm_password') as string,
        code: formData.get('code') as string
    }
    if (passwordData.password !== passwordData.confirm_password) {
        return { message: "Passwords do not match" }
    }

    // Server-side password validation for reset
    const pwError = validatePassword(passwordData.password)
    if (pwError) {
        return { message: pwError }
    }

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(passwordData.code)

    if (exchangeError) {
        return { message: "Reset link has expired or is invalid. Please request a new one." }
    }

    let { error } = await supabase.auth.updateUser({
        password: passwordData.password
    })
    if (error) {
        return { message: error.message }
    }
    redirect(`/forgot-password/reset/success`)
}


export async function forgotPassword(currentState: { message: string }, formData: FormData) {
    const supabase = createClient()
    const email = formData.get('email') as string
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${PUBLIC_URL}/forgot-password/reset` })

    if (error) {
        return { message: error.message }
    }
    redirect(`/forgot-password/success`)
}


export async function signup(currentState: { message: string }, formData: FormData) {
    const supabase = createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        username: formData.get('username') as string || formData.get('name') as string || '',
        role: formData.get('role') as string || 'subscriber',
        ref: (formData.get('ref') as string || '').trim(),
    }

    // Server-side email validation
    const emailError = validateEmail(data.email)
    if (emailError) {
        return { message: emailError }
    }

    // Server-side password validation
    const passwordError = validatePassword(data.password)
    if (passwordError) {
        return { message: passwordError }
    }

    // Check if user exists in our database first
    const existingDBUser = await db.select().from(usersTable).where(eq(usersTable.email, data.email))

    if (existingDBUser.length > 0) {
        return { message: "An account with this email already exists. Please login instead." }
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            emailRedirectTo: `${PUBLIC_URL}/auth/callback`,
            data: {
                email_confirm: process.env.NODE_ENV !== 'production',
                full_name: data.username,
            }
        }
    })

    if (signUpError) {
        if (signUpError.message.includes("already registered")) {
            return { message: "An account with this email already exists. Please login instead." }
        }
        return { message: signUpError.message }
    }

    if (!signUpData?.user) {
        return { message: "Failed to create user" }
    }

    try {
        // Create record in DB
        await db.insert(usersTable).values({
            id: signUpData.user.id,
            email: signUpData.user.email!,
            username: data.username,
            display_name: data.username,
            role: isAdminEmail(data.email) ? 'admin' : (data.role === 'creator' ? 'creator' : 'subscriber'),
        })
        // Process referral code if provided
        if (data.ref) {
            try {
                const affiliate = await db
                    .select({ id: affiliatesTable.id, user_id: affiliatesTable.user_id, is_active: affiliatesTable.is_active })
                    .from(affiliatesTable)
                    .where(eq(affiliatesTable.referral_code, data.ref))
                    .limit(1)

                if (affiliate.length > 0 && affiliate[0].is_active && affiliate[0].user_id !== signUpData.user.id) {
                    // Create referral record
                    await db.insert(referralsTable).values({
                        referrer_id: affiliate[0].user_id,
                        referred_user_id: signUpData.user.id,
                        referral_code: data.ref,
                        status: 'active',
                    })

                    // Increment total_referrals on affiliate
                    await db.update(affiliatesTable)
                        .set({ total_referrals: sql`${affiliatesTable.total_referrals} + 1` })
                        .where(eq(affiliatesTable.id, affiliate[0].id))
                }
            } catch (refErr) {
                // Don't fail signup if referral processing fails
                console.error("Referral processing error:", refErr instanceof Error ? refErr.message : "Unknown error")
            }
        }
    } catch (err) {
        console.error("Error in signup:", err instanceof Error ? err.message : "Unknown error")
        return { message: "Failed to setup user account" }
    }

    const redirectPath = data.role === 'creator' ? '/onboarding' : '/dashboard'
    revalidatePath("/", "layout")
    redirect(redirectPath)
}


export async function loginUser(currentState: { message: string }, formData: FormData) {
    const supabase = createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { message: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}


export async function logout() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    redirect('/login')
}


export async function signInWithGoogle() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${PUBLIC_URL}/auth/callback`,
        },
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.url) {
        redirect(data.url)
    }
}


export async function signInWithGithub() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: `${PUBLIC_URL}/auth/callback`,
        },
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.url) {
        redirect(data.url)
    }
}


export async function signInWithTwitter() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
            redirectTo: `${PUBLIC_URL}/auth/callback`,
        },
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.url) {
        redirect(data.url)
    }
}