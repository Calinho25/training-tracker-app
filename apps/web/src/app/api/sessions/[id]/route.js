import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const [sessionData, instances] = await sql.transaction([
      sql`SELECT * FROM sessions WHERE id = ${id} AND user_id = ${session.user.id}`,
      sql`
        SELECT 
          di.*,
          dt.name as drill_name,
          dt.limit_type,
          dt.target_reps,
          dt.target_seconds,
          dt.tracking_mode,
          c.name as category_name,
          dl.id as log_id,
          dl.successful_reps,
          dl.attempted_reps,
          dl.time_spent_seconds,
          dl.success_rate
        FROM drill_instances di
        JOIN drill_templates dt ON di.drill_template_id = dt.id
        LEFT JOIN categories c ON dt.category_id = c.id
        LEFT JOIN drill_logs dl ON di.id = dl.drill_instance_id
        WHERE di.session_id = ${id}
        ORDER BY di.position ASC
      `,
    ]);

    if (!sessionData || sessionData.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json({
      session: sessionData[0],
      drills: instances,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return Response.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { name, scheduledDate, completedAt } = await request.json();

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      if (!name.trim()) {
        return Response.json(
          { error: "Session name cannot be empty" },
          { status: 400 },
        );
      }
      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
    }

    if (scheduledDate !== undefined) {
      paramCount++;
      updates.push(`scheduled_date = $${paramCount}`);
      values.push(scheduledDate);
    }

    if (completedAt !== undefined) {
      paramCount++;
      updates.push(`completed_at = $${paramCount}`);
      values.push(completedAt);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    paramCount++;
    values.push(id);

    paramCount++;
    values.push(session.user.id);

    const query = `
      UPDATE sessions
      SET ${updates.join(", ")}
      WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `;

    const [updatedSession] = await sql(query, values);

    if (!updatedSession) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json({ session: updatedSession });
  } catch (error) {
    console.error("Error updating session:", error);
    return Response.json(
      { error: "Failed to update session" },
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

    // First, remove calendar entries that reference this session (set to null)
    await sql`
      UPDATE calendar_entries 
      SET session_id = NULL 
      WHERE session_id = ${id} AND user_id = ${session.user.id}
    `;

    // Then delete the session (drill instances will cascade delete)
    const result = await sql`
      DELETE FROM sessions 
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return Response.json(
      { error: "Failed to delete session" },
      { status: 500 },
    );
  }
}
