import { Shield, Mail, Phone, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function PermissionDenied({ permissionName = "this feature" }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
            <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Access Restricted
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            You don't have permission to access <span className="font-semibold text-gray-900 dark:text-white">{permissionName}</span>.
          </p>
          <p className="text-base text-gray-500 dark:text-gray-500">
            This permission has been disabled for your account by an administrator.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Need Access?
              </h3>
              <p className="text-amber-800 dark:text-amber-300 mb-4">
                To request access to this feature, please contact your team support or system administrator.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email: support@hrs-system.com</span>
                </div>
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Phone: +250 788 123 456</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-center"
          >
            Go to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

