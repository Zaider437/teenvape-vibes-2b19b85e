
/**
 * @jest-environment jsdom
 */
// @vitest-environment jsdom

import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Shop } from "./index";
import { fetchProducts } from "../lib/products";
import { createOrder } from "../lib/orders.functions";
import { CartProvider } from "../lib/cart";
import React from "react";
import { mockProducts } from "../test/fixtures/products";
import * as matchers from "@testing-library/jest-dom/matchers";

// @ts-ignore - expect.extend expects Jest matchers, but we are passing Vitest-compatible jest-dom matchers which might have slight type mismatches in this environment
expect.extend(matchers);

// Mock the external modules
vi.mock("../lib/products", () => ({
  fetchProducts: vi.fn(),
  formatImageUrl: vi.fn((url) => url),
  CATEGORIES: [
    { id: "all", label: "Всё", emoji: "🔥" },
    { id: "disposable", label: "Одноразки", emoji: "💨" },
    { id: "device", label: "Устройства", emoji: "⚡" },
    { id: "liquid", label: "Жидкости", emoji: "🧪" },
    { id: "consumable", label: "Расходники", emoji: "🧩" },
  ],
}));

vi.mock("../lib/orders.functions", () => ({
  createOrder: vi.fn(),
  debugEnv: vi.fn().mockResolvedValue({}),
}));

vi.mock("../integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    head: () => ({ meta: [] }),
  }),
}));

vi.mock("@tanstack/react-start", () => ({
  useServerFn: vi.fn(),
  createMiddleware: vi.fn().mockReturnValue({
    server: vi.fn().mockReturnValue(vi.fn()),
  }),
  createServerFn: vi.fn().mockReturnValue({
    inputValidator: vi.fn().mockReturnThis(),
    handler: vi.fn().mockReturnThis(),
    middleware: vi.fn().mockReturnThis(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

// Mock assets
vi.mock("../assets/lovevape-logo.jpg.asset.json", () => ({
  default: { url: "mock-logo.jpg" },
}));

describe("Shop Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchProducts).mockResolvedValue(mockProducts);
  });

  it("renders the shop with products and categories", async () => {
    const { container } = render(
      <CartProvider>
        <Shop />
      </CartProvider>
    );

    // Wait for products to load
    await waitFor(() => {
      const elements = screen.getAllByText("Test Disposable Vape");
      expect(elements.length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Test Pod Device")).toBeDefined();
    const searchInputs = screen.getAllByPlaceholderText("Поиск товара…");
    expect(searchInputs[0]).toBeDefined();
  });

  it("filters products by search query", async () => {
    render(
      <CartProvider>
        <Shop />
      </CartProvider>
    );

    await waitFor(() => {
      const elements = screen.getAllByText("Test Disposable Vape");
      expect(elements.length).toBeGreaterThan(0);
    });

    const searchInputs = screen.getAllByPlaceholderText("Поиск товара…");
    fireEvent.change(searchInputs[0], { target: { value: "Pod" } });

    await waitFor(() => {
      const elements = screen.queryAllByText("Test Disposable Vape");
      const visibleElements = elements.filter(el => {
        const card = el.closest('.bg-card');
        return card && !card.classList.contains('hidden') && card.querySelector('button')?.textContent?.includes('В корзину');
      });
      expect(visibleElements.length).toBe(0);
    });
    const podElements = screen.getAllByText("Test Pod Device");
    expect(podElements.length).toBeGreaterThan(0);
  });

  it("filters products by category", async () => {
    render(
      <CartProvider>
        <Shop />
      </CartProvider>
    );

    await waitFor(() => {
      const elements = screen.getAllByText("Test Disposable Vape");
      expect(elements.length).toBeGreaterThan(0);
    });

    // Click on "Устройства" category button
    const deviceCategoryBtns = screen.getAllByRole("button", { name: /Устройства/i });
    fireEvent.click(deviceCategoryBtns[0]);

    await waitFor(() => {
      const elements = screen.queryAllByText("Test Disposable Vape");
      const visibleElements = elements.filter(el => {
        const card = el.closest('.bg-card');
        return card && !card.classList.contains('hidden') && card.querySelector('button')?.textContent?.includes('В корзину');
      });
      expect(visibleElements.length).toBe(0);
    });
    const podElements = screen.getAllByText("Test Pod Device");
    expect(podElements.length).toBeGreaterThan(0);
  });

  it("handles fetchProducts rejection gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { toast } = await import("sonner");
      vi.mocked(fetchProducts).mockRejectedValueOnce(new Error("Network error"));

      render(
        <CartProvider>
          <Shop />
        </CartProvider>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Не удалось загрузить каталог");
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});