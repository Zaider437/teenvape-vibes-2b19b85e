function buildImageUrl(p: {
  image_url?: string | null;
  image?: string | null;
  id?: string;
  name?: string;
  slug?: string;
  category?: string | null;
}): string | null {
  if (p.image_url) return p.image_url;

  if (p.id) {
    const id = p.id;
    const lowerId = id.toLowerCase();

    const localDeviceMapping: Record<string, string> = {
      d1: "default-device.png",
      d2: "product-01.png",
      d3: "product-02.png",
      d4: "product-03.png",
    };
    if (localDeviceMapping[id]) {
      return `/assets/images/${localDeviceMapping[id]}`;
    }

    const name = p.name || "";
    if (p.category === "device") {
      const brandName = name.split(" ")[0];
      const safeName = brandName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-device.png";
      return `/assets/images/${safeName}`;
    }
  }

  return null;
}

export { buildImageUrl };
