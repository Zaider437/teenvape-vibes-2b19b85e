import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { mockOrder } from "../test/fixtures/orders";

const mockUseSearch = vi.fn();
const mockGetOrderByToken = vi.fn();
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
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
  useSearch: (options: any) => mockUseSearch(options),
}));

vi.mock("../lib/orders.functions", () => ({
  getOrderByToken: (...args: any[]) => mockGetOrderByToken(...args),
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
    mockUseSearch.mockReturnValue({ token: "test-token" });
    mockGetOrderByToken.mockReset();
    mockCancelOrder.mockReset();
  });

  it("shows error when token is missing", async () => {
    mockUseSearch.mockReturnValue({ token: "" });

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText("В ссылке отсутствует токен отмены.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    mockGetOrderByToken.mockImplementation(() => new Promise(() => {}));

    render(<OrderCancelPage />);

    expect(screen.getByText("Отмена")).toBeDefined();
  });

  it("displays order details when fetched successfully", async () => {
    mockGetOrderByToken.mockResolvedValue(mockOrder);

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText(`Заказ #${mockOrder.id.slice(0, 8)}`)).toBeDefined();
    });

    expect(screen.getByText(mockOrder.customer_address)).toBeDefined();
    expect(screen.getByText(`${mockOrder.total_amount.toFixed(2)} BYN`)).toBeDefined();
  });

  it("shows error when order fetch fails", async () => {
    mockGetOrderByToken.mockRejectedValue(new Error("Не удалось найти заказ."));

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText("Не удалось найти заказ.")).toBeDefined();
    });
  });

  it("cancels order when button is clicked", async () => {
    mockGetOrderByToken.mockResolvedValue(mockOrder);
    mockCancelOrder.mockResolvedValue({ success: true, alreadyCancelled: false });

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText(`Заказ #${mockOrder.id.slice(0, 8)}`)).toBeDefined();
    });

    const cancelButton = screen.getByText("Отменить заказ");
    cancelButton.click();

    await waitFor(() => {
      expect(mockCancelOrder).toHaveBeenCalledWith({ data: { token: "test-token" } });
    });
  });

  it("displays cancelled state when order is already cancelled", async () => {
    const cancelledOrder = { ...mockOrder, status: "cancelled" };
    mockGetOrderByToken.mockResolvedValue(cancelledOrder);

    render(<OrderCancelPage />);

    await waitFor(() => {
      expect(screen.getByText("отменён")).toBeDefined();
    });

    expect(screen.getByText("Заказ отменён")).toBeDefined();
  });

  it("renders link back to catalog", async () => {
    mockGetOrderByToken.mockResolvedValue(mockOrder);

    render(<OrderCancelPage />);

    await waitFor(() => {
      const link = screen.getByText("← В каталог");
      expect(link.closest("a")?.getAttribute("href")).toBe("/");
    });
  });
});
