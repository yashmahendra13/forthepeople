/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * budgetUtilizationScore (src/lib/health-score.ts): the Governance sub-score
 * for "how much of the allocated budget was spent". It used to be computed
 * inline, with a middle band that started at 0 and no upper limit: spending
 * 100 % scored 160, and spending 60 % scored lower than spending 59 %.
 */
import { describe, expect, it, vi } from "vitest";

// health-score.ts imports the Prisma client; the helper under test is pure.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/scraper/lib/district-snapshot", () => ({ readDistrictSnapshot: async () => null }));

import { budgetUtilizationScore } from "@/lib/health-score";

describe("budgetUtilizationScore (report card: budget spent, %)", () => {
  it("gives full marks for spending 80-95 % of the budget", () => {
    for (const util of [80, 87.5, 95]) expect(budgetUtilizationScore(util)).toBe(100);
  });

  it("never goes above 100, even when more than the allocation was spent", () => {
    for (const util of [95.1, 96, 100, 130, 400]) {
      expect(budgetUtilizationScore(util)).toBeLessThanOrEqual(100);
    }
    expect(budgetUtilizationScore(100)).toBe(100);
  });

  it("never goes below 0", () => {
    expect(budgetUtilizationScore(0)).toBe(0);
    expect(budgetUtilizationScore(-5)).toBe(0);
  });

  it("scores 50 at 60 % and does not drop when the 60 % line is crossed", () => {
    expect(budgetUtilizationScore(60)).toBe(50);
    expect(budgetUtilizationScore(59.9)).toBeLessThanOrEqual(budgetUtilizationScore(60));
    expect(budgetUtilizationScore(30)).toBeCloseTo(25, 5);
  });

  it("rises steadily from 0 % to 80 %, with no jump at 60 % or 80 %", () => {
    let prev = -1;
    for (let util = 0; util <= 80; util += 0.5) {
      const score = budgetUtilizationScore(util);
      expect(score).toBeGreaterThanOrEqual(prev);
      prev = score;
    }
    expect(budgetUtilizationScore(70)).toBeCloseTo(75, 5);
    expect(budgetUtilizationScore(79.9)).toBeGreaterThan(99);
  });

  it("treats a non-number as 0 rather than returning NaN", () => {
    expect(budgetUtilizationScore(Number.NaN)).toBe(0);
  });
});
