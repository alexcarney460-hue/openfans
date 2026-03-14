"use client";

import { useEffect, useState } from "react";
import { ShieldX, Mail } from "lucide-react";

interface UserData {
  is_suspended: boolean;
  suspension_reason: string | null;
}

export default function SuspendedPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const json = await res.json();
        setUserData(json.data);
      } catch {
        // Silent fail -- page shows generic message
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-7 w-7 text-red-500" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-gray-900">
          Account Suspended
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          Your account has been suspended and you are unable to access the
          platform at this time.
        </p>

        {userData?.suspension_reason && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-xs font-medium text-red-800">
              Reason
            </p>
            <p className="mt-1 text-sm text-red-700">
              {userData.suspension_reason}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Mail className="h-4 w-4" />
          <span>
            Contact{" "}
            <a
              href="mailto:support@openfans.online"
              className="font-medium text-[#00AFF0] hover:underline"
            >
              support@openfans.online
            </a>{" "}
            for assistance.
          </span>
        </div>
      </div>
    </div>
  );
}
