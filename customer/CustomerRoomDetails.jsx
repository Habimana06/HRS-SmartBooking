import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { roomService } from "../services/roomService.js";
import { formatRWF } from "../utils/currency.js";

export default function CustomerRoomDetails() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const displayPrice = (value) => {
    if (typeof value === "number") return formatRWF(value);
    if (typeof value === "string") {
      const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) return formatRWF(parsed);
      return value;
    }
    return formatRWF(0);
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const data = await roomService.getRoomDetails(id);
        setRoom(data);
      } catch (error) {
        console.error("Error fetching room details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Room not found
          </h2>
          <Link to="/customer/rooms" className="btn-primary">
            Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/customer/rooms"
          className="text-primary-600 dark:text-primary-400 hover:underline mb-4 inline-block"
        >
          ← Back to Rooms
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="relative h-96 rounded-2xl overflow-hidden mb-4">
              <img
                src={room.galleryImages?.[0] || "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=1200&q=80"}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {room.galleryImages?.slice(1, 5).map((img, index) => (
                <div key={index} className="relative h-24 rounded-xl overflow-hidden">
                  <img
                    src={img}
                    alt={`${room.name} ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {room.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {room.description}
            </p>

            <div className="card mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Pricing
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Price per night:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{displayPrice(room.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{displayPrice(room.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary-500 dark:text-primary-400 pt-2 border-t border-gray-200 dark:border-secondary-700">
                  <span>Total:</span>
                  <span>{displayPrice(room.total)}</span>
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {room.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-accent-400 mr-2">✓</span>
                    <span className="text-gray-600 dark:text-gray-400">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to={`/customer/booking?roomId=${id}`}
              className="btn-primary w-full text-center text-lg py-4"
            >
              Book This Room
            </Link>
          </div>
        </div>

        {/* Reviews */}
        {room.reviews && room.reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {room.reviews.map((review, index) => (
                <div key={index} className="card">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {review.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 italic">
                    "{review.quote}"
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    - {review.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
