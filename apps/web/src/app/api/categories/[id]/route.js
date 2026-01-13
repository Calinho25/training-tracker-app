import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return Response.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    const [category] = await sql`
      UPDATE categories
      SET name = ${name.trim()}
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    return Response.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.message.includes("unique")) {
      return Response.json(
        { error: "Category already exists" },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Failed to update category" },
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

    // Check if this is the Uncategorised category
    const [category] = await sql`
      SELECT name FROM categories WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    if (category.name === "Uncategorised") {
      return Response.json(
        { error: "Cannot delete Uncategorised category" },
        { status: 400 },
      );
    }

    // Get Uncategorised category ID for this user
    const [uncategorised] = await sql`
      SELECT id FROM categories WHERE name = 'Uncategorised' AND user_id = ${session.user.id}
    `;

    // Move drills to Uncategorised before deleting
    if (uncategorised) {
      await sql`
        UPDATE drill_templates
        SET category_id = ${uncategorised.id}
        WHERE category_id = ${id} AND user_id = ${session.user.id}
      `;
    }

    // Delete the category
    await sql`
      DELETE FROM categories WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return Response.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
