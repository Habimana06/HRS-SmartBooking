import { useState, useRef, useEffect } from 'react';
import { messageService } from '../services/messageService.js';

export default function ReceptionistChat() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping] = useState(false);
  const [activeGuest, setActiveGuest] = useState(null);
  const [guestList, setGuestList] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const quickReplies = [
    "Check-in is at 2 PM, but we'll do our best to accommodate early arrival.",
    "Checkout is at 11 AM. Late checkout may be available for a fee.",
    "Yes, we have complimentary WiFi. The password is in your welcome packet.",
    "Room service is available 24/7. Dial 0 from your room phone.",
    "The pool is open from 6 AM to 10 PM daily.",
    "We offer free parking in our underground garage."
  ];

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getMessages();
      const allMessages = Array.isArray(data) ? data : [];
      
      // Group messages by customer
      const customerMap = new Map();
      allMessages.forEach(msg => {
        const customerKey = msg.fromEmail || msg.fromName || 'unknown';
        if (!customerMap.has(customerKey)) {
          customerMap.set(customerKey, {
            name: msg.fromName || 'Guest',
            email: msg.fromEmail || '',
            room: 'N/A',
            status: 'Active',
            unread: 0,
            messages: []
          });
        }
        customerMap.get(customerKey).messages.push(msg);
      });

      const guests = Array.from(customerMap.values());
      setGuestList(guests);
      
      if (guests.length > 0 && !activeGuest) {
        setActiveGuest(guests[0]);
        setMessages(guests[0].messages || []);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !activeGuest) return;

    const messageText = inputValue.trim();
    setInputValue('');

    try {
      // Find the customer's message to reply to
      const customerMessage = messages.find(m => 
        (m.senderRole === 'customer' || m.senderRole === 'Customer') && 
        !m.replied
      );

      if (customerMessage) {
        await messageService.sendReply(customerMessage.id || customerMessage.messageId, {
          fromRole: 'receptionist',
          content: messageText,
        });
      } else {
        // If no customer message to reply to, send a new message
        await messageService.sendMessage({
          fromName: 'Reception',
          fromEmail: 'reception@hrs.com',
          senderRole: 'receptionist',
          content: messageText,
        });
      }

      await loadMessages();
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Could not send message. Please try again.");
    }
  };

  const handleQuickReply = (reply) => {
    setInputValue(reply);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar - Guest List */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Chats</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{guestList.length} conversations</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading chats...</div>
            ) : guestList.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No active conversations</div>
            ) : (
              guestList.map((guest, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setActiveGuest(guest);
                    setMessages(guest.messages || []);
                  }}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                    activeGuest?.name === guest.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {guest.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{guest.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Room {guest.room}</p>
                    </div>
                  </div>
                  {guest.unread > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {guest.unread}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    guest.status === 'Checked In' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {guest.status}
                  </span>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {activeGuest ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {activeGuest.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeGuest.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Room {activeGuest.room} • {activeGuest.status}</p>
                    </div>
                  </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  View Profile
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Task
                </button>
              </div>
            </div>
          </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => {
                  const isCustomer = message.senderRole === 'customer' || message.senderRole === 'Customer';
                  return (
                    <div
                      key={message.id || message.messageId}
                      className={`flex ${!isCustomer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xl ${!isCustomer ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl p-4 ${
                            isCustomer
                              ? 'bg-white dark:bg-gray-800 shadow-sm'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {isCustomer && (
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              {message.fromName || 'Guest'}
                            </p>
                          )}
                          <p className={`${isCustomer ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
                            {message.content || message.text}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                          {new Date(message.sentAt || message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {Array.isArray(message.replies) && message.replies.map((reply, idx) => (
                          <div key={idx} className="mt-2 ml-3">
                            <div className="bg-blue-600 text-white rounded-2xl p-4">
                              <p className="text-xs font-semibold text-blue-100 mb-1">Reception</p>
                              <p>{reply.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                              {new Date(reply.sentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">QUICK REPLIES</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                    >
                      {reply.length > 50 ? reply.substring(0, 50) + '...' : reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">No conversation selected</p>
                <p className="text-sm">Select a customer from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}