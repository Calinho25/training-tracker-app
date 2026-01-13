import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const [entry] = await sql`
      SELECT 
        ce.*,
        s.name as session_name,
        s.id as session_id
      FROM calendar_entries ce
      LEFT JOIN sessions s ON ce.session_id = s.id
      WHERE ce.id = ${id} AND ce.user_id = ${session.user.id}
    `;

    if (!entry) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    // Get drill instances for this session
    const drills = await sql`
      SELECT 
        di.*,
        dt.name as drill_name,
        dt.limit_type,
        dt.target_reps,
        dt.target_seconds,
        c.name as category_name
      FROM drill_instances di
      JOIN drill_templates dt ON di.drill_template_id = dt.id
      LEFT JOIN categories c ON dt.category_id = c.id
      WHERE di.session_id = ${entry.session_id}
      ORDER BY di.position ASC
    `;

    return Response.json({ entry: { ...entry, drills } });
  } catch (error) {
    console.error("Error fetching calendar entry:", error);
    return Response.json(
      { error: "Failed to fetch calendar entry" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { scheduledDate, startTime, endTime, notes } = body;

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (scheduledDate) {
      setClauses.push(`scheduled_date = $${paramCount++}`);
      values.push(scheduledDate);
    }
    if (startTime) {
      setClauses.push(`start_time = $${paramCount++}`);
      values.push(startTime);
    }
    if (endTime !== undefined) {
      setClauses.push(`end_time = $${paramCount++}`);
      values.push(endTime);
    }
    if (notes !== undefined) {
      setClauses.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    setClauses.push(`updated_at = NOW()`);

    if (setClauses.length === 1) {
      // Only updated_at
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const query = `
      UPDATE calendar_entries 
      SET ${setClauses.join(", ")}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    values.push(id, session.user.id);

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    return Response.json({ entry: result[0] });
  } catch (error) {
    console.error("Error updating calendar entry:", error);
    return Response.json(
      { error: "Failed to update calendar entry" },
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
      DELETE FROM calendar_entries 
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar entry:", error);
    return Response.json(
      { error: "Failed to delete calendar entry" },
      { status: 500 },
    );
  }
}
