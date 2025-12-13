import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { customerService } from "../services/customerService.js";

export default function CustomerTravelBooking() {
  const [searchParams] = useSearchParams();
  const attractionParam = searchParams.get("attraction");
  const typeParam = searchParams.get("type");
  
  const [formData, setFormData] = useState({
    attractionName: attractionParam || "",
    attractionType: typeParam || "",
    travelDate: "",
    numberOfParticipants: 1,
    paymentMethod: "card",
    specialRequests: "",
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0); // 0: Details, 1: Payment, 2: Confirmation

  const calculatePrice = () => {
    // Base price calculation (can be updated with actual API data)
    const basePrice = 150; // Default price per participant
    const calculatedTotal = basePrice * formData.numberOfParticipants;
    setTotalPrice(calculatedTotal);
  };

  useEffect(() => {
    calculatePrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.numberOfParticipants]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation: Cannot book without travel date
    if (!formData.travelDate) {
      setError("Please select a travel date to proceed with booking.");
      return;
    }

    // Validation: Travel date must be in the future
    const travelDate = new Date(formData.travelDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (travelDate < today) {
      setError("Travel date must be today or in the future.");
      return;
    }

    // Validation: Must have attraction name
    if (!formData.attractionName) {
      setError("Please select an attraction to proceed with booking.");
      return;
    }

    setLoading(true);

    try {
      await customerService.createTravelBooking({
        attractionName: formData.attractionName,
        attractionType: formData.attractionType,
        travelDate: formData.travelDate,
        numberOfParticipants: formData.numberOfParticipants,
        totalPrice: totalPrice,
        paymentMethod: formData.paymentMethod,
        specialRequests: formData.specialRequests,
        imageUrls: []
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create travel booking");
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: "card", name: "Credit/Debit Card", icon: "💳" },
    { id: "mobile", name: "Mobile Money", icon: "📱" },
    { id: "bank", name: "Bank Transfer", icon: "🏦" },
  ];

  if (step === 2) {
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
              Travel Booking Confirmed!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your travel booking has been successfully created. You will receive a confirmation email shortly.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> Cancellations must be made at least 2 days before the travel date to be eligible for a refund.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Link to="/customer/my-bookings" className="btn-primary">
                View My Bookings
              </Link>
              <Link to="/customer/explore" className="btn-secondary">
                Book Another Experience
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
            {[0, 1].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 dark:bg-secondary-700 text-gray-600 dark:text-gray-400"
                }`}>
                  {s + 1}
                </div>
                {s < 1 && (
                  <div className={`w-16 h-1 mx-2 transition-all ${
                    step > s ? "bg-primary-500" : "bg-gray-200 dark:bg-secondary-700"
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2">
            <span className={`text-sm font-medium ${step >= 0 ? "text-primary-600 dark:text-primary-400" : "text-gray-500"}`}>
              Booking Details
            </span>
            <span className={`text-sm font-medium ${step >= 1 ? "text-primary-600 dark:text-primary-400" : "text-gray-500"}`}>
              Payment
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {step === 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Travel Booking Details
                </h2>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); setStep(1); }} className="space-y-6">
                  <div>
                    <label htmlFor="attractionName" className="label">
                      Attraction/Experience
                    </label>
                    <input
                      id="attractionName"
                      type="text"
                      value={formData.attractionName}
                      onChange={(e) => setFormData({ ...formData, attractionName: e.target.value })}
                      required
                      className="input-field"
                      placeholder="e.g., Volcanoes National Park"
                    />
                  </div>

                  <div>
                    <label htmlFor="attractionType" className="label">
                      Type
                    </label>
                    <select
                      id="attractionType"
                      value={formData.attractionType}
                      onChange={(e) => setFormData({ ...formData, attractionType: e.target.value })}
                      required
                      className="input-field"
                    >
                      <option value="">Select type</option>
                      <option value="Nature">Nature</option>
                      <option value="Culture">Culture</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Wildlife">Wildlife</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="travelDate" className="label">
                      Travel Date *
                    </label>
                    <input
                      id="travelDate"
                      type="date"
                      value={formData.travelDate}
                      onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                    />
                    {!formData.travelDate && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        * Travel date is required to proceed
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="numberOfParticipants" className="label">
                      Number of Participants
                    </label>
                    <select
                      id="numberOfParticipants"
                      value={formData.numberOfParticipants}
                      onChange={(e) => setFormData({ ...formData, numberOfParticipants: parseInt(e.target.value) })}
                      required
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Participant' : 'Participants'}
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

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Cancellation Policy:</strong> Cancellations must be made at least 2 days before the travel date to be eligible for a refund.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!formData.travelDate || !formData.attractionName || loading}
                    className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {step === 1 && (
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
                      onClick={() => setStep(0)}
                      className="btn-secondary flex-1"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-1 text-lg py-4 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Confirm Booking"}
                    </button>
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

              {formData.attractionName && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">{formData.attractionName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type: {formData.attractionType || "Not specified"}
                  </p>
                </div>
              )}

              {formData.travelDate && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Travel Date</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(formData.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Participants</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formData.numberOfParticipants} {formData.numberOfParticipants === 1 ? 'Participant' : 'Participants'}
                    </span>
                  </div>
                </div>
              )}

              {totalPrice > 0 && (
                <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-secondary-700">
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-secondary-700">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {!formData.travelDate && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please select a travel date to continue with your booking.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

