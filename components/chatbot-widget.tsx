"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { LineContactWidget } from "@/components/line-contact-widget";

interface ActionButton {
  type: "support_redirect" | "ask_another";
  label: string;
  url?: string;
  variant?: "primary" | "secondary";
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  actions?: ActionButton[];
}

interface UserInfo {
  name: string;
  email?: string;
}

export function ChatbotWidget() {
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [lineQrCodeUrl, setLineQrCodeUrl] = useState<string | null>(null);
  const [lineOfficialId, setLineOfficialId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is at the bottom of the chat
  const isUserAtBottom = () => {
    if (!messagesContainerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Handle scroll event to detect if user is reading old messages
  const handleScroll = () => {
    setShouldAutoScroll(isUserAtBottom());
  };

  // Load chatbot settings from API
  useEffect(() => {
    async function loadChatbotSettings() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setChatbotEnabled(data.chatbotEnabled ?? true);
          setLineQrCodeUrl(data.lineQrCodeUrl || null);
          setLineOfficialId(data.lineOfficialId || null);
        }
      } catch (error) {
        console.error('Failed to load chatbot settings:', error);
        // Default to chatbot enabled on error
        setChatbotEnabled(true);
      }
    }
    loadChatbotSettings();
  }, []);

  // Load user info from localStorage on mount
  useEffect(() => {
    const savedUserInfo = localStorage.getItem("muic_chatbot_user");
    if (savedUserInfo) {
      try {
        setUserInfo(JSON.parse(savedUserInfo));
      } catch (error) {
        console.error("Error parsing saved user info:", error);
      }
    }
  }, []);

  // SSE: Real-time message streaming (replaces polling)
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    console.log('[Chatbot SSE] Connecting to conversation:', conversationId);

    const eventSource = new EventSource(
      `/api/chat/stream?conversation_id=${conversationId}`
    );

    eventSource.onopen = () => {
      console.log('[Chatbot SSE] Connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Chatbot SSE] Received:', data.type, data.messages?.length || 0, 'messages');

        if (data.type === 'initial') {
          // Replace all messages with initial data
          const formattedMessages: Message[] = data.messages.map((msg: any) => {
            // Find existing message to preserve actions
            const existingMsg = messages.find(m => m.id === msg.id);

            return {
              id: msg.id,
              text: msg.message,
              sender: msg.sender_type === 'admin' ? 'ai' : msg.sender_type,
              timestamp: new Date(msg.created_at),
              actions: existingMsg?.actions,
            };
          });
          setMessages(formattedMessages);
        } else if (data.type === 'new') {
          // Append new messages
          const newFormattedMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            text: msg.message,
            sender: msg.sender_type === 'admin' ? 'ai' : msg.sender_type,
            timestamp: new Date(msg.created_at),
          }));

          setMessages((prev) => {
            // Avoid duplicates
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNew = newFormattedMessages.filter(m => !existingIds.has(m.id));
            if (uniqueNew.length > 0) {
              console.log('[Chatbot SSE] Adding', uniqueNew.length, 'new messages');
              return [...prev, ...uniqueNew];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('[Chatbot SSE] Error parsing message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[Chatbot SSE] Connection error:', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      console.log('[Chatbot SSE] Disconnecting');
      eventSource.close();
    };
  }, [isOpen, conversationId]);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Check if user info exists
      if (!userInfo) {
        // Show welcome modal to collect user info
        setShowWelcomeModal(true);
      } else {
        // Show welcome message with user's name
        setMessages([{
          id: "welcome",
          text: `สวัสดีครับคุณ${userInfo.name}! ผมคือ MUIC Assistant พร้อมช่วยตอบคำถามเกี่ยวกับคอร์สเรียนและการใช้งานระบบครับ`,
          sender: "ai",
          timestamp: new Date(),
        }]);
      }
    }
  }, [isOpen, messages.length, userInfo]);

  const handleWelcomeSubmit = () => {
    if (!tempName.trim()) {
      alert("กรุณากรอกชื่อของคุณ");
      return;
    }

    const newUserInfo: UserInfo = {
      name: tempName.trim(),
      email: tempEmail.trim() || undefined,
    };

    // Save to localStorage
    localStorage.setItem("muic_chatbot_user", JSON.stringify(newUserInfo));

    // Update state
    setUserInfo(newUserInfo);
    setShowWelcomeModal(false);

    // Show welcome message
    setMessages([{
      id: "welcome",
      text: `สวัสดีครับคุณ${newUserInfo.name}! ผมคือ MUIC Assistant พร้อมช่วยตอบคำถามเกี่ยวกับคอร์สเรียนและการใช้งานระบบครับ`,
      sender: "ai",
      timestamp: new Date(),
    }]);

    // Clear temp values
    setTempName("");
    setTempEmail("");
  };

  const handleActionClick = (action: ActionButton) => {
    if (action.type === "support_redirect" && action.url) {
      // Navigate to support page
      window.location.href = action.url;
    } else if (action.type === "ask_another") {
      // Just clear the input - user can type a new question
      setInputText("");
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setShouldAutoScroll(true); // Always scroll to bottom when sending new message
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputText,
          conversationId,
          userName: userInfo?.name || "Guest User",
          userEmail: userInfo?.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.conversationId && !conversationId) {
          setConversationId(data.data.conversationId);
        }

        const aiMessage: Message = {
          id: data.data.aiMessage.id,
          text: data.data.aiMessage.message,
          sender: "ai",
          timestamp: new Date(data.data.aiMessage.timestamp),
          actions: data.data.aiMessage.actions,
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        text: "ขออภัยครับ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        sender: "ai",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // If chatbot is disabled, show LINE Contact Widget instead
  if (!chatbotEnabled) {
    return <LineContactWidget qrCodeUrl={lineQrCodeUrl} lineId={lineOfficialId} />;
  }

  return (
    <>
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <Card className="w-96 p-6 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">ยินดีต้อนรับ</h2>
              <p className="text-gray-600 text-sm">กรุณาแนะนำตัวเพื่อเริ่มใช้งาน Chatbot</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อของคุณ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="เช่น สมชาย ใจดี"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleWelcomeSubmit()}
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
                </label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleWelcomeSubmit()}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleWelcomeSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base"
              >
                เริ่มใช้งาน
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              ข้อมูลของคุณจะถูกบันทึกในอุปกรณ์นี้เท่านั้น
            </p>
          </Card>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[500px] shadow-2xl flex flex-col">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-base">MUIC Assistant</h3>
                <p className="text-xs opacity-90">ออนไลน์</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === "user" ? "bg-blue-600 text-white" : "bg-white border"}`}>
                  {msg.sender === "ai" ? (
                    <div className="text-sm prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              className="text-blue-600 hover:text-blue-800 underline"
                              target="_self"
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0" />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul {...props} className="list-disc list-inside mb-2" />
                          ),
                          li: ({ node, ...props }) => (
                            <li {...props} className="mb-1" />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-blue-100" : "text-gray-400"}`}>
                    {msg.timestamp.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </p>

                  {/* Action Buttons - Only for AI messages with actions */}
                  {msg.sender === "ai" && msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {msg.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(action)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${action.variant === "primary"
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="พิมพ์ข้อความ..."
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={!inputText.trim() || isLoading} size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
