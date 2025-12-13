import { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, Plus, Edit2, Trash2, Mail, Phone, Calendar, Clock, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { adminService } from '../services/adminService.js';

export default function AdminStaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [shiftFilter, setShiftFilter] = useState('All Shifts');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "Receptionist",
    status: "Active",
    shift: "Day"
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || member.status === statusFilter;
    const matchesShift = shiftFilter === 'All Shifts' || member.shift === shiftFilter;
    const matchesRole = roleFilter === 'All Roles' || member.role === roleFilter;
    return matchesSearch && matchesStatus && matchesShift && matchesRole;
  });

  const activeStaff = staff.filter(s => s.status === "Active").length;
  const onLeaveStaff = staff.filter(s => s.status === "On Leave").length;
  const avgPerformance = (staff.reduce((acc, s) => acc + s.performance, 0) / staff.length).toFixed(1);

  const roles = [...new Set(staff.map(s => s.role))];
  const shifts = [...new Set(staff.map(s => s.shift))];

  const handleViewDetails = (member) => {
    setSelectedStaff(member);
    setShowModal(true);
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await adminService.deleteStaff(staffId);
      await fetchStaff();
      alert("Staff member removed successfully");
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Failed to remove staff member");
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Email", "Role", "Shift", "Status", "Phone", "JoinDate"];
    const rows = filteredStaff.map(s => [
      s.name,
      s.email,
      s.role,
      s.shift,
      s.status,
      s.phone,
      s.joinDate
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openForm = (member = null) => {
    if (member) {
      const [firstName = "", lastName = ""] = (member.name || "").split(" ");
      setFormValues({
        firstName,
        lastName,
        email: member.email || "",
        phoneNumber: member.phone || "",
        password: "",
        role: member.role || "Receptionist",
        status: member.status || "Active",
        shift: member.shift || "Day"
      });
      setSelectedStaff(member);
    } else {
      setFormValues({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "Receptionist",
        status: "Active",
        shift: "Day"
      });
      setSelectedStaff(null);
    }
    setShowForm(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        userId: selectedStaff?.id,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        phoneNumber: formValues.phoneNumber,
        password: formValues.password || undefined,
        role: formValues.role,
        isActive: formValues.status === "Active",
        isVerified: true,
      };
      if (selectedStaff) {
        await adminService.updateStaff(selectedStaff.id, payload);
      } else {
        await adminService.createStaff({ ...payload, password: formValues.password });
      }
      await fetchStaff();
      setShowForm(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Failed to save staff member");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Staff Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage team members and monitor performance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => openForm()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 opacity-10">
              <Users className="w-32 h-32" />
            </div>
            <div className="relative">
              <p className="text-sm text-blue-100">Total Staff</p>
              <p className="text-4xl font-bold mt-1">{staff.length}</p>
              <p className="text-xs text-blue-100 mt-2">All team members</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 opacity-10">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative">
              <p className="text-sm text-green-100">Active Staff</p>
              <p className="text-4xl font-bold mt-1">{activeStaff}</p>
              <p className="text-xs text-green-100 mt-2">{((activeStaff/staff.length)*100).toFixed(0)}% of total</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 opacity-10">
              <Calendar className="w-32 h-32" />
            </div>
            <div className="relative">
              <p className="text-sm text-yellow-100">On Leave</p>
              <p className="text-4xl font-bold mt-1">{onLeaveStaff}</p>
              <p className="text-xs text-yellow-100 mt-2">Currently unavailable</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 opacity-10">
              <Award className="w-32 h-32" />
            </div>
            <div className="relative">
              <p className="text-sm text-purple-100">Avg Performance</p>
              <p className="text-4xl font-bold mt-1">{avgPerformance}%</p>
              <p className="text-xs text-purple-100 mt-2">Team average score</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                placeholder="Search by name, role, or email..."
              />
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>On Leave</option>
              </select>

              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option>All Shifts</option>
                {shifts.map(shift => <option key={shift}>{shift}</option>)}
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option>All Roles</option>
                {roles.map(role => <option key={role}>{role}</option>)}
              </select>

              <div className="flex gap-2 border-l pl-3 border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Display */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white">Staff Member</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white">Shift</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white">Performance</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Clock className="w-4 h-4" />
                          {member.shift}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            member.status === "Active"
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${member.performance >= 90 ? 'bg-green-500' : member.performance >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                              style={{ width: `${member.performance}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{member.performance}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openForm(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStaff(member.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Remove"
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((member) => (
              <div key={member.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{member.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      member.status === "Active"
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
                        : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    {member.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {member.shift} Shift
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Performance</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{member.performance}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${member.performance >= 90 ? 'bg-green-500' : member.performance >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                      style={{ width: `${member.performance}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewDetails(member)}
                    className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleDeleteStaff(member.id)}
                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredStaff.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No staff members found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStaff.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{selectedStaff.role}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedStaff.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phone</label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedStaff.phone}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Shift</label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedStaff.shift}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedStaff.status}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Join Date</label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedStaff.joinDate}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Leave Days Used</label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedStaff.leaves} days</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Performance Score</label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${selectedStaff.performance >= 90 ? 'bg-green-500' : selectedStaff.performance >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                      style={{ width: `${selectedStaff.performance}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{selectedStaff.performance}%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium">
                Edit Details
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedStaff ? "Edit Staff" : "Add Staff"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Provide required details</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSaveStaff}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input
                    type="text"
                    value={formValues.firstName}
                    onChange={(e) => setFormValues(v => ({ ...v, firstName: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input
                    type="text"
                    value={formValues.lastName}
                    onChange={(e) => setFormValues(v => ({ ...v, lastName: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={formValues.email}
                  onChange={(e) => setFormValues(v => ({ ...v, email: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  value={formValues.phoneNumber}
                  onChange={(e) => setFormValues(v => ({ ...v, phoneNumber: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="+250 7xx xxx xxx"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedStaff ? "New Password (optional)" : "Password"}
                  </label>
                  <input
                    type="password"
                    value={formValues.password}
                    onChange={(e) => setFormValues(v => ({ ...v, password: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    required={!selectedStaff}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    value={formValues.role}
                    onChange={(e) => setFormValues(v => ({ ...v, role: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option>Receptionist</option>
                    <option>Manager</option>
                    <option>Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues(v => ({ ...v, status: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option>Active</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Shift</label>
                  <select
                    value={formValues.shift}
                    onChange={(e) => setFormValues(v => ({ ...v, shift: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option>Day</option>
                    <option>Night</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  {selectedStaff ? "Save Changes" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}