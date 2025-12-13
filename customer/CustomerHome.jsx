import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerService } from "../services/customerService.js";
import { roomService } from "../services/roomService.js";
import Chatbot from "../components/Chatbot.jsx";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatRWF } from "../utils/currency.js";

export default function CustomerHome() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickBooking, setQuickBooking] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();

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
    const fetchHomeData = async () => {
      try {
        const data = await customerService.getHome();
        setHomeData(data);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSearchResults && !e.target.closest('form')) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSearchResults]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        const rooms = await roomService.getRooms();
        const filtered = rooms.filter((room) =>
          room.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleQuickBook = () => {
    if (quickBooking.checkIn && quickBooking.checkOut) {
      navigate(`/customer/booking?checkIn=${quickBooking.checkIn}&checkOut=${quickBooking.checkOut}&guests=${quickBooking.guests}`);
    } else {
      navigate("/customer/booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading amazing experiences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner with Quick Booking */}
      <section className="relative h-[700px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transform scale-105 transition-transform duration-700 hover:scale-100"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/85 via-primary-700/75 to-primary-600/65"></div>
        </div>
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Hero Content */}
              <div className="text-white animate-fade-in">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <span className="text-sm font-semibold">✨ Premium Experience</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Welcome to
                  <span className="block text-accent-400">Luxury Redefined</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                  Experience unparalleled comfort and world-class service at our premium hotel. Your perfect stay awaits.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/customer/rooms"
                    className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 transform hover:scale-105 transition-all"
                  >
                    <span>Explore Rooms</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    to="/customer/explore"
                    className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  >
                    <span>Our Services</span>
                  </Link>
                </div>
              </div>

              {/* Right: Quick Booking Widget */}
              <div className="card bg-white/95 dark:bg-secondary-800/95 backdrop-blur-md shadow-2xl animate-slide-up">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Quick Booking
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Check-In</label>
                      <input
                        type="date"
                        value={quickBooking.checkIn}
                        onChange={(e) => setQuickBooking({ ...quickBooking, checkIn: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Check-Out</label>
                      <input
                        type="date"
                        value={quickBooking.checkOut}
                        onChange={(e) => setQuickBooking({ ...quickBooking, checkOut: e.target.value })}
                        min={quickBooking.checkIn || new Date().toISOString().split('T')[0]}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Guests</label>
                    <select
                      value={quickBooking.guests}
                      onChange={(e) => setQuickBooking({ ...quickBooking, guests: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleQuickBook}
                    className="btn-primary w-full text-lg py-4"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-8">
          <div className="max-w-4xl mx-auto px-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) {
                      setShowSearchResults(false);
                      setSearchResults([]);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.trim() && searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  placeholder="Search rooms, amenities, or services..."
                  className="w-full pl-12 pr-14 py-4 rounded-2xl bg-white dark:bg-secondary-800 shadow-xl border-2 border-primary-200 dark:border-secondary-600 focus:border-primary-500 dark:focus:border-primary-400 outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-secondary-700 max-h-96 overflow-y-auto z-30">
                  <div className="p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 px-4 py-2">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    {searchResults.map((room) => (
                      <Link
                        key={room.roomId}
                        to={`/customer/rooms/${room.roomId}`}
                        className="block p-4 hover:bg-primary-50 dark:hover:bg-secondary-700 rounded-xl transition-colors mb-1"
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={room.imageUrls?.[0] || room.galleryImages?.[0] || "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"}
                            alt={room.name}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{room.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{displayPrice(room.price) || room.details}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-secondary-800 rounded-2xl shadow-xl border border-gray-200 dark:border-secondary-700 p-6 text-center z-30">
                  <p className="text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Featured Stays with imagery */}
      <section className="py-16 bg-secondary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Destinations</p>
              <h2 className="text-3xl md:text-4xl font-bold">Popular escapes with cinematic overlays</h2>
            </div>
            <Link to="/customer/rooms" className="btn-secondary border-white/40 text-white">
              View all rooms
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Premium Rooms",
                desc: "Luxury accommodations • Premium service",
                img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80"
              },
              {
                title: "Standard Rooms",
                desc: "Comfortable stay • Great value",
                img: "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=1400&q=80"
              },
              {
                title: "Deluxe Suites",
                desc: "Spacious suites • Extra amenities",
                img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80"
              },
              {
                title: "Executive Rooms",
                desc: "Business class • Professional service",
                img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80"
              },
            ].map((card) => (
              <div
                key={card.title}
                className="relative h-56 rounded-2xl overflow-hidden shadow-xl group"
                style={{
                  backgroundImage: `url('${card.img}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent group-hover:opacity-90 transition" />
                <div className="relative p-6 flex flex-col justify-end h-full">
                  <h3 className="text-2xl font-bold">{card.title}</h3>
                  <p className="text-white/80 mt-2 text-sm">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Features */}
      <section className="py-16 bg-secondary-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Why stay with us</p>
              <h2 className="text-3xl md:text-4xl font-bold">Designed for modern travelers</h2>
              <p className="text-white/80 mt-2 max-w-3xl">
                Curated spaces, thoughtful lighting, and concierge-grade tech for a seamless stay across every touchpoint.
              </p>
            </div>
            <Link to="/customer/booking" className="btn-primary px-6 py-3">
              Book your stay
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Smart Comfort", desc: "Adaptive climate & lighting tuned to your preferences.", icon: "💡" },
              { title: "Premium Sleep", desc: "Luxury bedding, blackout drapes, and noise-softened walls.", icon: "🛏️" },
              { title: "Seamless Connectivity", desc: "High-speed Wi‑Fi, wireless charging, in-room casting.", icon: "📶" },
              { title: "Gourmet Dining", desc: "Room service menus crafted by top local chefs.", icon: "🍽️" },
              { title: "Wellness Ready", desc: "On-demand spa, fitness partners, sunrise yoga sessions.", icon: "🌿" },
              { title: "Concierge Tech", desc: "Mobile check-in, smart locks, instant support chat.", icon: "📲" },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl border border-white/10 bg-secondary-900/60 backdrop-blur shadow-lg hover:border-primary-400/60 transition">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-white/75 mt-2 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local experiences */}
      <section className="py-16 bg-secondary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Local experiences</p>
            <h2 className="text-3xl md:text-4xl font-bold">Immerse Yourself in Rwanda</h2>
            <p className="text-white/80">Authentic experiences that connect you with local culture</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Gorilla Trekking",
                desc: "Meet mountain gorillas in their natural habitat",
                img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1400&q=80",
              },
              {
                title: "Cultural Tours",
                desc: "Discover traditional Rwandan culture and history",
                img: "https://images.unsplash.com/photo-1492052722242-2554d0e99e3a?auto=format&fit=crop&w=1400&q=80",
              },
              {
                title: "Adventure Activities",
                desc: "Hiking, bird watching, and nature walks",
                img: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1400&q=80",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="relative h-72 rounded-2xl overflow-hidden shadow-xl group"
                style={{ backgroundImage: `url(${card.img})`, backgroundSize: "cover", backgroundPosition: "center" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent transition-opacity group-hover:opacity-80" />
                <div className="relative p-6 flex flex-col justify-end h-full">
                  <h3 className="text-2xl font-bold">{card.title}</h3>
                  <p className="text-white/80 text-sm">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit Rwanda overlay grid */}
      <section className="py-5 bg-secondary-950 text-white max-h-[560px] overflow-hidden">
        <div className="w-full px-0 sm:px-0 lg:px-0 space-y-6">
          <div className="relative rounded-none overflow-hidden w-full">
            <img
              src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=2000&q=80"
              alt="Rwanda landscape"
              className="w-full min-h-[300px] md:min-h-[360px] object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex flex-col items-center justify-start text-center px-6 pt-6 md:pt-10 space-y-3 md:space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Visit Rwanda</h2>
              <p className="text-white/90 max-w-3xl">
                Experience the perfect blend of natural beauty, cultural heritage, and adventure in Rwanda.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full px-4 items-stretch">
                {[
                  { title: "Natural Wonders", icon: "🌲", img: "https://images.unsplash.com/photo-1433838552652-f9a46b332c40?auto=format&fit=crop&w=1200&q=80" },
                  { title: "Safe Travel", icon: "🛡️", img: "https://images.unsplash.com/photo-1492052722242-2554d0e99e3a?auto=format&fit=crop&w=1200&q=80" },
                  { title: "Modern Amenities", icon: "📶", img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80" },
                  { title: "Great Value", icon: "💰", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80" },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="relative h-24 md:h-28 rounded-xl overflow-hidden bg-secondary-800/70 backdrop-blur group w-full border border-white/10 shadow-lg"
                  >
                    <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative p-4 h-full flex flex-col justify-end">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <span className="text-xl">{card.icon}</span>
                        <span>{card.title}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {["Natural Wonders", "Safe Travel", "Modern Amenities"].map((pill) => (
                  <button key={pill} className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition">
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center text-white">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-white/90">Happy Guests</div>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-white/90">Luxury Rooms</div>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-white/90">Support</div>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl font-bold mb-2">4.9★</div>
              <div className="text-white/90">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20 bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Rooms
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover our handpicked selection of premium accommodations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {homeData?.featuredRooms
              ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((room, index) => (
              <Link
                key={room.roomId}
                to={`/customer/rooms/${room.roomId}`}
                className="group card hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-56 mb-4 rounded-xl overflow-hidden">
                  <img
                    src={room.imageUrl || "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-3 right-3 bg-accent-400 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                    {room.tag}
                  </div>
                  <div className="absolute bottom-3 left-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold">4.8</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                  {room.name}
                </h3>
                <p className="text-primary-500 dark:text-primary-400 text-2xl font-bold mb-3">
                  {displayPrice(room.price)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {room.description}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 dark:text-gray-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {room.capacity}
                  </p>
                  <span className="text-primary-500 dark:text-primary-400 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Pagination */}
          {homeData?.featuredRooms && homeData.featuredRooms.length > itemsPerPage && (
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
              {[...Array(Math.ceil((homeData.featuredRooms.length || 0) / itemsPerPage))].map((_, i) => (
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil((homeData.featuredRooms?.length || 0) / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil((homeData.featuredRooms?.length || 0) / itemsPerPage)}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link
              to="/customer/rooms"
              className="btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              View All Rooms
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-secondary-900 dark:to-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Us
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience the difference that sets us apart
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {homeData?.whyUs?.map((item, index) => (
              <div
                key={index}
                className="group card text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 dark:bg-primary-900 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl">⭐</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-secondary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Guests Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Real experiences from real guests
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homeData?.reviews?.map((review, index) => (
              <div
                key={index}
                className="group card hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative"
              >
                <div className="absolute top-4 right-4 text-6xl text-primary-100 dark:text-primary-900 font-serif leading-none opacity-50">
                  "
                </div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="flex text-yellow-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic text-lg leading-relaxed">
                    "{review.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-secondary-700">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {review.name?.[0] || 'G'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{review.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{review.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-secondary-900 dark:to-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Our Premium Amenities
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Everything you need for a perfect stay
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {homeData?.amenityHighlights?.map((amenity, index) => (
              <div
                key={index}
                className="group text-center cursor-pointer transform hover:scale-110 transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-800 dark:to-secondary-700 rounded-2xl p-6 mb-3 shadow-md group-hover:shadow-xl transition-all duration-300 border-2 border-transparent group-hover:border-primary-300 dark:group-hover:border-primary-600">
                  <span className="text-4xl block mb-2">✨</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{amenity}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with background image */}
      <section
        className="relative py-20 overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=2000&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/85 via-primary-800/75 to-primary-700/70"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready for Your Perfect Stay?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Book now and experience luxury like never before
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/customer/booking"
              className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              Book Now
            </Link>
            <Link
              to="/customer/rooms"
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all transform hover:scale-105"
            >
              Explore Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Chatbot - Only on Home Page */}
      <Chatbot />
    </div>
  );
}
