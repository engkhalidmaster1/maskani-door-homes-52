import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unauthorized",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log("Keep-alive ping started at:", new Date().toISOString());

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple query to keep the database active
    const { data, error } = await supabase
      .from("system_metrics")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Keep-alive query error:", error.message);
      throw error;
    }

    // Log the successful ping
    console.log("Keep-alive ping successful:", {
      timestamp: new Date().toISOString(),
      rowsChecked: data?.length || 0,
    });

    // Optionally update system_metrics with keep-alive timestamp
    const { error: insertError } = await supabase.rpc("update_system_metrics", {
      p_total_requests: 1,
    });

    if (insertError) {
      console.warn("Could not update system metrics:", insertError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database keep-alive ping successful",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Keep-alive error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
