import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CustomerExplore() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const heroImages = [
    "/images/forest1.jpg",
    "/images/forest2.jpg",
    "/images/forest3.jpg",
    "/images/forest5.jpg",
    "/images/forest6.jpg",
  ];

  const attractions = [
    {
      id: 1,
      name: "Volcanoes National Park",
      type: "Nature",
      image: "/images/forest3.jpg",
      description: "Home to the majestic mountain gorillas. Experience close encounters with these gentle giants in their natural habitat.",
      duration: "Full Day",
      features: "Guided Tours",
      badge: "Nature",
      difficulty: "Moderate",
      price: "$1500",
      rating: 4.9,
      reviews: 234,
    },
    {
      id: 2,
      name: "Kigali Genocide Memorial",
      type: "Culture",
      image: "/images/kigali.jpeg",
      description: "A place of remembrance and learning. Honor the past while looking toward a brighter future.",
      duration: "2-3 Hours",
      features: "Educational",
      badge: "Culture",
      difficulty: "Easy",
      price: "Free",
      rating: 4.8,
      reviews: 512,
    },
    {
      id: 3,
      name: "Nyungwe Forest",
      type: "Adventure",
      image: "/images/forest3.jpg",
      description: "Canopy walkway through ancient rainforest. Spot chimpanzees and over 300 bird species.",
      duration: "Half Day",
      features: "Rainforest",
      badge: "Adventure",
      difficulty: "Moderate",
      price: "$120",
      rating: 4.7,
      reviews: 189,
    },
    {
      id: 4,
      name: "Akagera National Park",
      type: "Wildlife",
      image: "/images/akagera.jpg",
      description: "Big Five safari experience. See lions, elephants, rhinos, and more in their natural habitat.",
      duration: "Full Day",
      features: "Safari",
      badge: "Wildlife",
      difficulty: "Easy",
      price: "$200",
      rating: 4.8,
      reviews: 298,
    },
    {
      id: 5,
      name: "Iby'Iwacu Cultural Village",
      type: "Culture",
      image: "/images/kigali2.jpg",
      description: "Experience traditional Rwandan life. Learn about local customs, crafts, and daily life.",
      duration: "3-4 Hours",
      features: "Interactive",
      badge: "Culture",
      difficulty: "Easy",
      price: "$30",
      rating: 4.6,
      reviews: 156,
    },
    {
      id: 6,
      name: "Mountain Gorilla Trekking",
      type: "Nature",
      image: "/images/forest1.jpg",
      description: "Experience the majestic mountain gorillas in their natural habitat. A once-in-a-lifetime wildlife encounter.",
      duration: "Full Day",
      features: "Guided Trek",
      badge: "Nature",
      difficulty: "Challenging",
      price: "$1500",
      rating: 5.0,
      reviews: 421,
    },
  ];

  const highlights = [
    {
      title: "Natural Beauty",
      icon: "🌲",
      description: "Discover Rwanda's stunning landscapes, national parks, and breathtaking mountain views. From the misty volcanoes to lush rainforests, experience nature at its finest.",
      items: ["Volcanoes National Park", "Nyungwe Forest", "Akagera National Park"],
      image: "/images/forest1.jpg",
    },
    {
      title: "Cultural Heritage",
      icon: "🛡️",
      description: "Experience the rich culture and traditions of Rwanda. From traditional dance to local crafts, immerse yourself in the vibrant heritage of this beautiful country.",
      items: ["Traditional Dance", "Local Crafts", "Cultural Sites"],
      image: "/images/forest2.jpg",
    },
  ];

  const whyRwanda = [
    {
      icon: "⭐",
      title: "Natural Wonders",
      description: "From misty mountains to pristine lakes, Rwanda's natural beauty is unmatched. Explore diverse ecosystems and breathtaking landscapes.",
    },
    {
      icon: "🛡️",
      title: "Safe Travel",
      description: "Rwanda is one of Africa's safest countries. Travel with confidence and peace of mind throughout your journey.",
    },
    {
      icon: "📶",
      title: "Modern Amenities",
      description: "Enjoy excellent infrastructure, reliable internet, and modern facilities while experiencing authentic African culture.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "United States",
      rating: 5,
      text: "The gorilla trekking experience was absolutely life-changing! Rwanda exceeded all my expectations.",
      avatar: "SJ",
      trip: "Gorilla Trekking Tour"
    },
    {
      name: "James Chen",
      location: "Singapore",
      rating: 5,
      text: "Beautiful country with amazing wildlife. The hospitality and safety made our trip unforgettable.",
      avatar: "JC",
      trip: "Wildlife Safari"
    },
    {
      name: "Emma Brown",
      location: "United Kingdom",
      rating: 5,
      text: "The cultural experiences were incredible. Rwanda is a hidden gem that everyone should visit.",
      avatar: "EB",
      trip: "Cultural Tour"
    },
  ];

  const categories = ["All", "Nature", "Culture", "Adventure", "Wildlife"];

  const filteredAttractions = attractions.filter(attraction => {
    const matchesCategory = selectedCategory === "All" || attraction.type === selectedCategory;
    const matchesSearch = attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         attraction.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, heroImages.length]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case "Easy": return "text-green-600 bg-green-50";
      case "Moderate": return "text-yellow-600 bg-yellow-50";
      case "Challenging": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Slider */}
      <section className="relative h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              style={{
                backgroundImage: `url(${image})`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-700/70 to-primary-600/60 z-20"></div>
        
        <div className="relative z-30 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
            <div className="max-w-3xl mx-auto text-white">
              <p className="text-lg md:text-xl font-semibold mb-4 tracking-wider uppercase animate-fade-in">
                Discover Rwanda
              </p>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up">
                Experience the Perfect Blend
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed animate-fade-in-delay">
                Natural beauty, cultural heritage, and adventure await you in the heart of Africa
              </p>
              <div className="flex flex-wrap justify-center gap-4 animate-fade-in-delay-2">
                <Link
                  to="/customer/booking"
                  className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 transform hover:scale-105 shadow-2xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book Your Stay
                </Link>
                <a
                  href="#highlights"
                  className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Explore More
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75 w-3"
              }`}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white dark:bg-secondary-800 py-8 shadow-lg -mt-1 relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">1,000+</div>
              <div className="text-gray-600 dark:text-gray-400">Mountain Gorillas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">98%</div>
              <div className="text-gray-600 dark:text-gray-400">Guest Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-400">Annual Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">#1</div>
              <div className="text-gray-600 dark:text-gray-400">Safest in Africa</div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section id="highlights" className="py-20 bg-gray-50 dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-600 dark:text-primary-400 font-semibold mb-4 tracking-wider uppercase">
              Rwanda Highlights
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Discover What Makes Rwanda Special
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From mountain gorillas to vibrant culture, explore the best of Rwanda
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {highlights.map((highlight, index) => (
              <article
                key={index}
                className="group card overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="relative h-64 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url(${highlight.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-4xl mb-4 transform group-hover:rotate-12 transition-transform">
                      {highlight.icon}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{highlight.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {highlight.description}
                  </p>
                  <ul className="space-y-3">
                    {highlight.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 transform hover:translate-x-2 transition-transform">
                        <svg className="w-5 h-5 text-accent-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Top Attractions with Filters */}
      <section className="py-20 bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-primary-600 dark:text-primary-400 font-semibold mb-4 tracking-wider uppercase">
              Top Attractions
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Must-Visit Destinations
            </h2>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-12 space-y-6">
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search attractions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-all"
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Filters and View Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all ${
                      selectedCategory === category
                        ? "bg-primary-600 text-white shadow-lg transform scale-105"
                        : "bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-secondary-700 rounded-full p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === "grid" ? "bg-white dark:bg-secondary-900 shadow" : ""
                  }`}
                  aria-label="Grid view"
                >
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === "list" ? "bg-white dark:bg-secondary-900 shadow" : ""
                  }`}
                  aria-label="List view"
                >
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 text-center text-gray-600 dark:text-gray-400">
            Showing {filteredAttractions.length} of {attractions.length} attractions
          </div>

          {/* Attractions Grid/List */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
            {filteredAttractions.map((attraction) => (
              <article
                key={attraction.id}
                className={`group card overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  viewMode === "list" ? "flex flex-col md:flex-row" : ""
                }`}
              >
                <div className={`relative overflow-hidden ${viewMode === "list" ? "md:w-1/3 h-64 md:h-auto" : "h-64"}`}>
                  <div
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url(${attraction.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-sm font-semibold">
                      {attraction.badge}
                    </span>
                    <span className={`px-3 py-2 rounded-full text-xs font-semibold ${getDifficultyColor(attraction.difficulty)}`}>
                      {attraction.difficulty}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">{attraction.rating}</span>
                    <span className="text-xs text-gray-600">({attraction.reviews})</span>
                  </div>
                </div>
                <div className={`p-6 ${viewMode === "list" ? "md:w-2/3 flex flex-col justify-between" : ""}`}>
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {attraction.name}
                      </h3>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 ml-4">
                        {attraction.price}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {attraction.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {attraction.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {attraction.features}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/customer/travel-booking?attraction=${encodeURIComponent(attraction.name)}&type=${encodeURIComponent(attraction.type)}`}
                    className="btn-primary w-full text-center inline-flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Now
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredAttractions.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No attractions found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-600 dark:text-primary-400 font-semibold mb-4 tracking-wider uppercase">
              Testimonials
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Guests Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Real experiences from travelers who've explored Rwanda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
                  {testimonial.trip}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Visit Rwanda */}
      <section className="py-20 bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-600 dark:text-primary-400 font-semibold mb-4 tracking-wider uppercase">
              Why Visit Rwanda
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Experience Rwanda's Unique Offerings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyRwanda.map((item, index) => (
              <div
                key={index}
                className="card text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg transform hover:rotate-12 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/90 font-semibold mb-4 tracking-wider uppercase">
            Ready to explore?
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Book your stay and start your adventure
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Combine comfortable accommodations with unforgettable experiences in Rwanda.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/customer/booking"
              className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book now
            </Link>
            <Link
              to="/customer/rooms"
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all transform hover:scale-105 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              View rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 animate-fade-in"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s backwards;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.6s backwards;
        }
      `}</style>
    </div>
  );
}