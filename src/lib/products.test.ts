import { describe, it, expect } from "vitest";
import { buildDescription, formatImageUrl } from "./product-helpers";

describe("buildDescription", () => {
  it("returns existing description if provided", () => {
    expect(buildDescription({ description: "  Existing desc  ", brand: "X" })).toBe(
      "Existing desc",
    );
  });

  it("builds disposable description with defaults when fields missing", () => {
    const desc = buildDescription({ category: "disposable", brand: "Elf Bar" });
    expect(desc).toContain("Одноразовая POD-система Elf Bar.");
    expect(desc).toContain("Объём жидкости: 12–18 мл");
    expect(desc).toContain("Ёмкость аккумулятора: 500–650 mAh");
    expect(desc).toContain("Сетчатый испаритель");
  });

  it("builds disposable description with optional fields", () => {
    const desc = buildDescription({
      category: "disposable",
      brand: "Lost Mary",
      flavor: "Клубника Киви",
      puffs: "5000 затяжек",
      volume: "15 мл",
    });
    expect(desc).toContain("Одноразовая POD-система Lost Mary.");
    expect(desc).toContain("Вкус: Клубника Киви");
    expect(desc).toContain("5000 затяжек");
    expect(desc).toContain("Объём жидкости: 15 мл");
  });

  it("builds liquid description with defaults when fields missing", () => {
    const desc = buildDescription({ category: "liquid", brand: "Husky" });
    expect(desc).toContain("Жидкость для POD-систем Husky.");
    expect(desc).toContain("Объём: 30 мл · крепость 20 мг");
    expect(desc).toContain("Соотношение PG/VG: 50/50");
    expect(desc).toContain("Подходит для маломощных POD-устройств");
  });

  it("builds liquid description with optional fields", () => {
    const desc = buildDescription({
      category: "liquid",
      brand: "Rell",
      flavor: "Арбуз",
      volume: "30 мл / 20 мг",
    });
    expect(desc).toContain("Жидкость для POD-систем Rell.");
    expect(desc).toContain("Вкус: Арбуз");
    expect(desc).toContain("Объём / крепость: 30 мл / 20 мг");
  });

  it("builds device description with defaults when fields missing", () => {
    const desc = buildDescription({ category: "device", brand: "SMOK" });
    expect(desc).toContain("POD-устройство SMOK.");
    expect(desc).toContain("Ёмкость аккумулятора: до 1000–2000 mAh");
    expect(desc).toContain("Объём картриджа: 2–4 мл");
    expect(desc).toContain("Регулировка затяжки и мощности");
  });

  it("builds device description with flavor as color", () => {
    const desc = buildDescription({ category: "device", brand: "XROS", flavor: "Pink" });
    expect(desc).toContain("POD-устройство XROS.");
    expect(desc).toContain("Цвет: Pink");
  });

  it("builds consumable description with optional fields", () => {
    const desc = buildDescription({
      category: "consumable",
      brand: "GeekVape",
      flavor: "Сменный испаритель",
      volume: "0.6Ω Mesh",
    });
    expect(desc).toContain("Расходник для GeekVape.");
    expect(desc).toContain("Сменный испаритель");
    expect(desc).toContain("0.6Ω Mesh");
  });

  it("falls back to brand/flavor for unknown category", () => {
    const desc = buildDescription({ category: "unknown", brand: "Brand", flavor: "Taste" });
    expect(desc).toBe("Brand\nTaste");
  });

  it("returns empty string when no fields are provided", () => {
    expect(buildDescription({})).toBe("");
  });
});

describe("formatImageUrl", () => {
  it("returns null for null/undefined/empty input", () => {
    expect(formatImageUrl(null)).toBeNull();
    expect(formatImageUrl(undefined)).toBeNull();
    expect(formatImageUrl("")).toBeNull();
  });

  it("returns local /assets/ paths unchanged", () => {
    expect(formatImageUrl("/assets/xros5mini/silver.jpg")).toBe("/assets/xros5mini/silver.jpg");
  });

  it("returns Supabase URLs with resizing params", () => {
    expect(formatImageUrl("product-images/photo.jpg")).toBe(
      "https://ueazjqvxjlppgtkhcmut.supabase.co/storage/v1/object/public/product-images/photo.jpg?width=400&quality=80&format=webp",
    );
  });

  it("returns other URLs unchanged", () => {
    expect(formatImageUrl("https://cdn.example.com/img.jpg")).toBe(
      "https://cdn.example.com/img.jpg",
    );
  });
});
