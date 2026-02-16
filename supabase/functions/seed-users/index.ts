import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const users = [
      { email: "netofly@admin.com", password: "gallo@2019", role: "admin" as const, name: "Neto" },
      { email: "marcellyfly@admin.com", password: "celly@2026", role: "admin" as const, name: "Marcelly" },
      { email: "fly@turismo.com", password: "flyturismo@2026", role: "employee" as const, name: "Funcionário" },
    ];

    const results = [];

    for (const u of users) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(eu => eu.email === u.email);
      
      if (existing) {
        // Ensure role exists
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", existing.id)
          .eq("role", u.role)
          .maybeSingle();

        if (!roleData) {
          await supabaseAdmin.from("user_roles").insert({ user_id: existing.id, role: u.role });
        }

        // Ensure profile exists
        const { data: profileData } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", existing.id)
          .maybeSingle();

        if (!profileData) {
          await supabaseAdmin.from("profiles").insert({
            id: existing.id,
            full_name: u.name,
            email: u.email,
            cargo: u.role === "admin" ? "Gerente" : "Funcionário",
          });
        }

        results.push({ email: u.email, status: "already_exists", id: existing.id });
        continue;
      }

      // Create user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });

      if (createError) {
        results.push({ email: u.email, status: "error", error: createError.message });
        continue;
      }

      // Assign role
      await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: u.role });

      // Create profile
      await supabaseAdmin.from("profiles").insert({
        id: newUser.user.id,
        full_name: u.name,
        email: u.email,
        cargo: u.role === "admin" ? "Gerente" : "Funcionário",
      });

      results.push({ email: u.email, status: "created", id: newUser.user.id });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
