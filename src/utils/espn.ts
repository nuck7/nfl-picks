export const getCurrentYear = () => {
  return new Date().getFullYear();
};

// Week numbers restart every season, so a bare "1" would have 2026's week 1 and
// 2027's week 1 sharing an id and colliding in the picks collection. The season
// is part of the id to keep it unique for as long as the app runs.
export const makeWeekId = (season: number, week: number) =>
  `${season}_week_${week}`;
