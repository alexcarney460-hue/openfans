import Link from "next/link"
import SignupForm from "@/components/SignupForm"
import ProviderSigninBlock from "@/components/ProviderSigninBlock"
import WalletConnectButton from "@/components/WalletConnectButton"

export default function Signup() {
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
              Join{" "}
              <span className="text-[#00AFF0]">OpenFans</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Create your account to get started
            </p>
          </div>

          {/* Signup Form */}
          <SignupForm />

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

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#00AFF0] transition-colors hover:text-[#33C1F5]"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
