import Link from "next/link"
import LoginForm from "@/components/LoginForm"
import ProviderSigninBlock from "@/components/ProviderSigninBlock"
import WalletConnectButton from "@/components/WalletConnectButton"

export default function Login() {
  return (
    <div className="bg-gray-50 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-2xl shadow-[#00AFF0]/5">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Link href="/" className="transition-transform hover:scale-105">
              <img src="/logo.png" alt="OpenFans" className="h-10" />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to your OpenFans account
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400">or</span>
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
              className="block text-sm text-gray-500 transition-colors hover:text-[#00AFF0]"
            >
              Forgot password?
            </Link>
            <p className="text-sm text-gray-500">
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
