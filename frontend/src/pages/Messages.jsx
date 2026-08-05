import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { messagesAPI } from '../services/messages.service';
import { searchAPI } from '../services/search.service';
import { usersAPI } from '../services/users.service';
import { getSocket } from '../socket/socketClient';
import toast from 'react-hot-toast';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ConversationSkeleton = () => (
  <div className="px-3 py-1">
    <div className="flex items-center gap-4 p-3 rounded-xl">
      <Skeleton circle width={48} height={48} />
      <div className="flex-1">
        <Skeleton height={16} width="60%" className="mb-2" />
        <Skeleton height={12} width="80%" />
      </div>
    </div>
  </div>
);

const MessageSkeleton = ({ isOwn }) => (
  <div className={`flex gap-4 max-w-[80%] ${isOwn ? 'self-end flex-row-reverse' : ''}`}>
    <Skeleton circle width={32} height={32} className="self-end mb-2" />
    <div className={`space-y-1 ${isOwn ? 'flex flex-col items-end' : ''}`}>
      <div className={`px-4 py-3 min-w-[120px] rounded-2xl ${isOwn
        ? 'bg-primary/20 rounded-br-none'
        : 'bg-surface-container-highest rounded-bl-none'
        }`}>
        <Skeleton height={14} width="100%" />
      </div>
      <Skeleton width={40} height={8} />
    </div>
  </div>
);

