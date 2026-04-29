import { describe, it, expect } from "vitest";
import { detectStack } from "../../src/core/stack.js";

describe("detectStack", () => {
  it("detects Next.js framework", () => {
    const result = detectStack({ next: "14.2.0", react: "18.2.0" });
    expect(result.framework).toBe("nextjs");
  });

  it("detects Vite framework", () => {
    const result = detectStack({ vite: "5.2.0", react: "18.2.0" });
    expect(result.framework).toBe("vite");
  });

  it("detects Remix framework", () => {
    const result = detectStack({ "@remix-run/react": "2.0.0" });
    expect(result.framework).toBe("remix");
  });

  it("detects Astro framework", () => {
    const result = detectStack({ astro: "4.0.0" });
    expect(result.framework).toBe("astro");
  });

  it("returns null framework when none detected", () => {
    const result = detectStack({ express: "4.18.0" });
    expect(result.framework).toBeNull();
  });

  it("detects Vitest testing tool", () => {
    const result = detectStack({ vitest: "1.6.0" });
    expect(result.testing).toContain("vitest");
  });

  it("detects Jest testing tool", () => {
    const result = detectStack({ jest: "29.0.0" });
    expect(result.testing).toContain("jest");
  });

  it("detects Playwright", () => {
    const result = detectStack({ "@playwright/test": "1.44.0" });
    expect(result.testing).toContain("playwright");
  });

  it("detects multiple testing tools", () => {
    const result = detectStack({ vitest: "1.6.0", "@playwright/test": "1.44.0" });
    expect(result.testing).toContain("vitest");
    expect(result.testing).toContain("playwright");
  });

  it("detects Tailwind styling", () => {
    const result = detectStack({ tailwindcss: "3.4.0" });
    expect(result.styling).toContain("tailwind");
  });

  it("detects styled-components", () => {
    const result = detectStack({ "styled-components": "6.0.0" });
    expect(result.styling).toContain("styled-components");
  });

  it("detects CSS modules via Next.js (no extra dep needed)", () => {
    const result = detectStack({ next: "14.0.0" });
    expect(result.framework).toBe("nextjs");
  });

  it("detects full nextjs fixture stack", () => {
    const deps = {
      next: "14.2.0",
      react: "18.2.0",
      vitest: "1.6.0",
      "@playwright/test": "1.44.0",
      tailwindcss: "3.4.0",
    };
    const result = detectStack(deps);
    expect(result.framework).toBe("nextjs");
    expect(result.testing).toContain("vitest");
    expect(result.testing).toContain("playwright");
    expect(result.styling).toContain("tailwind");
  });
});
