import { useState, useEffect, useRef } from "react";
import { messageService } from "../services/messageService.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { X, Send, Minimize2, MessageCircle } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && !isMinimized) {
      loadMessages();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      setError(null);
      const data = await messageService.getMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load messages", err);
      setError("Unable to load chat. Please try again.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setInput("");
    setLoading(true);
    setError(null);

    try {
      await messageService.sendMessage({
        fromName: user ? `${user.firstName} ${user.lastName}` : "Guest",
        fromEmail: user?.email || "guest@example.com",
        senderRole: "customer",
        content: messageText,
      });
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message", err);
      setError("Could not send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt)
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? "w-80" : "w-96"
      }`}
    >
      <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-secondary-700 flex flex-col h-[600px]">
        {/* Header */}
        <div className="bg-primary-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Chat with Reception</h3>
              <p className="text-xs text-white/80">We're here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={isMinimized ? "Expand" : "Minimize"}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-secondary-900">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {sortedMessages.length === 0 && !loading && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Start a conversation with our reception team
                  </p>
                </div>
              )}
              {sortedMessages.map((msg) => (
                <div
                  key={msg.id || msg.messageId}
                  className={`flex flex-col ${
                    msg.senderRole === "customer" || msg.senderRole === "Customer"
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                    {msg.fromName || "Guest"} •{" "}
                    {new Date(msg.sentAt || msg.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                      msg.senderRole === "customer" || msg.senderRole === "Customer"
                        ? "bg-primary-500 text-white"
                        : "bg-white dark:bg-secondary-700 text-gray-900 dark:text-white border border-gray-200 dark:border-secondary-600"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {Array.isArray(msg.replies) &&
                    msg.replies.map((reply, idx) => (
                      <div key={idx} className="mt-2 ml-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                          Reception • {new Date(reply.sentAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="bg-white dark:bg-secondary-700 text-gray-900 dark:text-white px-4 py-2 rounded-2xl max-w-[80%] border border-gray-200 dark:border-secondary-600">
                          {reply.content}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-secondary-700 px-4 py-2 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="border-t border-gray-200 dark:border-secondary-700 p-4 bg-white dark:bg-secondary-800"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

