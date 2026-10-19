/* =============================================================================
   ELITE TENNIS — SPONSORSHIP PORTFOLIO · Amina Nurmukhan
   data.js — every editable fact, figure, image and link lives in this file.

   How placeholders work
   ---------------------
   Wrap any value you have NOT confirmed in TBD(...). It renders with a dashed
   gold underline and a "placeholder" tooltip so nobody mistakes it for a fact.
   When the value is real, remove the TBD(...) wrapper:

       coach: TBD("Coach name"),     // placeholder, marked on the page
       coach: "Name Surname",        // confirmed, shown normally

   Set settings.showPlaceholderMarks to false to hide the marks (e.g. for a
   final export) — but only once everything has been replaced.

   Sources for the facts below
   ---------------------------
   Supplied by the player's team (October 2026):
     · ITF ranking No. 389 as of 12 Oct 2026
     · ATF Under-12 — 1st place
     · Podium finishes on the Tennis Europe junior tour
     · Selected twice for Kazakhstan's under-12 national team
   Published in the press (name spelled "Nurmakhan" / «Нурмахан»):
     · zakon.kz, 11 Sep 2023 — singles and doubles titles at a Tennis Europe
       Category 1 under-14 event in Spain (final 6–2 6–4; doubles 6–1 6–0)
     · weproject.media, 6 Feb 2025 — No. 87 in the Tennis Europe U14 ranking
   Not confirmed (kept as TBD): age, playing hand, style, coach, training base.
   ========================================================================== */

/** Marks a value as an unconfirmed placeholder. */
function TBD(value) {
  return { value: value, placeholder: true };
}

