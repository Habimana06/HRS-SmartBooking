import { useState, useEffect } from "react";
import { Search, Download, Calendar, Clock, CreditCard, User, FileText, CheckCircle, DollarSign, AlertCircle, Printer, Mail, X } from "lucide-react";
import { receptionistService } from "../services/receptionistService.js";

export default function ReceptionistCheckOut() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    notes: "",
    paymentMethod: "Cash",
    emailInvoice: true,
  });
  const [invoice, setInvoice] = useState(null);
  const [extraChargesList, setExtraChargesList] = useState([]);
  const [newCharge, setNewCharge] = useState({ description: "", amount: "" });
  const [showChargeInput, setShowChargeInput] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodayReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        // Get all checked-in bookings (rooms that can be checked out)
        // This includes bookings with past checkout dates that need to be processed
        const data = await receptionistService.getCheckOutReservations();
        setReservations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        setError("Unable to load check-outs right now.");
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayReservations();
    
    // Listen for booking updates to refresh immediately
    const handleBookingUpdate = () => {
      fetchTodayReservations();
    };
    
    window.addEventListener('bookingUpdated', handleBookingUpdate);
    
    // Refresh every 5 minutes to catch any checkout dates that have passed
    const interval = setInterval(fetchTodayReservations, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
    };
  }, []);

  const addExtraCharge = () => {
    if (newCharge.description && newCharge.amount && !isNaN(newCharge.amount)) {
      setExtraChargesList([...extraChargesList, { description: newCharge.description, amount: parseFloat(newCharge.amount) }]);
      setNewCharge({ description: "", amount: "" });
      setShowChargeInput(false);
    }
  };

  const removeExtraCharge = (index) => {
    setExtraChargesList(extraChargesList.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    if (!selectedReservation) return 0;
    const basePrice = selectedReservation.totalPrice || 0;
    const extraTotal = extraChargesList.reduce((sum, charge) => sum + charge.amount, 0);
    return basePrice + extraTotal;
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    if (!selectedReservation) return;
    setLoading(true);
    setError(null);
    try {
      await receptionistService.checkOut(selectedReservation.bookingId, {
        ...formData,
        extraCharges: extraChargesList,
        action: "checkout"
      });
      // Dispatch custom event to notify other pages to refresh
      window.dispatchEvent(new CustomEvent('bookingUpdated', { 
        detail: { type: 'checkout', bookingId: selectedReservation.bookingId } 
      }));
      
      setInvoice({
        bookingId: selectedReservation.bookingId,
        guestName: `${selectedReservation.customer?.firstName} ${selectedReservation.customer?.lastName}`,
        roomNumber: selectedReservation.room?.roomNumber,
        checkInDate: selectedReservation.checkInDate,
        checkOutDate: selectedReservation.checkOutDate,
        basePrice: selectedReservation.totalPrice || 0,
        extraCharges: extraChargesList,
        total: calculateTotal(),
        paymentMethod: formData.paymentMethod,
        date: new Date().toISOString(),
        notes: formData.notes,
      });
      // Refresh reservations
      const data = await receptionistService.getCheckOutReservations();
      setReservations(Array.isArray(data) ? data : []);
      setSelectedReservation(null);
      alert("Check-out completed successfully! Room is now available.");
    } catch (err) {
      console.error("Error processing check-out:", err);
      setError("Failed to complete check-out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedReservation) return;
    if (!window.confirm("Are you sure you want to cancel this booking? The room will be made available.")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await receptionistService.checkOut(selectedReservation.bookingId, {
        action: "cancel",
        notes: formData.notes
      });
      // Refresh reservations
      const data = await receptionistService.getCheckOutReservations();
      setReservations(Array.isArray(data) ? data : []);
      setSelectedReservation(null);
      alert("Booking cancelled successfully! Room is now available.");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    if (!invoice) return;
    const invoiceText = `
═══════════════════════════════════════════════════════
                    HOTEL INVOICE
═══════════════════════════════════════════════════════

Invoice Date: ${new Date(invoice.date).toLocaleDateString()}
Booking ID: #${invoice.bookingId}

GUEST INFORMATION
─────────────────────────────────────────────────────
Name: ${invoice.guestName}
Room: ${invoice.roomNumber}

STAY DETAILS
─────────────────────────────────────────────────────
Check-In:  ${new Date(invoice.checkInDate).toLocaleDateString()}
Check-Out: ${new Date(invoice.checkOutDate).toLocaleDateString()}

CHARGES
─────────────────────────────────────────────────────
Room Charges:                    $${invoice.basePrice.toFixed(2)}
${invoice.extraCharges.map(c => `${c.description.padEnd(28)} $${c.amount.toFixed(2)}`).join('\n')}

═══════════════════════════════════════════════════════
TOTAL AMOUNT:                    $${invoice.total.toFixed(2)}
═══════════════════════════════════════════════════════

Payment Method: ${invoice.paymentMethod}
${invoice.notes ? `\nNotes: ${invoice.notes}` : ''}

Thank you for staying with us!
    `;
    const blob = new Blob([invoiceText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice.bookingId}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredReservations = reservations.filter((res) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      res.customer?.firstName?.toLowerCase().includes(query) ||
      res.customer?.lastName?.toLowerCase().includes(query) ||
      res.bookingId?.toString().includes(query) ||
      res.room?.roomNumber?.toString().includes(query)
    );
  });

  // Show all checked-in bookings, including past checkout dates
  // Sort: overdue first, then by checkout date
  const allCheckOuts = filteredReservations.sort((a, b) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aCheckOut = new Date(a.checkOutDate);
    aCheckOut.setHours(0, 0, 0, 0);
    const bCheckOut = new Date(b.checkOutDate);
    bCheckOut.setHours(0, 0, 0, 0);
    
    // Overdue checkouts first
    const aOverdue = aCheckOut < today;
    const bOverdue = bCheckOut < today;
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Then sort by checkout date
    return aCheckOut - bCheckOut;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueCheckOuts = allCheckOuts.filter((r) => {
    const checkOut = new Date(r.checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    return checkOut < today;
  });
  
  const todayCheckOuts = allCheckOuts.filter((r) => {
    const checkOut = new Date(r.checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    return checkOut.getTime() === today.getTime();
  });

  const stats = {
    total: allCheckOuts.length,
    overdue: overdueCheckOuts.length,
    today: todayCheckOuts.length,
    pending: allCheckOuts.filter(r => r.bookingStatus !== 'Checked-out').length,
    revenue: allCheckOuts.reduce((sum, r) => sum + (r.totalPrice || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Guest Check-Out</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Process departures and generate invoices</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-600 transition-colors">
              <Printer size={18} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Check-Outs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-red-200 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Overdue</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.overdue}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Today</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.today}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Expected Revenue</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">${stats.revenue.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reservations List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, booking ID, or room number..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Reservations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Check-Outs ({allCheckOuts.length})
                  {stats.overdue > 0 && (
                    <span className="ml-2 text-sm font-normal text-red-600 dark:text-red-400">
                      ({stats.overdue} overdue)
                    </span>
                  )}
                </h2>
              </div>
              <div className="p-4 md:p-6">
                {allCheckOuts.length > 0 ? (
                  <div className="space-y-3">
                    {allCheckOuts.map((reservation) => {
                      const checkOutDate = new Date(reservation.checkOutDate);
                      checkOutDate.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isOverdue = checkOutDate < today;
                      const isToday = checkOutDate.getTime() === today.getTime();
                      
                      return (
                        <div
                          key={reservation.bookingId}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedReservation?.bookingId === reservation.bookingId
                              ? isOverdue 
                                ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md"
                                : "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                              : isOverdue
                                ? "border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600 bg-red-50/50 dark:bg-red-900/10 hover:shadow-sm"
                                : isToday
                                ? "border-yellow-300 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/10 hover:shadow-sm"
                                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                          }`}
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setInvoice(null);
                            setExtraChargesList([]);
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                                isOverdue 
                                  ? "bg-gradient-to-br from-red-500 to-red-600"
                                  : isToday
                                  ? "bg-gradient-to-br from-yellow-500 to-orange-600"
                                  : "bg-gradient-to-br from-blue-500 to-purple-600"
                              }`}>
                                {reservation.customer?.firstName?.[0]}{reservation.customer?.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900 dark:text-white text-lg">
                                    {reservation.customer?.firstName} {reservation.customer?.lastName}
                                  </p>
                                  {isOverdue && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">
                                      Overdue
                                    </span>
                                  )}
                                  {isToday && !isOverdue && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200">
                                      Today
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <FileText size={14} />
                                    #{reservation.bookingId}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User size={14} />
                                    Room {reservation.room?.roomNumber || "N/A"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {new Date(reservation.checkOutDate).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: checkOutDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                ${(reservation.totalPrice || 0).toFixed(2)}
                              </p>
                              <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                isOverdue
                                  ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200"
                                  : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
                              }`}>
                                {isOverdue ? "Overdue" : "Pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      No check-outs available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Check-Out Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 sticky top-4">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Process Check-Out</h2>
              </div>
              <div className="p-4 md:p-6">
                {selectedReservation ? (
                  <>
                    {!invoice ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Guest Name</label>
                          <input
                            type="text"
                            value={`${selectedReservation.customer?.firstName} ${selectedReservation.customer?.lastName}`}
                            disabled
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room & Duration</label>
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-1 text-sm">
                            <p className="text-gray-900 dark:text-white">Room {selectedReservation.room?.roomNumber}</p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {new Date(selectedReservation.checkInDate).toLocaleDateString()} - {new Date(selectedReservation.checkOutDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base Room Charges</label>
                          <input
                            type="text"
                            value={`$${(selectedReservation.totalPrice || 0).toFixed(2)}`}
                            disabled
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-semibold"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Extra Charges</label>
                            <button
                              onClick={() => setShowChargeInput(!showChargeInput)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {showChargeInput ? 'Cancel' : '+ Add Charge'}
                            </button>
                          </div>
                          
                          {showChargeInput && (
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-2 mb-2">
                              <input
                                type="text"
                                placeholder="Description"
                                value={newCharge.description}
                                onChange={(e) => setNewCharge({...newCharge, description: e.target.value})}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={newCharge.amount}
                                  onChange={(e) => setNewCharge({...newCharge, amount: e.target.value})}
                                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
                                  step="0.01"
                                />
                                <button
                                  onClick={addExtraCharge}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {extraChargesList.length > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-2">
                              {extraChargesList.map((charge, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700 dark:text-gray-300">{charge.description}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 dark:text-white font-semibold">${charge.amount.toFixed(2)}</span>
                                    <button
                                      onClick={() => removeExtraCharge(index)}
                                      className="text-red-600 dark:text-red-400 hover:underline text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                          <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option>Cash</option>
                            <option>Credit Card</option>
                            <option>Debit Card</option>
                            <option>Mobile Payment</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Any notes about the stay..."
                          />
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <input
                            type="checkbox"
                            id="emailInvoice"
                            checked={formData.emailInvoice}
                            onChange={(e) => setFormData({ ...formData, emailInvoice: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label htmlFor="emailInvoice" className="text-sm text-gray-700 dark:text-gray-300">
                            Email invoice to guest
                          </label>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              ${calculateTotal().toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleCheckOut}
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <CheckCircle size={20} />
                                Complete Check-Out
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelBooking}
                            disabled={loading}
                            className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            title="Cancel booking and make room available"
                          >
                            <X size={20} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center py-6">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Check-Out Complete!
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Invoice generated successfully
                          </p>
                          
                          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-3 text-left mb-6">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Guest:</span>
                              <span className="text-gray-900 dark:text-white font-medium">{invoice.guestName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Room:</span>
                              <span className="text-gray-900 dark:text-white font-medium">{invoice.roomNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Payment:</span>
                              <span className="text-gray-900 dark:text-white font-medium">{invoice.paymentMethod}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between">
                                <span className="text-gray-900 dark:text-white font-semibold">Total Paid:</span>
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  ${invoice.total.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <button
                              onClick={downloadInvoice}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Download size={20} />
                              Download Invoice
                            </button>
                            <button
                              onClick={() => {
                                setInvoice(null);
                                setSelectedReservation(null);
                                setFormData({ notes: "", paymentMethod: "Cash", emailInvoice: true });
                                setExtraChargesList([]);
                              }}
                              className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Process Another
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="text-gray-400" size={32} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Select a reservation to process check-out
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}