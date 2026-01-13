import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await sql`
      SELECT * FROM categories
      WHERE user_id = ${session.user.id}
      ORDER BY name ASC
    `;
    return Response.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json(
      { error: "Failed to fetch categories" },
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

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return Response.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    const [category] = await sql`
      INSERT INTO categories (name, user_id)
      VALUES (${name.trim()}, ${session.user.id})
      RETURNING *
    `;

    return Response.json({ category });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error.message.includes("unique")) {
      return Response.json(
        { error: "Category already exists" },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
