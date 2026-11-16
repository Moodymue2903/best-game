// The customers: who arrives, what they order, how long they wait, when they storm off.
// A customer has one or two orders (a Family orders two). Serve the exact recipe they
// asked for; when their patience runs out they walk away and the combo breaks.
import { CUSTOMER_TYPES, MAX_CUSTOMERS } from './config.js';
import { randomRecipe } from './orders.js';

export function createCustomers(random) {
  return { list: [], spawnTimer: 2.0, nextId: 1, random };
}

/** Pick a customer type for a night, weighted, from the types unlocked by then. */
function pickType(random, night) {
  const types = Object.entries(CUSTOMER_TYPES).filter(([, t]) => t.fromNight <= night);
  let total = 0;
  for (const [, t] of types) total += t.weight;
  let roll = random() * total;
  for (const [id, t] of types) {
    roll -= t.weight;
    if (roll <= 0) return id;
  }
  return types[types.length - 1][0];
}

function spawnCustomer(customers, night, patienceMul) {
  const typeId = pickType(customers.random, night);
  const type = CUSTOMER_TYPES[typeId];
  const orderCount = type.orders || 1;
  const orders = [];
  for (let i = 0; i < orderCount; i += 1) orders.push(randomRecipe(customers.random, night).id);
  customers.list.push({
    id: customers.nextId,
    type: typeId,
    label: type.label,
    color: type.color,
    orders,
    served: orders.map(() => false),
    patience: type.patience * patienceMul,
    patienceMax: type.patience * patienceMul,
    faceSeed: customers.random(),
  });
  customers.nextId += 1;
}

/**
 * One fixed step. Spawns customers while a seat is free, drains patience (faster in a
 * rush), and returns the customers who stormed off this step (their patience hit zero).
 */
export function stepCustomers(customers, dt, night, spawnInterval, patienceMul, rush) {
  const walked = [];
  customers.spawnTimer -= dt;
  if (customers.spawnTimer <= 0 && customers.list.length < MAX_CUSTOMERS) {
    spawnCustomer(customers, night, patienceMul);
    customers.spawnTimer = spawnInterval;
  }
  const drain = rush ? 1.25 : 1;
  for (let i = customers.list.length - 1; i >= 0; i -= 1) {
    const c = customers.list[i];
    c.patience -= dt * drain;
    if (c.patience <= 0) {
      walked.push(c);
      customers.list.splice(i, 1);
    }
  }
  return walked;
}

/**
 * Try to serve a recipe to a customer. Returns the order index served, or -1 when the
 * customer does not want that recipe (or has already had it). A customer whose orders
 * are all served leaves, satisfied.
 */
export function serveTo(customers, customerIndex, recipeId) {
  const c = customers.list[customerIndex];
  if (!c) return -1;
  for (let i = 0; i < c.orders.length; i += 1) {
    if (!c.served[i] && c.orders[i] === recipeId) {
      c.served[i] = true;
      if (c.served.every(Boolean)) customers.list.splice(customerIndex, 1);
      return i;
    }
  }
  return -1;
}

/** The most urgent waiting customer (lowest patience fraction), or null. */
export function mostUrgent(customers) {
  let best = null;
  let bestFrac = Infinity;
  for (const c of customers.list) {
    const frac = c.patience / c.patienceMax;
    if (frac < bestFrac) {
      bestFrac = frac;
      best = c;
    }
  }
  return best;
}
