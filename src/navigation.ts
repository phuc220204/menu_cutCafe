import type { CategoryId } from './menu.ts';

export interface NavigationState {
  displayedId: CategoryId;
  requestedId: CategoryId;
  revision: number;
  transitioning: boolean;
}

export type NavigationAction =
  | { type: 'request'; id: CategoryId }
  | { type: 'commit'; revision: number }
  | { type: 'finish'; revision: number }
  | { type: 'snap' };

export const initialNavigation: NavigationState = {
  displayedId: 'coffee',
  requestedId: 'coffee',
  revision: 0,
  transitioning: false,
};

// Each new destination owns a revision; interrupted animation callbacks cannot
// commit content or finish a later transition.
export function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  if (action.type === 'request') {
    if (action.id === state.requestedId) return state;
    return {
      ...state,
      requestedId: action.id,
      revision: state.revision + 1,
      transitioning: action.id !== state.displayedId,
    };
  }
  if (action.type === 'snap') {
    return {
      ...state,
      displayedId: state.requestedId,
      transitioning: false,
      revision: state.revision + 1,
    };
  }
  if (action.revision !== state.revision || !state.transitioning) return state;
  if (action.type === 'commit') return { ...state, displayedId: state.requestedId };
  return { ...state, transitioning: false };
}
