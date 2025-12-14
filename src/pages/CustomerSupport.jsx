import { useState } from "react";
import { messageService } from "../services/messageService.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function CustomerSupport() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    if (!form.subject.trim() || !form.message.trim()) {
      setStatus({ loading: false, error: "Please add a subject and message.", success: "" });
      return;
    }
    try {
      await messageService.sendMessage({
        name: form.name || "Guest",
        email: form.email,
        subject: form.subject,
        content: form.message,
        fromRole: "Customer",
      });
      setStatus({ loading: false, error: "", success: "Message sent! We'll get back to you shortly." });
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to send message. Please try again.";
      setStatus({ loading: false, error: msg, success: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-widest text-primary-500 font-semibold">Support</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Contact & Support</h1>
          <p className="text-gray-600 dark:text-gray-400">Reach our team anytime for reservations, billing, or stay assistance.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 flex items-center justify-center text-xl">✉️</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                <p className="text-gray-600 dark:text-gray-400">support@hrs.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 flex items-center justify-center text-xl">📞</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Phone</p>
                <p className="text-gray-600 dark:text-gray-400">+250 788 123 456</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 flex items-center justify-center text-xl">📍</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Address</p>
                <p className="text-gray-600 dark:text-gray-400">123 Hotel Street, City, Country</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center text-xl">⏰</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Hours</p>
                <p className="text-gray-600 dark:text-gray-400">24/7 concierge desk</p>
              </div>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Send us a message</h2>
              {status.success && <span className="text-sm text-emerald-600 dark:text-emerald-400">{status.success}</span>}
              {status.error && <span className="text-sm text-red-600 dark:text-red-400">{status.error}</span>}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="label">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input-field"
                  placeholder="How can we help?"
                  required
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  rows="5"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input-field"
                  placeholder="Tell us more about your request"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Average response time: under 1 hour</span>
                <button type="submit" className="btn-primary" disabled={status.loading}>
                  {status.loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
