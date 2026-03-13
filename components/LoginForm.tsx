"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { loginUser } from "@/app/auth/actions"
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
          <span>Signing in...</span>
        </>
      ) : (
        "Log In"
      )}
    </button>
  )
}

export default function LoginForm() {
  const initialState = { message: "" }
  const [formState, formAction] = useFormState(loginUser, initialState)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  )

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {}
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
        <Label htmlFor="email" className="text-gray-700">
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
            setErrors((prev) => ({ ...prev, email: undefined }))
          }}
          className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={errors.email ? true : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-400">
            {errors.email}
          </p>
        )}
      </div>
      <div className="mt-3 grid gap-2">
        <Label htmlFor="password" className="text-gray-700">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          name="password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrors((prev) => ({ ...prev, password: undefined }))
          }}
          className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
          aria-describedby={errors.password ? "password-error" : undefined}
          aria-invalid={errors.password ? true : undefined}
        />
        {errors.password && (
          <p id="password-error" className="text-xs text-red-400">
            {errors.password}
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
