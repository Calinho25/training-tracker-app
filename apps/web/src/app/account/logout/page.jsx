import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#111] p-8 border border-[#222]">
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          Sign Out
        </h1>

        <button
          onClick={handleSignOut}
          className="w-full rounded-lg bg-[#3b82f6] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
