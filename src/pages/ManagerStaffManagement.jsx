import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Mail, Phone, Edit2, Trash2, Eye, UserCheck, UserX } from 'lucide-react';
import { managerService } from '../services/managerService.js';

export default function ManagerStaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterShift, setFilterShift] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await managerService.getStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const roles = ['All', ...new Set(staff.map(s => s.role))];
  const statuses = ['All', 'Active', 'On Leave', 'Inactive'];
  const shifts = ['All', ...new Set(staff.map(s => s.shift))];

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || s.role === filterRole;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    const matchesShift = filterShift === 'All' || s.shift === filterShift;
    return matchesSearch && matchesRole && matchesStatus && matchesShift;
  });

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'Active').length,
    onLeave: staff.filter(s => s.status === 'On Leave').length,
    inactive: staff.filter(s => s.status === 'Inactive').length,
  };

  const handleViewDetails = (staffMember) => {
    setSelectedStaff(staffMember);
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) {
      return;
    }
    try {
      await managerService.deleteStaff(id);
      await fetchStaff();
      alert('Staff member removed successfully');
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to remove staff member');
    }
  };

  const handleDownload = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Phone', 'Shift', 'Status'];
    const rows = filteredStaff.map(s => [
      s.name || '',
      s.email || '',
      s.role || '',
      s.department || '',
      s.phone || '',
      s.shift || '',
      s.status || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `staff-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleStatus = (id) => {
    setStaff(staff.map(s => 
      s.id === id 
        ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' }
        : s
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading staff...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200';
      case 'On Leave':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200';
      case 'Inactive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your team members and their details</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => alert('Add Staff functionality - navigate to add staff page or show modal')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex-1 md:flex-none justify-center"
            >
              <Plus size={20} />
              Add Staff
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-600 transition-colors"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Staff</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">On Leave</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.onLeave}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Inactive</p>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{stats.inactive}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role === 'All' ? 'All Roles' : role}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status === 'All' ? 'All Status' : status}</option>
                ))}
              </select>
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {shifts.map(shift => (
                  <option key={shift} value={shift}>{shift === 'All' ? 'All Shifts' : shift}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Staff Member</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Role & Department</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Shift</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {s.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {s.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-900 dark:text-white">{s.role}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{s.department}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Mail size={14} className="text-gray-400" />
                          {s.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Phone size={14} className="text-gray-400" />
                          {s.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200">
                        {s.shift}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewDetails(s)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(s.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-400" 
                          title={s.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          {s.status === 'Active' ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(s.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400" 
                          title="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStaff.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No staff members found matching your filters.
            </div>
          )}
        </div>

        {/* Staff Details Modal */}
        {selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedStaff(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Details</h2>
                <button onClick={() => setSelectedStaff(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl">
                    {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedStaff.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedStaff.role}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedStaff.status)}`}>
                      {selectedStaff.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Department</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedStaff.department}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Shift</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedStaff.shift}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedStaff.email}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedStaff.phone}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Join Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedStaff.joinDate}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Staff ID</p>
                    <p className="font-semibold text-gray-900 dark:text-white">STF-{selectedStaff.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Edit Details
                  </button>
                  <button className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}