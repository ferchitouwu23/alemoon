import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");

loadEnvFile();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env de la raiz del proyecto.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

try {
  console.log(
    `Debug service role key prefix: ${serviceRoleKey.slice(0, 15)}...`,
  );
  const { data, error } = await supabase.from("categorias").select("id, nombre").order("nombre");

  if (error) {
    throw new Error(error.message);
  }

  console.log("Conexion a Supabase exitosa.");

  if (!data || data.length === 0) {
    console.log("No existen categorias en la tabla categorias.");
    process.exit(0);
  }

  console.log("Categorias encontradas:");
  for (const categoria of data) {
    console.log(`- ${categoria.nombre} (${categoria.id})`);
  }
} catch (error) {
  console.error(
    `No se pudo consultar la tabla categorias: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}

function loadEnvFile() {
  const envPath = path.join(PROJECT_ROOT, ".env");

  try {
    const envContents = readFileSync(envPath, "utf8");
    for (const line of envContents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "");

      if (!(key in process.env)) {
        process.env[key] = normalizedValue;
      }
    }
  } catch {
    // Si no existe .env, el script todavia puede usar variables del entorno del proceso.
  }
}
