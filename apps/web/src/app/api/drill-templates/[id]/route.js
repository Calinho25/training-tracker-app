import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const [template] = await sql`
      SELECT 
        dt.*,
        c.name as category_name
      FROM drill_templates dt
      LEFT JOIN categories c ON dt.category_id = c.id
      WHERE dt.id = ${id} AND dt.user_id = ${session.user.id}
    `;

    if (!template) {
      return Response.json(
        { error: "Drill template not found" },
        { status: 404 },
      );
    }

    return Response.json({ template });
  } catch (error) {
    console.error("Error fetching drill template:", error);
    return Response.json(
      { error: "Failed to fetch drill template" },
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
    const { name, categoryId, limitType, targetReps, targetSeconds } =
      await request.json();

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      if (!name.trim()) {
        return Response.json(
          { error: "Drill name cannot be empty" },
          { status: 400 },
        );
      }
      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
    }

    if (categoryId !== undefined) {
      paramCount++;
      updates.push(`category_id = $${paramCount}`);
      values.push(categoryId || null);
    }

    if (limitType !== undefined) {
      if (!["reps", "time", "none"].includes(limitType)) {
        return Response.json(
          { error: "Valid limit type is required" },
          { status: 400 },
        );
      }
      paramCount++;
      updates.push(`limit_type = $${paramCount}`);
      values.push(limitType);
    }

    if (targetReps !== undefined) {
      paramCount++;
      updates.push(`target_reps = $${paramCount}`);
      values.push(targetReps || null);
    }

    if (targetSeconds !== undefined) {
      paramCount++;
      updates.push(`target_seconds = $${paramCount}`);
      values.push(targetSeconds || null);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);

    paramCount++;
    values.push(id);

    paramCount++;
    values.push(session.user.id);

    const query = `
      UPDATE drill_templates
      SET ${updates.join(", ")}
      WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `;

    const [template] = await sql(query, values);

    if (!template) {
      return Response.json(
        { error: "Drill template not found" },
        { status: 404 },
      );
    }

    return Response.json({ template });
  } catch (error) {
    console.error("Error updating drill template:", error);
    return Response.json(
      { error: "Failed to update drill template" },
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

    await sql`
      DELETE FROM drill_templates WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting drill template:", error);
    return Response.json(
      { error: "Failed to delete drill template" },
      { status: 500 },
    );
  }
}
