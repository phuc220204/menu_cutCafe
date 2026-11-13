import assert from 'node:assert/strict';
import test from 'node:test';
import { initialNavigation, navigationReducer } from '../src/navigation.ts';
import { categories, initialVariant, money } from '../src/menu.ts';

test('latest request wins and stale callbacks cannot change the current scene', () => {
  const matcha = navigationReducer(initialNavigation, { type: 'request', id: 'matcha' });
  const tea = navigationReducer(matcha, { type: 'request', id: 'tea' });
  assert.equal(tea.displayedId, 'coffee');
  assert.equal(tea.requestedId, 'tea');
  assert.equal(navigationReducer(tea, { type: 'commit', revision: matcha.revision }), tea);
  const committed = navigationReducer(tea, { type: 'commit', revision: tea.revision });
  assert.equal(committed.displayedId, 'tea');
  assert.equal(committed.transitioning, true);
  assert.equal(navigationReducer(committed, { type: 'finish', revision: matcha.revision }), committed);
  assert.equal(navigationReducer(committed, { type: 'finish', revision: tea.revision }).transitioning, false);
});

test('returning to the displayed category cancels the pending destination', () => {
  const pending = navigationReducer(initialNavigation, { type: 'request', id: 'matcha' });
  const cancelled = navigationReducer(pending, { type: 'request', id: 'coffee' });
  assert.equal(cancelled.displayedId, 'coffee');
  assert.equal(cancelled.requestedId, 'coffee');
  assert.equal(cancelled.transitioning, false);
  assert.equal(navigationReducer(cancelled, { type: 'commit', revision: pending.revision }), cancelled);
});

test('a newer request during the outgoing wipe invalidates its completion', () => {
  const pending = navigationReducer(initialNavigation, { type: 'request', id: 'matcha' });
  const committed = navigationReducer(pending, { type: 'commit', revision: pending.revision });
  const next = navigationReducer(committed, { type: 'request', id: 'cacao' });
  assert.equal(next.displayedId, 'matcha');
  assert.equal(next.requestedId, 'cacao');
  assert.equal(navigationReducer(next, { type: 'finish', revision: committed.revision }), next);
});

test('reduced motion / pause snaps to the final request and invalidates old animations', () => {
  const pending = navigationReducer(initialNavigation, { type: 'request', id: 'other' });
  const snapped = navigationReducer(pending, { type: 'snap' });
  assert.equal(snapped.displayedId, 'other');
  assert.equal(snapped.transitioning, false);
  assert.equal(navigationReducer(snapped, { type: 'commit', revision: pending.revision }), snapped);
  assert.equal(navigationReducer(snapped, { type: 'finish', revision: pending.revision }), snapped);
});

test('repeated selection of the requested category does not restart its animation', () => {
  assert.equal(navigationReducer(initialNavigation, { type: 'request', id: 'coffee' }), initialNavigation);
  const pending = navigationReducer(initialNavigation, { type: 'request', id: 'matcha' });
  assert.equal(navigationReducer(pending, { type: 'request', id: 'matcha' }), pending);
});

test('the approved menu retains all 19 drinks, tea bases, prices and latte defaults', () => {
  const drinks = categories.flatMap(category => category.items);
  assert.equal(drinks.length, 19);
  assert.equal(new Set(drinks.map(drink => drink.id)).size, 19);
  assert.deepEqual(categories.map(category => category.items.length), [6, 4, 2, 6, 1]);
  assert.deepEqual(drinks.filter(drink => drink.variants).map(drink => drink.name), ['Matcha latte', 'Choco latte']);
  assert.deepEqual(categories.find(category => category.id === 'tea')!.items.map(drink => drink.teaBase), ['oolong', 'oolong', 'oolong', 'jasmine', 'jasmine', 'jasmine']);
  assert.deepEqual(initialVariant, { temperature: 'cold', milk: 'dairy' });
  assert.deepEqual(drinks.map(drink => drink.price), [25000, 29000, 35000, 39000, 35000, 45000, 45000, 49000, 55000, 49000, 39000, 45000, 39000, 39000, 39000, 39000, 45000, 39000, 35000]);
  assert.equal(money(25000), '25.000đ');
});
