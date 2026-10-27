/**
 * Reduce una foto antes de subirla (solo en el navegador): lado máximo 1600 px y JPEG de buena calidad.
 * Así las fotos del celular (varios MB) caben en el límite de 5 MB y cargan rápido en la tienda.
 * Si algo falla, devuelve el archivo original.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.86): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // los PNG con transparencia quedan sobre fondo blanco
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file.size <= 5 * 1024 * 1024 ? file : blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
