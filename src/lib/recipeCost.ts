import { Material, RecipeIngredient } from '../types';

/** Costo de producir 1 unidad del producto = suma de (cantidad de insumo × costo unitario del insumo). */
export function recipeCost(ingredients: RecipeIngredient[], materials: Material[]): number {
  const byId = new Map(materials.map(m => [m.id, m]));
  return ingredients.reduce((sum, ing) => {
    const m = byId.get(ing.materialId);
    return sum + (m ? ing.qty * m.costPerUnit : 0);
  }, 0);
}
