import sql from "@/app/api/utils/sql";

export async function POST(request, { params }) {
  try {
    const { id } = params;

    // Get scheduledDate from request body, default to now
    const body = await request.json().catch(() => ({}));
    const scheduledDate = body.scheduledDate || new Date().toISOString();

    // Get the original session
    const [originalSession] = await sql`
      SELECT * FROM sessions WHERE id = ${id}
    `;

    if (!originalSession) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    // Get all drill instances for this session
    const drillInstances = await sql`
      SELECT drill_template_id, position 
      FROM drill_instances 
      WHERE session_id = ${id}
      ORDER BY position ASC
    `;

    // Create a new session (duplicate) with specified date
    const [newSession] = await sql`
      INSERT INTO sessions (name, scheduled_date, created_at)
      VALUES (
        ${originalSession.name},
        ${scheduledDate},
        ${new Date().toISOString()}
      )
      RETURNING *
    `;

    // Copy all drill instances to the new session
    for (const drill of drillInstances) {
      await sql`
        INSERT INTO drill_instances (session_id, drill_template_id, position, created_at)
        VALUES (
          ${newSession.id},
          ${drill.drill_template_id},
          ${drill.position},
          ${new Date().toISOString()}
        )
      `;
    }

    return Response.json({ session: newSession });
  } catch (error) {
    console.error("Error repeating session:", error);
    return Response.json(
      { error: "Failed to repeat session" },
      { status: 500 },
    );
  }
}
