import { useEffect, useState, useMemo } from "react";
import { messageService } from "../services/messageService.js";

export default function CustomerChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)),
    [messages]
  );

  const loadMessages = async () => {
    try {
      setError(null);
      const data = await messageService.getMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load messages", err);
      setError("Unable to load chat right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      setLoading(true);
      await messageService.sendMessage({
        fromName: name || "Guest",
        fromEmail: email || "unknown",
        senderRole: "customer",
        content: input.trim(),
      });
      setInput("");
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message", err);
      setError("Could not send message. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat with Reception</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">We usually reply in a few minutes.</p>
            </div>
          </div>

          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <div className="px-6 py-4 space-y-3 max-h-[480px] overflow-y-auto">
            {loading && <p className="text-gray-600 dark:text-gray-400 text-sm">Loading chat...</p>}
            {!loading && sortedMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.senderRole === "customer" ? "items-end" : "items-start"}`}>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {msg.fromName} • {new Date(msg.sentAt).toLocaleString()}
                </div>
                <div className={`${msg.senderRole === "customer" ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-secondary-700 text-gray-900 dark:text-gray-100"} px-4 py-2 rounded-2xl max-w-[80%]`}>
                  {msg.content}
                </div>
                {Array.isArray(msg.replies) && msg.replies.map((reply, idx) => (
                  <div key={idx} className="mt-2 ml-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {reply.fromRole} • {new Date(reply.sentAt).toLocaleString()}
                    </div>
                    <div className="bg-gray-100 dark:bg-secondary-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-2xl max-w-[80%]">
                      {reply.content}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-secondary-700 px-6 py-4 space-y-3 bg-gray-50 dark:bg-secondary-800/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                rows={2}
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors"
                disabled={loading}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
