import { NextRequest, NextResponse } from "next/server";
import { looksLikeApiToken } from "@/lib/finance/tokens";
import { resolveApiToken, touchApiToken } from "@/lib/queries/finance-tokens";
import { ingestAlert } from "@/lib/finance/ingest";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/finance/ingest — the hub's first machine endpoint. An iOS Shortcut
// (or a future feed) POSTs a raw card-alert; a bearer token resolves the group
// + the account it lands in. Always 200 on any accepted body so Shortcuts never
// surfaces an error to the user; only auth/shape failures are non-200.
//
// proxy.ts allowlists /api/finance/* — WITHOUT that, this POST 307s to /login
// and Shortcuts (which follows redirects) silently posts the alert into the
// login page. That one line is load-bearing.
// ─────────────────────────────────────────────────────────────────────────────

function bearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

export async function POST(req: NextRequest) {
  const token = bearer(req);
  if (!looksLikeApiToken(token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const auth = await resolveApiToken(token, "ingest");
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  // Body: text/plain is easiest from Shortcuts; JSON {text} also accepted.
  let text = "";
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    try {
      const body = (await req.json()) as { text?: unknown };
      text = typeof body.text === "string" ? body.text : "";
    } catch {
      text = "";
    }
  } else {
    text = await req.text();
  }

  const result = await ingestAlert(auth.groupId, text, auth.accountId);
  void touchApiToken(auth.id);

  if (!result.ok) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json(result);
}
