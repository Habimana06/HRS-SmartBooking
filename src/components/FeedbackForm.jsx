import { useState } from "react";
import { customerService } from "../services/customerService.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { Star, Send } from "lucide-react";

export default function FeedbackForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    rating: 0,
    comment: "",
    category: "Service",
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const categories = ["Service", "Accommodation", "Dining", "Facilities", "Other"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!formData.comment.trim()) {
      setError("Please provide your feedback");
      return;
    }

    setSubmitting(true);

    try {
      await customerService.submitFeedback({
        rating: formData.rating,
        comment: formData.comment.trim(),
        category: formData.category,
        customerName: user ? `${user.firstName} ${user.lastName}` : "Guest",
        customerEmail: user?.email || "",
      });

      setSubmitted(true);
      setFormData({ rating: 0, comment: "", category: "Service" });
      setHoveredRating(0);

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
        <p className="text-green-800 dark:text-green-200 text-sm font-medium">
          Thank you for your feedback! Your response has been submitted and will be reviewed by our management team.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rating
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData({ ...formData, rating: star })}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= (hoveredRating || formData.rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            </button>
          ))}
          {formData.rating > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              {formData.rating} {formData.rating === 1 ? "star" : "stars"}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Feedback
        </label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          rows={3}
          placeholder="Share your experience with us..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting || formData.rating === 0 || !formData.comment.trim()}
        className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}

