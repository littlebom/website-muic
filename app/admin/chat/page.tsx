import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatList } from "@/components/admin/chat-list";
import { query } from "@/lib/data";

async function getConversations() {
  try {
    const conversations = await query(
      `SELECT id, user_id, user_name, user_email, status, priority, category,
              assigned_to, last_message_at, created_at, updated_at
       FROM chat_conversations
       ORDER BY last_message_at DESC
       LIMIT 100`
    );
    return conversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

export default async function AdminChatPage() {
  const conversations = await getConversations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">การจัดการแชท</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>รายการแชททั้งหมด ({conversations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChatList conversations={conversations} />
        </CardContent>
      </Card>
    </div>
  );
}
