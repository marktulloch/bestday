import type { ProfileTimelineEvent } from "./types";

export function sortTimelineEvents(events: ProfileTimelineEvent[]): ProfileTimelineEvent[] {
  return [...events].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}
