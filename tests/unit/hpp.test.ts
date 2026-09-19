import { describe, it, expect } from "vitest";
import {
  calculateIngredientCost,
  calculateIngredientsCost,
  calculateAdditionalCostsTotal,
  calculateHpp,
  calculatePriceFromMargin,
  calculatePriceFromMarkup,
  calculateMargin,
  calculateProfit,
  calculateSimpleHpp,
} from "@/lib/utils/hpp";

describe("calculateIngredientCost", () => {
  it("multiplies quantity by ingredient average cost", () => {
    expect(calculateIngredientCost({ quantity: 3, ingredient: { averageCost: 1000 } })).toBe(3000);
  });
});

describe("calculateIngredientsCost", () => {
  it("sums cost across multiple recipe items", () => {
    const items = [
      { quantity: 2, ingredient: { averageCost: 500 } },
      { quantity: 1, ingredient: { averageCost: 1500 } },
    ];
    expect(calculateIngredientsCost(items)).toBe(2500);
  });

  it("returns 0 for an empty recipe", () => {
    expect(calculateIngredientsCost([])).toBe(0);
  });
});

describe("calculateAdditionalCostsTotal", () => {
  it("sums additional cost amounts", () => {
    expect(calculateAdditionalCostsTotal([{ amount: 1000 }, { amount: 2500 }])).toBe(3500);
  });
});

describe("calculateHpp", () => {
  const recipe = [{ quantity: 2, ingredient: { averageCost: 1000 } }];
  const additional = [{ amount: 500 }];

  it("uses recipe cost + additional costs when no manual override is given", () => {
    expect(calculateHpp(recipe, additional)).toBe(2000 + 500);
  });

  it("uses manualCostPrice instead of recipe cost when provided", () => {
    expect(calculateHpp(recipe, additional, 10000)).toBe(10000 + 500);
  });

  it("ignores manualCostPrice when null/undefined", () => {
    expect(calculateHpp(recipe, additional, null)).toBe(2000 + 500);
    expect(calculateHpp(recipe, additional, undefined)).toBe(2000 + 500);
  });

  it("treats manualCostPrice of 0 as an explicit override, not 'unset'", () => {
    expect(calculateHpp(recipe, additional, 0)).toBe(0 + 500);
  });

  it("defaults additionalCosts to empty when omitted", () => {
    expect(calculateHpp(recipe)).toBe(2000);
  });
});

describe("calculatePriceFromMargin", () => {
  it("computes selling price for a target margin", () => {
    // hpp 8000, margin 20% -> price = 8000 / 0.8 = 10000
    expect(calculatePriceFromMargin(8000, 20)).toBeCloseTo(10000);
  });

  it("returns Infinity for a 100%+ margin (division by zero guard)", () => {
    expect(calculatePriceFromMargin(1000, 100)).toBe(Infinity);
    expect(calculatePriceFromMargin(1000, 150)).toBe(Infinity);
  });
});

describe("calculatePriceFromMarkup", () => {
  it("multiplies hpp by the markup factor", () => {
    expect(calculatePriceFromMarkup(5000, 1.5)).toBe(7500);
  });
});

describe("calculateMargin", () => {
  it("computes margin percentage", () => {
    expect(calculateMargin(10000, 8000)).toBeCloseTo(20);
  });

  it("returns 0 when selling price is 0 (avoids division by zero)", () => {
    expect(calculateMargin(0, 8000)).toBe(0);
  });

  it("returns a negative margin when hpp exceeds selling price", () => {
    expect(calculateMargin(1000, 1500)).toBeCloseTo(-50);
  });
});

describe("calculateProfit", () => {
  it("computes selling price minus hpp", () => {
    expect(calculateProfit(10000, 6000)).toBe(4000);
  });

  it("can be negative when selling at a loss", () => {
    expect(calculateProfit(1000, 1500)).toBe(-500);
  });
});

describe("calculateSimpleHpp", () => {
  it("divides total costs by unit count", () => {
    expect(calculateSimpleHpp(50000, 20000, 10000, 10)).toBe(8000);
  });

  it("returns 0 when unit count is 0 or negative (avoids division by zero)", () => {
    expect(calculateSimpleHpp(50000, 20000, 10000, 0)).toBe(0);
    expect(calculateSimpleHpp(50000, 20000, 10000, -5)).toBe(0);
  });
});
