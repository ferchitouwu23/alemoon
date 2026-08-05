import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export const WHATSAPP_NUMBER = "593960219620";
export const STORE_NAME = "Alemoon";

export function prefilledWhatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function whatsappUrl(productName: string, price?: number | null, productUrl?: string | null) {
  const productTxt = productUrl ? ` Producto: ${productUrl}.` : "";
  const priceTxt = price != null ? ` Precio: $${Number(price).toFixed(2)}.` : "";
  const msg = `Hola Alemoon, me interesa: ${productName}.${productTxt}${priceTxt} ¿Está disponible?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function getProductDetailUrl(productId: string) {
  const path = `/producto/${productId}`;
  const siteUrl =
    import.meta.env.VITE_SITE_URL ||
    process.env.SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!siteUrl) return path;

  try {
    return new URL(path, siteUrl).toString();
  } catch {
    return path;
  }
}

export function formatPrice(n: number | string | null | undefined) {
  if (n == null || n === "") return "$0.00";
  return `$${Number(n).toFixed(2)}`;
}

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precio_oferta: number | null;
  en_oferta: boolean;
  agotado: boolean;
  imagen_url: string;
  categoria_id: string | null;
  visible: boolean;
  fecha_creacion: string;
};

export type Categoria = { id: string; nombre: string };
export type Promocion = {
  id: string;
  imagen_url: string;
  titulo: string | null;
  orden: number;
  activo: boolean;
  fecha_creacion: string;
};

export type ComboDestacado = {
  id: string;
  imagen_url: string;
  etiqueta: string | null;
  titulo: string;
  descripcion: string | null;
  mensaje_whatsapp: string;
  orden: number;
  activo: boolean;
  fecha_creacion: string;
};

export async function uploadProductImage(file: File, categoryName: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const categoryFolder = sanitizeStorageSegment(categoryName || "sin-categoria");
  const fileName = `${uuidv4()}.${ext}`;
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

export async function uploadPromotionImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${uuidv4()}.${ext}`;
  const path = `promociones/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("productos")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("productos").getPublicUrl(path);

  return publicUrl;
}

export async function uploadFeaturedComboImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${uuidv4()}.${ext}`;
  const path = `combos-destacados/${fileName}`;

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
