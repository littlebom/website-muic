import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { query } from "@/lib/data";

async function getTickets() {
  try {
    const tickets = await query(
      `SELECT id, ticket_number, user_name, user_email, subject, description,
              category, priority, status, assigned_to, is_read,
              created_at, updated_at
       FROM tickets
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return tickets;
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
}

export default async function AdminTicketsPage() {
  const tickets = await getTickets();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">จัดการ Tickets</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tickets ทั้งหมด ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
              <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}>
                <div className="p-4 border rounded hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{ticket.ticket_number}</p>
                      <p className="text-sm">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">{ticket.user_email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${ticket.status === 'new' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        {ticket.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{ticket.category}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {tickets.length === 0 && <p className="text-center text-gray-500 py-8">ยังไม่มี Tickets</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