const PORTFOLIO = {
  settings: {
    currency: "USD",          // any ISO 4217 code, e.g. "EUR", "KZT"
    locale: "en-US",          // number and date formatting, e.g. "ru-RU"
    season: "2027",
    showPlaceholderMarks: true
  },

  /* ---------------------------------------------------------------------------
     PLAYER
     ------------------------------------------------------------------------ */
  player: {
    firstName: "Amina",
    lastName: "Nurmukhan",
    initials: "AN",
    country: "Kazakhstan",
    nationality: "Kazakhstan",
    age: TBD("15"),                       // a stats site lists 13 Mar 2011 — confirm
    plays: TBD("Right-handed"),
    style: TBD("Aggressive baseliner"),
    coach: TBD("Coach name"),
    trainingBase: TBD("Academy, City"),
    highlight: "ATF Under-12 champion",   // short line on the cover
    tagline: "Built on discipline. Driven by ambition.",
    bio:
      "Amina Nurmukhan is a junior tennis player from Kazakhstan, ranked No. 389 by the ITF as of 12 October 2026. She won the ATF Under-12 title, was selected twice for Kazakhstan's under-12 national team, and has reached the podium on the Tennis Europe tour, including the singles and doubles titles at a Category 1 under-14 event in Spain in 2023.",
    motivation: TBD(
      "Next goal: turn junior results into a place in professional draws, with a season plan sponsors can follow step by step."
    ),
    statement: TBD("I measure progress one match, one session, one decision at a time.")
  },

  /* ---------------------------------------------------------------------------
     RANKING
     ------------------------------------------------------------------------ */
  ranking: {
    current: 389,
    tour: "ITF",
    category: TBD("Junior singles"),      // confirm: ITF junior or ITF World Tennis Tour
    date: "12 Oct 2026",
    careerHigh: TBD("Add career high")
  },

  /* The six figures on the Rankings sheet. Edit freely. */
  rankingStats: [
    { label: "Ranking date", value: "12 Oct 2026" },
    { label: "ITF career high", value: TBD("Add career high") },
    { label: "Tennis Europe U14", value: "No. 87 (Feb 2025)" },
    { label: "Asian title", value: "ATF Under-12 champion" },
    { label: "National team", value: "Kazakhstan U12, selected twice" },
    { label: "ITF titles", value: TBD("Add if any") }
  ],

  /* Real ranking history only, oldest first: { date: "YYYY-MM", rank: 512 }.
     Leave empty until you have it — the chart shows a clean empty state. */
  rankingHistory: [],

  achievements: [
    "ATF Under-12 champion",
    "Selected twice for Kazakhstan's under-12 national team",
    "Singles and doubles titles at a Tennis Europe Category 1 under-14 event in Spain, September 2023",
    "Podium finishes on the Tennis Europe junior tour",
    "No. 87 in the Tennis Europe under-14 ranking, February 2025"
  ],

  /* ---------------------------------------------------------------------------
     TOURNAMENT RESULTS
     date: "YYYY-MM-DD" or "YYYY-MM". Unknown values stay TBD(...).
     `example: true` rows are layout samples only (none at the moment).
     ------------------------------------------------------------------------ */
  results: [
    { date: "2023-09", tournament: "Tennis Europe U14, Category 1", country: "Spain", surface: TBD("Surface"), category: "TE U14 Cat. 1", round: "Final (singles)", result: "W 6–2 6–4" },
    { date: "2023-09", tournament: "Tennis Europe U14, Category 1", country: "Spain", surface: TBD("Surface"), category: "TE U14 Cat. 1", round: "Final (doubles)", result: "W 6–1 6–0" },
    { date: TBD("Add date"), tournament: "ATF Under-12", country: TBD("Country"), surface: TBD("Surface"), category: "ATF U12", round: "Champion", result: TBD("Add score") }
  ],
  /* Supplied season record. Leave null to show "add record". */
  winLoss: null,               // e.g. { wins: 24, losses: 17, season: "2026" }
  bestResult: "Tennis Europe U14 Cat. 1 champion, singles and doubles",

  /* ---------------------------------------------------------------------------
     GOALS — targets are aspirations, not guarantees.
     ------------------------------------------------------------------------ */
  goals: [
    {
      phase: "Short term",
      horizon: "2027 season",
      target: TBD("ITF ranking target to set"),
      items: [
        "Climb from No. 389 toward a realistic ranking target",
        "Play a selected international tournament schedule",
        "Raise consistency and match performance",
        "Strengthen physical preparation and recovery"
      ]
    },
    {
      phase: "Medium term",
      horizon: TBD("2–3 seasons"),
      target: TBD("Target level to set"),
      items: [
        "Move up to higher-grade junior and professional events",
        "Win more matches week to week",
        "Build a sustainable tournament calendar"
      ]
    },
    {
      phase: "Long-term vision",
      horizon: TBD("4+ seasons"),
      target: TBD("Career ranking target to set"),
      items: [
        "Reach the ranking targets set with the team",
        "Compete at progressively higher levels",
        "Build a sustainable professional career"
      ]
    }
  ],

  /* ---------------------------------------------------------------------------
     TOURNAMENT SCHEDULE & FUNDING — all amounts are ESTIMATES in settings.currency.
     Travel, accommodation and entry totals are summed from the schedule.
     ------------------------------------------------------------------------ */
  schedule: [
    { event: TBD("Event 1, to confirm"), location: TBD("City, Country"), date: TBD("Jan 2027"), surface: "Hard",  travel: 1200, accommodation: 700, entry: 45, other: 150 },
    { event: TBD("Event 2, to confirm"), location: TBD("City, Country"), date: TBD("Feb 2027"), surface: "Hard",  travel: 900,  accommodation: 650, entry: 45, other: 120 },
    { event: TBD("Event 3, to confirm"), location: TBD("City, Country"), date: TBD("Apr 2027"), surface: "Clay",  travel: 800,  accommodation: 600, entry: 45, other: 120 },
    { event: TBD("Event 4, to confirm"), location: TBD("City, Country"), date: TBD("May 2027"), surface: "Clay",  travel: 750,  accommodation: 600, entry: 45, other: 100 },
    { event: TBD("Event 5, to confirm"), location: TBD("City, Country"), date: TBD("Jul 2027"), surface: "Grass", travel: 1100, accommodation: 800, entry: 45, other: 150 },
    { event: TBD("Event 6, to confirm"), location: TBD("City, Country"), date: TBD("Sep 2027"), surface: "Hard",  travel: 1300, accommodation: 750, entry: 45, other: 160 }
  ],

  /* Annual costs not tied to a single event. */
  annualCosts: [
    { label: "Coaching and training", amount: 18000 },
    { label: "Fitness and recovery",  amount: 6000 },
    { label: "Equipment",             amount: 2500 },
    { label: "Other documented expenses", amount: 1500 }
  ],

  funding: {
    confirmed: 0,              // funding actually secured — keep 0 until signed
    sponsorshipTarget: null    // null = target equals the remaining gap
  },

  /* ---------------------------------------------------------------------------
     CONTACT — leave a field as TBD(...) or "" until it is real.
     Empty fields are left out of the document; the QR code appears only
     once itfProfile is a real https:// link.
     ------------------------------------------------------------------------ */
  contact: {
    name: TBD("Parent or manager name"),
    role: TBD("Management"),
    email: TBD("partnerships@example.com"),
    phone: TBD("+7 000 000 00 00"),
    itfProfile: "",            // full https:// URL — also used for the QR code
    website: "",
    instagram: "",             // full https:// URL
    linkedin: ""               // full https:// URL
  },

  /* ---------------------------------------------------------------------------
     IMAGES — replace `src` with Amina's own photos (e.g. "assets/images/cover.jpg")
     and set `sample: false`. Sample images carry an on-page note so a stock
     athlete is never presented as the player.
     ------------------------------------------------------------------------ */
  images: {
    cover:   { src: "https://images.unsplash.com/photo-1696661115319-a9b6801e2571", alt: "Tennis player waiting to return serve on a clay court under evening light", sample: true, credit: "Unsplash" },
    profile: { src: "https://images.unsplash.com/photo-1661474974379-0f24bee86ce0", alt: "Tennis player on a clay court seen from directly above", sample: true, credit: "Unsplash" },
    goals:   { src: "https://images.unsplash.com/photo-1548920168-70d61248a912", alt: "Tennis player serving on a hard court, seen from above", sample: true, credit: "Unsplash" },
    contact: { src: "https://images.unsplash.com/photo-1709403552725-97e0ba206cb8", alt: "Tennis player moving to the ball on a blue court", sample: true, credit: "Unsplash" }
  }
};
