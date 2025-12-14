import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { roomService } from "../services/roomService.js";
import { formatRWF } from "../utils/currency.js";

export default function CustomerRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("default");
  const [filters, setFilters] = useState({
    roomType: "",
    guests: "",
    priceRange: "",
    ac: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

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
    fetchRooms();
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await roomService.getRooms(
        null,
        null,
        filters.guests || null,
        filters.roomType || null
      );
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedRooms = [...rooms].sort((a, b) => {
    if (sortBy === "price-low") {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
      return priceA - priceB;
    }
    if (sortBy === "price-high") {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
      return priceB - priceA;
    }
    if (sortBy === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    }
    return 0;
  });

  const clearFilters = () => {
    setFilters({
      roomType: "",
      guests: "",
      priceRange: "",
      ac: "",
    });
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== "").length;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Our Rooms
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Find your perfect accommodation from our curated collection
          </p>
        </div>

        {/* Toolbar */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center gap-2 relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-400 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field w-auto min-w-[180px]"
              >
                <option value="default">Sort by: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <div className="flex items-center gap-2 border border-gray-300 dark:border-secondary-600 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary-500 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-secondary-700"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-primary-500 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-secondary-700"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-secondary-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Room Type</label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Types</option>
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="label">Number of Guests</label>
                  <input
                    type="number"
                    value={filters.guests}
                    onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
                    className="input-field"
                    placeholder="Guests"
                    min="1"
                  />
                </div>
                <div>
                  <label className="label">Price Range</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Prices</option>
                    <option value="low">$0 - $100</option>
                    <option value="medium">$100 - $200</option>
                    <option value="high">$200+</option>
                  </select>
                </div>
                <div>
                  <label className="label">AC / Non-AC</label>
                  <select
                    value={filters.ac}
                    onChange={(e) => setFilters({ ...filters, ac: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All</option>
                    <option value="ac">AC</option>
                    <option value="non-ac">Non-AC</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{sortedRooms.length}</span> rooms
        </div>

        {/* Rooms Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading rooms...</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedRooms
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((room) => (
              <div key={room.roomId} className="group card hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                <div className="relative h-64 mb-4 rounded-xl overflow-hidden">
                  <img
                    src={room.imageUrls?.[0] || "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-3 right-3 bg-accent-400 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                    Available
                  </div>
                  <div className="absolute bottom-3 left-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold">{room.rating?.toFixed(1) || "4.5"}</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                  {room.name}
                </h3>
                <p className="text-primary-500 dark:text-primary-400 text-2xl font-bold mb-3">
                  {displayPrice(room.price)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {room.details}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {room.features?.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-lg text-xs font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                  {room.features?.length > 3 && (
                    <span className="bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-lg text-xs font-medium">
                      +{room.features.length - 3} more
                    </span>
                  )}
                </div>
                <Link
                  to={`/customer/rooms/${room.roomId}`}
                  className="btn-primary w-full text-center"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedRooms
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((room) => (
              <div key={room.roomId} className="card hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative w-full md:w-80 h-64 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={room.imageUrls?.[0] || "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex text-yellow-400">
                            {[...Array(Math.floor(room.rating || 4.5))].map((_, i) => (
                              <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {room.rating?.toFixed(1) || "4.5"} / 5
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary-500 dark:text-primary-400">
                          {displayPrice(room.price)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">per night</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {room.details}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.features?.map((feature, index) => (
                        <span
                          key={index}
                          className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-lg text-xs font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Link
                        to={`/customer/rooms/${room.roomId}`}
                        className="btn-primary"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/customer/booking?roomId=${room.roomId}`}
                        className="btn-accent"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && sortedRooms.length === 0 && (
          <div className="card text-center py-16">
            <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No rooms found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters to see more results.
            </p>
            <button onClick={clearFilters} className="btn-primary">
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && sortedRooms.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {[...Array(Math.ceil(sortedRooms.length / itemsPerPage))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                  currentPage === i + 1
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-secondary-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(sortedRooms.length / itemsPerPage), prev + 1))}
              disabled={currentPage >= Math.ceil(sortedRooms.length / itemsPerPage)}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
