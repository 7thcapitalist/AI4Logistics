/**
 * The alert that justifies the subscription.
 *
 * This is the cross-tenant query ADR 0002 was decided for: every authorized MDF-e,
 * across all carriers, past its window and not closed. One indexed query here;
 * with database-per-carrier it would be a fan-out that degrades with every customer
 * won.
 *
 * THRESHOLD WARNING: MDFE_CLOSURE_ALERT_HOURS defaults to 24 and that number is a
 * guess. See docs/domain/glossary.md. Source it before the first pilot.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const hours = Number(process.env.MDFE_CLOSURE_ALERT_HOURS ?? 24);

  // TODO: implement against the real schema once day 3 is proven.
  //   1. unscoped read of open MDF-e across carriers (the one sanctioned exception,
  //      which belongs in packages/db as a named, reviewed query, NOT an ad-hoc
  //      import of unsafe.ts here)
  //   2. group by org, load each carrier's owner phone via forOrg
  //   3. send via @ai4l/notifications
  //   4. append an "alert_sent" row to document_events for every send
  return NextResponse.json({ ok: true, thresholdHours: hours, alerted: 0 });
}
