import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT 
        s.*,
        COUNT(DISTINCT di.id) as drill_count,
        COUNT(DISTINCT dl.id) as completed_count
      FROM sessions s
      LEFT JOIN drill_instances di ON s.id = di.session_id
      LEFT JOIN drill_logs dl ON di.id = dl.drill_instance_id
      WHERE s.user_id = ${session.user.id}
      GROUP BY s.id
      ORDER BY s.scheduled_date DESC
    `;
    return Response.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return Response.json(
      { error: "Failed to fetch sessions" },
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

    const { name, scheduledDate, drills } = await request.json();

    if (!name || !name.trim()) {
      return Response.json(
        { error: "Session name is required" },
        { status: 400 },
      );
    }

    if (!scheduledDate) {
      return Response.json(
        { error: "Scheduled date is required" },
        { status: 400 },
      );
    }

    if (!drills || !Array.isArray(drills) || drills.length === 0) {
      return Response.json(
        { error: "At least one drill is required" },
        { status: 400 },
      );
    }

    // Create session
    const [newSession] = await sql`
      INSERT INTO sessions (name, scheduled_date, user_id)
      VALUES (${name.trim()}, ${scheduledDate}, ${session.user.id})
      RETURNING *
    `;

    // Create drill instances
    for (let i = 0; i < drills.length; i++) {
      await sql`
        INSERT INTO drill_instances (session_id, drill_template_id, position)
        VALUES (${newSession.id}, ${drills[i].templateId}, ${i})
      `;
    }

    return Response.json({ session: newSession });
  } catch (error) {
    console.error("Error creating session:", error);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}
