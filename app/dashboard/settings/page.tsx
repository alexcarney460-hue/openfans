"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Wallet, Trash2, Loader2, ImageIcon, Copy, Check, Share2, ArrowRight, ShieldCheck, ShieldAlert, Shield, Clock, CalendarClock, Globe, X, MapPin, Info, Crown } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTrack } from "@/hooks/useTrack";
import TaxInfoForm from "@/components/TaxInfoForm";

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  id: string;
  label: string;
  description?: string;
}

function ToggleSwitch({ enabled, onToggle, id, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          enabled ? "bg-[#00AFF0]" : "bg-gray-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [messageAlerts, setMessageAlerts] = useState(true);

  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState("");
  const [vipEnabled, setVipEnabled] = useState(false);
  const [vipPrice, setVipPrice] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [contentType, setContentType] = useState<"general" | "adult" | "ai_influencer">("general");
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceSaveError, setPriceSaveError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const [showActivity, setShowActivity] = useState(true);
  const [allowMessages, setAllowMessages] = useState(false);

  // Geo-blocking state
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
  const [blockedRegions, setBlockedRegions] = useState<string[]>([]);
  const [geoSaving, setGeoSaving] = useState(false);
  const [geoSaveMessage, setGeoSaveMessage] = useState<string | null>(null);
  const [geoLoaded, setGeoLoaded] = useState(false);
  const [addCountryInput, setAddCountryInput] = useState("");

  const [payoutSchedule, setPayoutSchedule] = useState<"manual" | "weekly" | "monthly">("manual");
  const [payoutScheduleSaving, setPayoutScheduleSaving] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("subscriber");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [founderNumber, setFounderNumber] = useState<number | null>(null);
  const { publicKey, connected, connecting, select, connect, wallets } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const track = useTrack();
  const [walletError, setWalletError] = useState<string | null>(null);


  const handleConnectWallet = useCallback(async () => {
    track("wallet_connect_click");
    setWalletError(null);

    // Try direct connect to Phantom first (most common)
    const phantom = wallets.find(
      (w) => w.adapter.name === "Phantom" && w.adapter.readyState === "Installed"
    );

    if (phantom) {
      try {
        select(phantom.adapter.name);
        // Small delay to let select() update state
        await new Promise((r) => setTimeout(r, 100));
        await connect();
        return;
      } catch (err) {
        console.error("Direct connect failed:", err);
        // Fall through to modal
      }
    }

    // Fallback: open the wallet selection modal
    setWalletModalVisible(true);
  }, [wallets, select, connect, setWalletModalVisible, track]);

  // When wallet connects via adapter, save the address to the user profile
  useEffect(() => {
    if (connected && publicKey) {
      const addr = publicKey.toBase58();
      setWalletAddress(addr);
      fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: addr }),
      }).catch(() => {
        setSaveMessage("Wallet connected but failed to save address to your profile.");
      });
    }
  }, [connected, publicKey]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const json = await res.json();
        const user = json.data;
        if (user) {
          setDisplayName(user.display_name ?? "");
          setUsername(user.username ?? "");
          setBio(user.bio ?? "");
          setEmail(user.email ?? "");
          setAvatarUrl(user.avatar_url ?? null);
          setBannerUrl(user.banner_url ?? null);
          setUserRole(user.role ?? "subscriber");
          setWalletAddress(user.wallet_address ?? null);

          // Load creator profile data if creator
          if (user.role === "creator" || user.role === "admin") {
            try {
              const [cpRes, vRes] = await Promise.allSettled([
                fetch("/api/creator-profile"),
                fetch("/api/verification"),
              ]);
              if (cpRes.status === "fulfilled" && cpRes.value.ok) {
                const cpJson = await cpRes.value.json();
                if (cpJson.data) {
                  // subscription_price_usdc is in cents, convert to dollars for display
                  const basicCents = cpJson.data.subscription_price_usdc;
                  setSubscriptionPrice(basicCents ? (basicCents / 100).toString() : "");
                  const loadedCategories = cpJson.data.categories ?? [];
                  setCategories(loadedCategories);
                  setContentType(
                    loadedCategories.some((c: string) => c.toLowerCase() === "ai_influencer" || c.toLowerCase() === "ai")
                      ? "ai_influencer"
                      : loadedCategories.some((c: string) => c.toLowerCase() === "adult")
                        ? "adult"
                        : "general",
                  );

                  // Load tier pricing
                  const premCents = cpJson.data.premium_price_usdc;
                  if (premCents != null) {
                    setPremiumEnabled(true);
                    setPremiumPrice((premCents / 100).toString());
                  }
                  const vipCents = cpJson.data.vip_price_usdc;
                  if (vipCents != null) {
                    setVipEnabled(true);
                    setVipPrice((vipCents / 100).toString());
                  }

                  // Load founder status
                  if (cpJson.data.is_founder) {
                    setIsFounder(true);
                    setFounderNumber(cpJson.data.founder_number ?? null);
                  }

                  // Load payout schedule
                  if (cpJson.data.payout_schedule) {
                    setPayoutSchedule(cpJson.data.payout_schedule);
                  }
                }
              }
              if (vRes.status === "fulfilled" && vRes.value.ok) {
                const vJson = await vRes.value.json();
                if (vJson.data) {
                  setVerificationStatus(vJson.data.verification_status);
                }
              }

              // Load geo-blocking settings
              try {
                const geoRes = await fetch("/api/creator-profile/geo-blocking");
                if (geoRes.ok) {
                  const geoJson = await geoRes.json();
                  if (geoJson.data) {
                    setBlockedCountries(geoJson.data.blocked_countries ?? []);
                    setBlockedRegions(geoJson.data.blocked_regions ?? []);
                    setGeoLoaded(true);
                  }
                }
              } catch {
                // non-critical
              }
            } catch {
              // non-critical
            }
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setSaveMessage(null);

    try {
      // Upload to storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const json = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
        setSaveMessage(json.error ?? "Failed to upload avatar.");
        return;
      }

      const uploadJson = await uploadRes.json();
      const newAvatarUrl = uploadJson.data.url;

      // Update profile with new avatar URL
      const patchRes = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: newAvatarUrl }),
      });

      if (patchRes.ok) {
        setAvatarUrl(newAvatarUrl);
        setSaveMessage("Avatar updated successfully.");
      } else {
        const json = await patchRes.json().catch(() => ({ error: "Unknown error" }));
        setSaveMessage(json.error ?? "Failed to update avatar.");
      }
    } catch {
      setSaveMessage("Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
      // Reset input so same file can be re-selected
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploading(true);
    setSaveMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "banners");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const json = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
        setSaveMessage(json.error ?? "Failed to upload banner.");
        return;
      }

      const uploadJson = await uploadRes.json();
      const newBannerUrl = uploadJson.data.url;

      const patchRes = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banner_url: newBannerUrl }),
      });

      if (patchRes.ok) {
        setBannerUrl(newBannerUrl);
        setSaveMessage("Banner updated successfully.");
      } else {
        const json = await patchRes.json().catch(() => ({ error: "Unknown error" }));
        setSaveMessage(json.error ?? "Failed to update banner.");
      }
    } catch {
      setSaveMessage("Failed to upload banner.");
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          username,
          bio,
        }),
      });

      if (res.ok) {
        setSaveMessage("Settings saved successfully.");
      } else {
        const json = await res.json().catch(() => ({ error: "Unknown error" }));
        setSaveMessage(json.error ?? "Failed to save settings.");
      }
    } catch {
      setSaveMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyProfileLink = useCallback(async () => {
    if (!username) return;
    const profileUrl = `${window.location.origin}/${username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = profileUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [username]);

  const handleSaveSubscriptionPrice = async () => {
    setPriceSaving(true);
    setSaveMessage(null);
    setPriceSaveError(null);

    // Client-side tier price validation
    const basicVal = Number(subscriptionPrice);
    const premiumVal = premiumEnabled ? Number(premiumPrice) : null;
    const vipVal = vipEnabled ? Number(vipPrice) : null;

    if (premiumVal !== null && premiumVal <= basicVal) {
      setPriceSaveError("Premium price must be greater than Basic price.");
      setPriceSaving(false);
      return;
    }
    if (vipVal !== null && premiumVal !== null && vipVal <= premiumVal) {
      setPriceSaveError("VIP price must be greater than Premium price.");
      setPriceSaving(false);
      return;
    }
    if (vipVal !== null && premiumVal === null && vipVal <= basicVal) {
      setPriceSaveError("VIP price must be greater than Basic price.");
      setPriceSaving(false);
      return;
    }

    try {
      // Build the categories array: merge existing categories
      // with the content type selection (strip old type markers first)
      const baseCategories = categories.filter(
        (c) => c.toLowerCase() !== "adult" && c.toLowerCase() !== "ai_influencer" && c.toLowerCase() !== "ai",
      );
      const finalCategories =
        contentType === "adult"
          ? [...baseCategories, "adult"]
          : contentType === "ai_influencer"
            ? [...baseCategories, "ai_influencer"]
            : baseCategories;

      const res = await fetch("/api/creator-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_price: basicVal,
          premium_price: premiumVal,
          vip_price: vipVal,
          categories: finalCategories.length > 0 ? finalCategories : ["general"],
        }),
      });

      if (res.ok) {
        setSaveMessage("Subscription pricing saved successfully.");
      } else {
        const json = await res.json().catch(() => ({ error: "Unknown error" }));
        setSaveMessage(json.error ?? "Failed to save subscription pricing.");
      }
    } catch {
      setSaveMessage("Failed to save subscription pricing.");
    } finally {
      setPriceSaving(false);
    }
  };

  const handleSavePayoutSchedule = async (schedule: "manual" | "weekly" | "monthly") => {
    setPayoutScheduleSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/creator-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_schedule: schedule }),
      });

      if (res.ok) {
        setPayoutSchedule(schedule);
        setSaveMessage(
          schedule === "manual"
            ? "Payout schedule set to manual. Request payouts from your earnings page."
            : `Payout schedule set to ${schedule}. Payouts will be processed automatically.`,
        );
      } else {
        const json = await res.json().catch(() => ({ error: "Unknown error" }));
        setSaveMessage(json.error ?? "Failed to update payout schedule.");
      }
    } catch {
      setSaveMessage("Failed to update payout schedule.");
    } finally {
      setPayoutScheduleSaving(false);
    }
  };

  const handleSaveGeoBlocking = async () => {
    setGeoSaving(true);
    setGeoSaveMessage(null);

    try {
      const res = await fetch("/api/creator-profile/geo-blocking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocked_countries: blockedCountries,
          blocked_regions: blockedRegions,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setBlockedCountries(json.data.blocked_countries ?? blockedCountries);
        setBlockedRegions(json.data.blocked_regions ?? blockedRegions);
        setGeoSaveMessage("Geo-blocking settings saved successfully.");
        setSaveMessage("Geo-blocking settings saved successfully.");
      } else {
        const json = await res.json().catch(() => ({ error: "Unknown error" }));
        setGeoSaveMessage(json.error ?? "Failed to save geo-blocking settings.");
      }
    } catch {
      setGeoSaveMessage("Failed to save geo-blocking settings.");
    } finally {
      setGeoSaving(false);
    }
  };

  const handleToggleCountry = (code: string) => {
    setBlockedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleToggleRegion = (regionCode: string) => {
    setBlockedRegions((prev) =>
      prev.includes(regionCode)
        ? prev.filter((r) => r !== regionCode)
        : [...prev, regionCode],
    );
  };

  const handleAddCustomCountry = () => {
    const code = addCountryInput.toUpperCase().trim();
    if (code.length === 2 && /^[A-Z]{2}$/.test(code) && !blockedCountries.includes(code)) {
      setBlockedCountries((prev) => [...prev, code]);
      setAddCountryInput("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isCreator = userRole === "creator" || userRole === "admin";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, account, and preferences.
          </p>
        </div>
        {username && (
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 gap-2"
            onClick={handleCopyProfileLink}
          >
            {linkCopied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Copy Profile Link
              </>
            )}
          </Button>
        )}
      </div>

      {saveMessage && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          saveMessage.includes("success")
            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
            : "border-red-200 bg-red-50 text-red-600"
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Founder Creator Badge */}
      {isCreator && isFounder && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-800">
                Founding Creator{founderNumber ? ` #${founderNumber}` : ""}
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                Lifetime
              </span>
            </div>
            <p className="mt-0.5 text-xs text-amber-600/80">
              You pay just 5% platform fee for life &mdash; even on adult content.
            </p>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Profile Settings</h2>

          {/* Avatar upload */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#00AFF0] text-2xl font-bold text-white">
                  {displayName.charAt(0) || "?"}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-200 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Upload avatar"
              >
                {avatarUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF, or WebP. Max 5MB.</p>
            </div>
          </div>

          {/* Banner upload (creators only) */}
          {(userRole === "creator" || userRole === "admin") && (
            <div className="mb-6">
              <p className="text-sm font-medium text-foreground mb-2">Banner Image</p>
              <div
                className="relative h-32 w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-[#00AFF0]/50 transition-colors"
                onClick={() => bannerInputRef.current?.click()}
              >
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <span className="text-sm">Click to upload a banner image</span>
                    <span className="text-xs text-gray-300 mt-1">Recommended: 1500 x 500px</span>
                  </div>
                )}
                {bannerUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                {bannerUrl && !bannerUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                    <Camera className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleBannerUpload}
              />
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, or WebP. Max 50MB.</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="displayName" className="text-sm text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
                />
              </div>
              <div>
                <Label htmlFor="username" className="text-sm text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio" className="text-sm text-muted-foreground">
                Bio
              </Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={2000}
                rows={3}
                className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/30 focus:outline-none resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status (creators only) */}
      {isCreator && verificationStatus && (
        <Card className={`bg-white ${
          verificationStatus === "verified"
            ? "border-emerald-200"
            : verificationStatus === "rejected"
              ? "border-red-200"
              : verificationStatus === "pending"
                ? "border-amber-200"
                : "border-gray-200"
        }`}>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Identity Verification</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {verificationStatus === "verified" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                ) : verificationStatus === "pending" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                ) : verificationStatus === "rejected" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Shield className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    verificationStatus === "verified"
                      ? "text-emerald-700"
                      : verificationStatus === "rejected"
                        ? "text-red-700"
                        : verificationStatus === "pending"
                          ? "text-amber-700"
                          : "text-foreground"
                  }`}>
                    {verificationStatus === "verified"
                      ? "Verified"
                      : verificationStatus === "pending"
                        ? "Under Review"
                        : verificationStatus === "rejected"
                          ? "Rejected"
                          : "Not Verified"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {verificationStatus === "verified"
                      ? "Your identity has been confirmed."
                      : verificationStatus === "pending"
                        ? "Your documents are being reviewed."
                        : verificationStatus === "rejected"
                          ? "Your verification was not approved. Please resubmit."
                          : "Complete verification to publish content."}
                  </p>
                </div>
              </div>
              {verificationStatus !== "verified" && verificationStatus !== "pending" && (
                <Button asChild size="sm" className="bg-[#00AFF0] hover:bg-[#009dd8]">
                  <Link href="/dashboard/verification">
                    {verificationStatus === "rejected" ? "Resubmit" : "Verify Now"}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Settings */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="mt-1.5 border-gray-200 bg-gray-50 text-muted-foreground cursor-not-allowed"
              />
            </div>
            <Button
              variant="outline"
              className="border-gray-200"
              onClick={() => {
                window.location.href = "/forgot-password";
              }}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Notification Preferences</h2>
          <div className="divide-y divide-gray-200">
            <ToggleSwitch
              id="emailNotifs"
              enabled={emailNotifs}
              onToggle={() => setEmailNotifs((prev) => !prev)}
              label="Email Notifications"
              description="Receive updates about your account via email"
            />
            <ToggleSwitch
              id="pushNotifs"
              enabled={pushNotifs}
              onToggle={() => setPushNotifs((prev) => !prev)}
              label="Push Notifications"
              description="Get push notifications in your browser"
            />
            <ToggleSwitch
              id="messageAlerts"
              enabled={messageAlerts}
              onToggle={() => setMessageAlerts((prev) => !prev)}
              label="Message Alerts"
              description="Be notified when you receive new messages"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Privacy</h2>
          <div className="divide-y divide-gray-200">
            <ToggleSwitch
              id="showActivity"
              enabled={showActivity}
              onToggle={() => setShowActivity((prev) => !prev)}
              label="Show activity status"
              description="Let others see when you are online"
            />
            <ToggleSwitch
              id="allowMessages"
              enabled={allowMessages}
              onToggle={() => setAllowMessages((prev) => !prev)}
              label="Allow messages from non-subscribers"
              description="Anyone can send you a direct message"
            />
          </div>
        </CardContent>
      </Card>

      {/* Geo Blocking (creators only) */}
      {isCreator && (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-5 w-5 text-[#00AFF0]" />
              <h2 className="text-lg font-semibold text-foreground">Geo Blocking</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Block visitors from specific countries or US states from viewing your profile.
            </p>

            {/* Info banner */}
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Visitors from blocked areas will see &quot;Profile not available in your region&quot; instead of your profile. You will never be blocked from your own profile.
              </p>
            </div>

            {geoSaveMessage && (
              <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                geoSaveMessage.includes("success")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}>
                {geoSaveMessage}
              </div>
            )}

            {/* Common Countries */}
            <div className="mb-5">
              <p className="text-sm font-medium text-foreground mb-3">Block Countries</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([
                  { code: "US", name: "United States" },
                  { code: "GB", name: "United Kingdom" },
                  { code: "CA", name: "Canada" },
                  { code: "AU", name: "Australia" },
                  { code: "DE", name: "Germany" },
                  { code: "FR", name: "France" },
                ] as const).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleToggleCountry(country.code)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      blockedCountries.includes(country.code)
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-gray-200 bg-gray-50 text-foreground hover:border-gray-300"
                    }`}
                  >
                    <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                      blockedCountries.includes(country.code)
                        ? "border-red-400 bg-red-500"
                        : "border-gray-300 bg-white"
                    }`}>
                      {blockedCountries.includes(country.code) && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{country.name}</span>
                  </button>
                ))}
              </div>

              {/* Add custom country code */}
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Country code (e.g. JP)"
                  value={addCountryInput}
                  onChange={(e) => setAddCountryInput(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  className="border-gray-200 bg-gray-50 w-48 uppercase focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomCountry();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200"
                  onClick={handleAddCustomCountry}
                  disabled={addCountryInput.length !== 2}
                >
                  Add Country
                </Button>
              </div>

              {/* Show blocked countries as tags */}
              {blockedCountries.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {blockedCountries.map((code) => {
                    const knownNames: Record<string, string> = {
                      US: "United States", GB: "United Kingdom", CA: "Canada",
                      AU: "Australia", DE: "Germany", FR: "France", JP: "Japan",
                      BR: "Brazil", IN: "India", MX: "Mexico", IT: "Italy",
                      ES: "Spain", NL: "Netherlands", SE: "Sweden", NO: "Norway",
                      DK: "Denmark", FI: "Finland", CH: "Switzerland", AT: "Austria",
                      BE: "Belgium", IE: "Ireland", NZ: "New Zealand", SG: "Singapore",
                      KR: "South Korea", ZA: "South Africa", AR: "Argentina",
                      CL: "Chile", CO: "Colombia", PL: "Poland", CZ: "Czechia",
                      PT: "Portugal", RO: "Romania", HU: "Hungary", IL: "Israel",
                      TH: "Thailand", PH: "Philippines", MY: "Malaysia", ID: "Indonesia",
                      TR: "Turkey", RU: "Russia", UA: "Ukraine", CN: "China",
                      TW: "Taiwan", HK: "Hong Kong", AE: "UAE", SA: "Saudi Arabia",
                      EG: "Egypt", NG: "Nigeria", KE: "Kenya", GH: "Ghana",
                    };
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                      >
                        {knownNames[code] ?? code}
                        <button
                          type="button"
                          onClick={() => handleToggleCountry(code)}
                          className="ml-0.5 hover:text-red-900 transition-colors"
                          aria-label={`Remove ${code}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* US State Selector */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Block US States</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Block specific US states instead of the entire country. This only applies if the US is not already fully blocked above.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                {([
                  { code: "AL", name: "Alabama" },
                  { code: "AK", name: "Alaska" },
                  { code: "AZ", name: "Arizona" },
                  { code: "AR", name: "Arkansas" },
                  { code: "CA", name: "California" },
                  { code: "CO", name: "Colorado" },
                  { code: "CT", name: "Connecticut" },
                  { code: "DE", name: "Delaware" },
                  { code: "DC", name: "Washington DC" },
                  { code: "FL", name: "Florida" },
                  { code: "GA", name: "Georgia" },
                  { code: "HI", name: "Hawaii" },
                  { code: "ID", name: "Idaho" },
                  { code: "IL", name: "Illinois" },
                  { code: "IN", name: "Indiana" },
                  { code: "IA", name: "Iowa" },
                  { code: "KS", name: "Kansas" },
                  { code: "KY", name: "Kentucky" },
                  { code: "LA", name: "Louisiana" },
                  { code: "ME", name: "Maine" },
                  { code: "MD", name: "Maryland" },
                  { code: "MA", name: "Massachusetts" },
                  { code: "MI", name: "Michigan" },
                  { code: "MN", name: "Minnesota" },
                  { code: "MS", name: "Mississippi" },
                  { code: "MO", name: "Missouri" },
                  { code: "MT", name: "Montana" },
                  { code: "NE", name: "Nebraska" },
                  { code: "NV", name: "Nevada" },
                  { code: "NH", name: "New Hampshire" },
                  { code: "NJ", name: "New Jersey" },
                  { code: "NM", name: "New Mexico" },
                  { code: "NY", name: "New York" },
                  { code: "NC", name: "North Carolina" },
                  { code: "ND", name: "North Dakota" },
                  { code: "OH", name: "Ohio" },
                  { code: "OK", name: "Oklahoma" },
                  { code: "OR", name: "Oregon" },
                  { code: "PA", name: "Pennsylvania" },
                  { code: "RI", name: "Rhode Island" },
                  { code: "SC", name: "South Carolina" },
                  { code: "SD", name: "South Dakota" },
                  { code: "TN", name: "Tennessee" },
                  { code: "TX", name: "Texas" },
                  { code: "UT", name: "Utah" },
                  { code: "VT", name: "Vermont" },
                  { code: "VA", name: "Virginia" },
                  { code: "WA", name: "Washington" },
                  { code: "WV", name: "West Virginia" },
                  { code: "WI", name: "Wisconsin" },
                  { code: "WY", name: "Wyoming" },
                ] as const).map((state) => {
                  const regionCode = `US:${state.code}`;
                  const isDisabled = blockedCountries.includes("US");
                  return (
                    <button
                      key={state.code}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleToggleRegion(regionCode)}
                      className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors text-left ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed"
                          : blockedRegions.includes(regionCode)
                            ? "bg-red-100 text-red-700 font-medium"
                            : "hover:bg-gray-100 text-foreground"
                      }`}
                    >
                      <div className={`h-3.5 w-3.5 shrink-0 rounded-sm border flex items-center justify-center transition-colors ${
                        isDisabled
                          ? "border-gray-300 bg-gray-200"
                          : blockedRegions.includes(regionCode)
                            ? "border-red-400 bg-red-500"
                            : "border-gray-300 bg-white"
                      }`}>
                        {blockedRegions.includes(regionCode) && !isDisabled && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="truncate">{state.name}</span>
                    </button>
                  );
                })}
              </div>
              {blockedCountries.includes("US") && (
                <p className="mt-2 text-xs text-amber-600">
                  The entire US is blocked. Remove the US country block to select individual states.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                className="bg-[#00AFF0] hover:bg-[#009dd8]"
                onClick={handleSaveGeoBlocking}
                disabled={geoSaving}
              >
                {geoSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Geo-Blocking Settings"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Wallet */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Connected Wallet</h2>
          {walletAddress ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-[#00AFF0]" />
                <div>
                  <p className="text-sm font-medium text-foreground">Solana Wallet</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <Wallet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No wallet connected yet</p>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200"
                onClick={handleConnectWallet}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
              <Link
                href="/help/wallet-setup"
                className="mt-3 inline-flex items-center gap-1 text-xs text-[#00AFF0] transition-colors hover:text-[#009dd8]"
              >
                Don&apos;t have a wallet? Set one up
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Pricing (creators only) */}
      {isCreator && (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Subscription Pricing</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Set pricing for each subscription tier. Premium and VIP are optional.
            </p>

            {priceSaveError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {priceSaveError}
              </div>
            )}

            <div className="space-y-5">
              {/* Content Type selector */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-foreground">Content Type</p>
                  <p className="text-xs text-muted-foreground">
                    This determines your platform fee rate.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setContentType("general")}
                    className={`rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      contentType === "general"
                        ? "border-[#00AFF0] bg-[#00AFF0]/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">General</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Standard content</p>
                    <p className="mt-2 text-xs font-semibold text-emerald-600">Platform fee: 5%</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType("adult")}
                    className={`rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      contentType === "adult"
                        ? "border-rose-400 bg-rose-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">Adult (18+)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Age-restricted content</p>
                    <p className="mt-2 text-xs font-semibold text-rose-600">Platform fee: 10%</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType("ai_influencer")}
                    className={`rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      contentType === "ai_influencer"
                        ? "border-violet-400 bg-violet-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">AI Influencer</p>
                    <p className="text-xs text-muted-foreground mt-0.5">AI-generated content, virtual personas, AI art</p>
                    <p className="mt-2 text-xs font-semibold text-violet-600">Platform fee: 15%</p>
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {contentType === "ai_influencer"
                    ? "You keep 85% of all revenue. The 15% fee covers AI content moderation and persona verification."
                    : contentType === "adult"
                      ? "You keep 90% of all revenue. The 10% fee covers enhanced compliance and age verification infrastructure."
                      : "You keep 95% of all revenue."}
                </p>
              </div>

              {/* Basic Tier */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Basic</p>
                    <p className="text-xs text-muted-foreground">Access to basic content</p>
                  </div>
                  <span className="rounded-full bg-[#00AFF0]/10 px-2.5 py-0.5 text-xs font-medium text-[#00AFF0]">
                    Required
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="subscriptionPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="9.99"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(e.target.value)}
                    className="border-gray-200 bg-white pr-16 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                    USDC/mo
                  </span>
                </div>
              </div>

              {/* Premium Tier */}
              <div className={`rounded-lg border p-4 transition-colors ${premiumEnabled ? "border-purple-200 bg-purple-50/50" : "border-gray-200 bg-gray-50"}`}>
                <ToggleSwitch
                  id="premiumTier"
                  enabled={premiumEnabled}
                  onToggle={() => {
                    setPremiumEnabled((prev) => !prev);
                    if (premiumEnabled) {
                      setPremiumPrice("");
                    }
                  }}
                  label="Premium"
                  description="Access to basic + premium content"
                />
                {premiumEnabled && (
                  <div className="relative mt-3">
                    <Input
                      id="premiumPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="19.99"
                      value={premiumPrice}
                      onChange={(e) => setPremiumPrice(e.target.value)}
                      className="border-gray-200 bg-white pr-16 focus:border-purple-400/50 focus:ring-purple-400/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                      USDC/mo
                    </span>
                  </div>
                )}
              </div>

              {/* VIP Tier */}
              <div className={`rounded-lg border p-4 transition-colors ${vipEnabled ? "border-amber-200 bg-amber-50/50" : "border-gray-200 bg-gray-50"}`}>
                <ToggleSwitch
                  id="vipTier"
                  enabled={vipEnabled}
                  onToggle={() => {
                    setVipEnabled((prev) => !prev);
                    if (vipEnabled) {
                      setVipPrice("");
                    }
                  }}
                  label="VIP"
                  description="Access to all content (basic + premium + VIP)"
                />
                {vipEnabled && (
                  <div className="relative mt-3">
                    <Input
                      id="vipPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="49.99"
                      value={vipPrice}
                      onChange={(e) => setVipPrice(e.target.value)}
                      className="border-gray-200 bg-white pr-16 focus:border-amber-400/50 focus:ring-amber-400/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                      USDC/mo
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-[#00AFF0] hover:bg-[#009dd8]"
                  onClick={handleSaveSubscriptionPrice}
                  disabled={priceSaving || !subscriptionPrice || (premiumEnabled && !premiumPrice) || (vipEnabled && !vipPrice)}
                >
                  {priceSaving ? "Saving..." : "Update Pricing"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Schedule (creators only) */}
      {isCreator && (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Payout Schedule</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Choose how often your earnings are automatically paid out to your connected wallet.
              Minimum payout is $5.00 USDC.
            </p>

            <div className="space-y-3">
              {([
                {
                  value: "manual" as const,
                  label: "Manual",
                  description: "Request payouts manually from your earnings page",
                  icon: <Wallet className="h-5 w-5" />,
                },
                {
                  value: "weekly" as const,
                  label: "Weekly",
                  description: "Automatically pay out every 7 days",
                  icon: <CalendarClock className="h-5 w-5" />,
                },
                {
                  value: "monthly" as const,
                  label: "Monthly",
                  description: "Automatically pay out every 30 days",
                  icon: <CalendarClock className="h-5 w-5" />,
                },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={payoutScheduleSaving}
                  onClick={() => {
                    if (option.value !== payoutSchedule) {
                      handleSavePayoutSchedule(option.value);
                    }
                  }}
                  className={`w-full flex items-center gap-4 rounded-lg border p-4 text-left transition-colors disabled:opacity-50 ${
                    payoutSchedule === option.value
                      ? "border-[#00AFF0] bg-[#00AFF0]/5"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    payoutSchedule === option.value
                      ? "bg-[#00AFF0]/10 text-[#00AFF0]"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      payoutSchedule === option.value ? "text-[#00AFF0]" : "text-foreground"
                    }`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <div className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                    payoutSchedule === option.value
                      ? "border-[#00AFF0] bg-[#00AFF0]"
                      : "border-gray-300"
                  }`}>
                    {payoutSchedule === option.value && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {payoutScheduleSaving && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating payout schedule...
              </div>
            )}

            {!walletAddress && payoutSchedule !== "manual" && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                You need to connect a wallet before automatic payouts can be processed.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tax Information (creators only) */}
      <TaxInfoForm isCreator={isCreator} />

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          className="bg-[#00AFF0] hover:bg-[#009dd8] px-8"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. All your content, subscribers, and earnings data will be permanently removed.
          </p>
          {showDeleteConfirm ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-foreground mb-3">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const res = await fetch("/api/me", { method: "DELETE" });
                      if (res.ok) {
                        window.location.href = "/";
                      } else {
                        const json = await res.json();
                        alert(json.error || "Failed to delete account");
                        setDeleting(false);
                      }
                    } catch {
                      alert("Failed to delete account");
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? "Deleting..." : "Yes, Delete My Account"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
