import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { managerService } from "../services/managerService.js";
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X, Camera, Bell, Lock, Globe } from "lucide-react";

export default function ManagerProfile() {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: 'Hotel manager with expertise in operations and guest relations.',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await managerService.getProfile();
      setProfileData(data);
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        bio: 'Hotel manager with expertise in operations and guest relations.',
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Fallback to auth user data
      setFormData({
        firstName: authUser?.firstName || '',
        lastName: authUser?.lastName || '',
        email: authUser?.email || '',
        phone: authUser?.phone || '',
        address: authUser?.address || '',
        bio: 'Hotel manager with expertise in operations and guest relations.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await managerService.updateProfile(formData);
      await fetchProfile();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings and preferences</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            {isEditing ? (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-5 h-5" />
                Edit Profile
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                  {formData.firstName?.[0] || 'M'}{formData.lastName?.[0] || 'G'}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-1/3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-center mt-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{profileData?.role || authUser?.role || 'Manager'}</p>
                <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Active</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Bookings</span>
                  <span className="font-bold text-gray-900 dark:text-white">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                  <span className="font-bold text-gray-900 dark:text-white">$45M</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Team Members</span>
                  <span className="font-bold text-gray-900 dark:text-white">12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{formData.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{formData.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">{formData.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{formData.phone || 'Not provided'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{formData.address || 'Not provided'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">{formData.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Account Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Update your password regularly</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Change
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage your notification preferences</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
                    Settings
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Language & Region</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">English (US) • UTC+2</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
