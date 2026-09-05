import { NextResponse } from "next/server";
import { createDevSupabase } from "../_lib/createDevSupabase";
import { requireDeveloper } from "../_lib/requireDeveloper";

export async function GET() {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const nodeEnv = process.env.NODE_ENV || "development";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
    const isVercel = Boolean(process.env.VERCEL);
    const gitCommit = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || "dev-local";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const envVars = [
      { key: "NODE_ENV", value: nodeEnv, isSecret: false, category: "Runtime" },
      { key: "NEXT_PUBLIC_APP_URL", value: appUrl, isSecret: false, category: "Routing" },
      { key: "NEXT_PUBLIC_SUPABASE_URL", value: supabaseUrl, isSecret: false, category: "Database" },
      { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "[CONFIGURED — ANON KEY]" : "[NOT SET]", isSecret: true, category: "Database" },
      { key: "SUPABASE_SERVICE_ROLE_KEY", value: process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-service-role-key-here" ? "[REDACTED — SERVICE ROLE KEY SET]" : "[NOT SET OR PLACEHOLDER]", isSecret: true, category: "Database" },
      { key: "PAYMONGO_SECRET_KEY", value: process.env.PAYMONGO_SECRET_KEY || process.env.PAYMONGO_LIVE_SECRET_KEY || process.env.PAYMONGO_TEST_SECRET_KEY ? "[REDACTED — PAYMONGO SECRET SET]" : "[NOT SET]", isSecret: true, category: "Payments" },
      { key: "PAYMONGO_PUBLIC_KEY", value: process.env.PAYMONGO_PUBLIC_KEY || process.env.PAYMONGO_LIVE_PUBLIC_KEY || process.env.PAYMONGO_TEST_PUBLIC_KEY || "pk_test_...", isSecret: false, category: "Payments" },
      { key: "UPSTASH_REDIS_REST_URL", value: process.env.UPSTASH_REDIS_REST_URL ? "[CONFIGURED]" : "[NOT SET — USING IN-MEMORY]", isSecret: false, category: "Caching" },
    ];

    const environments = [
      {
        id: "current",
        name: isVercel ? (nodeEnv === "production" ? "Production (Vercel)" : "Preview Deployment") : "Local Development Server",
        url: appUrl,
        status: "active" as const,
        commit: gitCommit,
        deployedAt: new Date().toISOString(),
        region: process.env.VERCEL_REGION || "ap-southeast-1 (local)",
        nodeVersion: process.version || "v20.x",
        provider: isVercel ? "Vercel Cloud" : "Node.js Local Runtime",
      },
    ];

    return NextResponse.json({ environments, envVars });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Environments fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
