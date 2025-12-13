import { useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { customerService } from "../services/customerService.js";

export default function CustomerProfile() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ error: "", success: "" });

  const resetForm = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    });
    setPasswords({ current: "", next: "", confirm: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: "", success: "" });

    if (passwords.next || passwords.confirm || passwords.current) {
      if (!passwords.current) {
        setStatus({ error: "Enter current password to change it.", success: "" });
        return;
      }
      if (passwords.next !== passwords.confirm) {
        setStatus({ error: "New passwords do not match.", success: "" });
        return;
      }
      if (passwords.next.length < 6) {
        setStatus({ error: "New password must be at least 6 characters.", success: "" });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        currentPassword: passwords.current || null,
        newPassword: passwords.next || null,
      };

      const updated = await customerService.updateProfile(payload);

      const updatedUser = {
        ...user,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phoneNumber: updated.phoneNumber,
      };
      setUser(updatedUser);
      setStatus({ error: "", success: "Profile updated successfully." });
      setIsEditing(false);
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update profile. Please try again.";
      setStatus({ error: msg, success: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          My Profile
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="card text-center">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-5xl text-white font-bold shadow-xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-accent-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{user?.email}</p>
              <span className="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
                {user?.role}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="card mt-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Bookings</span>
                  <span className="font-bold text-gray-900 dark:text-white">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Loyalty Points</span>
                  <span className="font-bold text-accent-600 dark:text-accent-400">1,250</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="card mt-6 text-left space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.email || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formData.phoneNumber || "Add your phone"}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary text-sm"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {(status.error || status.success) && (
                <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${status.error ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"}`}>
                  {status.error || status.success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-100 dark:disabled:bg-secondary-700 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-100 dark:disabled:bg-secondary-700 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-100 dark:disabled:bg-secondary-700 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    placeholder="+1234567890"
                    className="input-field disabled:bg-gray-100 dark:disabled:bg-secondary-700 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input
                    type="text"
                    value={user?.role || ""}
                    disabled
                    className="input-field disabled:bg-gray-100 dark:disabled:bg-secondary-700 disabled:cursor-not-allowed"
                  />
                </div>

                {isEditing && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="label">Current Password</label>
                        <input
                          type="password"
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          className="input-field"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="label">New Password</label>
                        <input
                          type="password"
                          value={passwords.next}
                          onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                          className="input-field"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="label">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          className="input-field"
                          placeholder="Re-enter new password"
                        />
                      </div>
                    </div>
                  </>
                )}

                {isEditing && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-secondary-700">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        resetForm();
                        setStatus({ error: "", success: "" });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
