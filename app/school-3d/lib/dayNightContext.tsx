'use client';

import type { MutableRefObject } from 'react';

/**
 * Day/night cycle — module-level shared refs.
 *
 * DayNightCycle writes to these refs every frame. Any component inside
 * the Canvas can read them via useDayNight(). No Provider needed —
 * keeps the architecture simple since we only ever have one Canvas
 * mounted at a time.
 *
 * Initial values represent "day", so if DayNightCycle isn't mounted yet
 * (first frame) consumers behave correctly.
 */

type DayNightRefs = {
  timeRef:     MutableRefObject<number>;
  nightFactor: MutableRefObject<number>;
  starOpacity: MutableRefObject<number>;
  moonOpacity: MutableRefObject<number>;
};

const refs: DayNightRefs = {
  timeRef:     { current: 0.30 },
  nightFactor: { current: 0    },
  starOpacity: { current: 0    },
  moonOpacity: { current: 0    },
};

export function useDayNight(): DayNightRefs {
  return refs;
}
