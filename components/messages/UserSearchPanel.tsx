"use client";

import { Search, ArrowLeft } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { UserSearchResult } from "@/app/dashboard/messages/types";

interface UserSearchPanelProps {
  readonly onSelectUser: (user: UserSearchResult) => void;
  readonly onClose: () => void;
}

export default function UserSearchPanel({
  onSelectUser,
  onClose,
}: UserSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`,
          { signal: abortController.signal },
        );
        if (res.ok) {
          const json = await res.json();
          setResults(json.data ?? []);
        }
      } catch {
        // Ignore aborted requests
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={handleQueryChange}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#00AFF0]/50 focus:ring-1 focus:ring-[#00AFF0]/25"
            aria-label="Search users"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-2 px-4 py-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-1 h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            No users found
          </p>
        )}

        {!loading &&
          results.map((user) => (
            <button
              key={user.id}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              onClick={() => onSelectUser(user)}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-500">
                    {(user.display_name[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user.display_name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  @{user.username}
                </p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
