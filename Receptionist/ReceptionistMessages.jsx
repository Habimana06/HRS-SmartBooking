import { useEffect, useMemo, useState } from "react";
import { messageService } from "../services/messageService.js";

export default function ReceptionistMessages() {
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState("all"); // all, unread, replied
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seenIds, setSeenIds] = useState(new Set());

  const loadMessages = async () => {
    try {
      setError(null);
      const data = await messageService.getMessages();
      const normalized = Array.isArray(data) ? data.map(m => ({
        id: m.id,
        fromName: m.fromName,
        fromEmail: m.fromEmail,
        senderRole: m.senderRole,
        content: m.content,
        sentAt: m.sentAt,
        replies: m.replies || [],
      })) : [];
      setMessages(normalized);
    } catch (err) {
      console.error("Failed to load messages", err);
      setError("Unable to load messages right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const selectedMessage = useMemo(
    () => messages.find(m => m.id === selectedId) || null,
    [messages, selectedId]
  );

  const filteredMessages = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return messages.filter(msg => {
      const matchesSearch =
        msg.fromName?.toLowerCase().includes(q) ||
        msg.fromEmail?.toLowerCase().includes(q) ||
        msg.content?.toLowerCase().includes(q);
      const hasReplies = (msg.replies?.length || 0) > 0;
      const isUnread = !seenIds.has(msg.id);
      if (filter === "unread") return matchesSearch && isUnread;
      if (filter === "replied") return matchesSearch && hasReplies;
      return matchesSearch;
    });
  }, [messages, searchQuery, filter, seenIds]);

  const unreadCount = messages.filter(m => !seenIds.has(m.id)).length;

  const handleSelectMessage = (msg) => {
    setSelectedId(msg.id);
    setSeenIds(prev => {
      const next = new Set(prev);
      next.add(msg.id);
      return next;
    });
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    try {
      await messageService.sendReply(selectedMessage.id, {
        fromRole: "receptionist",
        content: replyText.trim(),
      });
      setReplyText("");
      await loadMessages();
      setSelectedId(selectedMessage.id);
    } catch (err) {
      console.error("Failed to send reply", err);
      setError("Could not send reply.");
    }
  };

  const handleArchive = (msgId) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    if (selectedMessage?.id === msgId) {
      setSelectedId(null);
    }
  };

  const quickReplies = [
    "Thank you for reaching out. We'll get back to you shortly.",
    "Your request has been noted. Our team will assist you.",
    "We appreciate your feedback!",
    "I'll check on that for you right away.",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-secondary-900 dark:to-secondary-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Messages
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Guest communication {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white ml-2">
                    {unreadCount} new
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 md:flex-initial">
                <input 
                  className="input-field w-full md:w-64 pl-10" 
                  placeholder="Search messages"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "All", count: messages.length },
            { key: "unread", label: "Unread", count: unreadCount },
            { key: "replied", label: "Replied", count: messages.filter(m => m.replies.length > 0).length }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === f.key
                  ? "bg-primary-500 text-white shadow-lg scale-105"
                  : "bg-white dark:bg-secondary-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Messages Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-secondary-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">Inbox</h2>
              {loading && <span className="text-xs text-gray-500 dark:text-gray-400">Loading…</span>}
            </div>
            {error && <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-200">{error}</div>}
            <div className="divide-y divide-gray-200 dark:divide-secondary-700 max-h-[600px] overflow-y-auto">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-secondary-700 ${
                    selectedMessage?.id === msg.id 
                      ? "bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500" 
                      : !seenIds.has(msg.id) 
                      ? "bg-blue-50/50 dark:bg-blue-900/10" 
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                      !seenIds.has(msg.id) 
                        ? "bg-gradient-to-br from-primary-500 to-primary-600" 
                        : "bg-gradient-to-br from-gray-400 to-gray-500"
                    }`}>
                      {(msg.fromName || "G")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`font-semibold truncate ${
                          !seenIds.has(msg.id) 
                            ? "text-gray-900 dark:text-white" 
                            : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {msg.fromName}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                          {new Date(msg.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        !seenIds.has(msg.id) 
                          ? "text-gray-700 dark:text-gray-300" 
                          : "text-gray-500 dark:text-gray-500"
                      }`}>
                        {msg.content}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {!seenIds.has(msg.id) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            New
                          </span>
                        )}
                        {msg.replies?.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Replied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMessages.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    No messages found
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-3">
            {selectedMessage ? (
              <div className="card h-full flex flex-col">
                {/* Message Header */}
                <div className="border-b border-gray-200 dark:border-secondary-700 pb-4 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                        {(selectedMessage.fromName || "G")[0]}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedMessage.fromName}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedMessage.fromEmail}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleArchive(selectedMessage.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(selectedMessage.sentAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {/* Original Message */}
                  <div className="bg-gray-50 dark:bg-secondary-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedMessage.fromName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(selectedMessage.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedMessage.content}
                    </p>
                  </div>

                  {/* Replies */}
                  {selectedMessage.replies?.map((reply, idx) => (
                    <div key={idx} className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 ml-6 border-l-4 border-primary-500">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {reply.fromRole}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(reply.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Replies */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Replies:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReplyText(reply)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary-600 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reply Box */}
                <div className="border-t border-gray-200 dark:border-secondary-700 pt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="input-field w-full min-h-[100px] resize-none mb-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleSendReply();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Press Cmd/Ctrl + Enter to send
                    </p>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    Select a message to view
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                    Choose a conversation from the list to read and reply
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}