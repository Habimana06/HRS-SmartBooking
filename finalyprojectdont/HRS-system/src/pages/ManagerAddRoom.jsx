import { useState, useEffect } from 'react';
import { Plus, X, Upload, DollarSign, Bed, Users, Maximize, Trash2, Image, Wifi, Tv, Coffee, Wind, Bath, Phone, Check } from 'lucide-react';
import { managerService } from '../services/managerService.js';
import { useNavigate } from 'react-router-dom';

export default function ManagerAddRoom() {
  const navigate = useNavigate();
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [status, setStatus] = useState('Available');
  const [price, setPrice] = useState('');
  const [beds, setBeds] = useState('');
  const [bedType, setBedType] = useState('Queen');
  const [bathrooms, setBathrooms] = useState('1');
  const [maxOccupancy, setMaxOccupancy] = useState('');
  const [size, setSize] = useState('');
  const [view, setView] = useState('City View');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const types = await managerService.getRoomTypes();
        setRoomTypes(types);
        if (types.length > 0) {
          setRoomTypeId(types[0].id);
        }
      } catch (error) {
        console.error("Error fetching room types:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomTypes();
  }, []);

  const amenitiesList = [
    { id: 'wifi', name: 'Free WiFi', icon: Wifi },
    { id: 'tv', name: 'Smart TV', icon: Tv },
    { id: 'minibar', name: 'Mini Bar', icon: Coffee },
    { id: 'ac', name: 'Air Conditioning', icon: Wind },
    { id: 'bathtub', name: 'Bathtub', icon: Bath },
    { id: 'phone', name: 'Telephone', icon: Phone },
  ];

  const toggleAmenity = (amenityId) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const urls = await managerService.uploadRoomImages(files);
      const newImages = urls.map(url => ({
        id: Math.random().toString(36).substr(2, 9),
        name: url.split('/').pop(),
        url
      }));
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload images. Please try again.");
    } 
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!roomNumber.trim()) newErrors.roomNumber = 'Room number is required';
    if (!floor) newErrors.floor = 'Floor is required';
    if (!roomTypeId) newErrors.roomTypeId = 'Room type is required';
    if (!price) newErrors.price = 'Price is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    
    try {
      const roomData = {
        roomNumber,
        floorNumber: floor ? parseInt(floor) : null,
        roomTypeId: parseInt(roomTypeId),
        status: status.toLowerCase(),
        currentPrice: parseFloat(price),
        description,
        imageUrls: images.map(img => img.url).filter(Boolean)
      };
      await managerService.createRoom(roomData);
      alert('Room saved successfully!');
      navigate('/manager/manage-rooms');
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Failed to save room. Please try again.');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Available': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'Occupied': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'Maintenance': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'Reserved': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Add New Room</h1>
              <p className="text-gray-600 dark:text-gray-400">Configure room details, pricing, and amenities</p>
            </div>
            <span className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor()}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.roomNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., 205"
              />
              {errors.roomNumber && <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Floor <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.floor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., 2"
              />
              {errors.floor && <p className="text-red-500 text-sm mt-1">{errors.floor}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Type <span className="text-red-500">*</span>
              </label>
              {loading ? (
                <div className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500">
                  Loading room types...
                </div>
              ) : (
                <select
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.roomTypeId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                >
                  <option value="">Select Room Type</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                  {rt.name} - {rt.basePrice ? `$${rt.basePrice.toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
              )}
              {errors.roomTypeId && <p className="text-red-500 text-sm mt-1">{errors.roomTypeId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option>Available</option>
                <option>Occupied</option>
                <option>Maintenance</option>
                <option>Reserved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View</label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option>City View</option>
                <option>Garden View</option>
                <option>Pool View</option>
                <option>Mountain View</option>
                <option>Ocean View</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Price (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., 120000"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
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
              placeholder="Describe the room features, ambiance, and special highlights..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Room Specifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Room Specifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Bed className="inline w-4 h-4 mr-1" />
                Number of Beds <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.beds ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., 2"
              />
              {errors.beds && <p className="text-red-500 text-sm mt-1">{errors.beds}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bed Type</label>
              <select
                value={bedType}
                onChange={(e) => setBedType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option>Single</option>
                <option>Twin</option>
                <option>Queen</option>
                <option>King</option>
                <option>California King</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Bath className="inline w-4 h-4 mr-1" />
                Bathrooms
              </label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option>1</option>
                <option>1.5</option>
                <option>2</option>
                <option>2.5</option>
                <option>3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Max Occupancy <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={maxOccupancy}
                onChange={(e) => setMaxOccupancy(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.maxOccupancy ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., 4"
              />
              {errors.maxOccupancy && <p className="text-red-500 text-sm mt-1">{errors.maxOccupancy}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Maximize className="inline w-4 h-4 mr-1" />
                Room Size (m²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${errors.size ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="e.g., 35"
              />
              {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Room Amenities</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {amenitiesList.map((amenity) => {
              const Icon = amenity.icon;
              const isSelected = selectedAmenities.includes(amenity.id);
              
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {amenity.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <Image className="inline w-5 h-5 mr-2" />
            Room Images
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
            className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Save Room
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