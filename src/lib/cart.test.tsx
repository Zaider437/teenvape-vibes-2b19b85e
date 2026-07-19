import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";
import type { Product } from "./products";
import React from "react";

const mockProduct1: Product = {
  id: "p1",
  slug: "p1",
  name: "Product 1",
  brand: "Brand A",
  category: "device",
  price: 10.0,
  emoji: "⚡",
  color: "cyan",
  in_stock: true,
  sort_order: 1,
};

const mockProduct2: Product = {
  id: "p2",
  slug: "p2",
  name: "Product 2",
  brand: "Brand B",
  category: "liquid",
  price: 15.5,
  emoji: "🧪",
  color: "pink",
  in_stock: true,
  sort_order: 2,
};

describe("Cart Context & Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("throws an error when useCart is used outside CartProvider", () => {
    // Suppress console.error for this test to keep output clean
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    expect(() => renderHook(() => useCart())).toThrow("useCart outside provider");
    consoleSpy.mockRestore();
  });

  it("initializes with an empty cart", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it("adds a product to the cart", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add(mockProduct1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({ product: mockProduct1, qty: 1 });
    expect(result.current.count).toBe(1);
    expect(result.current.total).toBe(10.0);
  });

  it("increments quantity when adding the same product multiple times", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add(mockProduct1);
    });
    act(() => {
      result.current.add(mockProduct1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({ product: mockProduct1, qty: 2 });
    expect(result.current.count).toBe(2);
    expect(result.current.total).toBe(20.0);
  });

  it("adds different products to the cart", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add(mockProduct1);
    });
    act(() => {
      result.current.add(mockProduct2);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toEqual({ product: mockProduct1, qty: 1 });
    expect(result.current.items[1]).toEqual({ product: mockProduct2, qty: 1 });
    expect(result.current.count).toBe(2);
    expect(result.current.total).toBe(25.5);
  });

  it("removes a product from the cart", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add(mockProduct1);
      result.current.add(mockProduct2);
    });

    act(() => {
      result.current.remove(mockProduct1.id);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe(mockProduct2.id);
    expect(result.current.count).toBe(1);
    expect(result.current.total).toBe(15.5);
  });

  it("sets the quantity of a product", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add(mockProduct1);
    });

    act(() => {
      result.current.setQty(mockProduct1.id, 5);
    });

    expect(result.current.items[0].qty).toBe(5);
    expect(result.current.count).toBe(5);
    expect(result.current.total).toBe(50.0);
  });

  it("removes the product when setting quantity to 0 or negative", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add(mockProduct1);
    });

    act(() => {
      result.current.setQty(mockProduct1.id, 0);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);

    act(() => {
      result.current.add(mockProduct1);
    });

    act(() => {
      result.current.setQty(mockProduct1.id, -3);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("clears the cart", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add(mockProduct1);
      result.current.add(mockProduct2);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it("loads existing cart items from localStorage on mount", () => {
    const existingItems = [
      { product: mockProduct1, qty: 3 },
      { product: mockProduct2, qty: 2 },
    ];
    localStorage.setItem("vh_cart", JSON.stringify(existingItems));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toEqual(existingItems[0]);
    expect(result.current.items[1]).toEqual(existingItems[1]);
    expect(result.current.count).toBe(5);
    expect(result.current.total).toBe(61.0); // 3 * 10.0 + 2 * 15.5 = 30.0 + 31.0 = 61.0
  });

  it("saves cart items to localStorage when items change", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add(mockProduct1);
    });

    const saved = JSON.parse(localStorage.getItem("vh_cart") || "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toEqual({ product: mockProduct1, qty: 1 });
  });

  it("handles invalid JSON in localStorage gracefully on mount", () => {
    localStorage.setItem("vh_cart", "invalid-json-string");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);
  });
});
