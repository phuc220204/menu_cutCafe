import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { categories } from './menu';
import type { CategoryId } from './menu';
import { initialNavigation, navigationReducer } from './navigation';
import type { NavigationState } from './navigation';

const START = 'polygon(-35% 0%, -5% 0%, -35% 100%, -65% 100%)';
const COVER = 'polygon(-35% 0%, 135% 0%, 105% 100%, -65% 100%)';
const EXIT = 'polygon(135% 0%, 165% 0%, 135% 100%, 105% 100%)';

interface Options {
  motion: boolean;
  wipeRef: RefObject<HTMLDivElement | null>;
  onCommit: (id: CategoryId) => void;
}

export function useCategoryTransition({ motion, wipeRef, onCommit }: Options) {
  const [state, setState] = useState(initialNavigation);
  const stateRef = useRef(state);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const motionRef = useRef(motion);
  const commitRef = useRef(onCommit);
  motionRef.current = motion;
  commitRef.current = onCommit;

  const publish = useCallback((next: NavigationState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const stopWipe = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    const wipe = wipeRef.current;
    if (wipe) {
      gsap.killTweensOf(wipe);
      gsap.set(wipe, { visibility: 'hidden', clipPath: START, opacity: 1 });
    }
  }, [wipeRef]);

  const snapToRequested = useCallback(() => {
    stopWipe();
    const previous = stateRef.current;
    const next = navigationReducer(previous, { type: 'snap' });
    publish(next);
    if (previous.displayedId !== next.displayedId) commitRef.current(next.displayedId);
  }, [publish, stopWipe]);

  const chooseCategory = useCallback((id: CategoryId) => {
    const previous = stateRef.current;
    const next = navigationReducer(previous, { type: 'request', id });
    if (next === previous) return;

    stopWipe();
    publish(next);
    if (!motionRef.current || !wipeRef.current) {
      snapToRequested();
      return;
    }
    // Returning to the category already on screen cancels any pending wipe.
    if (!next.transitioning) return;

    const wipe = wipeRef.current;
    const revision = next.revision;
    gsap.set(wipe, {
      visibility: 'visible',
      clipPath: START,
      opacity: 1,
      backgroundColor: categories.find(category => category.id === id)!.background,
    });
    timelineRef.current = gsap.timeline({
      onComplete: () => {
        const current = stateRef.current;
        const finished = navigationReducer(current, { type: 'finish', revision });
        if (finished === current) return;
        timelineRef.current = null;
        gsap.set(wipe, { visibility: 'hidden', clipPath: START });
        publish(finished);
      },
    })
      .to(wipe, { clipPath: COVER, duration: 0.36, ease: 'power3.inOut' })
      .call(() => {
        const current = stateRef.current;
        const committed = navigationReducer(current, { type: 'commit', revision });
        if (committed === current) return;
        publish(committed);
        if (current.displayedId !== committed.displayedId) commitRef.current(committed.displayedId);
      })
      .to(wipe, { clipPath: EXIT, duration: 0.44, ease: 'power3.inOut' });
  }, [publish, snapToRequested, stopWipe, wipeRef]);

  useEffect(() => {
    if (!motion && stateRef.current.transitioning) snapToRequested();
  }, [motion, snapToRequested]);

  useEffect(() => () => {
    stopWipe();
    // Invalidate callbacks even if an already queued callback survives kill().
    stateRef.current = { ...stateRef.current, revision: stateRef.current.revision + 1 };
  }, [stopWipe]);

  return {
    displayedId: state.displayedId,
    requestedId: state.requestedId,
    transitioning: state.transitioning,
    chooseCategory,
  };
}
