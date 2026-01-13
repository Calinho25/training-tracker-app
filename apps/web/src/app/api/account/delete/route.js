import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function DELETE(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id.toString();

    // Delete all user data in a transaction
    await sql.transaction([
      // Delete drill logs
      sql`DELETE FROM drill_logs WHERE user_id = ${userId}`,

      // Delete calendar entries
      sql`DELETE FROM calendar_entries WHERE user_id = ${userId}`,

      // Delete drill instances (via sessions cascade)
      // Delete sessions (will cascade to drill_instances)
      sql`DELETE FROM sessions WHERE user_id = ${userId}`,

      // Delete drill templates
      sql`DELETE FROM drill_templates WHERE user_id = ${userId}`,

      // Delete categories
      sql`DELETE FROM categories WHERE user_id = ${userId}`,

      // Delete auth sessions
      sql`DELETE FROM auth_sessions WHERE "userId" = ${session.user.id}`,

      // Delete auth accounts
      sql`DELETE FROM auth_accounts WHERE "userId" = ${session.user.id}`,

      // Finally, delete the user
      sql`DELETE FROM auth_users WHERE id = ${session.user.id}`,
    ]);

    return Response.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return Response.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
