import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_NUMBER = "593990312477";
export const STORE_NAME = "Alemoon";

export function whatsappUrl(productName: string, price?: number | null) {
  const priceTxt = price != null ? ` (precio: $${Number(price).toFixed(2)})` : "";
  const msg = `Hola Alemoon, me interesa el producto: "${productName}"${priceTxt}. ¿Está disponible?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function formatPrice(n: number | string | null | undefined) {
  if (n == null || n === "") return "$0.00";
  return `$${Number(n).toFixed(2)}`;
}

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_oferta: number | null;
  en_oferta: boolean;
  imagen_url: string;
  categoria_id: string | null;
  visible: boolean;
  fecha_creacion: string;
};

export type Categoria = { id: string; nombre: string };

export async function uploadProductImage(file: File, categoryName: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const categoryFolder = sanitizeStorageSegment(categoryName || "sin-categoria");
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${categoryFolder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("productos")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("productos").getPublicUrl(path);

  return publicUrl;
}

function sanitizeStorageSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
