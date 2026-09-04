import { useEffect, useState } from 'react';

export type QualityTier = 'high' | 'medium' | 'low';

/** Detects device capability to scale 3D complexity. */
export const useQualityTier = (): QualityTier => {
  const [tier, setTier] = useState<QualityTier>('medium');

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const width = window.innerWidth;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (cores >= 8 && memory >= 8 && width >= 1024 && !coarsePointer) setTier('high');
    else if (cores >= 4 || width >= 640) setTier('medium');
    else setTier('low');
  }, []);

  return tier;
};

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
};
