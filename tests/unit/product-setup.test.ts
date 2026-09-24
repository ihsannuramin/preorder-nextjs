import { describe, it, expect } from "vitest";
import { isRecipeSetupIncomplete } from "@/lib/utils/product-setup";

describe("isRecipeSetupIncomplete", () => {
  it("is always false for MANUAL-mode products, regardless of recipe/cost data", () => {
    expect(
      isRecipeSetupIncomplete({ costMode: "MANUAL", recipeItems: [], additionalCosts: [] })
    ).toBe(false);
  });

  it("is true for a RECIPE-mode product with no ingredients yet", () => {
    expect(
      isRecipeSetupIncomplete({ costMode: "RECIPE", recipeItems: [], additionalCosts: [{}] })
    ).toBe(true);
  });

  it("is true for a RECIPE-mode product with ingredients but no additional costs", () => {
    expect(
      isRecipeSetupIncomplete({ costMode: "RECIPE", recipeItems: [{}], additionalCosts: [] })
    ).toBe(true);
  });

  it("is false for a RECIPE-mode product with both ingredients and additional costs", () => {
    expect(
      isRecipeSetupIncomplete({ costMode: "RECIPE", recipeItems: [{}], additionalCosts: [{}] })
    ).toBe(false);
  });
});
