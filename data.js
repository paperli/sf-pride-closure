/* SF Pride 2026 — Civic Center road-closure data
 *
 * Timeline origin = Friday, June 26, 2026, 00:00 PDT (2026-06-26T07:00:00Z).
 * All times below are expressed as "hours since origin":
 *   Fri 00:00 = 0 | Sat 00:00 = 24 | Sun 00:00 = 48 | Mon 00:00 = 72
 * Everything reopens Monday at 6:00 AM = hour 78.
 *
 * Coordinates were computed from OpenStreetMap street geometry
 * (true intersection points), so segments trace the real grid.
 */

const TZ = "America/Los_Angeles";
const ORIGIN_UTC = Date.UTC(2026, 5, 26, 7, 0, 0); // Fri Jun 26 2026 00:00 PDT
const TIMELINE_MIN = 0;     // Fri 12:00 AM
const TIMELINE_MAX = 80;    // Mon 8:00 AM (2h after full reopen)
const REOPEN_HOUR = 78;     // Mon 6:00 AM

// Pride 6-stripe flag palette — used as closure identity colors
const PRIDE = {
  red:    "#E40303",
  orange: "#FF8C00",
  yellow: "#FFED00",
  green:  "#008026",
  blue:   "#004DFF",
  violet: "#750787",
};

// Key event markers along the timeline (hours since origin)
const EVENTS = [
  { hour: 0.017, label: "Fri 12:01 AM", short: "Fri" },
  { hour: 20,    label: "Fri 8:00 PM",  short: "Fri PM" },
  { hour: 34.5,  label: "Sat 10:30 AM", short: "Sat" },
  { hour: 58.5,  label: "Sun 10:30 AM — Parade", short: "Parade" },
  { hour: 78,    label: "Mon 6:00 AM — Reopen", short: "Reopen" },
];

const REOPEN_LABEL = "Mon, Jun 29 · 6:00 AM";

const CLOSURES = [
  {
    id: "polk-mcallister-grove",
    street: "Polk Street",
    fromTo: "McAllister St → Grove St",
    startHour: 0.017,
    startLabel: "Fri, Jun 26 · 12:01 AM",
    color: PRIDE.yellow,
    path: [
      [37.780275, -122.418615], // Polk × McAllister
      [37.778490, -122.418254], // Polk × Grove
    ],
  },
  {
    id: "larkin-mcallister-market",
    street: "Larkin Street",
    fromTo: "McAllister St → Market St",
    startHour: 0.017,
    startLabel: "Fri, Jun 26 · 12:01 AM",
    color: PRIDE.blue,
    path: [
      [37.780499, -122.416990], // Larkin × McAllister
      [37.778685, -122.416621], // Larkin × Grove
      [37.777545, -122.416362], // Larkin × Market
    ],
  },
  {
    id: "fulton-hyde-larkin",
    street: "Fulton Street",
    fromTo: "Hyde St → Larkin St",
    startHour: 0.017,
    startLabel: "Fri, Jun 26 (time not specified)",
    note: "Source lists this under Friday closures without a start time.",
    color: PRIDE.red,
    path: [
      [37.779796, -122.415152], // Fulton × Hyde
      [37.779585, -122.416814], // Fulton × Larkin
    ],
  },
  {
    id: "grove-vanness-hyde",
    street: "Grove Street",
    fromTo: "Van Ness Ave → Hyde St",
    startHour: 0.017,
    startLabel: "Fri, Jun 26 (time not specified)",
    note: "Source lists this under Friday closures without a start time.",
    color: PRIDE.orange,
    path: [
      [37.778284, -122.419808], // Grove × Van Ness
      [37.778490, -122.418254], // Grove × Polk
      [37.778685, -122.416621], // Grove × Larkin
      [37.778891, -122.414956], // Grove × Hyde
    ],
  },
  {
    id: "polk-goldengate-hayes",
    street: "Polk Street",
    fromTo: "Golden Gate Ave → Hayes St",
    startHour: 20,
    startLabel: "Fri, Jun 26 · 8:00 PM",
    color: PRIDE.green,
    path: [
      [37.781242, -122.418811], // Polk × Golden Gate
      [37.780275, -122.418615], // Polk × McAllister
      [37.778490, -122.418254], // Polk × Grove
      [37.777516, -122.418064], // Polk × Hayes
    ],
  },
  {
    id: "larkin-goldengate-grove",
    street: "Larkin Street",
    fromTo: "Golden Gate Ave → Grove St",
    startHour: 20,
    startLabel: "Fri, Jun 26 · 8:00 PM",
    color: PRIDE.violet,
    path: [
      [37.781451, -122.417173], // Larkin × Golden Gate
      [37.780499, -122.416990], // Larkin × McAllister
      [37.778685, -122.416621], // Larkin × Grove
    ],
  },
  {
    id: "mcallister-vanness-leavenworth",
    street: "McAllister Street",
    fromTo: "Van Ness Ave → Leavenworth St",
    startHour: 20,
    startLabel: "Fri, Jun 26 · 8:00 PM",
    color: PRIDE.red,
    path: [
      [37.780076, -122.420398], // McAllister × Van Ness
      [37.780275, -122.418615], // McAllister × Polk
      [37.780499, -122.416990], // McAllister × Larkin
      [37.780726, -122.415339], // McAllister × Hyde
      [37.780933, -122.413693], // McAllister × Leavenworth
    ],
  },
  {
    id: "hyde-goldengate-market",
    street: "Hyde Street",
    fromTo: "Golden Gate Ave → Market St",
    startHour: 20,
    startLabel: "Fri, Jun 26 · 8:00 PM",
    color: PRIDE.blue,
    path: [
      [37.781660, -122.415527], // Hyde × Golden Gate
      [37.780726, -122.415339], // Hyde × McAllister
      [37.778891, -122.414956], // Hyde × Grove
      [37.778776, -122.414826], // Hyde × Market
    ],
  },
];

// attach shared reopen info
CLOSURES.forEach(c => { c.reopenHour = REOPEN_HOUR; c.reopenLabel = REOPEN_LABEL; });
