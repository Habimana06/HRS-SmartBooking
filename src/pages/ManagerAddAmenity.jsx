import { useState } from 'react';
import { Plus, X, Upload, DollarSign, Clock, Users, MapPin, Trash2, Image } from 'lucide-react';
import { managerService } from '../services/managerService.js';
import { useNavigate } from 'react-router-dom';

export default function ManagerAddAmenity() {
  const navigate = useNavigate();
  const [amenityName, setAmenityName] = useState('');
  const [type, setType] = useState('Essential');
  const [status, setStatus] = useState('Active');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [pricingType, setPricingType] = useState('free');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [openingHours, setOpeningHours] = useState({ from: '09:00', to: '18:00' });
  const [operatingDays, setOperatingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [images, setImages] = useState([]);
  const [features, setFeatures] = useState([]);
  const [currentFeature, setCurrentFeature] = useState('');
  const [errors, setErrors] = useState({});

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day) => {
    setOperatingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const addFeature = () => {
    if (currentFeature.trim()) {
      setFeatures(prev => [...prev, currentFeature.trim()]);
      setCurrentFeature('');
    }
  };

  const removeFeature = (index) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!amenityName.trim()) newErrors.amenityName = 'Amenity name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (pricingType === 'paid' && !price) newErrors.price = 'Price is required';
    if (!capacity) newErrors.capacity = 'Capacity is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (operatingDays.length === 0) newErrors.operatingDays = 'Select at least one operating day';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const amenityData = {
        name: amenityName,
        type,
        status,
        description,
        price: pricingType === 'paid' ? parseFloat(price) : 0,
        capacity: parseInt(capacity),
        location,
        operatingHours: openingHours,
        operatingDays,
        images,
        features
      };
      await managerService.createAmenity(amenityData);
      alert('Amenity saved successfully!');
      navigate('/manager/manage-amenities');
    } catch (error) {
      console.error('Error saving amenity:', error);
      alert('Failed to save amenity. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Add New Amenity</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and configure a new amenity for your property</p>
        </div>

        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amenity Name <span className="text-red-500">*</span>
              </label>
              <input
                value={amenityName}
                onChange={(e) => setAmenityName(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.amenityName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., Infinity Pool"
              />
              {errors.amenityName && <p className="text-red-500 text-sm mt-1">{errors.amenityName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option>Essential</option>
                <option>Leisure</option>
                <option>Transport</option>
                <option>Wellness</option>
                <option>Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location <span className="text-red-500">*</span>
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., Rooftop, Level 3"
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
              rows={4}
              placeholder="Describe the amenity, its features, and what makes it special..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Pricing & Capacity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pricing & Capacity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pricing Type</label>
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="members-only">Members Only</option>
              </select>
            </div>

            {pricingType === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Price per Use <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Max Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., 20"
              />
              {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <Clock className="inline w-5 h-5 mr-2" />
            Operating Schedule
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opening Time</label>
              <input
                type="time"
                value={openingHours.from}
                onChange={(e) => setOpeningHours(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Closing Time</label>
              <input
                type="time"
                value={openingHours.to}
                onChange={(e) => setOpeningHours(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Operating Days <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    operatingDays.includes(day)
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {errors.operatingDays && <p className="text-red-500 text-sm mt-2">{errors.operatingDays}</p>}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Key Features</h2>
          
          <div className="flex gap-2">
            <input
              value={currentFeature}
              onChange={(e) => setCurrentFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFeature()}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Heated water, Towel service"
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>

          {features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.map((feature, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-2 font-medium"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <Image className="inline w-5 h-5 mr-2" />
            Images
          </h2>
          
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or WEBP (MAX. 5MB)</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSubmit}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Save Amenity
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 px-8 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}