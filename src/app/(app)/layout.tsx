// App layout: sidebar navigation + main content area for signed-in pages.
import { AppShell } from "@/components/app-shell";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

// Per-user header; never prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string | null = null;
  if (user) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    fullName = profile?.full_name ?? null;
  }

  return (
    <AppShell email={user?.email ?? null} fullName={fullName}>
      {children}
    </AppShell>
  );
}
