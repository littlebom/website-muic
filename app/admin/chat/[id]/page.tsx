import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatReplyForm } from "@/components/admin/chat-reply-form";
import { query, execute } from "@/lib/data";

async function getConversation(id: string) {
  try {
    // Get conversation details
    const conversations = await query(
      `SELECT id, user_id, user_name, user_email, status, priority, category,
              assigned_to, last_message_at, created_at, updated_at, is_read
       FROM chat_conversations
       WHERE id = ?`,
      [id]
    );

    if (conversations.length === 0) return null;

    const conversation = conversations[0];

    // Get messages for this conversation
    const messages = await query(
      `SELECT id, conversation_id, sender_type, sender_name, message, created_at
       FROM chat_messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
      [id]
    );

    conversation.messages = messages;

    // Mark conversation as read
    if (!conversation.is_read) {
      await execute(
        `UPDATE chat_conversations SET is_read = TRUE WHERE id = ?`,
        [id]
      );
    }

    return conversation;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }
}

export default async function ConversationDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const conversation = await getConversation(id);
  
  if (!conversation) notFound();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">การสนทนากับ {conversation.user_name}</h1>
        <p className="text-gray-600">{conversation.user_email}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการสนทนา</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">สถานะ:</span> {conversation.status}</div>
            <div><span className="font-semibold">ความสำคัญ:</span> {conversation.priority}</div>
            <div><span className="font-semibold">หมวดหมู่:</span> {conversation.category || "ไม่ระบุ"}</div>
            <div><span className="font-semibold">เวลาล่าสุด:</span> {new Date(conversation.last_message_at).toLocaleString("th-TH")}</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>ข้อความทั้งหมด ({conversation.messages?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversation.messages && conversation.messages.map((msg: any) => (
              <div 
                key={msg.id} 
                className={`p-4 rounded ${
                  msg.sender_type === "user" 
                    ? "bg-blue-50 ml-0 mr-12" 
                    : msg.sender_type === "admin"
                    ? "bg-green-50 ml-12 mr-0"
                    : "bg-gray-50 ml-6 mr-6"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-sm">
                    {msg.sender_name || msg.sender_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString("th-TH")}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>ตอบกลับ</CardTitle>
        </CardHeader>
        <CardContent>
          <ChatReplyForm conversationId={conversation.id} />
        </CardContent>
      </Card>
    </div>
  );
}
