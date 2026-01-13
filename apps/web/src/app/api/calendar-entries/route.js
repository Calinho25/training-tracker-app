import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = `
      SELECT 
        ce.*,
        s.name as session_name,
        COUNT(di.id) as drill_count
      FROM calendar_entries ce
      LEFT JOIN sessions s ON ce.session_id = s.id
      LEFT JOIN drill_instances di ON s.id = di.session_id
      WHERE ce.user_id = $1
    `;

    const values = [session.user.id];

    if (startDate && endDate) {
      query += ` AND ce.scheduled_date BETWEEN $2 AND $3`;
      values.push(startDate, endDate);
    }

    query += ` GROUP BY ce.id, s.name ORDER BY ce.scheduled_date ASC, ce.start_time ASC`;

    const entries = await sql(query, values);
    return Response.json({ entries });
  } catch (error) {
    console.error("Error fetching calendar entries:", error);
    return Response.json(
      { error: "Failed to fetch calendar entries" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, scheduledDate, startTime, endTime, notes } = body;

    if (!sessionId || !scheduledDate || !startTime) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const [entry] = await sql`
      INSERT INTO calendar_entries (user_id, session_id, scheduled_date, start_time, end_time, notes, created_at, updated_at)
      VALUES (${session.user.id}, ${sessionId}, ${scheduledDate}, ${startTime}, ${endTime || null}, ${notes || null}, NOW(), NOW())
      RETURNING *
    `;

    return Response.json({ entry });
  } catch (error) {
    console.error("Error creating calendar entry:", error);
    return Response.json(
      { error: "Failed to create calendar entry" },
      { status: 500 },
    );
  }
}
