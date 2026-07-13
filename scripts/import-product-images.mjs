import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SOURCE_ROOT =
  process.argv[2] || "C:\\Users\\USER\\OneDrive\\Desktop\\sitio Alemoon front\\imagenes";
const BUCKET = "productos";
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
const CATEGORY_NAMES = ["anillos", "aretes", "cadenas", "combos", "pulseras"];

loadEnvFile();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Define esas variables antes de ejecutar el script.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const summary = Object.fromEntries(
  CATEGORY_NAMES.map((category) => [
    category,
    { found: 0, uploaded: 0, inserted: 0, skipped: 0, errors: 0 },
  ]),
);

const errors = [];

try {
  await ensureSourceRootExists(SOURCE_ROOT);
  const categoryMap = await getOrCreateCategories(CATEGORY_NAMES);

  for (const categoryName of CATEGORY_NAMES) {
    const categoryDir = path.join(SOURCE_ROOT, categoryName);
    const stat = await safeStat(categoryDir);

    if (!stat?.isDirectory()) {
      continue;
    }

    const files = await fs.readdir(categoryDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile()) continue;

      const extension = path.extname(file.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(extension)) continue;

      summary[categoryName].found += 1;

      const localPath = path.join(categoryDir, file.name);
      const storagePath = `${categoryName}/${sanitizeFileName(file.name)}`;
      const productName = formatProductName(path.parse(file.name).name);

      try {
        const fileBuffer = await fs.readFile(localPath);

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, fileBuffer, {
            upsert: true,
            contentType: getContentType(extension),
          });

        if (uploadError) {
          throw new Error(`Error al subir "${file.name}": ${uploadError.message}`);
        }

        summary[categoryName].uploaded += 1;

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

        const { data: existingProduct, error: existingError } = await supabase
          .from("productos")
          .select("id")
          .eq("imagen_url", publicUrl)
          .maybeSingle();

        if (existingError) {
          throw new Error(
            `Error al verificar producto existente para "${file.name}": ${existingError.message}`,
          );
        }

        if (existingProduct) {
          summary[categoryName].skipped += 1;
          continue;
        }

        const { error: insertError } = await supabase.from("productos").insert({
          nombre: productName,
          categoria_id: categoryMap.get(categoryName) ?? null,
          imagen_url: publicUrl,
          precio: 0,
          en_oferta: false,
          visible: true,
        });

        if (insertError) {
          throw new Error(`Error al insertar "${file.name}": ${insertError.message}`);
        }

        summary[categoryName].inserted += 1;
      } catch (error) {
        summary[categoryName].errors += 1;
        errors.push({
          category: categoryName,
          file: file.name,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  printSummary();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function loadEnvFile() {
  const envPath = path.resolve(".env");

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
    // If there is no .env file, the script can still run with process env variables.
  }
}

async function ensureSourceRootExists(dir) {
  const stat = await safeStat(dir);
  if (!stat?.isDirectory()) {
    throw new Error(`La carpeta de origen no existe o no es valida: ${dir}`);
  }
}

async function safeStat(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

async function getOrCreateCategories(categoryNames) {
  const { data: existingCategories, error } = await supabase
    .from("categorias")
    .select("id, nombre")
    .in("nombre", categoryNames);

  if (error) {
    throw new Error(`No se pudieron consultar las categorias: ${error.message}`);
  }

  const categoryMap = new Map(
    (existingCategories ?? []).map((category) => [category.nombre.toLowerCase(), category.id]),
  );

  for (const categoryName of categoryNames) {
    if (categoryMap.has(categoryName)) continue;

    const { data: insertedCategory, error: insertError } = await supabase
      .from("categorias")
      .insert({ nombre: categoryName })
      .select("id, nombre")
      .single();

    if (insertError) {
      throw new Error(`No se pudo crear la categoria "${categoryName}": ${insertError.message}`);
    }

    categoryMap.set(insertedCategory.nombre.toLowerCase(), insertedCategory.id);
  }

  return categoryMap;
}

function sanitizeFileName(fileName) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function formatProductName(fileNameWithoutExtension) {
  const normalized = fileNameWithoutExtension.replace(/[-_]+/g, " ").trim();
  if (!normalized) return "Producto sin nombre";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getContentType(extension) {
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function printSummary() {
  console.log("\nResumen de importacion:\n");

  for (const categoryName of CATEGORY_NAMES) {
    const stats = summary[categoryName];
    console.log(
      `${categoryName}: encontradas=${stats.found}, subidas=${stats.uploaded}, insertadas=${stats.inserted}, omitidas=${stats.skipped}, errores=${stats.errors}`,
    );
  }

  if (errors.length > 0) {
    console.log("\nErrores:");
    for (const error of errors) {
      console.log(`- [${error.category}] ${error.file}: ${error.message}`);
    }
  } else {
    console.log("\nSin errores.");
  }
}
