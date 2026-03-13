import Link from "next/link"
import ForgotPasswordForm from "@/components/ForgotPasswordForm"

export default function ForgotPassword() {
  return (
    <div className="bg-[#0a0a0a] flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-8 shadow-2xl shadow-[#00AFF0]/5">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Link href="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00AFF0] transition-transform hover:scale-105">
                <span className="text-lg font-bold text-white">OF</span>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white">
              Forgot your password?
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {/* Form */}
          <ForgotPasswordForm />

          {/* Footer Links */}
          <div className="mt-6 space-y-2 text-center">
            <Link
              href="/login"
              className="block text-sm text-zinc-500 transition-colors hover:text-[#00AFF0]"
            >
              Back to login
            </Link>
            <p className="text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-[#00AFF0] transition-colors hover:text-[#33C1F5]"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
