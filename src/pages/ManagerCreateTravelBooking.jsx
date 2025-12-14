import { useState } from 'react';
import { Calendar, Users, Mail, MapPin, Clock, DollarSign, FileText, Search, Plus, AlertCircle, Check, Image as ImageIcon, X } from 'lucide-react';
import { managerService } from '../services/managerService.js';
import { useNavigate } from 'react-router-dom';

export default function ManagerCreateTravelBooking() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    attraction: '',
    date: '',
    time: '',
    participants: '',
    email: '',
    phone: '',
    pickupLocation: '',
    price: '',
    notes: '',
    paymentMethod: 'card'
  });
  
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const popularAttractions = [
    { id: 1, name: 'Gorilla Trekking', duration: '6-8 hours', price: '$1500', category: 'Wildlife' },
    { id: 2, name: 'Kigali City Tour', duration: '4 hours', price: '$80', category: 'Culture' },
    { id: 3, name: 'Lake Kivu Beach Resort', duration: 'Full day', price: '$120', category: 'Leisure' },
    { id: 4, name: 'Nyungwe Forest Canopy Walk', duration: '5 hours', price: '$200', category: 'Adventure' },
    { id: 5, name: 'Akagera National Park Safari', duration: 'Full day', price: '$350', category: 'Wildlife' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectAttraction = (attraction) => {
    setSelectedPackage(attraction);
    setFormData(prev => ({ ...prev, attraction: attraction.name, price: attraction.price }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.attraction || !formData.date || !formData.participants || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Extract price number from string (remove $ and commas)
      const priceNum = parseFloat(formData.price.replace(/[^0-9.]/g, '')) || 0;
      const participants = parseInt(formData.participants) || 1;
      const totalPrice = priceNum * participants;
      
      // Combine date and time if time is provided
      let travelDate = new Date(formData.date);
      if (formData.time) {
        const [hours, minutes] = formData.time.split(':');
        travelDate.setHours(parseInt(hours), parseInt(minutes));
      }

      const bookingData = {
        customerEmail: formData.email, // Send email instead of customerId
        attractionName: formData.attraction,
        attractionType: selectedPackage?.category || 'Adventure',
        travelDate: travelDate.toISOString(),
        numberOfParticipants: participants,
        totalPrice: totalPrice,
        bookingStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: formData.paymentMethod || 'card',
        specialRequests: formData.notes || '',
        imageUrls: images.map(img => img.url).filter(Boolean)
      };

      await managerService.createTravelBooking(bookingData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/manager/manage-travel-bookings');
      }, 2000);
    } catch (error) {
      console.error('Error creating travel booking:', error);
      alert(error.response?.data?.message || 'Failed to create travel booking. Please try again.');
    }
  };

  const calculateTotal = () => {
    const priceNum = parseFloat(formData.price.replace(/[^0-9.]/g, '')) || 0;
    const participants = parseInt(formData.participants) || 0;
    return priceNum * participants;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      setUploading(true);
      const urls = await managerService.uploadTravelImages(files);
      const mapped = urls.map(url => ({
        id: Math.random().toString(36).substr(2, 9),
        name: url.split('/').pop(),
        url
      }));
      setImages(prev => [...prev, ...mapped]);
    } catch (err) {
      console.error('Travel image upload failed:', err);
      alert('Failed to upload travel images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <MapPin className="text-blue-500" />
                Create Travel Booking
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Book tours and excursions for your guests</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Quick Booking</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Attractions Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-500" />
                Popular Attractions
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {popularAttractions.map(attraction => (
                  <button
                    key={attraction.id}
                    onClick={() => selectAttraction(attraction)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      selectedPackage?.id === attraction.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">{attraction.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{attraction.duration}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                        {attraction.category}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{attraction.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700 space-y-6">
              {/* Success Message */}
              {showSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-green-800 dark:text-green-300">Booking Created Successfully!</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Confirmation email will be sent shortly.</div>
                  </div>
                </div>
              )}

              {/* Attraction & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Attraction *
                  </label>
                  <input
                    name="attraction"
                    value={formData.attraction}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    placeholder="e.g., Gorilla Trek"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Time & Participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Pickup Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Participants *
                  </label>
                  <input
                    type="number"
                    name="participants"
                    value={formData.participants}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    placeholder="Number of guests"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    placeholder="guest@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    placeholder="+250 XXX XXX XXX"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  Travel Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-700 dark:text-gray-200"
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-xs text-blue-500">Uploading images...</p>
                )}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {images.map((img) => (
                      <div key={img.id} className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pickup Location & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Pickup Location
                  </label>
                  <input
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    placeholder="Hotel or address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    Price per Person *
                  </label>
                  <input
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    placeholder="$0.00"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Special Requests / Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                  rows={4}
                  placeholder="Dietary restrictions, accessibility needs, special occasions..."
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              {/* Total Price Display */}
              {formData.participants && formData.price && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Booking Cost</div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        ${calculateTotal().toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formData.participants} × {formData.price}
                      </div>
                    </div>
                    <DollarSign className="w-12 h-12 text-blue-400 opacity-50" />
                  </div>
                </div>
              )}

              {/* Important Note */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Confirm availability before creating the booking. Send confirmation email within 24 hours.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Booking
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-4 px-8 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Phone(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}