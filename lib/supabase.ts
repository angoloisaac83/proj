import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function authUserToAppUser(authUser: SupabaseUser) {
  const metadata = authUser.user_metadata ?? {};
  const role = metadata.role === "admin" || metadata.role === "lecturer" ? metadata.role : "student";
  const name = typeof metadata.name === "string" && metadata.name.trim()
    ? metadata.name.trim()
    : authUser.email?.split("@")[0] ?? "XcelLearn user";

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