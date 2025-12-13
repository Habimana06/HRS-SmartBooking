import { useEffect, useState } from "react";
import { customerService } from "../services/customerService.js";
import QRCode from "qrcode";
import { useNavigate } from "react-router-dom";
import { messageService } from "../services/messageService.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function CustomerMyBookings() {
  const [bookings, setBookings] = useState([]);
  const [travelBookings, setTravelBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past, cancelled
  const [selectedTab, setSelectedTab] = useState("hotel"); // hotel, travel
  const [refundMessage, setRefundMessage] = useState("");
  const [detailBooking, setDetailBooking] = useState(null); // {booking, type}
  const [cancelDialog, setCancelDialog] = useState(null); // { booking, isTravel, daysUntil, policy }
  const [cancelReason, setCancelReason] = useState("");
  const [contactModal, setContactModal] = useState(null); // { booking, type }
  const [contactMessage, setContactMessage] = useState({ subject: "", message: "" });
  const [contactStatus, setContactStatus] = useState({ loading: false, error: "", success: "" });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await customerService.getMyBookings();
      setBookings(data.bookings || []);
      setTravelBookings(data.travelBookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if cancellation is allowed (at least 2 days before)
  const canCancel = (bookingDate) => {
    const booking = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilBooking = Math.ceil((booking - today) / (1000 * 60 * 60 * 24));
    return daysUntilBooking >= 2;
  };

  const getDaysUntilBooking = (bookingDate) => {
    const booking = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((booking - today) / (1000 * 60 * 60 * 24));
  };

  const handleCancel = async (booking, isTravel = false) => {
    const bookingDate = isTravel ? booking.travelDate : booking.checkInDate;
    const daysUntil = getDaysUntilBooking(bookingDate);
    
    if (!canCancel(bookingDate)) {
      alert(
        `Cancellation is not allowed. You must cancel at least 2 days before the ${isTravel ? 'travel' : 'check-in'} date to be eligible for a refund.\n\n` +
        `Your ${isTravel ? 'travel' : 'check-in'} date is in ${daysUntil} day(s).`
      );
      return;
    }

    setCancelDialog({
      booking,
      isTravel,
      daysUntil,
      policy: `Cancellations made at least 2 days before the ${isTravel ? "travel" : "check-in"} date are eligible for a full refund.`,
    });
    setCancelReason("");
  };

  const confirmCancel = async () => {
    if (!cancelDialog) return;
    try {
      const reason = cancelReason.trim() || cancelDialog.policy;
      if (cancelDialog.isTravel) {
        await customerService.requestTravelRefund({
          travelBookingId: cancelDialog.booking.travelBookingId,
          reason
        });
      } else {
        await customerService.cancelBooking(cancelDialog.booking.bookingId, {
          reason
        });
      }
      alert("Cancellation/refund requested. The team will review your request.");
      setCancelReason("");
      setCancelDialog(null);
      await fetchBookings();
    } catch (error) {
      console.error("Error requesting cancellation:", error);
      const msg = error.response?.data?.message || "Failed to request cancellation.";
      alert(msg);
    }
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "$0.00";
    if (value === 0) return "$0.00";
    
    // If API sends a string with RWF, extract the number and convert
    if (typeof value === "string") {
      // Remove RWF, rwf, commas, spaces, and any currency symbols
      const cleaned = value.replace(/RWF|rwf|Rwf|,|\s/g, "").replace(/[^\d.]/g, "");
      const numValue = parseFloat(cleaned);
      if (!isNaN(numValue) && numValue > 0) {
        return `$${numValue.toFixed(2)}`;
      }
      // If it's already a USD formatted string, return as is
      if (value.includes("$")) {
        return value;
      }
      // Otherwise try to parse as number directly
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0) {
        return `$${parsed.toFixed(2)}`;
      }
      return "$0.00";
    }
    // If it's a number, format it as USD
    const num = Number(value);
    if (isNaN(num)) return "$0.00";
    return `$${num.toFixed(2)}`;
  };

  const handleDownloadTicket = async (booking, type = "hotel") => {
    const id = booking.bookingId || booking.travelBookingId;
    const title = type === "travel" ? "Travel Ticket" : "Hotel Reservation Ticket";
    const primaryLine =
      type === "travel"
        ? `Attraction: ${booking.attractionName} (${booking.attractionType})`
        : `Room: ${booking.roomType} (${booking.roomNumber})`;
    const dateLine =
      type === "travel"
        ? `Travel Date: ${new Date(booking.travelDate).toLocaleDateString()}`
        : `Dates: ${new Date(booking.checkInDate).toLocaleDateString()} → ${new Date(
            booking.checkOutDate
          ).toLocaleDateString()}`;
    const guestsLine = `Guests/Participants: ${booking.numberOfGuests || booking.numberOfParticipants}`;
    const qrText = `Booking:${id}|Type:${type}|Total:${formatPrice(booking.totalPrice)}`;
    const qrDataUrl = await QRCode.toDataURL(qrText);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title} #${id}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f7f9fc; padding:24px; }
    .ticket { max-width:720px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.08); }
    h1 { margin:0 0 8px 0; font-size:22px; color:#111827; }
    .muted { color:#6b7280; margin-bottom:16px; }
    .row { display:flex; justify-content:space-between; gap:12px; margin:6px 0; color:#111827; }
    .label { color:#6b7280; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; }
    .value { font-weight:600; }
    .pill { display:inline-block; padding:6px 10px; border-radius:999px; background:#e5f3ff; color:#0b66c3; font-weight:600; }
    .qr { margin-top:16px; text-align:center; }
    .footer { margin-top:12px; color:#6b7280; font-size:12px; text-align:center; }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="row" style="align-items:center;">
      <div>
        <h1>${title}</h1>
        <div class="muted">Reservation ID #${id}</div>
      </div>
      <div class="pill">${booking.bookingStatus || "N/A"}</div>
    </div>
    <div class="row"><span class="label">Primary</span><span class="value">${primaryLine}</span></div>
    <div class="row"><span class="label">Dates</span><span class="value">${dateLine}</span></div>
    <div class="row"><span class="label">Guests</span><span class="value">${guestsLine}</span></div>
    <div class="row"><span class="label">Total</span><span class="value">${formatPrice(booking.totalPrice)}</span></div>
    <div class="row"><span class="label">Payment</span><span class="value">${booking.paymentStatus || "N/A"}</span></div>
    <div class="row"><span class="label">Key</span><span class="value">${booking.roomKey || "N/A"}</span></div>
    <div class="qr">
      <img src="${qrDataUrl}" alt="QR Code" width="160" height="160"/>
      <div class="muted">Scan to verify reservation</div>
    </div>
    <div class="footer">Please present this ticket at check-in. Refunds/cancellations per policy.</div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (booking, type = "hotel") => {
    setDetailBooking({ booking, type });
  };

  const handleContactSupport = (booking, type = "hotel") => {
    const bookingId = booking.bookingId || booking.travelBookingId;
    const bookingType = type === "travel" ? "Travel Booking" : "Room Booking";
    setContactModal({ booking, type });
    setContactMessage({
      subject: `Inquiry about ${bookingType} #${bookingId}`,
      message: `Hello,\n\nI have a question regarding my ${bookingType} #${bookingId}.\n\n`
    });
    setContactStatus({ loading: false, error: "", success: "" });
  };

  const handleSendContactMessage = async () => {
    if (!contactModal || !contactMessage.subject.trim() || !contactMessage.message.trim()) {
      setContactStatus({ loading: false, error: "Please fill in both subject and message.", success: "" });
      return;
    }

    setContactStatus({ loading: true, error: "", success: "" });
    try {
      await messageService.sendMessage({
        name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Guest",
        email: user?.email || "",
        subject: contactMessage.subject,
        content: contactMessage.message,
        fromRole: "Customer",
      });
      setContactStatus({ loading: false, error: "", success: "Message sent! The receptionist will get back to you shortly." });
      setTimeout(() => {
        setContactModal(null);
        setContactMessage({ subject: "", message: "" });
        setContactStatus({ loading: false, error: "", success: "" });
      }, 2000);
    } catch (error) {
      const msg = error?.response?.data?.error || "Failed to send message. Please try again.";
      setContactStatus({ loading: false, error: msg, success: "" });
    }
  };


  const filteredBookings = bookings.filter((booking) => {
    const isCancellationPending = booking.refundRequested && booking.refundApproved == null;
    if (filter === "all") return true;
    if (filter === "upcoming") {
      return new Date(booking.checkInDate) >= new Date() && booking.bookingStatus !== "Cancelled" && !isCancellationPending;
    }
    if (filter === "past") {
      return new Date(booking.checkOutDate) < new Date();
    }
    if (filter === "cancelled") {
      return booking.bookingStatus === "Cancelled" || isCancellationPending;
    }
    return true;
  });

  const filteredTravelBookings = travelBookings.filter((booking) => {
    const isCancellationPending = booking.refundRequested && booking.refundApproved == null;
    if (filter === "all") return true;
    if (filter === "upcoming") {
      return new Date(booking.travelDate) >= new Date() && booking.bookingStatus !== "Cancelled" && !isCancellationPending;
    }
    if (filter === "past") {
      return new Date(booking.travelDate) < new Date();
    }
    if (filter === "cancelled") {
      return booking.bookingStatus === "Cancelled" || isCancellationPending;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const allBookings = selectedTab === "hotel" ? filteredBookings : filteredTravelBookings;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            My Reservations
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage all your bookings and reservations
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-secondary-700">
            <button
              onClick={() => setSelectedTab("hotel")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                selectedTab === "hotel"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Hotel Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setSelectedTab("travel")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                selectedTab === "travel"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Travel Bookings ({travelBookings.length})
            </button>
          </div>
        </div>

        {/* Filters - Only for Hotel Bookings */}
        {selectedTab === "hotel" && (
          <div className="mb-6 flex flex-wrap gap-2">
            {["all", "upcoming", "past", "cancelled"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filter === f
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-secondary-600"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Bookings List */}
        {allBookings.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No {selectedTab === "hotel" ? "Hotel" : "Travel"} Bookings
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {selectedTab === "hotel"
                ? "You don't have any hotel reservations yet."
                : "You don't have any travel bookings yet."}
            </p>
            <a href={selectedTab === "hotel" ? "/customer/rooms" : "/customer/explore"} className="btn-primary inline-block">
              {selectedTab === "hotel" ? "Browse Rooms" : "Explore Travel"}
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedTab === "hotel" ? (
              filteredBookings.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="group card hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Reservation ID</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        #{booking.bookingId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Room</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {booking.roomType}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Room {booking.roomNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Dates</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {new Date(booking.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        to {new Date(booking.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Status</p>
                      {(() => {
                        const isCancellationPending = booking.refundRequested && booking.refundApproved == null;
                        const displayStatus = isCancellationPending ? "Cancellation Pending" : booking.bookingStatus;
                        const color =
                          displayStatus === "Confirmed"
                            ? "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200"
                            : displayStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : displayStatus === "Cancellation Pending"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : displayStatus === "Cancelled"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
                        return (
                          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${color}`}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Payment: {booking.paymentStatus}
                      </div>
                      {booking.refundRequested && (
                        <div className="mt-1 text-xs text-orange-500">
                          Refund requested
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-secondary-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Total Price</p>
                        <p className="font-bold text-primary-500 dark:text-primary-400 text-xl">
                          {formatPrice(booking.totalPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Payment Status</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                            booking.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Guests</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'Guest' : 'Guests'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Room Key</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-secondary-700 px-3 py-1 rounded-lg inline-block">
                          {booking.roomKey}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {booking.bookingStatus !== "Cancelled" && !(booking.refundRequested && booking.refundApproved == null) && new Date(booking.checkInDate) >= new Date() && (
                        <>
                          {canCancel(booking.checkInDate) ? (
                            <button
                              onClick={() => handleCancel(booking, false)}
                              className="btn-secondary text-sm"
                            >
                              Cancel Booking
                            </button>
                          ) : (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                              Cannot cancel: Less than 2 days before check-in
                            </div>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleDownloadTicket(booking, "hotel")}
                        className="btn-primary text-sm"
                      >
                        Download Ticket
                      </button>
                      <button
                        onClick={() => handleViewDetails(booking, "hotel")}
                        className="btn-secondary text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleContactSupport(booking, "hotel")}
                        className="btn-secondary text-sm"
                      >
                        Contact Support
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Policy: Cancellations/refunds allowed up to 2 days before check-in.
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              travelBookings.map((booking) => (
                <div
                  key={booking.travelBookingId}
                  className="group card hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
                >
                  {booking.imageUrls && booking.imageUrls.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">Images</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {booking.imageUrls.slice(0, 4).map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`${booking.attractionName} ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Attraction</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {booking.attractionName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.attractionType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Travel Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(booking.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.numberOfParticipants} Participants
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Total Price</p>
                      <p className="font-bold text-primary-500 dark:text-primary-400 text-xl">
                        {formatPrice(booking.totalPrice)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Status</p>
                      {(() => {
                        const isCancellationPending = booking.refundRequested && booking.refundApproved == null;
                        const displayStatus = isCancellationPending ? "Cancellation Pending" : booking.bookingStatus;
                        const color =
                          displayStatus === "Confirmed"
                            ? "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200"
                            : displayStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : displayStatus === "Cancellation Pending"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : displayStatus === "Cancelled"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
                        return (
                          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${color}`}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Payment: {booking.paymentStatus || "pending"}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        Refund: {booking.refundRequested ? (booking.refundApproved == null ? "Requested" : booking.refundApproved ? "Approved" : "Declined") : "Not requested"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-secondary-700">
                    <div className="flex flex-wrap gap-3">
                      {booking.bookingStatus !== "Cancelled" && !(booking.refundRequested && booking.refundApproved == null) && new Date(booking.travelDate) >= new Date() && (
                        <>
                          {canCancel(booking.travelDate) ? (
                            <button
                              onClick={() => handleCancel(booking, true)}
                              className="btn-secondary text-sm"
                            >
                              Cancel Booking
                            </button>
                          ) : (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                              Cannot cancel: Less than 2 days before travel date
                            </div>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleViewDetails(booking, "travel")}
                        className="btn-secondary text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleCancel(booking, true)}
                        className="btn-secondary text-sm"
                        disabled={booking.refundRequested || !canCancel(booking.travelDate)}
                        title="Refunds allowed up to 2 days before travel"
                      >
                        {booking.refundRequested ? "Refund Requested" : "Request Refund"}
                      </button>
                      <button
                        onClick={() => handleContactSupport(booking, "travel")}
                        className="btn-secondary text-sm"
                      >
                        Contact Support
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Policy: Refunds allowed up to 2 days before travel date.
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {refundMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200">
            {refundMessage}
          </div>
        </div>
      )}
      {detailBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setDetailBooking(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white"
              aria-label="Close details"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              {detailBooking.type === "travel" ? "Travel Booking Details" : "Reservation Details"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              ID #{detailBooking.booking.bookingId || detailBooking.booking.travelBookingId}
            </p>
            <div className="space-y-2 text-gray-800 dark:text-gray-200">
              {detailBooking.type === "travel" ? (
                <>
                  <div className="flex justify-between"><span>Attraction</span><span>{detailBooking.booking.attractionName}</span></div>
                  <div className="flex justify-between"><span>Type</span><span>{detailBooking.booking.attractionType}</span></div>
                  <div className="flex justify-between"><span>Travel Date</span><span>{new Date(detailBooking.booking.travelDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>Participants</span><span>{detailBooking.booking.numberOfParticipants}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span>Room</span><span>{detailBooking.booking.roomType} - {detailBooking.booking.roomNumber}</span></div>
                  <div className="flex justify-between"><span>Check-in</span><span>{new Date(detailBooking.booking.checkInDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>Check-out</span><span>{new Date(detailBooking.booking.checkOutDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>Guests</span><span>{detailBooking.booking.numberOfGuests}</span></div>
                </>
              )}
              <div className="flex justify-between"><span>Status</span><span>{detailBooking.booking.bookingStatus || "N/A"}</span></div>
              <div className="flex justify-between"><span>Payment</span><span>{detailBooking.booking.paymentStatus || "N/A"}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPrice(detailBooking.booking.totalPrice)}</span></div>
              {detailBooking.booking.roomKey && (
                <div className="flex justify-between"><span>Key</span><span className="font-mono">{detailBooking.booking.roomKey}</span></div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleDownloadTicket(detailBooking.booking, detailBooking.type)}
                className="btn-primary text-sm"
              >
                Download Ticket
              </button>
              <button
                onClick={() => setDetailBooking(null)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {cancelDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setCancelDialog(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white"
              aria-label="Close cancel dialog"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Cancel {cancelDialog.isTravel ? "Travel" : "Room"} Booking?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {cancelDialog.policy}
            </p>
            <div className="bg-gray-100 dark:bg-secondary-700 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-100 mb-4">
              You have <strong>{cancelDialog.daysUntil} day(s)</strong> until the{" "}
              {cancelDialog.isTravel ? "travel" : "check-in"} date.
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Reservation ID #{cancelDialog.booking.bookingId || cancelDialog.booking.travelBookingId}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Reason for cancelling
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Let us know why you need to cancel"
                className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Your reason is shared with the receptionist to approve or decline the cancellation.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmCancel}
                className="btn-primary text-sm"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => setCancelDialog(null)}
                className="btn-secondary text-sm"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
      {contactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => {
                setContactModal(null);
                setContactMessage({ subject: "", message: "" });
                setContactStatus({ loading: false, error: "", success: "" });
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white"
              aria-label="Close contact modal"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Contact Support
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Send a message to the receptionist about your booking
            </p>
            {contactStatus.success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 text-sm">
                {contactStatus.success}
              </div>
            )}
            {contactStatus.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 text-sm">
                {contactStatus.error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={contactMessage.subject}
                  onChange={(e) => setContactMessage({ ...contactMessage, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Subject of your message"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Message
                </label>
                <textarea
                  value={contactMessage.message}
                  onChange={(e) => setContactMessage({ ...contactMessage, message: e.target.value })}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tell us how we can help..."
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSendContactMessage}
                className="btn-primary text-sm"
                disabled={contactStatus.loading || !contactMessage.subject.trim() || !contactMessage.message.trim()}
              >
                {contactStatus.loading ? "Sending..." : "Send Message"}
              </button>
              <button
                onClick={() => {
                  setContactModal(null);
                  setContactMessage({ subject: "", message: "" });
                  setContactStatus({ loading: false, error: "", success: "" });
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
