import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await sql`
      SELECT 
        dt.*,
        c.name as category_name
      FROM drill_templates dt
      LEFT JOIN categories c ON dt.category_id = c.id
      WHERE dt.user_id = ${session.user.id}
      ORDER BY dt.created_at DESC
    `;
    return Response.json({ templates });
  } catch (error) {
    console.error("Error fetching drill templates:", error);
    return Response.json(
      { error: "Failed to fetch drill templates" },
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
      name,
      categoryId,
      limitType,
      targetReps,
      targetSeconds,
      trackingMode,
    } = await request.json();

    if (!name || !name.trim()) {
      return Response.json(
        { error: "Drill name is required" },
        { status: 400 },
      );
    }

    if (!limitType || !["reps", "time", "none"].includes(limitType)) {
      return Response.json(
        { error: "Valid limit type is required" },
        { status: 400 },
      );
    }

    if (limitType === "reps" && (!targetReps || targetReps <= 0)) {
      return Response.json(
        { error: "Target reps is required for rep limit drills" },
        { status: 400 },
      );
    }

    if (limitType === "time" && (!targetSeconds || targetSeconds <= 0)) {
      return Response.json(
        { error: "Target time is required for time limit drills" },
        { status: 400 },
      );
    }

    const [template] = await sql`
      INSERT INTO drill_templates (name, category_id, limit_type, target_reps, target_seconds, tracking_mode, user_id)
      VALUES (
        ${name.trim()},
        ${categoryId || null},
        ${limitType},
        ${limitType === "reps" ? targetReps : null},
        ${limitType === "time" ? targetSeconds : null},
        ${trackingMode || "success_fail"},
        ${session.user.id}
      )
      RETURNING *
    `;

    return Response.json({ template });
  } catch (error) {
    console.error("Error creating drill template:", error);
    return Response.json(
      { error: "Failed to create drill template" },
      { status: 500 },
    );
  }
}
