import { notFound } from "next/navigation";
import { getProduct } from "@/actions/products";
import { ResepClient, type RecipeWithIngredient } from "./resep-client";

export default async function ResepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <ResepClient
      product={product}
      initialRecipeItems={product.recipeItems as RecipeWithIngredient[]}
    />
  );
}
