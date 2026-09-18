/**
 * The scaffold's old `/` page, preserved as a route of its own.
 *
 * It was replaced at `/` by the redirect to /viagens, but what it actually did is
 * still worth keeping and is not duplicated anywhere else: it is the end-to-end
 * proof that the pipe works — Vercel to Turso to a real row — and it is the only
 * page that exercises `forOrg`, which is the tenant-isolation guardrail from
 * ADR 0002. Deleting it would have removed the environment check along with the
 * placeholder. Everything else on this page is the original, verbatim.
 *
 * Note that even this throwaway page goes through forOrg. There is no other way in.
 */
import { forOrg, schema } from "@ai4l/db";

export const dynamic = "force-dynamic";

export default async function Saude() {
  // Hardcoded until auth exists (ADR 0005, not written: phone-first, not email).
  const db = forOrg(1);
  const trips = await db.findMany(schema.trips);

  return (
    <main style={{ fontFamily: "system-ui", padding: 32 }}>
      <h1>AI4Logistics</h1>
      <p>{trips.length} trip(s) for organisation 1.</p>
      <p style={{ color: "#666", maxWidth: 480 }}>
        If you can see another carrier&apos;s trips here, stop and read ADR 0002.
      </p>
    </main>
  );
}
