import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const drillTemplateId = searchParams.get("drillTemplateId");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = `
      SELECT 
        dl.*,
        dt.name as drill_name,
        c.name as category_name,
        s.name as session_name
      FROM drill_logs dl
      JOIN drill_templates dt ON dl.drill_template_id = dt.id
      LEFT JOIN categories c ON dt.category_id = c.id
      LEFT JOIN sessions s ON dl.session_id = s.id
      WHERE dl.user_id = $1
    `;

    const values = [session.user.id];
    let paramCount = 1;

    if (drillTemplateId) {
      paramCount++;
      query += ` AND dl.drill_template_id = $${paramCount}`;
      values.push(drillTemplateId);
    }

    if (categoryId) {
      paramCount++;
      query += ` AND dt.category_id = $${paramCount}`;
      values.push(categoryId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND dl.finished_at >= $${paramCount}`;
      values.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND dl.finished_at <= $${paramCount}`;
      values.push(endDate);
    }

    query += ` ORDER BY dl.finished_at DESC`;

    const logs = await sql(query, values);

    return Response.json({ logs });
  } catch (error) {
    console.error("Error fetching drill logs:", error);
    return Response.json(
      { error: "Failed to fetch drill logs" },
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

    const {
      drillInstanceId,
      drillTemplateId,
      sessionId,
      startedAt,
      finishedAt,
      timeSpentSeconds,
      attemptedReps,
      successfulReps,
      leftAttempted,
      leftSuccessful,
      rightAttempted,
      rightSuccessful,
      limitType,
      targetReps,
      targetSeconds,
      notes,
    } = await request.json();

    if (!drillTemplateId) {
      return Response.json(
        { error: "Drill template ID is required" },
        { status: 400 },
      );
    }

    if (!startedAt || !finishedAt) {
      return Response.json(
        { error: "Start and finish times are required" },
        { status: 400 },
      );
    }

    if (timeSpentSeconds === undefined || timeSpentSeconds < 0) {
      return Response.json(
        { error: "Valid time spent is required" },
        { status: 400 },
      );
    }

    // Calculate success rate
    const successRate =
      attemptedReps > 0
        ? ((successfulReps / attemptedReps) * 100).toFixed(2)
        : null;

    const [log] = await sql`
      INSERT INTO drill_logs (
        drill_instance_id,
        drill_template_id,
        session_id,
        started_at,
        finished_at,
        time_spent_seconds,
        attempted_reps,
        successful_reps,
        left_attempted,
        left_successful,
        right_attempted,
        right_successful,
        success_rate,
        limit_type,
        target_reps,
        target_seconds,
        notes,
        user_id
      )
      VALUES (
        ${drillInstanceId || null},
        ${drillTemplateId},
        ${sessionId || null},
        ${startedAt},
        ${finishedAt},
        ${timeSpentSeconds},
        ${attemptedReps || 0},
        ${successfulReps || 0},
        ${leftAttempted || 0},
        ${leftSuccessful || 0},
        ${rightAttempted || 0},
        ${rightSuccessful || 0},
        ${successRate},
        ${limitType},
        ${targetReps || null},
        ${targetSeconds || null},
        ${notes || null},
        ${session.user.id}
      )
      RETURNING *
    `;

    return Response.json({ log });
  } catch (error) {
    console.error("Error creating drill log:", error);
    return Response.json(
      { error: "Failed to create drill log" },
      { status: 500 },
    );
  }
}
