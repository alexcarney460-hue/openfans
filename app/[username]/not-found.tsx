import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreatorNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <span className="text-3xl font-bold text-white/20">?</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">
          Creator not found
        </h1>
        <p className="mb-8 text-sm text-white/40">
          This profile does not exist or may have been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
