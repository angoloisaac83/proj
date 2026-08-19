import { createBrowserClient } from "@supabase/ssr";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function authUserToAppUser(authUser: SupabaseUser) {
  const metadata = authUser.user_metadata ?? {};
  const role = metadata.role === "admin" || metadata.role === "lecturer" ? metadata.role : "student";
  const name = typeof metadata.name === "string" && metadata.name.trim() ? metadata.name.trim() : authUser.email?.split("@")[0] ?? "XcelLearn user";
  return {
    id: authUser.id,
    name,
    username: typeof metadata.username === "string" && metadata.username.trim() ? metadata.username.trim() : authUser.email ?? authUser.id,
    email: authUser.email ?? undefined,
    role,
    courses: Array.isArray(metadata.courses) ? metadata.courses.filter((course: unknown): course is string => typeof course === "string") : [],
    department: typeof metadata.department === "string" ? metadata.department : undefined,
    year: typeof metadata.year === "number" ? metadata.year : undefined,
    status: metadata.status === "pending" || metadata.status === "rejected" ? metadata.status : "approved",
    verified: metadata.verified !== false,
  } as const;
}

export function authErrorMessage(message: string, mode: "signin" | "signup") {
  const normalized = message.toLowerCase();
  if (normalized.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (normalized.includes("password should be") || normalized.includes("weak password")) return "Choose a stronger password and try again.";
  if (normalized.includes("rate limit") || normalized.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (normalized.includes("invalid login credentials") || normalized.includes("user already registered")) return mode === "signin" ? "Invalid email or password." : "Unable to create this account with those details.";
  return "Something went wrong. Please try again.";
}
