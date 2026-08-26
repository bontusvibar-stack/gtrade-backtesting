import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}
const dir = dirname(fileURLToPath(import.meta.url));

const files = ["001_init.sql", "002_rls.sql"];

for (const f of files) {
  const sql = readFileSync(join(dir, "..", "supabase", "migrations", f), "utf8");
  const res = await fetch(url + "/sql?query=" + encodeURIComponent(sql), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: "Bearer " + key,
      "X-Client-Info": "gtrade-migrate",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("FAILED " + f + ":", res.status, text);
    process.exit(1);
  }
  console.log("OK " + f);
}
console.log("Migrations applied.");
