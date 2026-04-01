import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const APP_VERSION = "1.0.0";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo) {
    return NextResponse.json({ current: APP_VERSION, latest: null, hasUpdate: false, checkedAt: new Date().toISOString() });
  }

  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers, next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("GitHub API error");

    const data = await res.json();
    const latest = data.tag_name?.replace(/^v/, "") ?? APP_VERSION;
    const hasUpdate = latest !== APP_VERSION;

    return NextResponse.json({
      current: APP_VERSION,
      latest,
      hasUpdate,
      changelog: data.body ?? null,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ current: APP_VERSION, latest: null, hasUpdate: false, checkedAt: new Date().toISOString() });
  }
}

export async function PATCH() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.systemSettings.upsert({
    where: { key: "app_version" },
    create: { key: "app_version", value: APP_VERSION },
    update: { value: APP_VERSION },
  });

  return NextResponse.json({ ok: true });
}
