"use client";

import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authUserToAppUser, supabase } from "../../lib/supabase";

type Role = "admin" | "student" | "lecturer";
type AccountStatus = "pending" | "approved" | "rejected";
type User = { id: string; name: string; username: string; role: Role; courses: string[]; department?: string; year?: number; email?: string; status?: AccountStatus; verified?: boolean };
type AccountRequest = { id: string; name: string; username: string; password: string; email: string; role: Role; department: string; status: AccountStatus; verified: boolean; createdAt: string };
type Assignment = { id: string; title: string; description: string; course: string; code: string; type: "assignment" | "quiz"; deadline: string; status?: string };

/**
 * Preview-only identity data.
 *
 * This is intentionally kept separate from the UI so it can be replaced by
 * Supabase Auth without changing the role-based application shell. Do not add
 * real users or real passwords here.
 */
const demoUsers: User[] = [
  { id: "xe-admin", name: "XE Admin", username: "xeadmin", role: "admin", courses: [], status: "approved", verified: true },
  { id: "u2", name: "Alice Johnson", username: "stud.demo", role: "student", courses: ["c1", "c2", "c3"], department: "Computer Science", year: 2, status: "approved", verified: true },
  { id: "u3", name: "Bob Smith", username: "student2", role: "student", courses: ["c4", "c5"], department: "Business Administration", year: 1, status: "approved", verified: true },
  { id: "u4", name: "Prof. Sarah Chen", username: "lect.demo", role: "lecturer", courses: ["c1", "c2", "c3"], department: "Computer Science", status: "approved", verified: true },
  { id: "u5", name: "Prof. James Osei", username: "lect2", role: "lecturer", courses: ["c4", "c5"], department: "Business Administration", status: "approved", verified: true },
];

const demoPasswords: Record<string, string> = {
  "stud.demo": "123",
  student2: "123",
  "lect.demo": "123",
  lect2: "123",
  xeadmin: "XE2407",
};

const accountRequestsSeed: AccountRequest[] = [
  { id: "r1", name: "Maya Williams", username: "maya.williams", password: "preview-only", email: "maya.williams@example.com", role: "student", department: "Computer Science", status: "pending", verified: false, createdAt: "Today, 9:14 AM" },
  { id: "r2", name: "Dr. Daniel Mensah", username: "daniel.mensah", password: "preview-only", email: "daniel.mensah@example.com", role: "lecturer", department: "Business Administration", status: "pending", verified: false, createdAt: "Yesterday, 3:42 PM" },
];

const REQUESTS_KEY = "xcellearn_account_requests";
const AUTO_ACCEPT_KEY = "xcellearn_auto_accept";

function requestToUser(request: AccountRequest): User {
  return {
    id: request.id,
    name: request.name,
    username: request.username,
    email: request.email,
    role: request.role,
    courses: [],
    department: request.department,
    status: request.status,
    verified: request.status === "approved" && request.verified,
  };
}

function getStoredRequests(): AccountRequest[] {
  if (typeof window === "undefined") return accountRequestsSeed;
  const stored = window.localStorage.getItem(REQUESTS_KEY);
  if (!stored) return accountRequestsSeed;
  try {
    const parsed = JSON.parse(stored) as AccountRequest[];
    return Array.isArray(parsed) ? parsed : accountRequestsSeed;
  } catch {
    return accountRequestsSeed;
  }
}

