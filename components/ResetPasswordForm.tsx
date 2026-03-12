"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { resetPassword } from "@/app/auth/actions"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function GetCodeHiddenInput() {
  const searchParams = useSearchParams()
  return <input type="hidden" name="code" value={searchParams.get("code") || ""} />
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="gradient-bg mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
          <span>Updating...</span>
        </>
      ) : (
        "Update Password"
      )}
    </button>
  )
}

export default function ResetPasswordForm() {
  const initialState = { message: "" }
  const [formState, formAction] = useFormState(resetPassword, initialState)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  function validate(): boolean {
    const newErrors: { password?: string; confirmPassword?: string } = {}
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
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
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-zinc-300">
            New Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter new password"
            name="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/30"
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={errors.password ? true : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-red-400">
              {errors.password}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm_password" className="text-zinc-300">
            Confirm Password
          </Label>
          <Input
            id="confirm_password"
            type="password"
            placeholder="Confirm new password"
            name="confirm_password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
            }}
            className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/30"
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
        <Suspense>
          <GetCodeHiddenInput />
        </Suspense>
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
