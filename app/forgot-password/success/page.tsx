import Link from "next/link"
import Image from "next/image"

export default function ForgotPasswordSuccess() {
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
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
            <p className="mt-2 text-sm text-gray-500">
              We&apos;ve sent a password reset link to your email address.
              Please check your inbox and follow the instructions.
            </p>
          </div>

          {/* Back to Login */}
          <Link
            href="/login"
            className="bg-[#00AFF0] hover:bg-[#009dd8] block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
