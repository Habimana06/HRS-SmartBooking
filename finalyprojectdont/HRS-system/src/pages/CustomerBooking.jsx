import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { roomService } from "../services/roomService.js";
import { customerService } from "../services/customerService.js";
import { formatRWF } from "../utils/currency.js";

export default function CustomerBooking() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const guestsParam = searchParams.get("guests");
  
  const [room, setRoom] = useState(null);
  const [formData, setFormData] = useState({
    checkIn: checkInParam || "",
    checkOut: checkOutParam || "",
    guests: parseInt(guestsParam) || 1,
    roomId: roomId || "",
    paymentMethod: "",
    specialRequests: "",
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [tax, setTax] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(roomId ? 1 : 0); // 0: Select Room, 1: Details, 2: Payment, 3: Confirmation
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showRoomSelection, setShowRoomSelection] = useState(!roomId);
  const [submitting, setSubmitting] = useState(false);

  const displayPrice = (value) => {
    if (typeof value === "number") return formatRWF(value);
    if (typeof value === "string") {
      const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) return formatRWF(parsed);
      return value;
    }
    return formatRWF(0);
  };

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (formData.checkIn && formData.checkOut && !roomId) {
      fetchAvailableRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.checkIn, formData.checkOut, formData.guests]);

  const fetchAvailableRooms = async () => {
    if (!formData.checkIn || !formData.checkOut) return;
    setLoadingRooms(true);
    try {
      const data = await roomService.getRooms(
        formData.checkIn,
        formData.checkOut,
        formData.guests || null,
        null
      );
      setAvailableRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const data = await roomService.getRoomDetails(roomId);
      setRoom(data);
      setFormData(prev => ({ ...prev, roomId }));
    } catch (error) {
      console.error("Error fetching room:", error);
    }
  };

  const handleRoomSelect = async (selectedRoomId) => {
    setFormData(prev => ({ ...prev, roomId: selectedRoomId.toString() }));
    try {
      const data = await roomService.getRoomDetails(selectedRoomId.toString());
      setRoom(data);
      setShowRoomSelection(false);
      setStep(1);
    } catch (error) {
      console.error("Error fetching room details:", error);
    }
  };

  const calculatePrice = () => {
    if (formData.checkIn && formData.checkOut && room) {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        const priceMatch = room.total?.match(/[\d.]+/);
        const pricePerNight = priceMatch ? parseFloat(priceMatch[0]) : 0;
        const calculatedSubtotal = pricePerNight * days;
        const calculatedTax = calculatedSubtotal * 0.1; // 10% tax
        const calculatedTotal = calculatedSubtotal + calculatedTax;
        
        setSubtotal(calculatedSubtotal);
        setTax(calculatedTax);
        setTotalPrice(calculatedTotal);
      }
    }
  };

  useEffect(() => {
    calculatePrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.checkIn, formData.checkOut, room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation: Cannot book without dates
    if (!formData.checkIn || !formData.checkOut) {
      setError("Please select both check-in and check-out dates to proceed with booking.");
      return;
    }

    // Validation: Check-in must be in the future
    const checkInDate = new Date(formData.checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      setError("Check-in date must be today or in the future.");
      return;
    }

    // Validation: Check-out must be after check-in
    const checkOutDate = new Date(formData.checkOut);
    if (checkOutDate <= checkInDate) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    // Validation: Must have a room selected
    if (!formData.roomId) {
      setError("Please select a room to proceed with booking.");
      return;
    }

    if (!formData.paymentMethod) {
      setError("Please choose a payment method.");
      return;
    }

    setLoading(true);
    setSubmitting(true);

    try {
      const payload = {
        roomId: parseInt(formData.roomId, 10),
        checkInDate: formData.checkIn,
        checkOutDate: formData.checkOut,
        numberOfGuests: formData.guests,
        paymentMethod: formData.paymentMethod,
        specialRequests: formData.specialRequests
      };
      const response = await customerService.bookRoom(payload);
      console.log("Booking response:", response);
      setStep(3);
    } catch (err) {
      console.error("Booking error:", err);
      console.error("Error response:", err.response);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          "Failed to create booking";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { id: "card", name: "Credit/Debit Card", icon: "💳" },
    { id: "mobile", name: "Mobile Money", icon: "📱" },
    { id: "bank", name: "Bank Transfer", icon: "🏦" },
  ];

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-16 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="card">
            <div className="w-20 h-20 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your reservation has been successfully created. You will receive a confirmation email shortly.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/customer/my-bookings" className="btn-primary">
                View My Bookings
              </Link>
              <Link to="/customer/rooms" className="btn-secondary">
                Book Another Room
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              {[0, 1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s
                      ? "bg-primary-500 text-white shadow-lg"
                      : "bg-gray-200 dark:bg-secondary-700 text-gray-500 dark:text-gray-300"
                  }`}>
                    {s + 1}
                  </div>
                  {s < 2 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > s ? "bg-primary-500" : "bg-gray-200 dark:bg-secondary-700"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          <div className="flex justify-center gap-12 mt-2">
            <span className={`text-sm font-medium ${step >= 0 ? "text-primary-600 dark:text-primary-400" : "text-gray-500"}`}>
              {roomId ? "Room Selected" : "Select Room"}
            </span>
            <span className={`text-sm font-medium ${step >= 1 ? "text-primary-600 dark:text-primary-400" : "text-gray-500"}`}>
              Booking Details
            </span>
            <span className={`text-sm font-medium ${step >= 2 ? "text-primary-600 dark:text-primary-400" : "text-gray-500"}`}>
              Payment
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Room Selection Step */}
            {(step === 0 || showRoomSelection) && !roomId && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Select Your Room
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please select your check-in and check-out dates to see available rooms.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="label">Check-In Date</label>
                      <input
                        type="date"
                        value={formData.checkIn}
                        onChange={(e) => {
                          setFormData({ ...formData, checkIn: e.target.value, roomId: "" });
                          setRoom(null);
                          setShowRoomSelection(true);
                        }}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Check-Out Date</label>
                      <input
                        type="date"
                        value={formData.checkOut}
                        onChange={(e) => {
                          setFormData({ ...formData, checkOut: e.target.value, roomId: "" });
                          setRoom(null);
                          setShowRoomSelection(true);
                        }}
                        required
                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                        className="input-field"
                      />
                    </div>
                </div>

                {formData.checkIn && formData.checkOut && (
                  <div>
                    {loadingRooms ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading available rooms...</p>
                      </div>
                    ) : availableRooms.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {availableRooms.map((availableRoom) => (
                          <div
                            key={availableRoom.roomId}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                              formData.roomId === availableRoom.roomId.toString()
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md"
                                : "border-gray-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700"
                            }`}
                            onClick={() => handleRoomSelect(availableRoom.roomId)}
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={availableRoom.imageUrls?.[0] || "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"}
                                alt={availableRoom.name}
                                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                              />
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                  {availableRoom.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                  {availableRoom.details}
                                </p>
                                <div className="flex items-center gap-4">
                                  <span className="text-primary-500 dark:text-primary-400 font-bold">
                                    {displayPrice(availableRoom.price)}
                                  </span>
                                  <div className="flex text-yellow-400">
                                    {[...Array(Math.floor(availableRoom.rating || 4.5))].map((_, i) => (
                                      <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {formData.roomId === availableRoom.roomId.toString() && (
                                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          No rooms available for the selected dates.
                        </p>
                        <Link to="/customer/rooms" className="btn-primary">
                          Browse All Rooms
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Booking Details
                </h2>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="checkIn" className="label">
                        Check-In Date
                      </label>
                      <input
                        id="checkIn"
                        type="date"
                        value={formData.checkIn}
                        onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkOut" className="label">
                        Check-Out Date
                      </label>
                      <input
                        id="checkOut"
                        type="date"
                        value={formData.checkOut}
                        onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                        required
                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="guests" className="label">
                      Number of Guests
                    </label>
                    <select
                      id="guests"
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                      required
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="specialRequests" className="label">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      rows={4}
                      className="input-field"
                      placeholder="Any special requests or preferences..."
                    />
                  </div>

                  <div className="flex gap-4">
                    {!roomId && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoomSelection(true);
                          setStep(0);
                        }}
                        className="btn-secondary flex-1"
                      >
                        Change Room
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!formData.checkIn || !formData.checkOut || !formData.roomId || loading}
                      className="btn-primary flex-1 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Payment
                    </button>
                    {(!formData.checkIn || !formData.checkOut) && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        * Please select check-in and check-out dates to continue
                      </p>
                    )}
                  </div>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Payment Information
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="label">Payment Method</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.paymentMethod === method.id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700"
                          }`}
                        >
                          <div className="text-3xl mb-2">{method.icon}</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{method.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.paymentMethod === "card" && (
                    <div className="space-y-4 p-6 bg-gray-50 dark:bg-secondary-700 rounded-xl">
                      <div>
                        <label className="label">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="input-field"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="input-field"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label className="label">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="input-field"
                            maxLength={3}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          className="input-field"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-secondary flex-1"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || submitting || !formData.paymentMethod}
                      className="btn-primary flex-1 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading || submitting ? "Processing..." : "Confirm Booking"}
                    </button>
                    {error && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Booking Summary
              </h3>

              {room && (
                <div className="mb-6">
                  <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                    <img
                      src={room.galleryImages?.[0] || "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">{room.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {room.description}
                  </p>
                </div>
              )}

              {formData.checkIn && formData.checkOut && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Check-In</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(formData.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Check-Out</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(formData.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Guests</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formData.guests} {formData.guests === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                  {formData.checkIn && formData.checkOut && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700 rounded-xl">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Nights</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {totalPrice > 0 && (
                <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-secondary-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-secondary-700">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {!room && !showRoomSelection && (
                <button
                  onClick={() => {
                    setShowRoomSelection(true);
                    setStep(0);
                  }}
                  className="btn-secondary w-full mt-6 text-center"
                >
                  Select a Room
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
