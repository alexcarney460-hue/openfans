import Link from "next/link"
import Image from "next/image"

export default function ResetPasswordSuccess() {
  return (
    <div className="bg-gray-50 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-2xl shadow-[#00AFF0]/5">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="OpenFans"
                width={48}
                height={48}
                className="transition-transform hover:scale-105"
              />
            </Link>
          </div>

          {/* Success Icon */}
          <div className="mb-4 flex justify-center">
            <div className="bg-[#00AFF0] flex h-14 w-14 items-center justify-center rounded-full">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Password reset successful
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Your password has been updated. You can now sign in with your new
              password.
            </p>
          </div>

          {/* Login Button */}
          <Link
            href="/login"
            className="bg-[#00AFF0] hover:bg-[#009dd8] block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
