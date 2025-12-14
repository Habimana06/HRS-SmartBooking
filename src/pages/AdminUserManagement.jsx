import { useEffect, useState } from "react";
import { Search, UserPlus, Edit2, Trash2, Filter, Download, Mail, Lock, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { adminService } from "../services/adminService.js";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "User",
    status: "Active",
  });
  const usersPerPage = 5;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setFormValues({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "User",
      status: "Active",
    });
    setShowAddModal(true);
  };

  const openEditUser = (user) => {
    setSelectedUser(user);
    setFormValues({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      password: "",
      role: user.role || "User",
      status: user.status || "Active",
    });
    setShowAddModal(true);
  };

  const handleFormChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        userId: selectedUser?.userId,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        phoneNumber: formValues.phoneNumber,
        password: formValues.password || undefined,
        role: formValues.role,
        isActive: formValues.status !== "Inactive",
        isVerified: formValues.status !== "Pending"
      };

      if (selectedUser) {
        await adminService.updateUser(selectedUser.userId, payload);
      } else {
        await adminService.createUser(payload);
      }
      await fetchUsers();
      setShowAddModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert(error?.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== "All") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Email", "Role", "Status", "Phone", "Verified", "Last Login"];
    const rows = filteredUsers.map(u => [
      u.userId,
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.role,
      u.status,
      u.phoneNumber || "",
      u.isVerified ? "Yes" : "No",
      u.lastLogin
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminService.deleteUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Inactive": return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      case "Pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "Manager": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Receptionist": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "User": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Add/Edit User Modal */}
        {(showAddModal || selectedUser) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h2>
              
              <form className="space-y-4" onSubmit={handleSubmitUser}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formValues.firstName}
                    onChange={(e) => handleFormChange("firstName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formValues.lastName}
                    onChange={(e) => handleFormChange("lastName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formValues.phoneNumber}
                onChange={(e) => handleFormChange("phoneNumber", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="+250 7xx xxx xxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {selectedUser ? "New Password (optional)" : "Password"}
              </label>
              <input
                type="password"
                value={formValues.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required={!selectedUser}
                placeholder={selectedUser ? "Leave blank to keep current password" : "Set a secure password"}
              />
            </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={formValues.role}
                    onChange={(e) => handleFormChange("role", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Receptionist</option>
                    <option>User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formValues.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Pending</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : selectedUser ? 'Save Changes' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor all users in your system
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.length}</p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {users.filter(u => u.status === "Active").length}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-green-500"></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {users.filter(u => u.role === "Admin").length}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {users.filter(u => u.status === "Pending").length}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-yellow-500 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="User">User</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Add User Button */}
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {(user.firstName || "?")[0]}{(user.lastName || "?")[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {user.userId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                      {user.lastLogin}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditUser(user)}
                          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.userId)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > usersPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        currentPage === i + 1
                          ? "bg-indigo-600 text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No users found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}