function saveRequests(requests: AccountRequest[]) {
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

function allPreviewUsers(requests = getStoredRequests()): User[] {
  return [...demoUsers, ...requests.filter((request) => request.status !== "rejected").map(requestToUser)];
}

function findPreviewUser(username: string, password: string, role: Role): User | null {
  const normalizedUsername = username.toLowerCase();
  const staticUser = allPreviewUsers().find((user) => user.username.toLowerCase() === normalizedUsername && user.role === role);
  if (staticUser && demoPasswords[staticUser.username.toLowerCase()] === password) return staticUser;
  const request = getStoredRequests().find((item) => item.username.toLowerCase() === normalizedUsername && item.role === role && item.password === password && item.status !== "rejected");
  return request ? requestToUser(request) : null;
}

const assignments: Assignment[] = [
  { id: "a1", title: "Binary Search Tree Implementation", description: "Implement a binary search tree with insertion, deletion, and traversal operations. Include clear complexity analysis.", course: "Data Structures", code: "CS201", type: "assignment", deadline: "Aug 14, 2026", status: "Not submitted" },
  { id: "a2", title: "CS201 Midterm Quiz", description: "A timed quiz covering standard BSTs, sorting algorithms, traversal types, and time complexities.", course: "Data Structures", code: "CS201", type: "quiz", deadline: "Aug 12, 2026", status: "Not attempted" },
  { id: "a3", title: "Dynamic Programming Problem Set", description: "Solve the matrix chain multiplication problems and show your memoized solution with the DP table.", course: "Algorithm Design", code: "CS202", type: "assignment", deadline: "Aug 20, 2026", status: "Submitted" },
  { id: "a4", title: "Graph Theory Problem Set", description: "Complete the graph theory exercises from the weekly problem set and explain each proof in your own words.", course: "Discrete Mathematics", code: "MATH201", type: "assignment", deadline: "Aug 7, 2026", status: "Graded · 95/100" },
  { id: "a5", title: "Market Analysis Report", description: "Prepare an evidence-based market analysis using recent industry sources and APA 7th edition citations.", course: "Introduction to Business", code: "BUS101", type: "assignment", deadline: "Aug 18, 2026", status: "Not submitted" },
];

const notificationsSeed = [
  { id: "n1", kind: "grade", message: 'Your "Graph Theory Problem Set" submission has been graded. Score: 95/100. Feedback available.', age: "2 days ago", read: false },
  { id: "n2", kind: "comment", message: 'Prof. Sarah Chen replied to your question on "Binary Search Tree Implementation"', age: "3 days ago", read: false },
  { id: "n3", kind: "deadline", message: "CS201 Midterm Quiz is due in 2 days. You have not yet attempted this quiz.", age: "4 days ago", read: true },
  { id: "n4", kind: "comment", message: 'Prof. Sarah Chen left a comment on "Binary Search Tree Implementation"', age: "5 days ago", read: true },
];

const courseRows = [
  ["CS201", "Data Structures", "Computer Science", "Prof. Sarah Chen", "2"],
  ["CS202", "Algorithm Design", "Computer Science", "Prof. Sarah Chen", "2"],
  ["MATH201", "Discrete Mathematics", "Computer Science", "Prof. Sarah Chen", "1"],
  ["BUS101", "Introduction to Business", "Business Administration", "Prof. James Osei", "1"],
  ["MATH101", "Calculus I", "Business Administration", "Prof. James Osei", "1"],
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function getStoredUser(storageKey: string): User | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(storageKey);
  return allPreviewUsers().find((user) => user.id === id) ?? null;
}

function Icon({ name }: { name: string }) {
  const props = { size: 18, strokeWidth: 1.8 };
  const icons: Record<string, React.ReactNode> = {
    dashboard: <LayoutDashboard {...props} />,
    users: <Users {...props} />,
    departments: <Building2 {...props} />,
    faculties: <Building2 {...props} />,
    courses: <BookOpen {...props} />,
    assignments: <FileText {...props} />,
    activity: <Activity {...props} />,
    profile: <UserRound {...props} />,
    library: <LibraryBig {...props} />,
    notifications: <Bell {...props} />,
    submissions: <CheckCircle2 {...props} />,
  };
  return icons[name] ?? <Settings {...props} />;
}

function Button({ children = null, variant = "primary", onClick, type = "button", className = "", disabled = false }: { children?: React.ReactNode; variant?: "primary" | "outline" | "ghost" | "danger"; onClick?: () => void; type?: "button" | "submit"; className?: string; disabled?: boolean }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`button button-${variant} ${className}`}>{children}</button>;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "orange" | "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function VerifiedBadge() {
  return <span className="verified-badge"><ShieldCheck size={12} /> Verified</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function StatCard({ label, value, icon, accent = false }: { label: string; value: string | number; icon: string; accent?: boolean }) {
  return <Card className={accent ? "stat-card accent" : "stat-card"}><div className="stat-head"><span>{label}</span><Icon name={icon} /></div><strong>{value}</strong></Card>;
}

function Login({ demoMode, onLogin }: { demoMode: boolean; onLogin: (user: User) => void }) {
  const [view, setView] = useState<"signin" | "create">("signin");
  const [role, setRole] = useState<Role>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fillDemoAccount = (nextRole: Role, nextUsername: string, nextPassword: string) => {
    setView("signin");
    setRole(nextRole);
    setUsername(nextUsername);
    setPassword(nextPassword);
    setError("");
    setSuccess("");
  };
  const chooseRole = (r: Role) => {
    setRole(r);
    setError("");
    setSuccess("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!demoMode) {
      if (!supabase) {
        setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
        return;
      }
      setError("");
      setSuccess("");
      if (view === "create") {
        if (!name.trim() || !email.trim() || !username.trim() || !password.trim() || !department.trim()) {
          setError("Complete all fields to create your account.");
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim(), username: username.trim(), role, department: department.trim(), status: "pending", verified: false } },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.user && data.session) {
          onLogin(authUserToAppUser(data.user));
        } else {
          setSuccess("Your account was created. Check your email to confirm it, then sign in.");
          setView("signin");
          setPassword("");
        }
        return;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: username.trim(), password });
      if (signInError || !data.user) {
        setError(signInError?.message ?? "Unable to sign in.");
        return;
      }
      onLogin(authUserToAppUser(data.user));
      return;
    }
    if (view === "create") {
      if (!name.trim() || !email.trim() || !username.trim() || !password.trim() || !department.trim()) {
        setError("Complete all fields to submit your account request.");
        return;
      }
      const existing = allPreviewUsers().some((item) => item.username.toLowerCase() === username.trim().toLowerCase());
      if (existing) {
        setError("That username is already in use.");
        return;
      }
      const autoAccept = window.localStorage.getItem(AUTO_ACCEPT_KEY) === "true";
      const request: AccountRequest = {
        id: `request-${Date.now()}`,
        name: name.trim(),
        username: username.trim(),
        password,
        email: email.trim(),
        role,
        department: department.trim(),
        status: autoAccept ? "approved" : "pending",
        verified: autoAccept,
        createdAt: "Just now",
      };
      saveRequests([...getStoredRequests(), request]);
      if (autoAccept) {
        onLogin(requestToUser(request));
      } else {
        setSuccess("Your account request was sent to an administrator for verification.");
        setView("signin");
        setPassword("");
      }
      return;
    }
    const user = findPreviewUser(username.trim(), password, role);
    if (!user) {
      setError("Invalid username or password, or this account has been rejected.");
      return;
    }
    onLogin(user);
  };
  return <main className="login-page">
    <div className="login-card">
      <div className="brand-mark"><GraduationCap size={26} /></div>
      <div className="brand-block"><h1>XcelLearn</h1><p>by XEStudioz</p></div>
      <div className="login-copy"><h2>{view === "signin" ? "Welcome back" : "Create your account"}</h2><p>{view === "signin" ? "Sign in to continue your learning journey." : "Submit your details for administrator verification."}</p></div>
      <div className="auth-switch"><button type="button" className={view === "signin" ? "active" : ""} onClick={() => { setView("signin"); setError(""); setSuccess(""); }}>Sign in</button><button type="button" className={view === "create" ? "active" : ""} onClick={() => { setView("create"); setRole("student"); setError(""); setSuccess(""); }}>Create an account</button></div>
      <div className="role-tabs">{(["student", "lecturer", ...(view === "signin" ? ["admin" as Role] : [])] as Role[]).map((item) => <button type="button" className={role === item ? "active" : ""} key={item} onClick={() => chooseRole(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
      <form onSubmit={submit} className="form-stack">
        {view === "create" && <><label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" /></label><label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" /></label><label>Department<input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Your department" /></label></>}
        <label>{demoMode ? "Username" : "Email address"}<input value={username} onChange={(e) => setUsername(e.target.value)} type={demoMode ? "text" : "email"} placeholder={demoMode ? "Enter username" : "you@example.com"} /></label>
        <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter password" /></label>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <Button type="submit" className="full-width">{view === "signin" ? "Sign In" : "Submit account request"}</Button>
      </form>
       {demoMode && <div className="demo-box"><strong>Demo accounts</strong><button type="button" onClick={() => fillDemoAccount("admin", "xeadmin", "XE2407")}>Use XE Admin demo</button><button type="button" onClick={() => fillDemoAccount("student", "stud.demo", "123")}>Use student demo</button><button type="button" onClick={() => fillDemoAccount("lecturer", "lect.demo", "123")}>Use lecturer demo</button></div>}
      <p className="login-footnote">{demoMode ? "You are in the isolated demo environment. Demo changes stay in this browser." : "Your account is secured by Supabase Auth."}</p>
    </div>
  </main>;
}

function Shell({ user, children = null, onLogout, basePath }: { user: User; children?: React.ReactNode; onLogout: () => void; basePath: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    if (user.role !== "admin") return;
    setPendingCount(getStoredRequests().filter((request) => request.status === "pending").length);
  }, [user.role, pathname]);
  const unread = user.role === "student" ? notificationsSeed.filter((n) => !n.read).length : user.role === "admin" ? pendingCount : 2;
  const links = user.role === "admin"
    ? [["dashboard", "Dashboard", `${basePath}/admin/dashboard`], ["users", "Users", `${basePath}/admin/users`], ["departments", "Departments", `${basePath}/admin/departments`], ["faculties", "Faculties", `${basePath}/admin/faculties`], ["courses", "Courses", `${basePath}/admin/courses`], ["assignments", "Assignments", `${basePath}/admin/assignments`], ["activity", "Activity", `${basePath}/admin/activity`], ["notifications", "Account requests", `${basePath}/admin/notifications`], ["settings", "Settings", `${basePath}/admin/settings`]]
    : user.role === "student"
      ? [["dashboard", "Dashboard", `${basePath}/student/dashboard`], ["assignments", "Assignments", `${basePath}/student/assignments`], ["library", "Library", `${basePath}/student/library`], ["profile", "Profile", `${basePath}/student/profile`], ["notifications", "Notifications", `${basePath}/student/notifications`]]
      : [["dashboard", "Dashboard", `${basePath}/lecturer/dashboard`], ["assignments", "Assignments", `${basePath}/lecturer/assignments`], ["submissions", "Submissions", `${basePath}/lecturer/submissions`], ["profile", "Profile", `${basePath}/lecturer/profile`], ["notifications", "Notifications", `${basePath}/lecturer/notifications`]];
  return <div className="app-shell">
    <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="side-brand"><div className="side-logo"><GraduationCap size={22} /></div><div><strong>XcelLearn</strong><small>by XEStudioz</small></div></div>
      <nav className="side-nav">{links.map(([icon, label, href]) => <button key={href} className={pathname === href ? "active" : ""} onClick={() => { router.push(href); setMenuOpen(false); }}><Icon name={icon} /><span>{label}</span>{label === "Notifications" && unread > 0 && <em>{unread}</em>}</button>)}</nav>
      <div className="side-user"><div className="avatar">{initials(user.name)}</div><div className="user-info"><strong>{user.name}</strong><span>{user.role}</span></div><button className="logout-icon" onClick={onLogout} aria-label="Log out"><LogOut size={17} /></button></div>
    </aside>
     <div className="main-area"><header className="topbar"><div className="crumb"><span>{user.role === "admin" ? "Administration" : user.role === "student" ? "Student Portal" : "Lecturer Portal"}</span><ChevronDown size={15} /></div><div className="top-actions"><button className="icon-button" onClick={() => router.push(`${basePath}/${user.role}/notifications`)}><Bell size={19} />{unread > 0 && <i>{unread}</i>}</button><div className="top-avatar">{initials(user.name)}</div></div></header>{user.status === "pending" && <div className="account-status-banner"><Clock3 size={16} /><span>Your account is awaiting administrator verification. Some features may remain limited until approval.</span></div>}<main className="content">{children}</main></div>
  </div>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action}</div>;
}

function AdminPage({ section }: { section: string }) {
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState("");
  if (section === "dashboard") return <><PageHeading title="Dashboard Overview" description="A quick look at your learning platform." /><div className="stats-grid four"><StatCard label="Total Users" value="5" icon="users" /><StatCard label="Departments" value="3" icon="departments" /><StatCard label="Courses" value="5" icon="courses" /><StatCard label="Assignments" value="6" icon="assignments" /></div><div className="two-col"><Card><div className="card-title-row"><h2>Platform activity</h2><Badge tone="green">Live</Badge></div><div className="activity-list"><ActivityItem icon="users" title="New student profile created" meta="Alice Johnson joined Computer Science" time="2h ago" /><ActivityItem icon="assignments" title="Assignment published" meta="Binary Search Tree Implementation · CS201" time="Yesterday" /><ActivityItem icon="check" title="Submission graded" meta="Graph Theory Problem Set · 95/100" time="2 days ago" /></div></Card><Card><div className="card-title-row"><h2>Quick links</h2></div><div className="quick-links"><button onClick={() => setAdded("Open Users from the sidebar")}> <Users size={19} /> Manage users <span>→</span></button><button onClick={() => setAdded("Open Assignments from the sidebar")}><FileText size={19} /> Review assignments <span>→</span></button><button onClick={() => setAdded("Open Activity from the sidebar")}><Activity size={19} /> View activity <span>→</span></button></div>{added && <p className="toast-message">{added}</p>}</Card></div></>;
   if (section === "users") return <AdminTable title="Users" description="Manage everyone with access to XcelLearn." search={query} setSearch={setQuery} headers={["Name", "Username", "Role", "Department", "Status"]} rows={allPreviewUsers().filter((u) => `${u.name} ${u.username}`.toLowerCase().includes(query.toLowerCase())).map((u) => [<span className="inline-person">{u.name}{u.role === "lecturer" && u.verified && <VerifiedBadge />}</span>, u.username, <Badge key="r" tone={u.role === "admin" ? "orange" : "blue"}>{u.role}</Badge>, u.department ?? "—", u.status === "pending" ? <Badge key="s" tone="orange">Pending verification</Badge> : <Badge key="s" tone="green">Verified</Badge>])} action={<Button onClick={() => setAdded("Invite user flow ready for connection.")}><Plus size={16} /> Add user</Button>} notice={added} />;
   if (section === "courses") return <AdminTable title="Courses" description="All courses across your faculties and departments." search={query} setSearch={setQuery} headers={["Code", "Name", "Department", "Lecturer", "Students"]} rows={courseRows.map((r) => [r[0], <strong key="name">{r[1]}</strong>, r[2], <span className="inline-person">{r[3]} <VerifiedBadge /></span>, r[4]])} action={<Button onClick={() => setAdded("Course creation flow ready for connection.")}><Plus size={16} /> Add course</Button>} notice={added} />;
  if (section === "assignments") return <AdminTable title="Assignments" description="Monitor posted work and deadlines." headers={["Title", "Course", "Type", "Due date", "Status"]} rows={assignments.map((a) => [<strong key="title">{a.title}</strong>, `${a.code} · ${a.course}`, <Badge key="type" tone={a.type === "quiz" ? "orange" : "blue"}>{a.type}</Badge>, a.deadline, <Badge key="status" tone="green">Published</Badge>])} />;
  if (section === "departments" || section === "faculties") {
    const isDept = section === "departments";
    const rows = isDept ? [["Computer Science", "Engineering", "12 courses"], ["Mechanical Engineering", "Engineering", "8 courses"], ["Business Administration", "Commerce", "6 courses"]] : [["Engineering", "3 departments", "18 courses"], ["Commerce", "2 departments", "11 courses"], ["Natural Sciences", "4 departments", "16 courses"]];
    return <AdminTable title={isDept ? "Departments" : "Faculties"} description={isDept ? "Organize courses and users by department." : "Top-level academic faculties."} headers={isDept ? ["Name", "Faculty", "Courses"] : ["Name", "Departments", "Courses"]} rows={rows.map((r) => [<strong key="r">{r[0]}</strong>, r[1], r[2]])} action={<Button onClick={() => setAdded(`${isDept ? "Department" : "Faculty"} form opened.`)}><Plus size={16} /> Add {isDept ? "department" : "faculty"}</Button>} notice={added} />;
  }
   if (section === "notifications") return <AdminRequests />;
   if (section === "settings") return <AdminSettings />;
   return <AdminTable title="Activity" description="Recent actions across the platform." headers={["Event", "Details", "Time"]} rows={[["Assignment published", "Binary Search Tree Implementation", "Today, 9:42 AM"], ["New student added", "Alice Johnson · Computer Science", "Yesterday, 4:18 PM"], ["Submission graded", "Graph Theory Problem Set · 95/100", "Aug 7, 2026"]].map((r) => [<strong key="e">{r[0]}</strong>, r[1], r[2]])} />;
}

function AdminRequests() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<AccountRequest | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setRequests(getStoredRequests());
  }, []);

  const pending = requests.filter((request) => request.status === "pending");
  const updateRequests = (ids: string[], status: AccountStatus) => {
    const next = requests.map((request) => ids.includes(request.id) ? { ...request, status, verified: status === "approved" } : request);
    setRequests(next);
    saveRequests(next);
    setSelectedIds([]);
    setMessage(`${ids.length} account request${ids.length === 1 ? "" : "s"} ${status}.`);
  };

  return <><PageHeading title="Account requests" description="Review new student and lecturer registrations before granting full access." action={<div className="request-actions"><Button variant="outline" disabled={selectedIds.length === 0} onClick={() => updateRequests(selectedIds, "rejected")}>Reject selected</Button><Button disabled={selectedIds.length === 0} onClick={() => updateRequests(selectedIds, "approved")}><Check size={16} /> Approve selected</Button></div>} />{message && <div className="toast-message">{message}</div>}<Card className="request-summary"><div><strong>{pending.length}</strong><span>pending requests</span></div><div><strong>{requests.filter((request) => request.status === "approved").length}</strong><span>approved accounts</span></div><div><strong>{requests.filter((request) => request.role === "lecturer" && request.verified).length}</strong><span>verified lecturers</span></div></Card><Card className="table-card"><div className="table-tools"><span className="muted">Select requests to approve or reject together.</span><button className="text-button" onClick={() => setSelectedIds(selectedIds.length === pending.length ? [] : pending.map((request) => request.id))}>{selectedIds.length === pending.length && pending.length > 0 ? "Clear selection" : "Select all pending"}</button></div><div className="table-wrap"><table><thead><tr><th></th><th>Applicant</th><th>Role</th><th>Contact</th><th>Department</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td><input type="checkbox" checked={selectedIds.includes(request.id)} disabled={request.status !== "pending"} onChange={() => setSelectedIds((current) => current.includes(request.id) ? current.filter((id) => id !== request.id) : [...current, request.id])} /></td><td><button className="table-link" onClick={() => setSelected(request)}>{request.name}</button>{request.role === "lecturer" && request.verified && <VerifiedBadge />}</td><td><Badge tone={request.role === "lecturer" ? "blue" : "neutral"}>{request.role}</Badge></td><td>{request.email}</td><td>{request.department}</td><td>{request.createdAt}</td><td>{request.status === "pending" ? <Badge tone="orange">Pending</Badge> : request.status === "approved" ? <Badge tone="green">Approved</Badge> : <Badge tone="neutral">Rejected</Badge>}</td><td>{request.status === "pending" && <div className="row-actions"><button className="compact-action approve" onClick={() => updateRequests([request.id], "approved")} aria-label={`Approve ${request.name}`}><Check size={15} /></button><button className="compact-action reject" onClick={() => updateRequests([request.id], "rejected")} aria-label={`Reject ${request.name}`}><X size={15} /></button></div>}</td></tr>)}</tbody></table></div></Card>{selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button><Badge tone={selected.role === "lecturer" ? "blue" : "neutral"}>{selected.role}</Badge><h2>{selected.name}</h2><p className="muted">{selected.email}</p><div className="request-detail"><div><span>Username</span><strong>{selected.username}</strong></div><div><span>Department</span><strong>{selected.department}</strong></div><div><span>Submitted</span><strong>{selected.createdAt}</strong></div><div><span>Status</span><strong>{selected.status}</strong></div></div><p className="muted">Passwords are never displayed in the admin review view.</p>{selected.status === "pending" && <div className="modal-actions"><Button variant="outline" onClick={() => { updateRequests([selected.id], "rejected"); setSelected(null); }}>Reject</Button><Button onClick={() => { updateRequests([selected.id], "approved"); setSelected(null); }}><Check size={16} /> Approve account</Button></div>}</div></div>}</>;
}

