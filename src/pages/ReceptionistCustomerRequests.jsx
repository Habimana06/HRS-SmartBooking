import { useState, useEffect } from 'react';
import { Search, Filter, Clock, User, CheckCircle, AlertCircle, Loader, X, Plus, MessageSquare } from 'lucide-react';
import { receptionistService } from '../services/receptionistService.js';

export default function ReceptionistCustomerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({
    guest: '',
    room: '',
    request: '',
    priority: 'Medium',
    notes: ''
  });

  useEffect(() => {
    fetchCustomerRequests();
  }, []);

  const fetchCustomerRequests = async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getCustomerRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customer requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const guestName = `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.toLowerCase();
    const bookingId = (r.bookingId || r.travelBookingId || r.id)?.toString();
    const matchesSearch = guestName.includes(searchTerm.toLowerCase()) || 
                         bookingId?.includes(searchTerm) ||
                         (r.room?.roomNumber?.toString() || r.attractionName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || (r.status || 'Pending') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApproveRefund = async (id, type) => {
    try {
      await receptionistService.approveRefund(id, type);
      await fetchCustomerRequests();
      setSelectedRequest(null); // Close modal after action
      alert("Refund approved successfully!");
    } catch (error) {
      console.error("Error approving refund:", error);
      alert("Failed to approve refund. Please try again.");
    }
  };

  const handleDeclineRefund = async (id, type, reason) => {
    if (!reason || reason.trim() === '') {
      alert("Please provide a reason for declining the refund.");
      return;
    }
    try {
      await receptionistService.declineRefund(id, type, reason);
      await fetchCustomerRequests();
      setSelectedRequest(null); // Close modal after action
      alert("Refund declined.");
    } catch (error) {
      console.error("Error declining refund:", error);
      alert("Failed to decline refund. Please try again.");
    }
  };

  const addNewRequest = () => {
    const newRequest = {
      id: Math.max(...requests.map(r => r.id)) + 1,
      guest: newRequestForm.guest,
      room: newRequestForm.room,
      request: newRequestForm.request,
      time: 'Today ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Open',
      priority: newRequestForm.priority,
      notes: newRequestForm.notes
    };
    setRequests([newRequest, ...requests]);
    setShowNewRequest(false);
    setNewRequestForm({ guest: '', room: '', request: '', priority: 'Medium', notes: '' });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Open': return <AlertCircle className="w-4 h-4" />;
      case 'In Progress': return <Loader className="w-4 h-4" />;
      case 'Done': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading customer requests...</p>
        </div>
      </div>
    );
  }

  const statusCounts = {
    pending: requests.filter(r => (r.status || 'Pending') === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    declined: requests.filter(r => r.status === 'Declined').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Customer Requests</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage guest inquiries and requests efficiently</p>
          </div>
          <button 
            onClick={() => setShowNewRequest(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Refunds</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{statusCounts.pending}</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{statusCounts.approved}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Declined</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{statusCounts.declined}</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <X className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by guest name, room, or request..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Declined</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No requests found matching your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRequests.map((r) => (
                <div 
                  key={r.id} 
                  className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(r)}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : r.guest || 'Unknown'}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {r.type === 'travel' ? `Travel: ${r.attractionName || 'N/A'}` : `Room: ${r.room?.roomNumber || r.room || 'N/A'}`}
                            </span>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              • Refund Request
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">
                            Refund Amount: ${(r.amount || 0).toFixed(2)}
                            {r.cancellationReason && (
                              <span className="block mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Reason: {r.cancellationReason}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            {r.refundRequestedAt ? new Date(r.refundRequestedAt).toLocaleString() : (r.time || 'N/A')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                          (r.status || 'Pending') === "Pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            : r.status === "Approved"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {getStatusIcon(r.status || 'Pending')}
                        {r.status || 'Pending'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(r);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Request Details</h2>
                <p className="text-gray-600 dark:text-gray-400">ID: #{selectedRequest.id}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Guest Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest.customer ? `${selectedRequest.customer.firstName} ${selectedRequest.customer.lastName}` : selectedRequest.guest || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Booking Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest.type === 'travel' ? 'Travel Booking' : 'Room Booking'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  #{selectedRequest.bookingId || selectedRequest.travelBookingId || selectedRequest.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Refund Amount</p>
                <p className="font-semibold text-green-600 dark:text-green-400 text-xl">
                  ${(selectedRequest.amount || 0).toFixed(2)}
                </p>
              </div>

              {selectedRequest.cancellationReason && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cancellation Reason</p>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    {selectedRequest.cancellationReason}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Requested At</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedRequest.refundRequestedAt 
                    ? new Date(selectedRequest.refundRequestedAt).toLocaleString()
                    : (selectedRequest.time || 'N/A')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  (selectedRequest.status || 'Pending') === "Pending"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                    : selectedRequest.status === "Approved"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}>
                  {selectedRequest.status || 'Pending'}
                </span>
              </div>

              {/* Response Section */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">Response</p>
                  {(selectedRequest.status || 'Pending') === 'Pending' && (
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                      Action Required
                    </span>
                  )}
                </div>
                
                {selectedRequest.response ? (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{selectedRequest.response}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedRequest.responseDate ? new Date(selectedRequest.responseDate).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-4 border border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No response yet</p>
                  </div>
                )}
                
                {/* Action Buttons - Visible for Pending and Confirmed statuses */}
                {(() => {
                  const currentStatus = selectedRequest.status || 'Pending';
                  const showButtons = (currentStatus === 'Pending' || currentStatus === 'Confirmed') && 
                                     (selectedRequest.refundApproved === null || selectedRequest.refundApproved === undefined);
                  
                  return showButtons && (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Take Action:</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const id = selectedRequest.bookingId || selectedRequest.travelBookingId || selectedRequest.id;
                            const type = selectedRequest.type || 'room';
                            handleApproveRefund(id, type);
                          }}
                          className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Approve Refund</span>
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Please provide a reason for declining the refund:");
                            if (reason) {
                              const id = selectedRequest.bookingId || selectedRequest.travelBookingId || selectedRequest.id;
                              const type = selectedRequest.type || 'room';
                              handleDeclineRefund(id, type, reason);
                            }
                          }}
                          className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancel/Decline</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowNewRequest(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Request</h2>
                <p className="text-gray-600 dark:text-gray-400">Add a new customer request</p>
              </div>
              <button 
                onClick={() => setShowNewRequest(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    value={newRequestForm.guest}
                    onChange={(e) => setNewRequestForm({...newRequestForm, guest: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter guest name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={newRequestForm.room}
                    onChange={(e) => setNewRequestForm({...newRequestForm, room: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 302"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Type *
                </label>
                <input
                  type="text"
                  value={newRequestForm.request}
                  onChange={(e) => setNewRequestForm({...newRequestForm, request: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Extra towels, Room service"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority Level
                </label>
                <select
                  value={newRequestForm.priority}
                  onChange={(e) => setNewRequestForm({...newRequestForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newRequestForm.notes}
                  onChange={(e) => setNewRequestForm({...newRequestForm, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional details about the request..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewRequest(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewRequest}
                  disabled={!newRequestForm.guest || !newRequestForm.room || !newRequestForm.request}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Add Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}