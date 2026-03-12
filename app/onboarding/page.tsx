"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import WalletConnectButton from "@/components/WalletConnectButton"

const CATEGORIES = [
  "Fitness",
  "Entertainment",
  "Trading",
  "Podcasts",
  "Music",
  "Art",
  "Adult",
] as const

type Category = (typeof CATEGORIES)[number]

interface ProfileData {
  displayName: string
  username: string
  bio: string
  avatar: File | null
  avatarPreview: string
  banner: File | null
  bannerPreview: string
}

interface SubscriptionData {
  monthlyPrice: string
  hasPremiumTier: boolean
  premiumPrice: string
  categories: Category[]
}

interface WalletData {
  connected: boolean
  address: string
}

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const [step, setStep] = useState(1)

  // Step 1: Profile
  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    username: "",
    bio: "",
    avatar: null,
    avatarPreview: "",
    banner: null,
    bannerPreview: "",
  })

  // Step 2: Subscription
  const [subscription, setSubscription] = useState<SubscriptionData>({
    monthlyPrice: "",
    hasPremiumTier: false,
    premiumPrice: "",
    categories: [],
  })

  // Step 3: Wallet
  const [wallet, setWallet] = useState<WalletData>({
    connected: false,
    address: "",
  })

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [subErrors, setSubErrors] = useState<Record<string, string>>({})

  function updateProfile<K extends keyof ProfileData>(
    key: K,
    value: ProfileData[K]
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }))
    setProfileErrors((prev) => ({ ...prev, [key]: "" }))
  }

  function updateSubscription<K extends keyof SubscriptionData>(
    key: K,
    value: SubscriptionData[K]
  ) {
    setSubscription((prev) => ({ ...prev, [key]: value }))
    setSubErrors((prev) => ({ ...prev, [key]: "" }))
  }

  function validateProfile(): boolean {
    const errors: Record<string, string> = {}
    if (!profile.displayName.trim()) {
      errors.displayName = "Display name is required"
    }
    if (!profile.username.trim()) {
      errors.username = "Username is required"
    } else if (profile.username.length < 3) {
      errors.username = "Username must be at least 3 characters"
    } else if (!/^[a-zA-Z0-9_]+$/.test(profile.username)) {
      errors.username = "Only letters, numbers, and underscores"
    }
    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateSubscription(): boolean {
    const errors: Record<string, string> = {}
    if (!subscription.monthlyPrice) {
      errors.monthlyPrice = "Set a subscription price"
    } else if (
      isNaN(Number(subscription.monthlyPrice)) ||
      Number(subscription.monthlyPrice) <= 0
    ) {
      errors.monthlyPrice = "Enter a valid price"
    }
    if (subscription.hasPremiumTier) {
      if (!subscription.premiumPrice) {
        errors.premiumPrice = "Set a premium tier price"
      } else if (
        isNaN(Number(subscription.premiumPrice)) ||
        Number(subscription.premiumPrice) <= 0
      ) {
        errors.premiumPrice = "Enter a valid price"
      } else if (
        Number(subscription.premiumPrice) <=
        Number(subscription.monthlyPrice)
      ) {
        errors.premiumPrice = "Premium price must be higher than standard"
      }
    }
    if (subscription.categories.length === 0) {
      errors.categories = "Select at least one category"
    }
    setSubErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateProfile()) return
    if (step === 2 && !validateSubscription()) return
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner"
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (type === "avatar") {
      updateProfile("avatar", file)
      updateProfile("avatarPreview", url)
    } else {
      updateProfile("banner", file)
      updateProfile("bannerPreview", url)
    }
  }

  function toggleCategory(cat: Category) {
    const current = subscription.categories
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat]
    updateSubscription("categories", updated)
  }

  const handleWalletConnect = useCallback((address: string) => {
    setWallet({ connected: true, address })
  }, [])

  const handleWalletDisconnect = useCallback(() => {
    setWallet({ connected: false, address: "" })
  }, [])

  return (
    <div className="mesh-gradient flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[520px]">
        <div className="gradient-border rounded-xl border border-white/[0.06] bg-[#111111] p-8 shadow-2xl shadow-purple-500/5">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Image src="/logo.png" alt="OpenFans" width={48} height={48} />
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Step {step} of {TOTAL_STEPS}
              </span>
              <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="gradient-bg h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between">
              {["Profile", "Subscription", "Wallet", "Done"].map(
                (label, idx) => (
                  <span
                    key={label}
                    className={`text-xs font-medium ${
                      idx + 1 <= step ? "text-[#8b5cf6]" : "text-zinc-600"
                    }`}
                  >
                    {label}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Step 1: Profile Setup */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">
                  Set up your profile
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Tell your fans who you are
                </p>
              </div>

              {/* Banner Upload */}
              <div>
                <Label className="mb-2 block text-zinc-300">
                  Banner Image
                </Label>
                <label
                  htmlFor="banner-upload"
                  className="flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/10 bg-white/[0.02] transition-colors hover:border-white/20"
                >
                  {profile.bannerPreview ? (
                    <img
                      src={profile.bannerPreview}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <svg
                        className="mx-auto h-8 w-8 text-zinc-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                        />
                      </svg>
                      <p className="mt-1 text-xs text-zinc-500">
                        Click to upload banner (1500x500 recommended)
                      </p>
                    </div>
                  )}
                </label>
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "banner")}
                />
              </div>

              {/* Avatar Upload */}
              <div>
                <Label className="mb-2 block text-zinc-300">Avatar</Label>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="avatar-upload"
                    className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-white/10 bg-white/[0.02] transition-colors hover:border-white/20"
                  >
                    {profile.avatarPreview ? (
                      <img
                        src={profile.avatarPreview}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg
                        className="h-8 w-8 text-zinc-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                        />
                      </svg>
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "avatar")}
                  />
                  <p className="text-xs text-zinc-500">
                    Upload a profile picture (400x400 recommended)
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <div className="grid gap-2">
                <Label htmlFor="displayName" className="text-zinc-300">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your display name"
                  value={profile.displayName}
                  onChange={(e) =>
                    updateProfile("displayName", e.target.value)
                  }
                  className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/30"
                  aria-invalid={!!profileErrors.displayName}
                />
                {profileErrors.displayName && (
                  <p className="text-xs text-red-400">
                    {profileErrors.displayName}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="grid gap-2">
                <Label htmlFor="onboard-username" className="text-zinc-300">
                  Username
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    @
                  </span>
                  <Input
                    id="onboard-username"
                    type="text"
                    placeholder="yourname"
                    value={profile.username}
                    onChange={(e) =>
                      updateProfile("username", e.target.value)
                    }
                    className="border-white/10 bg-white/5 pl-8 text-white placeholder:text-zinc-500 focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/30"
                    aria-invalid={!!profileErrors.username}
                  />
                </div>
                {profileErrors.username && (
                  <p className="text-xs text-red-400">
                    {profileErrors.username}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="grid gap-2">
                <Label htmlFor="bio" className="text-zinc-300">
                  Bio
                </Label>
                <textarea
                  id="bio"
                  placeholder="Tell your fans about yourself..."
                  value={profile.bio}
                  onChange={(e) => updateProfile("bio", e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-[#8b5cf6]/50 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:ring-offset-0"
                />
                <p className="text-right text-xs text-zinc-600">
                  {profile.bio.length}/300
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Subscription Setup */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">
                  Set your pricing
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Choose how much fans pay to subscribe
                </p>
              </div>

              {/* Monthly Price */}
              <div className="grid gap-2">
                <Label htmlFor="monthlyPrice" className="text-zinc-300">
                  Monthly Subscription Price
                </Label>
                <div className="relative">
                  <Input
                    id="monthlyPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="9.99"
                    value={subscription.monthlyPrice}
                    onChange={(e) =>
                      updateSubscription("monthlyPrice", e.target.value)
                    }
                    className="border-white/10 bg-white/5 pr-16 text-white placeholder:text-zinc-500 focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/30"
                    aria-invalid={!!subErrors.monthlyPrice}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
                    USDC/mo
                  </span>
                </div>
                {subErrors.monthlyPrice && (
                  <p className="text-xs text-red-400">
                    {subErrors.monthlyPrice}
                  </p>
                )}
              </div>

              {/* Premium Tier Toggle */}
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <label className="flex cursor-pointer items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Add Premium Tier
                    </p>
                    <p className="text-xs text-zinc-500">
                      Offer an exclusive tier with higher pricing
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={subscription.hasPremiumTier}
                      onChange={(e) =>
                        updateSubscription("hasPremiumTier", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`h-6 w-11 rounded-full transition-colors ${
                        subscription.hasPremiumTier
                          ? "bg-[#8b5cf6]"
                          : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                          subscription.hasPremiumTier
                            ? "translate-x-[22px]"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </div>
                </label>

                {subscription.hasPremiumTier && (
                  <div className="mt-4 grid gap-2">
                    <Label htmlFor="premiumPrice" className="text-zinc-300">
                      Premium Tier Price
                    </Label>
                    <div className="relative">
                      <Input
                        id="premiumPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="29.99"
                        value={subscription.premiumPrice}
                        onChange={(e) =>
                          updateSubscription("premiumPrice", e.target.value)
                        }
                        className="border-white/10 bg-white/5 pr-16 text-white placeholder:text-zinc-500 focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/30"
                        aria-invalid={!!subErrors.premiumPrice}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
                        USDC/mo
                      </span>
                    </div>
                    {subErrors.premiumPrice && (
                      <p className="text-xs text-red-400">
                        {subErrors.premiumPrice}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Category Selection */}
              <div className="grid gap-2">
                <Label className="text-zinc-300">
                  Content Categories
                </Label>
                <p className="text-xs text-zinc-500">
                  Select one or more categories that describe your content
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const selected = subscription.categories.includes(cat)
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          selected
                            ? "border-[#8b5cf6] bg-[#8b5cf6]/15 text-[#a78bfa]"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
                {subErrors.categories && (
                  <p className="text-xs text-red-400">
                    {subErrors.categories}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Wallet Connect */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">
                  Connect your wallet
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Connect your Solana wallet to receive payments
                </p>
              </div>

              {/* Wallet Illustration */}
              <div className="flex justify-center py-4">
                <div className="gradient-bg flex h-20 w-20 items-center justify-center rounded-2xl">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.008a2.244 2.244 0 011.547.645l.746.746M21 12a2.25 2.25 0 01-2.25 2.25H15a3 3 0 100 6h.008a2.244 2.244 0 001.547-.645l.746-.746M21 12H3m18 0a2.25 2.25 0 00-2.25-2.25H15m6 4.5V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25"
                    />
                  </svg>
                </div>
              </div>

              {/* Info Boxes */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#8b5cf6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                  <p className="text-xs text-zinc-400">
                    Your wallet is used to receive subscription payments in USDC
                    and SOL directly from fans.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#ec4899]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  <p className="text-xs text-zinc-400">
                    We never have access to your funds. All payments go directly
                    to your wallet via smart contracts.
                  </p>
                </div>
              </div>

              {/* Wallet Connect Button */}
              <WalletConnectButton
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
              />
            </div>
          )}

          {/* Step 4: All Set */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="gradient-bg flex h-20 w-20 items-center justify-center rounded-full">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  You&apos;re all set!
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Your creator profile is ready. Start sharing content and
                  building your audience.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-2 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Username</span>
                  <span className="text-sm text-white">
                    @{profile.username}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Monthly Price</span>
                  <span className="text-sm text-white">
                    {subscription.monthlyPrice} USDC
                  </span>
                </div>
                {subscription.hasPremiumTier && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Premium Price</span>
                    <span className="text-sm text-white">
                      {subscription.premiumPrice} USDC
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Wallet</span>
                  <span className="text-sm text-white">
                    {wallet.connected
                      ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
                      : "Not connected"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Categories</span>
                  <span className="text-sm text-white">
                    {subscription.categories.join(", ")}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link
                  href="/dashboard"
                  className="gradient-bg flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href={`/${profile.username}`}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
                >
                  View My Profile
                </Link>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < TOTAL_STEPS && (
            <div className="mt-8 flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className={`gradient-bg rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
                  step > 1 ? "flex-1" : "w-full"
                }`}
              >
                {step === 3 && !wallet.connected ? "Skip for now" : "Continue"}
              </button>
            </div>
          )}

          {/* Skip on wallet step */}
          {step === 3 && wallet.connected && (
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="gradient-bg flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