function AdminSettings() {
  const [autoAccept, setAutoAccept] = useState(false);
  useEffect(() => {
    setAutoAccept(window.localStorage.getItem(AUTO_ACCEPT_KEY) === "true");
  }, []);
  const toggle = () => {
    const next = !autoAccept;
    setAutoAccept(next);
    window.localStorage.setItem(AUTO_ACCEPT_KEY, String(next));
  };
  return <><PageHeading title="Admin settings" description="Control how new accounts enter the platform." /><Card className="settings-card"><div className="setting-row"><div><h2>Automatically accept new accounts</h2><p className="muted">When enabled, new student and lecturer registrations are approved immediately in preview mode.</p></div><button type="button" className={`toggle ${autoAccept ? "on" : ""}`} onClick={toggle} aria-pressed={autoAccept}><span /></button></div><div className="settings-note"><ShieldCheck size={18} /><span>This preview setting will be replaced by a server-side Supabase approval policy. For production, keep manual verification on unless you have a trusted onboarding process.</span></div></Card></>;
}

function AdminTable({ title, description, headers, rows, search, setSearch, action, notice }: { title: string; description: string; headers: string[]; rows: React.ReactNode[][]; search?: string; setSearch?: (value: string) => void; action?: React.ReactNode; notice?: string }) {
  return <><PageHeading title={title} description={description} action={action} />{notice && <div className="toast-message">{notice}</div>}<Card className="table-card">{setSearch && <div className="table-tools"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}...`} /></div><span className="muted">{rows.length} records</span></div>}<div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></Card></>;
}

function ActivityItem({ icon, title, meta, time }: { icon: string; title: string; meta: string; time: string }) {
  return <div className="activity-item"><div className="activity-icon"><Icon name={icon} /></div><div><strong>{title}</strong><p>{meta}</p></div><time>{time}</time></div>;
}

function StudentDashboard({ user, basePath }: { user: User; basePath: string }) {
  return <><PageHeading eyebrow={`Good morning, ${user.name.split(" ")[0]}`} title="Your learning overview" description="Keep an eye on your progress and upcoming work." /><div className="stats-grid four"><StatCard label="Enrolled Courses" value={user.courses.length} icon="courses" /><StatCard label="Assignments Progress" value="2 / 3" icon="assignments" /><StatCard label="Quizzes Completed" value="1 / 2" icon="check" /><StatCard label="Upcoming Deadlines" value="3" icon="activity" accent /></div><div className="two-col"><Card><div className="card-title-row"><div><h2>Upcoming deadlines</h2><p className="muted">Stay ahead of your coursework.</p></div><Clock3 size={19} className="muted-icon" /></div><div className="deadline-list">{assignments.filter((a) => a.status?.startsWith("Not")).slice(0, 3).map((a) => <div className="deadline-row" key={a.id}><div className={`assignment-dot ${a.type}`}><FileText size={16} /></div><div><strong>{a.title}</strong><span>{a.code} · Due {a.deadline}</span></div><Badge tone={a.type === "quiz" ? "orange" : "blue"}>{a.type}</Badge></div>)}</div><Button variant="outline" className="full-width" onClick={() => location.assign(`${basePath}/student/assignments`)}>View all assignments</Button></Card><Card><div className="card-title-row"><div><h2>My courses</h2><p className="muted">Courses you are enrolled in.</p></div><BookOpen size={19} className="muted-icon" /></div><div className="course-list">{courseRows.slice(0, 3).map((c) => <div className="course-row" key={c[0]}><div className="course-code">{c[0]}</div><div><strong>{c[1]}</strong><span>{c[3]}</span></div><span className="course-arrow">→</span></div>)}</div></Card></div></>;
}

function LecturerDashboard({ user, basePath }: { user: User; basePath: string }) {
  return <><PageHeading eyebrow={`Welcome, ${user.name.split(" ")[1] ?? "Lecturer"}`} title="Lecturer overview" description="Everything you need to support your students." action={user.verified ? <VerifiedBadge /> : undefined} /><div className="stats-grid three"><StatCard label="Courses Taught" value="3" icon="courses" /><StatCard label="Assignments Posted" value="4" icon="assignments" /><StatCard label="Pending Submissions" value="2" icon="check" accent /></div><div className="two-col"><Card><div className="card-title-row"><h2>Recent submissions</h2><Badge tone="orange">2 to review</Badge></div><div className="activity-list"><ActivityItem icon="check" title="Alice Johnson submitted an assignment" meta="Binary Search Tree Implementation · CS201" time="Today" /><ActivityItem icon="check" title="Alice Johnson submitted an assignment" meta="Dynamic Programming Problem Set · CS202" time="Yesterday" /></div><Button variant="outline" className="full-width" onClick={() => location.assign(`${basePath}/lecturer/submissions`)}>Review submissions</Button></Card><Card><div className="card-title-row"><h2>Your courses</h2></div><div className="course-list">{courseRows.slice(0, 3).map((c) => <div className="course-row" key={c[0]}><div className="course-code">{c[0]}</div><div><strong>{c[1]}</strong><span>24 enrolled students · <VerifiedBadge /></span></div></div>)}</div></Card></div></>;
}

function AssignmentsPage({ role, user }: { role: Role; user: User }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [message, setMessage] = useState("");
  const verified = user.status !== "pending";
  const visible = assignments.filter((a) => filter === "All" || a.type === filter.toLowerCase() || a.status?.startsWith(filter));
  return <><PageHeading title={role === "student" ? "Assignments" : "Assignments"} description={role === "student" ? "View and complete your coursework." : "Create and manage assignments for your courses."} action={role === "lecturer" ? <Button disabled={!verified} onClick={() => setMessage("New assignment form opened.")}><Plus size={16} /> {verified ? "New assignment" : "Available after verification"}</Button> : undefined} />{!verified && <div className="notice-banner"><ShieldCheck size={16} /><span>Your account can explore assignments, but submissions and lecturer publishing are available after verification.</span></div>}{message && <div className="toast-message">{message}</div>}<div className="filter-row">{["All", ...(role === "student" ? ["Not submitted", "Submitted", "quiz"] : ["assignment", "quiz"])].map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "active" : ""}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div><div className="assignment-grid">{visible.map((a) => <Card key={a.id} className="assignment-card"><div className="assignment-top"><Badge tone={a.type === "quiz" ? "orange" : "blue"}>{a.type}</Badge><span className="muted">{a.code}</span></div><h2>{a.title}</h2><p>{a.description}</p><div className="assignment-meta"><span><Clock3 size={15} /> Due {a.deadline}</span><span><BookOpen size={15} /> {a.course}</span></div><div className="assignment-actions">{role === "student" ? <Button disabled={!verified} onClick={() => { setSelected(a); setMessage(""); }}>{verified ? (a.type === "quiz" ? "Take quiz" : a.status === "Submitted" ? "View submission" : "Open assignment") : "Available after verification"}</Button> : <Button variant="outline" onClick={() => setSelected(a)}>View details</Button>}{a.status && role === "student" && <Badge tone={a.status === "Submitted" || a.status.startsWith("Graded") ? "green" : "neutral"}>{a.status}</Badge>}</div></Card>)}</div>{selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button><Badge tone={selected.type === "quiz" ? "orange" : "blue"}>{selected.type}</Badge><h2>{selected.title}</h2><p className="muted">{selected.code} · {selected.course} · Due {selected.deadline}</p><div className="modal-copy"><p>{selected.description}</p>{selected.type === "quiz" ? <div className="quiz-question"><strong>Question 1 of 5</strong><p>Which traversal visits a binary search tree in sorted order?</p><label><input type="radio" name="answer" /> Pre-order</label><label><input type="radio" name="answer" /> In-order</label><label><input type="radio" name="answer" /> Post-order</label></div> : <textarea placeholder="Add a note or paste your submission link..." rows={5} />}</div><Button onClick={() => { setMessage(selected.type === "quiz" ? "Quiz saved. Your result will appear here." : "Submission saved successfully."); setSelected(null); }}>{selected.type === "quiz" ? "Submit quiz" : "Save submission"}</Button></div></div>}</>;
}

function Notifications() {
  const [items, setItems] = useState(notificationsSeed);
  return <><PageHeading title="Notifications" description="Updates and activity that need your attention." action={items.some((n) => !n.read) ? <Button variant="outline" onClick={() => setItems(items.map((n) => ({ ...n, read: true })))}><Check size={16} /> Mark all as read</Button> : undefined} /><div className="notification-list">{items.map((item) => <Card className={`notification ${!item.read ? "unread" : ""}`} key={item.id}><div className={`notification-icon ${item.kind}`}><Icon name={item.kind === "comment" ? "activity" : item.kind === "grade" ? "check" : "activity"} /></div><div className="notification-copy"><strong>{item.message}</strong><span>{item.age}</span></div>{!item.read && <Button variant="ghost" onClick={() => setItems(items.map((n) => n.id === item.id ? { ...n, read: true } : n))}>Mark read</Button>}</Card>)}</div></>;
}

function Profile({ user }: { user: User }) {
  const [saved, setSaved] = useState(false);
  return <><PageHeading title="Profile" description="Keep your personal information up to date." /><div className="profile-layout"><Card><div className="profile-hero"><div className="profile-avatar">{initials(user.name)}</div><div><h2>{user.name} {user.role === "lecturer" && user.verified && <VerifiedBadge />}</h2><p>{user.role} · {user.department ?? "Platform administrator"}</p></div></div><div className="profile-fields"><label>Full name<input defaultValue={user.name} /></label><label>Username<input defaultValue={user.username} /></label><label>Email address<input placeholder="Add your email address" type="email" /> </label>{user.department && <label>Department<input defaultValue={user.department} /></label>}</div><Button onClick={() => setSaved(true)}>Save changes</Button>{saved && <span className="saved-note">Profile saved successfully.</span>}</Card><Card><h2>Account security</h2><p className="muted">Account security settings will be managed by your configured identity provider.</p><div className="security-row"><ShieldCheck size={22} /><div><strong>Protected account</strong><span>Authentication settings are ready for Supabase integration.</span></div></div></Card></div></>;
}

function Library() {
  const [query, setQuery] = useState("");
  const resources = [["Lecture 1: Introduction to Data Structures", "PDF", "CS201", "Aug 05, 2026"], ["Sorting Algorithms Explained", "Video", "CS201", "Aug 03, 2026"], ["Dynamic Programming Lecture Notes", "Notes", "CS202", "Jul 28, 2026"], ["Discrete Mathematics Reading Pack", "PDF", "MATH201", "Jul 22, 2026"]];
  return <><PageHeading title="Library" description="Course resources shared by your lecturers." /><div className="search-box large"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources..." /></div><Card className="resource-card"><div className="resource-list">{resources.filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase())).map((r) => <div className="resource-row" key={r[0]}><div className={`resource-icon ${String(r[1]).toLowerCase()}`}>{r[1] === "Video" ? "▶" : r[1] === "Notes" ? "≡" : "PDF"}</div><div><strong>{r[0]}</strong><span>{r[2]} · Added {r[3]}</span></div><Button variant="outline">Open</Button></div>)}</div></Card></>;
}

export default function Page() {
  const pathname = usePathname();
  const router = useRouter();
  const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");
  const basePath = isDemo ? "/demo" : "";
  const loginPath = `${basePath}/login`;
  const storageKey = isDemo ? "xcellearn_demo_user" : "xcellearn_live_user";
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (isDemo) {
      setUser(getStoredUser(storageKey));
      return;
    }
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ? authUserToAppUser(data.user) : null);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ? authUserToAppUser(session.user) : null);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [isDemo, storageKey]);
  useEffect(() => {
    if (user && (pathname === "/" || pathname === "/login" || pathname === "/demo" || pathname === "/demo/login")) router.replace(`${basePath}/${user.role}/dashboard`);
    if (!user && pathname !== loginPath) router.replace(loginPath);
  }, [user, pathname, router, basePath, loginPath]);
  if (!user) return <Login demoMode={isDemo} onLogin={(nextUser) => { if (isDemo) window.localStorage.setItem(storageKey, nextUser.id); setUser(nextUser); router.push(`${basePath}/${nextUser.role}/dashboard`); }} />;
  const parts = pathname.split("/").filter(Boolean);
  const routeParts = isDemo ? parts.slice(1) : parts;
  const role = (routeParts[0] as Role) || user.role;
  const section = routeParts[1] || "dashboard";
  let page: React.ReactNode;
  if (role === "admin") page = <AdminPage section={section} />;
  else if (section === "dashboard") page = role === "student" ? <StudentDashboard user={user} basePath={basePath} /> : <LecturerDashboard user={user} basePath={basePath} />;
  else if (section === "assignments") page = <AssignmentsPage role={role} user={user} />;
  else if (section === "notifications") page = <Notifications />;
  else if (section === "profile") page = <Profile user={user} />;
  else if (section === "library") page = <Library />;
  else if (section === "submissions") page = <AssignmentsPage role="lecturer" user={user} />;
  else page = <PageHeading title="Page not found" description="This XcelLearn page does not exist." />;
  return <Shell user={user} basePath={basePath} onLogout={async () => { if (isDemo) window.localStorage.removeItem(storageKey); else await supabase?.auth.signOut(); setUser(null); router.push(loginPath); }}>{page}</Shell>;
}