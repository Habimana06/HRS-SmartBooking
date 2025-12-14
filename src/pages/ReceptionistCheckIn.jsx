import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { receptionistService } from "../services/receptionistService.js";

export default function ReceptionistCheckIn() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [searchQuery, setSearchQuery] = useState("");
  const [reservations, setReservations] = useState([]);
  const [checkedInList, setCheckedInList] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: "",
    idDocument: null,
    idDocumentPreview: null,
    notes: "",
    paymentMethod: "card",
    earlyCheckIn: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all checked-in bookings (still using the room)
        const checkedInData = await receptionistService.getCheckedInBookings();
        // Also fetch today's + upcoming arrivals
        const todayData = await receptionistService.getTodayReservations();
        setCheckedInList(checkedInData || []);
        // Combine both - prioritize checked-in for display
        const allData = [...(checkedInData || []), ...(todayData || [])];
        // Remove duplicates
        const uniqueData = allData.filter((r, index, self) => 
          index === self.findIndex(t => t.bookingId === r.bookingId)
        );
        setReservations(uniqueData);
        if (bookingId) {
          const reservation = uniqueData?.find((r) => r.bookingId === parseInt(bookingId));
          if (reservation) setSelectedReservation(reservation);
        }
      } catch (error) {
        console.error("Error fetching reservations:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedReservation) return;
    
    // Validate room number
    if (!formData.roomNumber || formData.roomNumber.trim() === "") {
      alert("Room number is required for check-in");
      return;
    }
    
    setLoading(true);
    try {
      await receptionistService.checkIn(selectedReservation.bookingId, formData);
      setShowSuccessModal(true);
      setSelectedReservation(null);
      setFormData({
        roomNumber: "",
        idDocument: null,
        idDocumentPreview: null,
        notes: "",
        paymentMethod: "card",
        earlyCheckIn: false,
      });
      // Refresh reservations
      const checkedInData = await receptionistService.getCheckedInBookings();
      const todayData = await receptionistService.getTodayReservations();
      setCheckedInList(checkedInData || []);
      const allData = [...(checkedInData || []), ...(todayData || [])];
      const uniqueData = allData.filter((r, index, self) => 
        index === self.findIndex(t => t.bookingId === r.bookingId)
      );
      setReservations(uniqueData);
    } catch (error) {
      console.error("Error checking in:", error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          (error.response?.status === 404 ? "Booking not found. Please refresh the page." : 
                           error.response?.status === 500 ? "Server error occurred. Please try again." :
                           "Failed to process check-in. Please try again.");
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          idDocument: file,
          idDocumentPreview: reader.result 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      res.customer?.firstName?.toLowerCase().includes(query) ||
      res.customer?.lastName?.toLowerCase().includes(query) ||
      res.bookingId?.toString().includes(query) ||
      res.customer?.email?.toLowerCase().includes(query)
    );
  });

  const today = new Date();
  today.setHours(0,0,0,0);
  const todayArrivals = filteredReservations.filter((r) => {
    const checkIn = new Date(r.checkInDate);
    checkIn.setHours(0,0,0,0);
    return checkIn.getTime() === today.getTime();
  });
  const upcomingArrivals = filteredReservations.filter((r) => {
    const checkIn = new Date(r.checkInDate);
    checkIn.setHours(0,0,0,0);
    return checkIn.getTime() > today.getTime();
  });
  const checkedInBookings = filteredReservations.filter((r) => (r.bookingStatus || r.status || "").toLowerCase() === "checked-in");

  const checkedInCount = checkedInBookings.length;
  const pendingCount = todayArrivals.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Guest Check-In
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Process guest arrivals and room assignments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Arrivals</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Checked In</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{checkedInCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Check-In Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">4.2m</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reservations List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Search Bar */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, booking ID, or email..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("today")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    activeTab === "today"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Today ({todayArrivals.length})
                </button>
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    activeTab === "upcoming"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab("checkedin")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    activeTab === "checkedin"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Checked-In ({checkedInBookings.length})
                </button>
              </div>

              {/* Reservation Cards */}
              <div className="p-6">
                {activeTab === "today" && todayArrivals.length > 0 ? (
                  <div className="space-y-3">
                    {todayArrivals.map((reservation) => (
                      <div
                        key={reservation.bookingId}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedReservation?.bookingId === reservation.bookingId
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                        }`}
                        onClick={() => setSelectedReservation(reservation)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {reservation.customer?.firstName?.charAt(0)}{reservation.customer?.lastName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                {reservation.customer?.firstName} {reservation.customer?.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Booking #{reservation.bookingId} • {reservation.customer?.email}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                  Confirmed
                                </span>
                                {reservation.specialRequests && (
                                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                                    Special Request
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {reservation.room?.roomType?.typeName || "Room TBD"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(reservation.checkInDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {Math.ceil((new Date(reservation.checkOutDate) - new Date(reservation.checkInDate)) / (1000 * 60 * 60 * 24))} nights
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeTab === "upcoming" && upcomingArrivals.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingArrivals.map((reservation) => (
                      <div
                        key={reservation.bookingId}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedReservation?.bookingId === reservation.bookingId
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                        }`}
                        onClick={() => setSelectedReservation(reservation)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {reservation.customer?.firstName?.charAt(0)}{reservation.customer?.lastName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                {reservation.customer?.firstName} {reservation.customer?.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Booking #{reservation.bookingId} • {reservation.customer?.email}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                                  Upcoming
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {reservation.room?.roomType?.typeName || "Room TBD"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(reservation.checkInDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {Math.ceil((new Date(reservation.checkOutDate) - new Date(reservation.checkInDate)) / (1000 * 60 * 60 * 24))} nights
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeTab === "checkedin" && checkedInBookings.length > 0 ? (
                  <div className="space-y-3">
                    {checkedInBookings.map((reservation) => (
                      <div
                        key={reservation.bookingId}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedReservation?.bookingId === reservation.bookingId
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm"
                        }`}
                        onClick={() => setSelectedReservation(reservation)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {reservation.customer?.firstName?.charAt(0)}{reservation.customer?.lastName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                {reservation.customer?.firstName} {reservation.customer?.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Booking #{reservation.bookingId} • {reservation.customer?.email}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                  Checked-In
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {reservation.room?.roomType?.typeName || "Room"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Room {reservation.room?.roomNumber || "TBD"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Out: {new Date(reservation.checkOutDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      No reservations to display
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Check-In Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Process Check-In
                </h2>
              </div>
              
              {selectedReservation ? (
                <form onSubmit={handleCheckIn} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={`${selectedReservation.customer?.firstName} ${selectedReservation.customer?.lastName}`}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Room Number *
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="e.g., 204"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="card">Credit/Debit Card</option>
                      <option value="cash">Cash</option>
                      <option value="prepaid">Prepaid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      ID Document
                    </label>
                    {formData.idDocumentPreview ? (
                      <div className="relative">
                        <img 
                          src={formData.idDocumentPreview} 
                          alt="ID Preview" 
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, idDocument: null, idDocumentPreview: null })}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Upload ID document</span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*,.pdf"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.earlyCheckIn}
                        onChange={(e) => setFormData({ ...formData, earlyCheckIn: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Early check-in (additional fee)
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any special notes or requests..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !formData.roomNumber}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Confirm Check-In"
                    )}
                  </button>
                </form>
              ) : (
                <div className="p-12 text-center">
                  <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a reservation to begin check-in
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Check-In Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Guest has been checked in to room {formData.roomNumber}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}