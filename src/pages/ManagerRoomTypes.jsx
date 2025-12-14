import { useState, useEffect } from "react";
import { Edit2, Trash2, DollarSign, Users, Maximize, Home, Plus, X } from "lucide-react";
import { managerService } from "../services/managerService.js";
import { formatRWF } from "../utils/currency.js";

export default function ManagerRoomTypes() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const data = await managerService.getRoomTypes();
      setRoomTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching room types:", error);
      setRoomTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room type? This action cannot be undone.")) {
      return;
    }
    try {
      await managerService.deleteRoomType(id);
      await fetchRoomTypes();
      alert("Room type deleted successfully");
    } catch (error) {
      console.error("Error deleting room type:", error);
      alert(error.response?.data?.error || "Failed to delete room type");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Room Types</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage different room categories and pricing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Room Type
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading room types...</p>
          </div>
        </div>
      ) : roomTypes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No room types found</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomTypes.map((roomType) => (
          <div key={roomType.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{roomType.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatRWF(roomType.basePrice)}
                  <span className="text-sm text-gray-600 font-normal">/night</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingType(roomType)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(roomType.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-sm">Capacity: {roomType.capacity} guests</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Maximize className="w-4 h-4" />
                <span className="text-sm">Size: {roomType.size}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Home className="w-4 h-4" />
                <span className="text-sm">Available: {roomType.available} / {roomType.total}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Features:</p>
              <div className="flex flex-wrap gap-2">
                {roomType.features.map((feature, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                roomType.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {roomType.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingType) && (
        <RoomTypeModal
          roomType={editingType}
          onClose={() => {
            setShowCreateModal(false);
            setEditingType(null);
          }}
          onSave={async () => {
            await fetchRoomTypes();
            setShowCreateModal(false);
            setEditingType(null);
          }}
        />
      )}
    </div>
  );
}

function RoomTypeModal({ roomType, onClose, onSave }) {
  const [formData, setFormData] = useState({
    typeName: roomType?.name || '',
    description: roomType?.description || '',
    basePrice: roomType?.basePrice || '',
    maxOccupancy: roomType?.capacity || '',
    amenities: Array.isArray(roomType?.features) ? roomType.features.join(', ') : ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.typeName.trim()) newErrors.typeName = 'Required';
    if (!formData.basePrice) newErrors.basePrice = 'Required';
    if (!formData.maxOccupancy) newErrors.maxOccupancy = 'Required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      const roomTypeData = {
        typeName: formData.typeName,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice),
        maxOccupancy: parseInt(formData.maxOccupancy),
        amenities: formData.amenities || null
      };
      
      if (roomType) {
        // Update existing - would need update endpoint
        alert("Update functionality coming soon");
      } else {
        await managerService.createRoomType(roomTypeData);
        alert("Room type created successfully!");
      }
      onSave();
    } catch (error) {
      console.error("Error saving room type:", error);
      alert(error.response?.data?.error || "Failed to save room type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {roomType ? 'Edit' : 'Create'} Room Type
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.typeName}
              onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${errors.typeName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="e.g., Standard, Deluxe, Suite"
            />
            {errors.typeName && <p className="text-red-500 text-sm mt-1">{errors.typeName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Room type description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base Price (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${errors.basePrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="50000"
              />
              {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Occupancy <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.maxOccupancy}
                onChange={(e) => setFormData({ ...formData, maxOccupancy: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${errors.maxOccupancy ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="2"
              />
              {errors.maxOccupancy && <p className="text-red-500 text-sm mt-1">{errors.maxOccupancy}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amenities (comma-separated)
            </label>
            <input
              type="text"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="WiFi, TV, AC, Mini Bar"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : (roomType ? 'Update' : 'Create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}