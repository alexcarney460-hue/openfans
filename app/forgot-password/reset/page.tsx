import Link from "next/link"
import Image from "next/image"
import ResetPasswordForm from "@/components/ResetPasswordForm"

export default function ResetPassword() {
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

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Set new password
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}
