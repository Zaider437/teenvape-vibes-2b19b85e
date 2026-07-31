import { describe, it, expect } from "vitest";
import { escapeHtml } from "./orders.functions";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than and greater-than", () => {
    expect(escapeHtml("<div>content</div>")).toBe("&lt;div&gt;content&lt;/div&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes mixed special characters", () => {
    expect(escapeHtml('<a href="test">It\'s working</a>')).toBe(
      "&lt;a href=&quot;test&quot;&gt;It&#39;s working&lt;/a&gt;",
    );
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});
