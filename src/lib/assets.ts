import { buildDescription } from "./product-helpers";
import { buildImageUrl } from "./image-utils";

export { buildDescription, buildImageUrl };

export function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const resolved = buildImageUrl({ image_url: url } as any);
  return resolved || url;
}
