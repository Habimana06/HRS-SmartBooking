import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Info } from 'lucide-react';
import { receptionistService } from '../services/receptionistService.js';

export default function ReceptionistPendingApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedApproval, setSelectedApproval] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getPendingApprovals();
      setApprovals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApprovals = approvals.filter(a => 
    filter === "All" || a.status === filter
  );

  const pendingCount = approvals.filter(a => a.status === "Pending").length;

  const handleAction = async (id, action) => {
    try {
      // TODO: Implement approval/rejection API call
      // await receptionistService.approveRequest(id, action === "approve");
      setApprovals(approvals.map(a => 
        a.id === id ? { ...a, status: action === "approve" ? "Approved" : "Rejected" } : a
      ));
      setSelectedApproval(null);
    } catch (error) {
      console.error("Error updating approval:", error);
      alert("Failed to update approval status");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "Approved": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getPriorityIndicator = (priority) => {
    if (priority === "high") return <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Pending Approvals
              {pendingCount > 0 && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-amber-500 text-white">
                  {pendingCount} pending
                </span>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage check-in/out requests</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {approvals.filter(a => a.status === "Approved").length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {approvals.filter(a => a.status === "Rejected").length}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Approvals List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredApprovals.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">No approvals found</p>
              </div>
            ) : (
              filteredApprovals.map((a) => (
                <div 
                  key={a.id} 
                  className="p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        {getPriorityIndicator(a.priority)}
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {a.guest}
                        </h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(a.status)}`}>
                          {a.status}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Room {a.room}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {a.type}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {a.requestedTime} (Standard: {a.standardTime})
                        </span>
                        <span className="text-xs">Submitted: {a.time}</span>
                      </div>

                      {a.reason && (
                        <div className="flex items-start gap-2 text-sm">
                          <Info className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Reason:</span> {a.reason}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {a.status === "Pending" ? (
                        <>
                          <button
                            onClick={() => setSelectedApproval(a)}
                            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleAction(a.id, "approve")}
                            className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(a.id, "reject")}
                            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedApproval(a)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedApproval(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Request Details</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Guest Name</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedApproval.guest}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Room Number</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedApproval.room}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Request Type</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedApproval.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Requested Time</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedApproval.requestedTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Standard Time</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedApproval.standardTime}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reason</p>
                <p className="text-gray-900 dark:text-white">{selectedApproval.reason}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(selectedApproval.status)}`}>
                  {selectedApproval.status}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {selectedApproval.status === "Pending" ? (
                <>
                  <button
                    onClick={() => handleAction(selectedApproval.id, "approve")}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleAction(selectedApproval.id, "reject")}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Request
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedApproval(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}