"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { forgotPassword } from "@/app/auth/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#00AFF0] hover:bg-[#009dd8] mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Sending...</span>
        </>
      ) : (
        "Reset Password"
      )}
    </button>
  )
}

export default function ForgotPasswordForm() {
  const initialState = { message: "" }
  const [formState, formAction] = useFormState(forgotPassword, initialState)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  function validate(): boolean {
    if (!email) {
      setError("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email")
      return false
    }
    setError("")
    return true
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!validate()) {
          e.preventDefault()
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-zinc-300">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          name="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError("")
          }}
          className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
          aria-describedby={error ? "email-error" : undefined}
          aria-invalid={error ? true : undefined}
        />
        {error && (
          <p id="email-error" className="text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
      <SubmitButton />
      {formState?.message && (
        <p className="mt-2 text-center text-sm text-red-400" role="alert">
          {formState.message}
        </p>
      )}
    </form>
  )
}
