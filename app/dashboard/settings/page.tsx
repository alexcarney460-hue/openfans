"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Wallet, Trash2 } from "lucide-react";

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
  const [displayName, setDisplayName] = useState("CryptoCreator");
  const [username, setUsername] = useState("cryptocreator");
  const [bio, setBio] = useState("Web3 content creator sharing alpha and insights.");

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [messageAlerts, setMessageAlerts] = useState(true);

  const [showActivity, setShowActivity] = useState(true);
  const [allowMessages, setAllowMessages] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, account, and preferences.
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Profile Settings</h2>

          {/* Avatar upload */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#00AFF0] text-2xl font-bold text-white">
                C
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-200 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Upload avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, or GIF. Max 5MB.</p>
            </div>
          </div>

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
                value="creator@example.com"
                readOnly
                className="mt-1.5 border-gray-200 bg-gray-50 text-muted-foreground cursor-not-allowed"
              />
            </div>
            <Button variant="outline" className="border-gray-200">
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
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-[#00AFF0]" />
              <div>
                <p className="text-sm font-medium text-foreground">Phantom Wallet</p>
                <p className="text-xs text-muted-foreground font-mono">
                  7xKXt...3mPq
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-gray-200 text-red-400 hover:text-red-300">
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button className="bg-[#00AFF0] hover:bg-[#009dd8] px-8">
          Save Changes
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
                >
                  Yes, Delete My Account
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
