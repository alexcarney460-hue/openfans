"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Wallet, Trash2, Loader2, ImageIcon } from "lucide-react";

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

  const [showActivity, setShowActivity] = useState(true);
  const [allowMessages, setAllowMessages] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("subscriber");

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data?.wallet_address) {
          setWalletAddress(data.data.wallet_address);
        }
      })
      .catch(() => {});
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, account, and preferences.
        </p>
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
                onClick={() => {
                  window.location.href = "/dashboard/wallet";
                }}
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
