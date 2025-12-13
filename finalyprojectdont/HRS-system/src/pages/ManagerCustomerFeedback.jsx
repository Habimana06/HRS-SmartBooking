import { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp, Filter, Download, Search, ThumbsUp, Flag, Reply, Calendar, BarChart3, Users, Award } from 'lucide-react';
import { managerService } from '../services/managerService.js';

export default function ManagerCustomerFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchCustomerFeedback();
  }, []);

  const fetchCustomerFeedback = async () => {
    try {
      setLoading(true);
      const data = await managerService.getCustomerFeedback();
      setFeedback(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customer feedback:", error);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = feedback.filter(f => {
    const matchesRating = selectedRating === 'all' || f.rating === parseInt(selectedRating);
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         f.comment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRating && matchesCategory && matchesSearch;
  });

  const avgRating = (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1);
  const recentReviews = feedback.filter(f => f.date === "Today" || f.date === "Yesterday").length;
  const responseRate = Math.round((feedback.filter(f => f.replied).length / feedback.length) * 100);

  const handleReply = (id) => {
    if (replyText.trim()) {
      setFeedback(feedback.map(f => 
        f.id === id ? { ...f, replied: true } : f
      ));
      setReplyingTo(null);
      setReplyText('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading feedback...</p>
        </div>
      </div>
    );
  }

  const handleFlag = (feedbackId) => {
    setFeedback(feedback.map(f => 
      f.id === feedbackId ? { ...f, flagged: true } : f
    ));
    alert(`Feedback from ${feedback.find(f => f.id === feedbackId)?.name} flagged for review`);
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: feedback.filter(f => f.rating === rating).length
  }));

  const categories = ['all', 'Service', 'Accommodation', 'Dining', 'Facilities'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <MessageSquare className="text-blue-500" />
                Customer Feedback
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Recent reviews and sentiment analysis</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Average Rating</p>
                <p className="text-4xl font-bold mt-2">{avgRating}</p>
                <div className="flex text-yellow-300 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-current' : ''}`} />
                  ))}
                </div>
              </div>
              <Award className="w-12 h-12 text-blue-300 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">New Reviews (7d)</p>
                <p className="text-4xl font-bold mt-2">{recentReviews}</p>
                <p className="text-green-100 text-xs mt-2">↑ 12% vs last week</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-300 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Response Rate</p>
                <p className="text-4xl font-bold mt-2">{responseRate}%</p>
                <p className="text-purple-100 text-xs mt-2">Target: 95%</p>
              </div>
              <Reply className="w-12 h-12 text-purple-300 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Reviews</p>
                <p className="text-4xl font-bold mt-2">{feedback.length}</p>
                <p className="text-orange-100 text-xs mt-2">All time</p>
              </div>
              <Users className="w-12 h-12 text-orange-300 opacity-50" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Rating Distribution
            </h2>
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{rating}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${(count / feedback.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-500" />
              Filters & Search
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reviews..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                >
                  <option value="all">All Ratings</option>
                  {[5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>{r} Stars</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Reviews ({filteredFeedback.length})
            </h2>
            {filteredFeedback.length !== feedback.length && (
              <button 
                onClick={() => {
                  setSelectedRating('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No reviews match your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((f) => (
                <div key={f.id} className="p-5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{f.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {f.date}
                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">{f.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < f.rating ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      {f.replied && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Reply className="w-3 h-3" />
                          Replied
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mt-3 mb-3 leading-relaxed">{f.comment}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{f.helpful} people found this helpful</span>
                  </div>

                  {replyingTo === f.id ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-blue-300 dark:border-blue-600">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your response..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReply(f.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all"
                        >
                          Send Reply
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold py-2 px-4 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReplyingTo(f.id)}
                        className="bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-1"
                      >
                        <Reply className="w-3 h-3" />
                        Reply
                      </button>
                      <button
                        onClick={() => handleFlag(f.id)}
                        className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-1"
                      >
                        <Flag className="w-3 h-3" />
                        Flag
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}