import Link from "next/link"
import Image from "next/image"
import ResetPasswordForm from "@/components/ResetPasswordForm"

export default function ResetPassword() {
  return (
    <div className="mesh-gradient flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="gradient-border rounded-xl border border-white/[0.06] bg-[#111111] p-8 shadow-2xl shadow-purple-500/5">
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
            <h1 className="text-2xl font-bold text-white">
              Set new password
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
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
