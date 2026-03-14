import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Page not found
          </h2>
          <p className="text-gray-600 mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <div className="space-y-3">
            <Link
              href="/explore"
              className="block w-full bg-[#00AFF0] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#0095cc] transition-colors"
            >
              Explore Creators
            </Link>
            <Link
              href="/"
              className="block w-full text-gray-600 font-medium py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