export default function Messages() {
  const user = useSelector(selectUser);
  const { userId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [convosLoading, setConvosLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const chatRef = useRef(null);

  const fetchConvos = async () => {
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data.conversations || []);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setConvosLoading(false);
    }
  };

  useEffect(() => {
    fetchConvos();
  }, []);

  useEffect(() => {
    if (!userId) {
      setSelectedContact(null);
      setMessages([]);
      return;
    }

    const foundConvo = conversations.find(c => c.contact._id === userId);
    if (foundConvo) {
      setSelectedContact(foundConvo.contact);
      return;
    }

    const fetchContactDetails = async () => {
      try {
        const res = await usersAPI.getProfile(userId);
        setSelectedContact(res.data.user);
      } catch {
        toast.error('User not found');
        navigate('/messages');
      }
    };

    fetchContactDetails();
  }, [userId, conversations, navigate]);

  useEffect(() => {
    if (!selectedContact) return;

    const fetchHistory = async () => {
      setMessagesLoading(true);
      try {
        const res = await messagesAPI.getMessages(selectedContact._id);
        setMessages(res.data.messages || []);
      } catch {
        toast.error('Failed to load message history');
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchHistory();
  }, [selectedContact]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      if (
        selectedContact &&
        (msg.sender._id === selectedContact._id || msg.receiver._id === selectedContact._id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchConvos();
    };

    const handleUserOnline = ({ userId }) => {
      setConversations(prev => prev.map(c =>
        c.contact._id === userId ? { ...c, contact: { ...c.contact, isOnline: true } } : c
      ));
      if (selectedContact && selectedContact._id === userId) {
        setSelectedContact(prev => ({ ...prev, isOnline: true }));
      }
    };

    const handleUserOffline = ({ userId }) => {
      setConversations(prev => prev.map(c =>
        c.contact._id === userId ? { ...c, contact: { ...c.contact, isOnline: false } } : c
      ));
      if (selectedContact && selectedContact._id === userId) {
        setSelectedContact(prev => ({ ...prev, isOnline: false }));
      }
    };

    socket.on('new_message', handleIncomingMessage);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.off('new_message', handleIncomingMessage);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [selectedContact]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      try {
        const res = await searchAPI.search(val.trim(), 'users');
        const searchUsers = res.data.users || [];
        const followersSet = new Set((user?.followers || []).map(id => id.toString()));
        const followingSet = new Set((user?.following || []).map(id => id.toString()));
        const existingChatSet = new Set(conversations.map(c => c.contact._id.toString()));

        const filtered = searchUsers.filter(u => {
          const uIdStr = u._id.toString();
          if (uIdStr === user?._id?.toString()) return false;
          return followersSet.has(uIdStr) || followingSet.has(uIdStr) || existingChatSet.has(uIdStr);
        });
        setSearchResults(filtered);
      } catch {
        // silent catch
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    try {
      const res = await messagesAPI.sendMessage(selectedContact._id, newMessage.trim());
      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
      fetchConvos();
    } catch {
      toast.error('Failed to send message');
    }
  };

  const selectUserChat = (contactUser) => {
    navigate(`/messages/${contactUser._id}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="flex-1 flex overflow-hidden w-full max-w-6xl min-w-0 mx-auto py-stack-sm md:py-stack-md">
        <section className={`w-full md:w-80 lg:w-96 flex flex-col bg-surface border-r border-outline-variant/20 shrink-0 ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-stack-md space-y-4 border-b border-outline-variant/10">
            <div className="flex items-center justify-between">
              <h2 className="mb-stack-md text-[24px] font-serif tracking-tight text-on-surface">Messages</h2>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                className="w-full bg-[#050505] border border-outline-variant/30 text-body-md rounded-xl py-2 pl-10 pr-4 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                placeholder="Search developers..."
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {searchQuery.trim().length >= 2 ? (
              <div className="divide-y divide-outline-variant/10">
                <p className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/50">Search Results</p>
                {searchResults.length === 0 ? (
                  <p className="p-4 text-xs text-on-surface-variant">No developers found</p>
                ) : (
                  searchResults.map((u) => (
                    <div key={u._id} onClick={() => selectUserChat(u)} className="p-3 hover:bg-surface-container cursor-pointer transition-all flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {u.avatar ? <img className="w-full h-full object-cover" src={u.avatar} alt="" /> : u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-body-md font-semibold text-on-surface">@{u.username}</h4>
                        <p className="text-xs text-on-surface-variant truncate max-w-[200px]">{u.bio || 'No bio'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant/50">
                <span className="material-symbols-outlined text-4xl mb-3 text-outline-variant/40">forum</span>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface mb-1">No chats yet</h4>
                <p className="text-xs text-on-surface-variant/80 max-w-[200px] mx-auto leading-normal">
                  Search for a developer above to start a direct message!
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = selectedContact?._id === c.contact._id;
                return (
                  <div key={c.contact._id} className="px-3 py-1">
                    <div
                      onClick={() => selectUserChat(c.contact)}
                      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer group transition-all ${isActive ? 'bg-surface-container-highest border border-primary/20' : 'hover:bg-surface-container'
                        }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold ${!isActive && 'opacity-80 group-hover:opacity-100'}`}>
                          {c.contact.avatar ? (
                            <img className="w-full h-full object-cover" src={c.contact.avatar} alt="" />
                          ) : (
                            c.contact.username[0].toUpperCase()
                          )}
                        </div>
                        {c.contact.isOnline && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-surface" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={`font-body-md text-body-md font-semibold truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>{c.contact.name || `@${c.contact.username}`}</h3>
                          {c.unreadCount > 0 && (
                            <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${isActive ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{c.lastMessage.content}</p>

                      </div>
                      <p className='text-xs truncate'>
                        {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* chat */}
        <section className={`flex-1 flex flex-col bg-[#050505] relative h-full ${selectedContact ? 'flex' : 'hidden md:flex'}`}>
          {selectedContact ? (
            <>
              <header className="h-16 flex items-center justify-between px-1 border-b border-outline-variant/10 bg-surface/50 glass-effect z-10 shrink-0">
                <div className="flex items-center gap-4">
                  {/* back button for mobile */}
                  <button
                    onClick={() => navigate('/messages')}
                    className="md:hidden flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface mr-1"
                  >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                  </button>
                  <Link to={`/profile/${selectedContact._id}`} className="flex items-center gap-4 hover:opacity-85 transition-opacity">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {selectedContact.avatar ? (
                        <img className="w-full h-full object-cover" src={selectedContact.avatar} alt="" />
                      ) : (
                        selectedContact.username[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-body-lg text-body-lg font-semibold text-on-surface hover:underline">{selectedContact.name || `@${selectedContact.username}`}</h2>
                        {selectedContact.isOnline && <span className="w-2 h-2 rounded-full bg-secondary" />}
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {selectedContact.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </Link>
                </div>
              </header>

              <div ref={chatRef} className="flex-1 overflow-y-auto p-gutter space-y-6 flex flex-col custom-scrollbar pb-32">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-4xl mb-2">chat</span>
                    <p className="text-xs">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwn = m.sender._id === user?._id;
                    const senderInitials = m.sender.username[0].toUpperCase();
                    return (
                      <div key={m._id} className={`flex gap-4 max-w-[80%] ${isOwn ? 'self-end flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary/20 flex-shrink-0 self-end mb-2 flex items-center justify-center text-primary text-xs font-bold">
                          {m.sender.avatar ? (
                            <img className="w-full h-full object-cover" src={m.sender.avatar} alt="" />
                          ) : (
                            senderInitials
                          )}
                        </div>
                        <div className={`space-y-1 ${isOwn ? 'flex flex-col items-end' : ''}`}>
                          <div className={`px-4 py-3 shadow-sm ${isOwn
                            ? 'bg-primary text-on-primary-fixed rounded-2xl rounded-br-none'
                            : 'bg-surface-container-highest text-on-surface rounded-2xl rounded-bl-none'
                            }`}>
                            <p className="text-body-md select-text">{m.content}</p>
                          </div>
                          <div className="flex items-center gap-0.5 px-1">
                            <span className="text-[9px] text-on-surface-variant/50">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              m.read ? (
                                <span className="material-symbols-outlined text-[#3b82f6] text-[13px] font-bold select-none">done_all</span>
                              ) : (
                                <span className="material-symbols-outlined text-on-surface-variant/40 text-[13px] select-none">done</span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <footer className="absolute bottom-0 left-0 right-0 p-gutter pt-0 bg-gradient-to-t from-surface-container-low via-surface-container-low to-transparent">
                <form onSubmit={handleSend} className="relative group">
                  <div className="relative bg-surface-container-high rounded-[18px] border border-outline-variant/30 p-2 flex items-center gap-2">
                    <input
                      className="flex-1 bg-transparent border-none focus:ring-0 text-body-md text-on-surface py-2 px-3 outline-none placeholder:text-on-surface-variant/50"
                      placeholder={`Message ${selectedContact.name || `@${selectedContact.username}`}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="bg-primary text-on-primary-fixed w-10 h-10 flex items-center justify-center rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100">
                      <span className="material-symbols-outlined font-fill-1">send</span>
                    </button>
                  </div>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-on-surface-variant/50 bg-[#050505]">
              <span className="material-symbols-outlined text-5xl mb-4 text-outline-variant/50">chat_bubble</span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Your Inbox</h3>
              <p className="text-xs">Search for a developer on the left to start a conversation.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
