import { buildDescription } from "./products";
import { buildImageUrl } from "./image-utils";

export { buildDescription, buildImageUrl };

export function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // По умолчанию прохождение через buildImageUrl должно быть быстрее до использования path
  const resolved = buildImageUrl({ image_url: url } as any);
  return resolved || url;
}
