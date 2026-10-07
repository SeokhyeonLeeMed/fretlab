/**
 * useNarrowLayout.ts — true when the page is in its single-column layout.
 *
 * The breakpoint must match the one in global.css at which the sidebar drops
 * below the stage. It exists because one control has to move in the markup,
 * not just restyle: on a narrow screen the guitar/bass switch belongs at the
 * top of the page, above the instrument it changes, rather than in a card
 * that has ended up underneath it.
 */

import { useEffect, useState } from 'react';

export const NARROW_QUERY = '(max-width: 1080px)';

const matches = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(NARROW_QUERY).matches
    : false;

export function useNarrowLayout(): boolean {
  const [narrow, setNarrow] = useState(matches);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(NARROW_QUERY);
    const update = (): void => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return narrow;
}
