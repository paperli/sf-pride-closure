/* SF Pride 2026 — road-closure data (Civic Center festival + Parade route)
 *
 * Timeline origin = Thursday, June 25, 2026, 00:00 PDT (2026-06-25T07:00:00Z).
 * Times are "hours since origin":
 *   Thu 00:00 = 0 | Fri = 24 | Sat = 48 | Sun = 72 | Mon = 96 | Mon 06:00 = 102
 *
 * Sources cross-checked:
 *   • SFMTA — SF Pride Parade project page + Pride Week 2026 Travel & Transit Impacts
 *   • KQED — SF Pride 2026 parade route / street closures guide
 * Segment geometry computed from OpenStreetMap intersection points.
 * A few minor SoMa endpoints are interpolated and flagged. Confirm with SFMTA.
 */

const TZ = "America/Los_Angeles";
const ORIGIN_UTC = Date.UTC(2026, 5, 25, 7, 0, 0); // Thu Jun 25 2026 00:00 PDT
const TIMELINE_MIN = 0;    // Thu 12:00 AM
const TIMELINE_MAX = 108;  // Mon 12:00 PM

const PRIDE = {
  red: "#E40303", orange: "#FF8C00", yellow: "#F5C500",
  green: "#008026", blue: "#004DFF", violet: "#750787",
};
const RAINBOW = [PRIDE.red, PRIDE.orange, PRIDE.yellow, PRIDE.green, PRIDE.blue, PRIDE.violet];

// Category metadata (controls list grouping + order)
const CATS = {
  festival: { label: "Civic Center festival", sub: "Closed through Mon 6 AM" },
  sunday:   { label: "Sunday parade-day closures", sub: "Sunday, June 28 only" },
  parade:   { label: "Parade route", sub: "Market St · Sunday" },
};

// Quick-jump moments (hours since origin)
const EVENTS = [
  { hour: 19,   label: "Thu 7:00 PM" },
  { hour: 44,   label: "Fri 8:00 PM" },
  { hour: 60,   label: "Sat (festival)" },
  { hour: 82.5, label: "Sun 10:30 AM — Parade" },
  { hour: 102,  label: "Mon 6:00 AM — Reopen" },
];

// Common labels
const LBL = {
  thu7:   "Thu, Jun 25 · 7:00 PM",
  fri001: "Fri, Jun 26 · 12:01 AM",
  fri8:   "Fri, Jun 26 · 8:00 PM",
  friTBD: "Fri, Jun 26 (time not specified)",
  sun0:   "Sun, Jun 28 · all day",
  sun6:   "Sun, Jun 28 · 6:00 AM",
  sun930: "Sun, Jun 28 · 9:30 AM",
  monReopen: "Mon, Jun 29 · 6:00 AM",
  sun5:   "Sun, Jun 28 · 5:00 PM",
  sunEve: "Sun, Jun 28 · evening (after parade)",
};
const H = { thu7: 19, fri001: 24.017, fri8: 44, sun0: 72, sun6: 78, sun930: 81.5, sun5: 89, sunEve: 90, monReopen: 102 };

