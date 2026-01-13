import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const [log] = await sql`
      SELECT 
        dl.*,
        dt.name as drill_name,
        c.name as category_name,
        s.name as session_name
      FROM drill_logs dl
      JOIN drill_templates dt ON dl.drill_template_id = dt.id
      LEFT JOIN categories c ON dt.category_id = c.id
      LEFT JOIN sessions s ON dl.session_id = s.id
      WHERE dl.id = ${id} AND dl.user_id = ${session.user.id}
    `;

    if (!log) {
      return Response.json({ error: "Drill log not found" }, { status: 404 });
    }

    return Response.json({ log });
  } catch (error) {
    console.error("Error fetching drill log:", error);
    return Response.json(
      { error: "Failed to fetch drill log" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const result = await sql`
      DELETE FROM drill_logs 
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({ error: "Log not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting drill log:", error);
    return Response.json(
      { error: "Failed to delete drill log" },
      { status: 500 },
    );
  }
}
