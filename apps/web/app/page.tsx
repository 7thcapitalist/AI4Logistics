/**
 * Day 3 in SETUP.md: one trivial page, in production, reading one row from Turso.
 * No features. The point is to prove the whole pipe works while it is still easy
 * to debug.
 *
 * Replace this with the trip dashboard once the pipe is proven.
 */
import { forOrg, schema } from "@ai4l/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Hardcoded until auth exists (ADR 0005, not written: phone-first, not email).
  // Note that even this throwaway page goes through forOrg. There is no other way in.
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
