"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { signup } from "@/app/auth/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="bg-[#00AFF0] hover:bg-[#009dd8] mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
          <span>Creating account...</span>
        </>
      ) : (
        "Create Account"
      )}
    </button>
  )
}

type Role = "creator" | "fan" | null

interface FormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
  terms?: string
}

export default function SignupForm({ refCode = "" }: { refCode?: string }) {
  const initialState = { message: "" }
  const [formState, formAction] = useFormState(signup, initialState)

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<Role>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!username || username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Only letters, numbers, and underscores allowed"
    }
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    if (!role) {
      newErrors.role = "Please select a role"
    }
    if (!termsAccepted) {
      newErrors.terms = "You must accept the Terms of Service"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function clearError(key: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [key]: undefined }))
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
      {/* Role Selector */}
      <div className="mb-4 grid gap-2">
        <Label className="text-gray-700">I am a...</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setRole("creator")
              clearError("role")
            }}
            className={`rounded-lg border px-4 py-3 text-center text-sm font-medium transition-all ${
              role === "creator"
                ? "border-[#00AFF0] bg-[#00AFF0]/10 text-gray-900"
                : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <div className="mb-1 text-lg">
              <svg
                className="mx-auto h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            Creator
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("fan")
              clearError("role")
            }}
            className={`rounded-lg border px-4 py-3 text-center text-sm font-medium transition-all ${
              role === "fan"
                ? "border-[#00AFF0] bg-[#00AFF0]/10 text-gray-900"
                : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <div className="mb-1 text-lg">
              <svg
                className="mx-auto h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            Fan
          </button>
        </div>
        {errors.role && (
          <p className="text-xs text-red-400">{errors.role}</p>
        )}
        <input type="hidden" name="role" value={role || ""} />
        {refCode && <input type="hidden" name="ref" value={refCode} />}
      </div>

      {/* Username */}
      <div className="grid gap-2">
        <Label htmlFor="username" className="text-gray-700">
          Username
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            @
          </span>
          <Input
            id="username"
            type="text"
            placeholder="yourname"
            name="username"
            required
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              clearError("username")
            }}
            className="border-gray-200 bg-gray-50 pl-8 text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
            aria-describedby={errors.username ? "username-error" : undefined}
            aria-invalid={errors.username ? true : undefined}
          />
        </div>
        {errors.username && (
          <p id="username-error" className="text-xs text-red-400">
            {errors.username}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="mt-3 grid gap-2">
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
            clearError("email")
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

      {/* Password */}
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
            clearError("password")
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

      {/* Confirm Password */}
      <div className="mt-3 grid gap-2">
        <Label htmlFor="confirm_password" className="text-gray-700">
          Confirm Password
        </Label>
        <Input
          id="confirm_password"
          type="password"
          name="confirm_password"
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            clearError("confirmPassword")
          }}
          className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
          aria-describedby={
            errors.confirmPassword ? "confirm-password-error" : undefined
          }
          aria-invalid={errors.confirmPassword ? true : undefined}
        />
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="text-xs text-red-400">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="mt-4">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked)
              clearError("terms")
            }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 bg-gray-50 text-[#00AFF0] focus:ring-[#00AFF0]/30"
          />
          <span className="text-xs text-gray-500">
            I agree to the{" "}
            <a
              href="/terms"
              className="text-[#00AFF0] underline hover:text-[#33C1F5]"
            >
              Terms of Service
            </a>
          </span>
        </label>
        {errors.terms && (
          <p className="mt-1 text-xs text-red-400">{errors.terms}</p>
        )}
      </div>

      <SubmitButton disabled={!termsAccepted} />
      {formState?.message && (
        <p className="mt-2 text-center text-sm text-red-400" role="alert">
          {formState.message}
        </p>
      )}
    </form>
  )
}
