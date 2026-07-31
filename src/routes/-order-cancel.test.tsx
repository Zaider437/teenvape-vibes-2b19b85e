import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { mockOrder } from "../test/fixtures/orders";

const mockUseSearch = vi.fn();
const mockFetchOrder = vi.fn();
const mockCancelOrder = vi.fn();

vi.mock("@tanstack/react-start", () => ({
  useServerFn: vi.fn((fn: any) => fn),
  createServerFn: vi.fn().mockReturnValue({
    inputValidator: vi.fn().mockReturnThis(),
    handler: vi.fn().mockReturnThis(),
  }),
  createMiddleware: vi.fn().mockReturnValue({
    server: vi.fn().mockReturnValue(vi.fn()),
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useSearch: (options: any) => mockUseSearch(options),
}));

vi.mock("../lib/orders.functions", () => ({
  getOrderByToken: (...args: any[]) => mockFetchOrder(...args),
  cancelOrder: (...args: any[]) => mockCancelOrder(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock("lucide-react", () => ({
  ShoppingBag: () => <span data-testid="icon-shopping-bag" />,
  X: () => <span data-testid="icon-x" />,
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  CheckCircle2: () => <span data-testid="icon-check-circle" />,
}));

import { OrderCancelPage } from "./order-cancel";

describe("OrderCancelPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchOrder.mockReset();
    mockCancelOrder.mockReset();
  });

  it("shows error when token is missing", () => {
    mockUseSearch.mockReturnValue({ token: "" });

    render(<OrderCancelPage />);

    expect(screen.getByText("В ссылке отсутствует токен отмены.")).toBeDefined();
  });

  it("shows error when order is not found", async () => {
    mockUseSearch.mockReturnValue({ token: "uuid-token-1234" });
    mockFetchOrder.mockResolvedValue(null);

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText("Заказ не найден.")).toBeDefined();
    });
  });

  it("displays order details when token is valid", async () => {
    mockUseSearch.mockReturnValue({ token: "uuid-token-1234" });
    mockFetchOrder.mockResolvedValue(mockOrder);

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText(`Заказ #${mockOrder.id.slice(0, 8)}`)).toBeDefined();
    });
    expect(screen.getByText(mockOrder.customer_address)).toBeDefined();
    expect(screen.getByText(`${mockOrder.total_amount.toFixed(2)} BYN`)).toBeDefined();
  });

  it("displays brand in order items", async () => {
    const orderWithBrand = {
      ...mockOrder,
      items: [{ name: "Test Vape", brand: "TestBrand", qty: 2, price: 25.5, flavor: "Ментол" }],
    };
    mockUseSearch.mockReturnValue({ token: "uuid-token-1234" });
    mockFetchOrder.mockResolvedValue(orderWithBrand);

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Vape (TestBrand)")).toBeDefined();
    });
  });

  it("cancels order when button is clicked", async () => {
    mockUseSearch.mockReturnValue({ token: "uuid-token-1234" });
    mockFetchOrder.mockResolvedValue(mockOrder);
    mockCancelOrder.mockResolvedValue({ success: true, alreadyCancelled: false });

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText(`Заказ #${mockOrder.id.slice(0, 8)}`)).toBeDefined();
    });

    const cancelButton = screen.getByText("Отменить заказ");
    cancelButton.click();

    await waitFor(() => {
      expect(mockCancelOrder).toHaveBeenCalledWith({ data: { token: "uuid-token-1234" } });
    });
  });

  it("displays cancelled state when order is already cancelled", async () => {
    const cancelledOrder = { ...mockOrder, status: "cancelled" };
    mockUseSearch.mockReturnValue({ token: "uuid-token-1234" });
    mockFetchOrder.mockResolvedValue(cancelledOrder);

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText("отменён")).toBeDefined();
    });
    expect(screen.getByText("Заказ отменён")).toBeDefined();
  });

  it("renders link back to catalog", async () => {
    mockUseSearch.mockReturnValue({ token: "uuid-token-1234" });
    mockFetchOrder.mockResolvedValue(mockOrder);

    render(<OrderCancelPage />);

    await waitFor(() => {
      const link = screen.getByText("← В каталог");
      expect(link.closest("a")?.getAttribute("href")).toBe("/");
    });
  });
});
