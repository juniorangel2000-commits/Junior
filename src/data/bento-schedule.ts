/** Phase 5 starting schedule. Days/hours remain configurable, not a seasonal calendar. */
export const BENTO_WEEKLY_PLAN={
 regularDays:[2,5] as readonly number[],occasionalDay:7,occasionalChance:.3,
 preparationStart:7*60,latestDeparture:9*60,preparationSeconds:8,
 explorationMinutes:100,latestReturn:16*60,returnPreparationSeconds:6,
 speed:48,routeRetrySeconds:2,portalPause:.3,
} as const;
