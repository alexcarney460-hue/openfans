import Link from "next/link"
import Image from "next/image"
import LoginForm from "@/components/LoginForm"
import ProviderSigninBlock from "@/components/ProviderSigninBlock"
import WalletConnectButton from "@/components/WalletConnectButton"

export default function Login() {
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
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Sign in to your OpenFans account
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111111] px-3 text-zinc-500">or</span>
            </div>
          </div>

          {/* Wallet Connect */}
          <WalletConnectButton className="mb-3" />

          {/* Social Logins */}
          <ProviderSigninBlock />

          {/* Footer Links */}
          <div className="mt-6 space-y-2 text-center">
            <Link
              href="/forgot-password"
              className="block text-sm text-zinc-500 transition-colors hover:text-[#8b5cf6]"
            >
              Forgot password?
            </Link>
            <p className="text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-[#8b5cf6] transition-colors hover:text-[#a78bfa]"
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
