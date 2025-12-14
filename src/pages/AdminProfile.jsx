import { useAuth } from "../hooks/useAuth.jsx";
import { useState } from "react";
import { Shield, Phone, Mail, Save } from "lucide-react";

export default function AdminProfile() {
  const { user } = useAuth();
  const [contactMethod, setContactMethod] = useState("email");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold">
            {user?.firstName?.[0] || "A"}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{user?.email || "admin@hrs.com"}</p>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200">
              {user?.role || "Admin"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Profile Details</h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p><span className="font-semibold">Name:</span> {user?.firstName} {user?.lastName}</p>
              <p><span className="font-semibold">Email:</span> {user?.email}</p>
              <p><span className="font-semibold">Role:</span> {user?.role}</p>
              <p><span className="font-semibold">Phone:</span> +250 788 000 000</p>
            </div>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Email notifications</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200">
                  Enabled
                </span>
              </label>
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Two-factor authentication</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Require 2FA on login</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="2fa"
                      checked={contactMethod === "email"}
                      onChange={() => setContactMethod("email")}
                    />
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email code</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="2fa"
                      checked={contactMethod === "phone"}
                      onChange={() => setContactMethod("phone")}
                    />
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">SMS code</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Choose how users verify after login. Email is recommended.
                </p>
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