const CLOSURES = [
  /* ============ CIVIC CENTER FESTIVAL — reopen Mon, Jun 29 · 6 AM ============ */
  { id: "grove-polk-larkin", cat: "festival", street: "Grove St", fromTo: "Polk St → Larkin St",
    startHour: H.thu7, startLabel: LBL.thu7, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.violet, note: "First Civic Center block to close (Thursday evening).",
    path: [[37.778490,-122.418254],[37.778685,-122.416621]] },

  { id: "grove-vanness-hyde", cat: "festival", street: "Grove St", fromTo: "Van Ness Ave → Hyde St",
    startHour: H.fri001, startLabel: LBL.friTBD, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.violet, note: "Listed under Friday closures without a specific time.",
    path: [[37.778284,-122.419808],[37.778490,-122.418254],[37.778685,-122.416621],[37.778891,-122.414956]] },

  { id: "fulton-hyde-larkin", cat: "festival", street: "Fulton St", fromTo: "Hyde St → Larkin St",
    startHour: H.fri001, startLabel: LBL.friTBD, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.blue, note: "Listed under Friday closures without a specific time.",
    path: [[37.779796,-122.415152],[37.779585,-122.416814]] },

  { id: "polk-mcallister-grove", cat: "festival", street: "Polk St", fromTo: "McAllister St → Grove St",
    startHour: H.fri001, startLabel: LBL.fri001, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.red,
    path: [[37.780275,-122.418615],[37.778490,-122.418254]] },

  { id: "polk-goldengate-hayes", cat: "festival", street: "Polk St", fromTo: "Golden Gate Ave → Hayes St",
    startHour: H.fri8, startLabel: LBL.fri8, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.red,
    path: [[37.781242,-122.418811],[37.780275,-122.418615],[37.778490,-122.418254],[37.777516,-122.418064]] },

  { id: "larkin-mcallister-market", cat: "festival", street: "Larkin St", fromTo: "McAllister St → Market St",
    startHour: H.fri001, startLabel: LBL.fri001, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.orange,
    path: [[37.780499,-122.416990],[37.778685,-122.416621],[37.777545,-122.416362]] },

  { id: "larkin-goldengate-grove", cat: "festival", street: "Larkin St", fromTo: "Golden Gate Ave → Grove St",
    startHour: H.fri8, startLabel: LBL.fri8, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.orange,
    path: [[37.781451,-122.417173],[37.780499,-122.416990],[37.778685,-122.416621]] },

  { id: "mcallister-vanness-leavenworth", cat: "festival", street: "McAllister St", fromTo: "Van Ness Ave → Leavenworth St",
    startHour: H.fri8, startLabel: LBL.fri8, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.yellow,
    path: [[37.780076,-122.420398],[37.780275,-122.418615],[37.780499,-122.416990],[37.780726,-122.415339],[37.780933,-122.413693]] },

  { id: "hyde-goldengate-market", cat: "festival", street: "Hyde St", fromTo: "Golden Gate Ave → Market St",
    startHour: H.fri8, startLabel: LBL.fri8, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.green,
    path: [[37.781660,-122.415527],[37.780726,-122.415339],[37.778891,-122.414956],[37.778776,-122.414826]] },

  /* ============ SUNDAY PARADE-DAY (Jun 28) ============ */
  // All-day Sunday — these extend the festival grid to its full length.
  { id: "polk-turk-market", cat: "sunday", street: "Polk St", fromTo: "Turk St → Market St",
    startHour: H.sun0, startLabel: LBL.sun0, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.red, note: "Full-length closure on parade day.",
    path: [[37.782174,-122.419005],[37.781242,-122.418811],[37.780275,-122.418615],[37.778490,-122.418254],[37.777516,-122.418064],[37.776582,-122.417574]] },

  { id: "larkin-turk-market", cat: "sunday", street: "Larkin St", fromTo: "Turk St → Market St",
    startHour: H.sun0, startLabel: LBL.sun0, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.orange, note: "Full-length closure on parade day.",
    path: [[37.782384,-122.417360],[37.781451,-122.417173],[37.780499,-122.416990],[37.778685,-122.416621],[37.777545,-122.416362]] },

  { id: "hyde-turk-market", cat: "sunday", street: "Hyde St", fromTo: "Turk St → Market St",
    startHour: H.sun0, startLabel: LBL.sun0, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.green, note: "Full-length closure on parade day.",
    path: [[37.782593,-122.415716],[37.781660,-122.415527],[37.780726,-122.415339],[37.778891,-122.414956],[37.778776,-122.414826]] },

  { id: "goldengate-vanness-leavenworth", cat: "sunday", street: "Golden Gate Ave", fromTo: "Van Ness Ave → Leavenworth St",
    startHour: H.sun0, startLabel: LBL.sun0, reopenHour: H.monReopen, reopenLabel: LBL.monReopen,
    color: PRIDE.blue,
    path: [[37.781046,-122.420357],[37.781242,-122.418811],[37.781451,-122.417173],[37.781660,-122.415527],[37.781870,-122.413882]] },

  // Sunday 12 a.m. – 5 p.m.
  { id: "leavenworth-mcallister-market", cat: "sunday", street: "Leavenworth St", fromTo: "McAllister St → Market St",
    startHour: H.sun0, startLabel: "Sun, Jun 28 · 12:00 AM – 5:00 PM", reopenHour: H.sun5, reopenLabel: LBL.sun5,
    color: PRIDE.violet, note: "South end interpolated (Leavenworth meets Market near 7th).",
    path: [[37.780933,-122.413693],[37.779561,-122.413700]] },

  { id: "sutter-sansome-market", cat: "sunday", street: "Sutter St", fromTo: "Sansome St → Market St",
    startHour: H.sun0, startLabel: "Sun, Jun 28 · 12:00 AM – 5:00 PM", reopenHour: H.sun5, reopenLabel: LBL.sun5,
    color: PRIDE.blue,
    path: [[37.790250,-122.400589],[37.790312,-122.400097]] },

  { id: "sansome-sutter-bush", cat: "sunday", street: "Sansome St", fromTo: "Sutter St → Bush St (NB only)",
    startHour: H.sun0, startLabel: "Sun, Jun 28 · 12:00 AM – 5:00 PM", reopenHour: H.sun5, reopenLabel: LBL.sun5,
    color: PRIDE.violet, note: "Northbound lanes only.",
    path: [[37.790250,-122.400589],[37.791182,-122.400773]] },

  // Sunday 6 a.m. – 5 p.m. (downtown staging / disassembly)
  { id: "steuart-market-howard", cat: "sunday", street: "Steuart St", fromTo: "Market St → Howard St",
    startHour: H.sun6, startLabel: "Sun, Jun 28 · 6:00 AM – 5:00 PM", reopenHour: H.sun5, reopenLabel: LBL.sun5,
    color: PRIDE.orange,
    path: [[37.794446,-122.394831],[37.792000,-122.391652]] },

  { id: "spear-market-folsom", cat: "sunday", street: "Spear St", fromTo: "Market St → Folsom St",
    startHour: H.sun6, startLabel: "Sun, Jun 28 · 6:00 AM – 5:00 PM", reopenHour: H.sun5, reopenLabel: LBL.sun5,
    color: PRIDE.green, note: "Cross-street intersections remain open. South end interpolated.",
    path: [[37.793813,-122.395680],[37.789926,-122.391181]] },

  { id: "main-market-folsom", cat: "sunday", street: "Main St", fromTo: "Market St → Folsom St",
    startHour: H.sun6, startLabel: "Sun, Jun 28 · 6:00 AM – 5:00 PM", reopenHour: H.sun5, reopenLabel: LBL.sun5,
    color: PRIDE.red, note: "Cross-street intersections remain open.",
    path: [[37.793276,-122.396360],[37.789389,-122.391861]] },

  { id: "beale-market-mission", cat: "sunday", street: "Beale St", fromTo: "Market St → Mission St",
    startHour: H.sun6, startLabel: "Sun, Jun 28 · 6:00 AM – 5:00 PM", reopenHour: H.sun5, reopenLabel: LBL.sun5,
    color: PRIDE.blue, note: "Parade step-off is here, at Beale & Market.",
    path: [[37.792440,-122.397404],[37.791160,-122.395825]] },

  { id: "beale-mission-howard", cat: "sunday", street: "Beale St", fromTo: "Mission St → Howard St",
    startHour: H.sun6, startLabel: "Sun, Jun 28 · 6:00 AM – 5:00 PM", reopenHour: H.sun5, reopenLabel: LBL.sun5,
    color: PRIDE.blue, note: "Traffic lanes only — Muni-only lane stays open.",
    path: [[37.791160,-122.395825],[37.789903,-122.394311]] },

  /* ============ PARADE ROUTE — the spine ============ */
  { id: "market-parade", cat: "parade", street: "Market St", fromTo: "Beale St → 9th St", rainbow: true,
    startHour: H.sun930, startLabel: LBL.sun930, reopenHour: H.sunEve, reopenLabel: LBL.sunEve,
    note: "Parade steps off 10:30 AM at Beale & Market. All Market intersections close to cross-traffic; Market 8th–9th closes earlier, at 6 AM.",
    path: [[37.792440,-122.397404],[37.789284,-122.401398],[37.787676,-122.403436],[37.785714,-122.405916],
           [37.784013,-122.408071],[37.782207,-122.410356],[37.780488,-122.412528],[37.778720,-122.414764],[37.777499,-122.416308]] },
];
