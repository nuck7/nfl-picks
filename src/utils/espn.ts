import { SeasonWeek } from '../types';

export const getCurrentYear = () => {
  return new Date().getFullYear();
};

// Week numbers restart every season, so a bare "1" would have 2026's week 1 and
// 2027's week 1 sharing an id and colliding in the picks collection. The season
// is part of the id to keep it unique for as long as the app runs.
export const makeWeekId = (season: number, week: number) =>
  `${season}_week_${week}`;

// The inverse of makeWeekId, so anything stored under a week id -- a payment,
// say -- can be sorted and labelled by the week it belongs to without carrying
// the season and the number again as separate fields. Undefined for an id that
// doesn't parse, so a stray document can't render as "Week NaN".
export const parseWeekId = (weekId: string): SeasonWeek | undefined => {
  const match = /^(\d{4})_week_(\d{1,2})$/.exec(weekId);

  return match
    ? { season: Number(match[1]), week: Number(match[2]) }
    : undefined;
};
