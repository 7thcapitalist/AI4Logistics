/**
 * Seeds TWO organisations, deliberately. See ADR 0002.
 *
 * A tenant leak should be obvious on the first page load in development, not
 * discovered in production. If you ever see Transportes Bandeirante's trips while
 * signed in as Rodoviario Goias, the isolation guarantee is broken and that is a
 * stop-everything bug.
 */
import { forOrg } from "./tenant.js";
import { unsafeDb } from "./unsafe.js";
import * as schema from "./schema.js";

const [orgA] = await unsafeDb
  .insert(schema.organizations)
  .values({ name: "Rodoviario Goias LTDA", cnpj: "11222333000181", antNumber: "12345678" })
  .returning();

const [orgB] = await unsafeDb
  .insert(schema.organizations)
  .values({ name: "Transportes Bandeirante ME", cnpj: "44555666000199", antNumber: "87654321" })
  .returning();

if (!orgA || !orgB) throw new Error("seed failed to create organisations");

for (const [org, plate, driverName, cpf] of [
  [orgA, "RGO1A23", "Joao da Silva", "11111111111"],
  [orgB, "BND4B56", "Marcos Pereira", "22222222222"],
] as const) {
  const db = forOrg(org.id);

  const [vehicle] = await db.insert(schema.vehicles, { plate, renavam: "00000000000" });
  const [driver] = await db.insert(schema.drivers, {
    name: driverName, cpf, phone: "5562900000000", isAutonomous: true, rntrc: "0000000",
  });
  await db.insert(schema.users, {
    phone: "5562911111111", name: `Dono ${org.name}`, role: "owner",
  });

  if (!vehicle || !driver) throw new Error("seed failed to create fleet");

  const [trip] = await db.insert(schema.trips, {
    vehicleId: vehicle.id,
    driverId: driver.id,
    status: "in_transit",
    originCity: "Goiania", originUf: "GO",
    destCity: "Sao Paulo", destUf: "SP",
    cargoDescription: "Graos ensacados",
    cargoWeightKg: 28000,
    freightCents: 850000, // R$ 8.500,00
    departedAt: Date.now() - 1000 * 60 * 60 * 30, // 30h ago: past the guessed window
  });

  if (!trip) throw new Error("seed failed to create trip");

  await db.insertMany(schema.tripCosts, [
    { tripId: trip.id, kind: "fuel", amountCents: 180000 },
    { tripId: trip.id, kind: "toll", amountCents: 24500 },
    { tripId: trip.id, kind: "advance", amountCents: 100000 },
  ]);

  // An authorized MDF-e with closedAt null and a departure 30h ago is exactly
  // what the alert job should find.
  await db.insert(schema.documents, {
    tripId: trip.id,
    kind: "mdfe",
    status: "authorized",
    idempotencyKey: `${org.id}:${trip.id}:mdfe:1`,
    authorizedAt: Date.now() - 1000 * 60 * 60 * 29,
  });
}

console.log("seeded two organisations, each with an overdue MDF-e");
process.exit(0);
