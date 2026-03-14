import Link from "next/link";

export const metadata = {
  title: "Something went wrong | OpenFans",
};

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t complete that action. This might happen if a
            confirmation link has expired or was already used.
          </p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-[#00AFF0] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#0095cc] transition-colors"
            >
              Go to Login
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
