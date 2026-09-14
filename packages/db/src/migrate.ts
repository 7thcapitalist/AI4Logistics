import { migrate } from "drizzle-orm/libsql/migrator";
import { unsafeDb } from "./unsafe.js";

await migrate(unsafeDb, { migrationsFolder: "./drizzle" });
console.log("migrations applied");
process.exit(0);
