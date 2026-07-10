import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_NUMBER = "593990312477"; // +593 990312477
export const STORE_NAME = "Alemoon";

export function whatsappUrl(productName: string, price?: number | null) {
  const priceTxt = price != null ? ` (precio: $${Number(price).toFixed(2)})` : "";
  const msg = `Hola Alemoon 🌿, me interesa el producto: "${productName}"${priceTxt}. ¿Está disponible?`;
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

/**
 * Upload an image to the "productos" storage bucket and return a long-lived
 * signed URL that the public catalog can display without additional auth.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("productos")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (upErr) throw upErr;
  // 10 years — effectively permanent for a private bucket.
  const { data, error } = await supabase.storage
    .from("productos")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (error || !data) throw error ?? new Error("No se pudo crear URL");
  return data.signedUrl;
}