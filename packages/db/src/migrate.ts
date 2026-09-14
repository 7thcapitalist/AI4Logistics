// MUST be first: loads .env.local before anything reads process.env
import "./env";
import { migrate } from "drizzle-orm/libsql/migrator";
import { unsafeDb } from "./unsafe";

await migrate(unsafeDb(), { migrationsFolder: "./drizzle" });
console.log("migrations applied");
process.exit(0);
