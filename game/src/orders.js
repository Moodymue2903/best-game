// Recipes and tickets: what a skewer is, and how an ingredient set matches a recipe.
// A ticket shows a recipe's ingredient icons; the player rebuilds that exact set.
import { INGREDIENTS, RECIPES } from './config.js';

export function ingredientById(id) {
  for (const ing of INGREDIENTS) if (ing.id === id) return ing;
  return null;
}

export function recipeById(id) {
  for (const r of RECIPES) if (r.id === id) return r;
  return null;
}

/** The recipe an ingredient set makes (order does not matter), or null when it makes none. */
export function recipeFor(ids) {
  const sorted = [...ids].sort();
  for (const r of RECIPES) {
    const needs = [...r.needs].sort();
    if (needs.length === sorted.length && needs.every((n, i) => n === sorted[i])) return r;
  }
  return null;
}

/** Recipes a customer may order on a given night. */
export function recipesForNight(night) {
  return RECIPES.filter((r) => r.fromNight <= night);
}

/** A random recipe for a night, weighted toward the cheaper ones early. */
export function randomRecipe(random, night) {
  const pool = recipesForNight(night);
  // Weight by 1/coins so cheap recipes appear more often early on.
  let total = 0;
  const weights = pool.map((r) => {
    const w = 1 / r.coins;
    total += w;
    return w;
  });
  let roll = random() * total;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
