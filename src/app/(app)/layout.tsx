// App layout: sidebar navigation + main content area for signed-in pages.
import { redirect } from "next/navigation";
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

  // proxy.ts normally redirects first; this keeps every page under (app)
  // private even if a new route is not listed there.
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const fullName = (profile?.full_name as string | null) ?? null;

  return (
    <AppShell email={user.email ?? null} fullName={fullName}>
      {children}
    </AppShell>
  );
}
