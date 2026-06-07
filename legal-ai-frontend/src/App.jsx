import { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import ChatInput from "./components/ChatInput.jsx";
import AuthPage from "./components/auth/AuthPage.jsx";
import { useAuth } from "./hooks/useAuth.js";
import ConfirmModal from "./components/ConfirmModal.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import {
  createChat,
  sendMessage,
  getChats,
  getChat,
  deleteChat,
} from "./api/chatAPI.js";

function App() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      if (!isAuthenticated) return;
      try {
        setLoadingChats(true);
        const res = await getChats();
        setChats(res.data.chats || []);
      } catch (err) {
        console.error("خطأ في جلب المحادثات:", err);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30 blur-[100px]"
            style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative text-center animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-5xl shadow-2xl shadow-blue-500/50">
              ⚖️
            </div>
          </div>
          <div className="text-2xl font-bold text-gradient mb-2">Legal AI Assistant</div>
          <div className="text-sm text-slate-400 flex items-center justify-center gap-1">
            <span>جارٍ التحقق</span>
            <span className="flex gap-0.5">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;

  if (showAdmin) return (
    <div className="h-screen overflow-y-auto">
      <AdminDashboard onBack={() => setShowAdmin(false)} />
    </div>
  );

  const handleSelectChat = async (chatId) => {
    if (chatId === currentChatId) return;
    try {
      setIsTyping(true);
      setMessages([]);
      const res = await getChat(chatId);
      const chat = res.data.chat;
      const formattedMessages = (chat.messages || []).map((msg) => ({
        id: msg._id,
        role: msg.role,
        text: msg.content,
      }));
      setMessages(formattedMessages);
      setCurrentChatId(chatId);
    } catch (err) {
      console.error("خطأ في فتح المحادثة:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleDeleteChat = (chatId) => setChatToDelete(chatId);

  const confirmDelete = async () => {
    if (!chatToDelete) return;
    try {
      await deleteChat(chatToDelete);
      setChats((prev) => prev.filter((c) => c._id !== chatToDelete));
      if (chatToDelete === currentChatId) {
        setMessages([]);
        setCurrentChatId(null);
      }
    } catch (err) {
      console.error("خطأ في حذف المحادثة:", err);
    } finally {
      setChatToDelete(null);
    }
  };

  const handleSendMessage = async (text) => {
    const userMessage = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    try {
      let chatId = currentChatId;
      if (!chatId) {
        const chatRes = await createChat({ title: text.slice(0, 40), category: "general" });
        chatId = chatRes.data.chat._id;
        setCurrentChatId(chatId);
        setChats((prev) => [chatRes.data.chat, ...prev]);
      }
      const res = await sendMessage(chatId, text);
      const assistant = res.data.assistantMessage;
      setMessages((prev) => [...prev, { id: assistant._id || Date.now() + 1, role: "assistant", text: assistant.content }]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: "عذراً، حدث خطأ في الاتصال. تأكد أن السيرفرات تعمل وحاول مرة أخرى." }]);
      console.error("خطأ في إرسال الرسالة:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
      </div>

      <Header user={user} onLogout={logout} onAdminClick={() => setShowAdmin(true)} />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar
          chats={chats}
          loading={loadingChats}
          activeChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onNewChat={handleNewChat}
        />
        <div className="flex-1 flex flex-col">
          <ChatArea messages={messages} isTyping={isTyping} />
          <ChatInput onSend={handleSendMessage} />
        </div>
      </div>

      <ConfirmModal
        isOpen={chatToDelete !== null}
        title="حذف المحادثة"
        message="هل أنت متأكد من حذف هذه المحادثة؟ لن تتمكن من استعادتها."
        confirmText="حذف"
        cancelText="إلغاء"
        danger={true}
        onConfirm={confirmDelete}
        onCancel={() => setChatToDelete(null)}
      />
    </div>
  );
}

export default App;