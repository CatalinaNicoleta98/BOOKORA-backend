import type { DemoUserLibrarySeed } from "../types";

export const demoUserLibraries: DemoUserLibrarySeed[] = [
  {
    userKey: "maya",
    entries: [
      {
        bookKey: "acotar",
        status: "finished_reading",
        formats: ["physical", "ebook"],
        rating: 4.5,
        reviewText: "Messy in the way I wanted it to be. Once the world opened up, I tore through the second half in a weekend.",
        customLists: ["favorites", "book-club"],
        monthsAgo: 5,
        startedMonthsAgo: 5.6,
        finishedMonthsAgo: 5,
        progressValue: 100,
        progressMax: 100,
        progressUnit: "percent"
      },
      {
        bookKey: "the-hobbit",
        status: "finished_reading",
        formats: ["physical"],
        rating: 5,
        reviewText: "Still impossibly cozy. The songs hit better when I am in the mood to let the book wander a little.",
        customLists: ["comfort-reads"],
        monthsAgo: 2,
        startedMonthsAgo: 2.5,
        finishedMonthsAgo: 2,
        progressValue: 310,
        progressMax: 310,
        progressUnit: "pages"
      },
      {
        bookKey: "project-hail-mary",
        status: "currently_listening",
        formats: ["audiobook"],
        monthsAgo: 0.8,
        startedMonthsAgo: 0.7,
        progressValue: 9,
        progressMax: 16,
        progressUnit: "hours"
      },
      {
        bookKey: "dune",
        status: "want_to_read",
        formats: ["ebook"],
        monthsAgo: 1.3,
        customLists: ["big-books-2026"]
      }
    ]
  },
  {
    userKey: "elias",
    entries: [
      {
        bookKey: "dune",
        status: "finished_reading",
        formats: ["ebook"],
        rating: 4,
        reviewText: "The politics and ecology absolutely worked for me. I admired it a little more than I loved it, which still counts for a lot.",
        customLists: ["sci-fi-keeps"],
        monthsAgo: 7,
        startedMonthsAgo: 8.2,
        finishedMonthsAgo: 7,
        progressValue: 100,
        progressMax: 100,
        progressUnit: "percent"
      },
      {
        bookKey: "nineteen-eighty-four",
        status: "finished_reading",
        formats: ["physical"],
        rating: 4.5,
        reviewText: "Bleak, sharp, and annoyingly impossible to stop thinking about once I finished.",
        monthsAgo: 3.2,
        startedMonthsAgo: 3.8,
        finishedMonthsAgo: 3.2,
        progressValue: 328,
        progressMax: 328,
        progressUnit: "pages"
      },
      {
        bookKey: "project-hail-mary",
        status: "finished_reading",
        formats: ["ebook", "audiobook"],
        rating: 5,
        reviewText: "Pure propulsion. The problem-solving stayed playful without losing the emotional punch.",
        customLists: ["recommend-to-everyone"],
        monthsAgo: 1.1,
        startedMonthsAgo: 1.8,
        finishedMonthsAgo: 1.1,
        progressValue: 496,
        progressMax: 496,
        progressUnit: "pages",
        completedViaAudiobook: true
      },
      {
        bookKey: "gone-girl",
        status: "on_break",
        formats: ["audiobook"],
        monthsAgo: 0.9,
        startedMonthsAgo: 0.9,
        pausedMonthsAgo: 0.5,
        progressValue: 5,
        progressMax: 16,
        progressUnit: "hours"
      }
    ]
  },
  {
    userKey: "zoe",
    entries: [
      {
        bookKey: "evelyn-hugo",
        status: "finished_reading",
        formats: ["ebook"],
        rating: 5,
        reviewText: "Absolutely understood the hype. Glamorous on the surface, lonely in all the places that mattered.",
        customLists: ["late-night-favorites"],
        monthsAgo: 4.5,
        startedMonthsAgo: 4.9,
        finishedMonthsAgo: 4.5,
        progressValue: 389,
        progressMax: 389,
        progressUnit: "pages"
      },
      {
        bookKey: "normal-people",
        status: "finished_reading",
        formats: ["physical"],
        rating: 4,
        reviewText: "Tender and frustrating in equal measure. I highlighted enough lines to make the margins look guilty.",
        monthsAgo: 1.7,
        startedMonthsAgo: 2.1,
        finishedMonthsAgo: 1.7,
        progressValue: 273,
        progressMax: 273,
        progressUnit: "pages"
      },
      {
        bookKey: "gone-girl",
        status: "finished_reading",
        formats: ["audiobook"],
        rating: 4.5,
        reviewText: "Listening to this was the correct life choice. Every chapter felt like being handed one more bad idea.",
        monthsAgo: 2.7,
        startedMonthsAgo: 3.1,
        finishedMonthsAgo: 2.7,
        progressValue: 16,
        progressMax: 16,
        progressUnit: "hours",
        completedViaAudiobook: true
      },
      {
        bookKey: "pride-and-prejudice",
        status: "want_to_read",
        formats: ["physical"],
        monthsAgo: 0.6,
        customLists: ["classics-i-swear-i-will-read"]
      }
    ]
  },
  {
    userKey: "noah",
    entries: [
      {
        bookKey: "the-hunger-games",
        status: "finished_reading",
        formats: ["physical"],
        rating: 4.5,
        reviewText: "Flew by. The momentum never let up, and the satire still lands harder than I remembered.",
        monthsAgo: 6.3,
        startedMonthsAgo: 6.8,
        finishedMonthsAgo: 6.3,
        progressValue: 374,
        progressMax: 374,
        progressUnit: "pages"
      },
      {
        bookKey: "gone-girl",
        status: "did_not_finish",
        formats: ["ebook"],
        notes: "Compelling, but I bounced off the characters after the midway twist.",
        monthsAgo: 1.9,
        startedMonthsAgo: 2.2,
        finishedMonthsAgo: 1.9,
        progressValue: 46,
        progressMax: 100,
        progressUnit: "percent"
      },
      {
        bookKey: "the-book-thief",
        status: "currently_reading",
        formats: ["physical"],
        monthsAgo: 0.5,
        startedMonthsAgo: 0.45,
        progressValue: 221,
        progressMax: 552,
        progressUnit: "pages"
      }
    ]
  },
  {
    userKey: "sana",
    entries: [
      {
        bookKey: "pride-and-prejudice",
        status: "finished_reading",
        formats: ["physical", "audiobook"],
        rating: 5,
        reviewText: "A reread that felt even funnier this time. The social precision is so deliciously mean.",
        customLists: ["all-time-favorites", "book-club"],
        monthsAgo: 8.5,
        startedMonthsAgo: 9.4,
        finishedMonthsAgo: 8.5,
        progressValue: 432,
        progressMax: 432,
        progressUnit: "pages",
        completedViaAudiobook: true
      },
      {
        bookKey: "the-book-thief",
        status: "finished_reading",
        formats: ["ebook"],
        rating: 4.5,
        reviewText: "Beautifully told without ever feeling precious. That ending still wrecks me.",
        monthsAgo: 2.4,
        startedMonthsAgo: 3,
        finishedMonthsAgo: 2.4,
        progressValue: 552,
        progressMax: 552,
        progressUnit: "pages"
      },
      {
        bookKey: "harry-potter-1",
        status: "finished_reading",
        formats: ["audiobook"],
        rating: 4,
        reviewText: "Comfort reading in audio form. Exactly the right pick for a busy week.",
        monthsAgo: 0.9,
        startedMonthsAgo: 1.2,
        finishedMonthsAgo: 0.9,
        progressValue: 8,
        progressMax: 8,
        progressUnit: "hours",
        completedViaAudiobook: true
      },
      {
        bookKey: "normal-people",
        status: "currently_reading",
        formats: ["ebook"],
        monthsAgo: 0.3,
        startedMonthsAgo: 0.28,
        progressValue: 54,
        progressMax: 273,
        progressUnit: "pages"
      },
      {
        bookKey: "dune",
        status: "want_to_read",
        formats: ["physical"],
        monthsAgo: 0.2,
        customLists: ["summer-doorstoppers"]
      }
    ]
  },
  {
    userKey: "luca",
    entries: [
      {
        bookKey: "project-hail-mary",
        status: "finished_reading",
        formats: ["audiobook"],
        rating: 5,
        reviewText: "This absolutely sings in audio. I kept sitting in parked cars to finish scenes.",
        monthsAgo: 3.6,
        startedMonthsAgo: 4.1,
        finishedMonthsAgo: 3.6,
        progressValue: 16,
        progressMax: 16,
        progressUnit: "hours",
        completedViaAudiobook: true
      },
      {
        bookKey: "the-hobbit",
        status: "finished_reading",
        formats: ["audiobook"],
        rating: 4.5,
        reviewText: "A very good narrator can make a familiar adventure feel newly mischievous.",
        monthsAgo: 1.4,
        startedMonthsAgo: 1.8,
        finishedMonthsAgo: 1.4,
        progressValue: 11,
        progressMax: 11,
        progressUnit: "hours",
        completedViaAudiobook: true
      },
      {
        bookKey: "the-hunger-games",
        status: "currently_listening",
        formats: ["audiobook"],
        monthsAgo: 0.4,
        startedMonthsAgo: 0.35,
        progressValue: 6,
        progressMax: 10,
        progressUnit: "hours"
      },
      {
        bookKey: "acotar",
        status: "want_to_read",
        formats: ["audiobook"],
        monthsAgo: 0.25
      }
    ]
  },
  {
    userKey: "claire",
    entries: [
      {
        bookKey: "pride-and-prejudice",
        status: "finished_reading",
        formats: ["physical"],
        rating: 4.5,
        reviewText: "The dialogue sparkles. Austen is still the queen of making restraint feel dramatic.",
        monthsAgo: 10,
        startedMonthsAgo: 10.6,
        finishedMonthsAgo: 10,
        progressValue: 432,
        progressMax: 432,
        progressUnit: "pages"
      },
      {
        bookKey: "normal-people",
        status: "finished_reading",
        formats: ["ebook"],
        rating: 3.5,
        reviewText: "Sharp and intimate, though I admired parts of it more than I emotionally connected with them.",
        monthsAgo: 5.8,
        startedMonthsAgo: 6.1,
        finishedMonthsAgo: 5.8,
        progressValue: 273,
        progressMax: 273,
        progressUnit: "pages"
      },
      {
        bookKey: "evelyn-hugo",
        status: "on_break",
        formats: ["physical"],
        monthsAgo: 0.9,
        startedMonthsAgo: 1,
        pausedMonthsAgo: 0.6,
        progressValue: 141,
        progressMax: 389,
        progressUnit: "pages"
      },
      {
        bookKey: "dune",
        status: "want_to_read",
        formats: ["ebook"],
        monthsAgo: 0.1,
        customLists: ["eventually-when-my-brain-is-rested"]
      }
    ]
  },
  {
    userKey: "jasper",
    entries: [
      {
        bookKey: "gone-girl",
        status: "finished_reading",
        formats: ["physical"],
        rating: 4,
        reviewText: "Mean in a way that felt earned. I can see why people inhale this one.",
        monthsAgo: 7.1,
        startedMonthsAgo: 7.4,
        finishedMonthsAgo: 7.1,
        progressValue: 432,
        progressMax: 432,
        progressUnit: "pages"
      },
      {
        bookKey: "the-book-thief",
        status: "want_to_read",
        formats: ["ebook"],
        monthsAgo: 1.2
      },
      {
        bookKey: "harry-potter-1",
        status: "currently_reading",
        formats: ["physical"],
        monthsAgo: 0.15,
        startedMonthsAgo: 0.12,
        progressValue: 68,
        progressMax: 320,
        progressUnit: "pages"
      }
    ]
  }
];
