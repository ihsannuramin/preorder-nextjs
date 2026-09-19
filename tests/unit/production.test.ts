import { describe, it, expect } from "vitest";
import {
  calculateCapacity,
  generateProductionNeeds,
  checkAvailability,
} from "@/lib/utils/production";

describe("calculateCapacity", () => {
  it("returns Infinity for a recipe with no ingredients", () => {
    expect(calculateCapacity([])).toBe(Infinity);
  });

  it("returns the max producible units limited by the scarcest ingredient", () => {
    const recipe = [
      { quantity: 2, ingredient: { currentStock: 20 } }, // enough for 10
      { quantity: 5, ingredient: { currentStock: 15 } }, // enough for 3
    ];
    expect(calculateCapacity(recipe)).toBe(3);
  });

  it("treats a zero-quantity recipe line as unlimited (avoids division by zero)", () => {
    const recipe = [{ quantity: 0, ingredient: { currentStock: 10 } }];
    expect(calculateCapacity(recipe)).toBe(Infinity);
  });
});

describe("generateProductionNeeds", () => {
  it("aggregates ingredient quantity and cost across multiple order items", () => {
    const orderItems = [
      {
        quantity: 3,
        product: {
          recipeItems: [
            { quantity: 2, ingredient: { id: "flour", name: "Tepung", unit: "GRAM" as const, averageCost: 10 } },
          ],
        },
      },
      {
        quantity: 2,
        product: {
          recipeItems: [
            { quantity: 2, ingredient: { id: "flour", name: "Tepung", unit: "GRAM" as const, averageCost: 10 } },
          ],
        },
      },
    ];

    const needs = generateProductionNeeds(orderItems as never);
    expect(needs).toHaveLength(1);
    // (3*2) + (2*2) = 10 units of flour
    expect(needs[0].totalQuantity).toBe(10);
    expect(needs[0].estimatedCost).toBe(100);
  });

  it("skips order items with no linked product (deleted/manual-cost products)", () => {
    const needs = generateProductionNeeds([{ quantity: 5, product: null }]);
    expect(needs).toEqual([]);
  });
});

describe("checkAvailability", () => {
  it("reports ready when stock covers every need", () => {
    const needs = [
      { ingredientId: "a", ingredientName: "A", unit: "GRAM" as const, totalQuantity: 10, estimatedCost: 100 },
    ];
    const result = checkAvailability(needs, new Map([["a", 20]]));
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("reports shortfall amounts for insufficient ingredients", () => {
    const needs = [
      { ingredientId: "a", ingredientName: "A", unit: "GRAM" as const, totalQuantity: 10, estimatedCost: 100 },
    ];
    const result = checkAvailability(needs, new Map([["a", 4]]));
    expect(result.ready).toBe(false);
    expect(result.missing).toEqual([
      { ingredientId: "a", ingredientName: "A", unit: "GRAM", shortBy: 6 },
    ]);
  });

  it("treats an ingredient absent from the stock map as having zero stock", () => {
    const needs = [
      { ingredientId: "a", ingredientName: "A", unit: "GRAM" as const, totalQuantity: 5, estimatedCost: 50 },
    ];
    const result = checkAvailability(needs, new Map());
    expect(result.ready).toBe(false);
    expect(result.missing[0].shortBy).toBe(5);
  });
});
