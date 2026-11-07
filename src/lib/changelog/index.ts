import { isAnnouncementActive } from "./announcement";

export {
  CHANGELOG_ANNOUNCEMENT_DURATION_MS,
  CHANGELOG_DISMISSAL_STORAGE_KEY,
} from "./announcement";

export interface ChangelogEntry {
  version: string;
  publishedAt: string;
  title: string;
  summary: string;
  groups: readonly ChangelogGroup[];
}

export interface ChangelogGroup {
  title: string;
  description?: string;
  changes?: readonly ChangelogChange[];
  tables?: readonly ChangelogTable[];
  note?: string;
}

export type ChangelogChange =
  | string
  | {
      segments: readonly (string | ChangelogLink)[];
    };

export interface ChangelogLink {
  text: string;
  href: string;
}

export interface ChangelogTable {
  caption: string;
  columns: readonly string[];
  rows: readonly {
    label: string;
    values: readonly string[];
  }[];
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    version: "2.0.3",
    publishedAt: "2026-10-25T00:00:00.000+08:00",
    title: "A board that fits your screen, and your rank on every score",
    summary:
      "Every part of the game now fits your screen, from the smallest iPhone to a laptop, with nothing cut off. And when you send a score to the leaderboard, you see right away where it ranks.",
    groups: [
      {
        title: "Play on any screen",
        changes: [
          "The board is as big as your screen allows, with every button in view.",
          "The rest of the site steps out of the way while you play. Tap the X whenever you want to leave the round.",
          "White and black pieces are both ready to place, so you never switch between them. Submit is right beside them.",
          "On a laptop, your pieces sit right beside the board.",
        ],
      },
      {
        title: "Start a round faster",
        changes: [
          "On a phone, Start round is always in reach at the bottom of the screen, with a quick summary of your round.",
          "On a laptop, the board sits beside your settings, so you see everything at once.",
          "Today's board shows its pieces, its study time and how long it is still open before you start.",
        ],
      },
      {
        title: "Your results at a glance",
        changes: [
          "On a phone, your board now appears right under your score. On a laptop, the whole board stays in view, with your score and Next round beside it.",
          "Side by side fits both boards on the first screen, so you can compare them in one look.",
          "Your stats now take about half the space.",
        ],
      },
      {
        title: "Know where you rank",
        changes: [
          "After a round, you are invited to add your score to the leaderboard, with Share result and View leaderboard right alongside.",
          "Once you submit, you see your rank worldwide, and in your country if you choose one.",
          "Beat your best and you will know it is a new personal best. If a leaderboard still has room, you will know your score makes the cut.",
          "Your name is filled in for you next time.",
        ],
      },
    ],
  },
  {
    version: "2.0.2",
    publishedAt: "2026-10-23T17:30:00.000+08:00",
    title: "Set up a round on the board, and see your board beside the position",
    summary:
      "A small update. You now pick a round while watching the board you will get, and the result screen puts your board beside the position again.",
    groups: [
      {
        title: "Set up your round on the board",
        changes: [
          "The sliders are gone. The setup card now shows a live board with exactly as many pieces as you picked, and a ring around it that fills with your study time.",
          "Use the − and + buttons to change the pieces and the time. Time goes up by 1 second to 10 seconds, then by 5 seconds to 60.",
          "Easy, Medium, Hard and Grandmaster sit in one row above the board.",
          "A line under the board sums up the round, such as \"Medium, 6 pcs / 10s\", with the board's rating and the score to expect. Tap Rating details for the full preview.",
        ],
      },
      {
        title: "Your board beside the position",
        changes: [
          "After a round, Your board shows what you placed, marked correct or wrong. The position sits beside it, with the pieces you missed outlined in red.",
          "Prefer every mark on one board? Tap One board above the boards. The game remembers your choice for later rounds.",
          "A perfect round or an empty board opens on One board, since side by side would show nothing new. You can still switch.",
        ],
      },
      {
        title: "A lighter leaderboard",
        changes: [
          {
            segments: [
              "The ",
              { text: "leaderboard", href: "/leaderboard" },
              " page is about a third smaller. It loads the Medium board first, and each other board loads when you open its tab.",
            ],
          },
        ],
      },
    ],
  },
  {
    version: "2.0.1",
    publishedAt: "2026-10-21T23:00:00.000+08:00",
    title: "Blindfold mode, a rating chart, and a smarter result screen",
    summary:
      "A week of updates since 2.0. You can now play blindfold, watch your rating climb on a chart, and get a one-tap Next round after every result. Everything also loads and plays faster.",
    groups: [
      {
        title: "Play blindfold",
        description: "Study the position as text instead of pieces, then rebuild it on an empty board.",
        changes: [
          "Turn on Blindfold in the round settings. During study the board stays empty and you see the position written out. Each side's pieces are listed in K, Q, R, B, N order, then the pawns by square.",
          "Rebuilding and scoring work the same as a normal round.",
          {
            segments: [
              "Blindfold scores have their own leaderboard, with a Board or Blindfold switch at the top of the ",
              { text: "leaderboard", href: "/leaderboard" },
              ". They never mix with board scores.",
            ],
          },
          {
            segments: [
              "The ",
              { text: "blindfold guide", href: "/learn/blindfold-chess-training-for-beginners" },
              " now ends with a blindfold round to try.",
            ],
          },
        ],
      },
      {
        title: "Watch your rating move",
        changes: [
          {
            segments: [
              "A new Rating over time card on your ",
              { text: "dashboard", href: "/dashboard" },
              " shows your rating after every rated round. It also shows how far it moved in the last 7 days, and rings your peak. It says New peak when your latest round set one.",
            ],
          },
          "The accuracy and recall pace charts are redrawn. Each round is a faint dot behind a smooth 5-round average, your best round is ringed, and accuracy has a line at the 70% win mark.",
          "Played times now show in your own time zone. Before, a round played early in the morning could show up as the day before.",
        ],
      },
      {
        title: "A dashboard that tells you what to do next",
        changes: [
          "The locked figures now sit in one short Unlocks next list, nearest first. Each one says exactly what it still needs, such as \"4 more rounds at 6 pieces, 10 s\", with a button to play it.",
          "The top of the dashboard leads with your day streak and today's daily board.",
          "If your browser might clear your record, a quiet card offers to download a copy in one click.",
        ],
      },
      {
        title: "One clear next step after every round",
        changes: [
          "The result screen has one main button, Next round, and it shows the board it will start, such as \"7 pcs / 10s\". It adds a piece after a round of 90% or better, takes one away under 50%, and otherwise repeats the board.",
          "On a phone, the button stays pinned to the bottom of the screen, so you never scroll to find it.",
          "Try again and Change settings sit just below. Submit, Share and the leaderboard link fold under More options.",
          "The submit prompt only appears when your score would actually make a full leaderboard.",
          "When a wrong piece sits on a square that needed a different piece, that square now splits in two. Your piece shows in the red half, and the right piece in the green half.",
        ],
      },
      {
        title: "Easier to start",
        changes: [
          "Every round you open from a link, a guide or the home page now waits on a short card with one line of rules and a Start button. Then it counts 3, 2, 1. Your study time never starts before you are ready.",
          "The Done button during study is now called Hide board, which says what it does.",
          "The \"Thanks for playing\" feedback box now waits until you have played a few rounds. It never interrupts your first result.",
          {
            segments: [
              "Every ",
              { text: "Learn", href: "/learn" },
              " guide starts with a round to play near the top, sized to you. New players get 4 pieces for 10 seconds, and returning players get the board the setup card would suggest.",
            ],
          },
        ],
      },
      {
        title: "Faster and smoother",
        changes: [
          "The game reacts faster to taps and drags. Its slowest moment went from 208 ms to 144 ms on a slowed-down phone in our tests.",
          "The daily leaderboard loads in about a quarter of the time, and leaderboard tabs switch at once.",
          "Pages in Russian, Hindi, Vietnamese and other languages no longer jump when their fonts arrive.",
          "Sounds load the first time they play, so pages open lighter.",
          "A quickly flicked piece now lands where you let go of it.",
          "On a phone inside another app's browser, such as ChatGPT's, the board no longer sits low with pieces hidden under the app's toolbar.",
        ],
      },
      {
        title: "Quieter sounds on iPhone",
        changes: [
          "Game sounds now play at 5% by default, down from 10%.",
          "On iPhone and iPad the volume setting now actually works. Before, those devices played every sound at full volume.",
          "On iPhone, game sounds now follow the silent switch. If your phone is on silent, the game is too.",
        ],
      },
      {
        title: "More to read and learn",
        changes: [
          {
            segments: [
              "A new ",
              { text: "data page", href: "/data" },
              " shares how well players remember positions, from 3,734 rounds. With 6 pieces and 10 seconds, the average is 48%, so if that board feels hard, you are in good company.",
            ],
          },
          {
            segments: [
              "The ",
              { text: "game page", href: "/game" },
              " now explains what a chess memory test is and how your score is counted.",
            ],
          },
          "Four comparison pages show how Memory Chess stacks up against DarkSquares, the Lichess coordinate trainer, and Lichess and Chess.com for visualization. They say plainly where each one is the better choice.",
          "Eight popular guides now open with a straight answer and a number.",
          "A new guide explains the rules of the wooden Memory Chess board game, for anyone who came looking for the toy.",
          "Five guides are now in Russian, Brazilian Portuguese, French, German and Spanish.",
          "Learn search no longer treats a bare number such as \"20\" as a strong match.",
        ],
      },
      {
        title: "Smaller things you might notice",
        changes: [
          {
            segments: [
              "Join the Memory Chess community on ",
              { text: "Telegram", href: "https://t.me/TheMemoryChess" },
              ". The link sits in the footer, on the daily board and on your dashboard once you have played a few rounds.",
            ],
          },
          "Copy caption and Copy image say \"Copied\" on the button itself.",
          "Translation fixes in 20 languages, including a doubled \"de de Groot\" in French, Spanish and Italian.",
          "The data table shows a soft shadow when it has more columns to scroll to.",
        ],
        note: "Thank you for playing and for every note in the feedback box. Keep them coming.",
      },
    ],
  },
  {
    version: "2.0.0",
    publishedAt: "2026-10-14T20:45:00.000+08:00",
    title: "Memory Chess 2.0: a daily board, your own dashboard, and a whole new look",
    summary:
      "The biggest update since launch. There is a new board every day that everyone plays, a dashboard that shows how your memory is changing, a result screen that tells you what each round did to your numbers, and a fresh design in all 24 languages.",
    groups: [
      {
        title: "A new board every day",
        description:
          "Once a day, everyone gets the same position. You get one try, and today's top scores sit on their own leaderboard.",
        changes: [
          {
            segments: [
              "Open the ",
              { text: "daily board", href: "/daily" },
              " to play. The position stays hidden until you start, so nobody gets a head start.",
            ],
          },
          "The week has a rhythm: a gentle board on Monday, a little harder each day, a speed test on Saturday and one big board on Sunday.",
          "The game screen shows a countdown to the next board, and your dashboard shows a dot when today's board is waiting.",
          "The leaderboard has a new Daily tab, with the reset time shown in your own time zone.",
        ],
        tables: [
          {
            caption: "What each day asks of you",
            columns: ["Pieces", "Time to look"],
            rows: [
              { label: "Monday", values: ["4 to 5", "12 seconds"] },
              { label: "Tuesday", values: ["5 to 6", "10 seconds"] },
              { label: "Wednesday", values: ["6 to 7", "10 seconds"] },
              { label: "Thursday", values: ["7 to 8", "9 seconds"] },
              { label: "Friday", values: ["8 to 9", "8 seconds"] },
              { label: "Saturday", values: ["6 to 12", "2 to 6 seconds"] },
              { label: "Sunday", values: ["12 to 32", "12 seconds"] },
            ],
          },
        ],
      },
      {
        title: "Your dashboard",
        description: "Every number the game knows about your memory, on one page that grows as you play.",
        changes: [
          {
            segments: [
              "The new ",
              { text: "Dashboard", href: "/dashboard" },
              " shows your skill rating and which way it is heading, your memory span, how many pieces you hold, your recall pace, your accuracy, your win streak, the days you have played and your recent rounds.",
            ],
          },
          "Figures that need a few more rounds say exactly what they are waiting for, with a button to play the round that unlocks them.",
          "A small Day chip in the header counts your streak of days played. Tap it to open your dashboard from any page.",
          "Everything is kept on your own device. You can download it as a file and bring it back on another browser.",
        ],
      },
      {
        title: "See what every round did",
        changes: [
          "After each round, the result screen lists your dashboard figures before and after, with a green arrow when a number got better and a red one when it slipped.",
          "A short note at the top tells you your updated stats are waiting just below, with a button that takes you straight there.",
          "Your win streak now counts properly and your round history is kept.",
        ],
      },
      {
        title: "A skill rating that moves both ways",
        description:
          "The old rating only ever went up, so every player drifted toward the top. It has been rebuilt, and everyone starts again at 1000.",
        changes: [
          "Every board has a rating. More pieces count most, then a shorter look at the board, then a faster rebuild. Your rating is the board you recall about 70% of.",
          "Each round compares your accuracy with what your rating expects on that board. Do better and it rises. Do worse and it falls. A 90% round counts as 90%, and a round of 40% or less never raises it.",
          "New players start at 1000 with a provisional rating that moves a lot, so it finds your level within a few rounds. It settles as the game learns you, and the setup card says Provisional rating until it has.",
          "The setup card shows the accuracy your rating expects on the board you picked, the most a perfect round can earn and the most a miss can cost. Suggested board sets the sliders to one you should clear about three times in four, or half the time while your rating is provisional.",
          "A harder board earns more when you clear it and costs less when you miss it. An easier one earns little and costs more. Once you clear all 32 pieces, a shorter look and a faster rebuild keep raising it.",
          "Your first empty board each day is a free skip and leaves your rating alone. Review rounds are still not rated. The daily board is.",
        ],
        tables: [
          {
            caption: "What one round does to a settled rating of 1,200, rebuilding at an everyday pace",
            columns: ["Board", "Expected accuracy", "Perfect", "80%", "50%", "Empty"],
            rows: [
              { label: "Easy, 2 pieces for 10 seconds", values: ["99%", "0", "−4", "−11", "−22"] },
              { label: "Medium, 6 pieces for 10 seconds", values: ["82%", "+4", "0", "−7", "−18"] },
              { label: "Suggested, 7 pieces for 10 seconds", values: ["75%", "+6", "+1", "−6", "−19"] },
              { label: "Hard, 12 pieces for 8 seconds", values: ["36%", "+26", "+18", "+5", "−15"] },
              { label: "Grandmaster, 20 pieces for 5 seconds", values: ["9%", "+50", "+46", "+26", "−6"] },
            ],
          },
        ],
        note: "Easy boards cost the most when you slip, because your rating already expects them. Hard boards pay the most, and a miss there costs little.",
      },
      {
        title: "Share a round, and let friends watch it back",
        changes: [
          "Share a result or your dashboard as an image card. Post it to X, Facebook, LinkedIn, Reddit, WhatsApp, Threads or Bluesky in one tap, or download or copy it.",
          "The link you share shows your card in the post, and opens a page that replays your round: the position you studied, then every piece going down in the order you placed it, then your score.",
          "Friends can play the same setting straight from your link.",
          {
            segments: [
              "Open ",
              { text: "a sample shared round", href: "/share/result/1_g_8_100_74_218_1264_u18_3_6k1-5pp1-8-8-8-8-5PPP-3Q2K1_6k1-5pp1-8-8-8-8-5PPP-4Q1K1_g130f222g218h216e141g835f729g727" },
              " to see what a friend sees when you send them yours.",
            ],
          },
        ],
      },
      {
        title: "Nicer to play",
        changes: [
          "Start round, Try again and Restart count 3, 2, 1 over a blurred board before the position appears. The study clock starts with the pieces, so the countdown never takes from your study time.",
          "Drag pieces onto the board as well as tapping them.",
          "When you have placed every piece of one kind that a real set has, it greys out in the tray and tells you why.",
          "Study a position for as little as 1 second or as long as 60, up from 32.",
          "Board coordinates are always shown, on every board.",
          "Leaderboard scores now show each player's rating at the time they played.",
        ],
      },
      {
        title: "Fairer positions",
        description:
          "Thanks to a player's bug report, we found a board that looked impossible. It was really being drawn upside down.",
        changes: [
          "Boards now always show rank 8 at the top, in every view.",
          "The game no longer deals checks that no real game could reach, such as a pawn giving check from its starting square.",
        ],
      },
      {
        title: "A new home, a new look, in every language",
        changes: [
          "The home page is now the Brain Lab. Take a quick calibration round right there, then watch two famous games broken down the way a strong player remembers them: Topalov against Shirov in 1998 and Kasparov's Immortal from 1999.",
          "Every page has a clean, light design that is easier to read, and it is the same in all 24 languages.",
          {
            segments: [
              "The ",
              { text: "About", href: "/about" },
              " page, the ",
              { text: "privacy policy", href: "/privacy" },
              " and the ",
              { text: "terms of service", href: "/terms" },
              " are now in all 24 languages. Each translation says it was made with AI help and links to the English page. On the privacy policy and the terms, the English page is the one that counts.",
            ],
          },
          "Pages load without jumping around, including in Russian, Vietnamese and Hindi.",
        ],
      },
      {
        title: "Learn, rebuilt",
        changes: [
          {
            segments: [
              "All 14 ",
              { text: "Learn", href: "/learn" },
              " guides were rewritten, with boards where they help, and arranged into a five-stage path from your first round to a daily habit.",
            ],
          },
          "Type a question such as \"why do I keep hanging pieces\" and Learn finds the guide that answers it.",
        ],
      },
      {
        title: "Smaller things you might notice",
        changes: [
          "This changelog has a list of releases on the side, so you can jump between updates.",
          "The contact form explains clearly what went wrong if a message cannot be sent.",
          "A page that does not exist now says so and points you back to a round.",
        ],
        note: "Thank you to everyone who wrote in, reported a bug or simply kept playing. Many of these changes started as one sentence in the feedback box.",
      },
    ],
  },
  {
    version: "1.2.5",
    publishedAt: "2026-10-05T14:40:00.000+08:00",
    title: "New: articles about the people behind chess memory",
    summary:
      "A new Articles section opens with three profiles: Magnus Carlsen, Adriaan de Groot and Judit Polgár. Each one tells a memory feat, sets it beside the research that explains it, and ends with a drill you can play.",
    groups: [
      {
        title: "Three articles to start",
        changes: [
          {
            segments: [
              { text: "Articles", href: "/articles" },
              " sits between Learn and Leaderboard in the menu.",
            ],
          },
          {
            segments: [
              {
                text: "How Magnus Carlsen names a famous game from one position",
                href: "/articles/magnus-carlsen",
              },
            ],
          },
          {
            segments: [
              {
                text: "Adriaan de Groot's 1944 test of chess memory, by the numbers",
                href: "/articles/adriaan-de-groot",
              },
            ],
          },
          {
            segments: [
              {
                text: "How Judit Polgár played blindfold chess at age seven",
                href: "/articles/judit-polgar",
              },
            ],
          },
          "Every article has a portrait, a fact file, the sources it draws on, and a drill that opens a round sized to the story.",
          "After every round, the result screen suggests one article and sets its drill beside the round you just played.",
          "The articles can be read in every language the game supports. The other languages are translated from English with AI assistance.",
        ],
        note: "The articles are researched and drafted with AI assistance, then checked against their sources before they go up. If you spot a mistake, please tell us through the contact page.",
      },
      {
        title: "Made to be read",
        changes: [
          "Open an article from the list and its portrait moves into place while the text types in. Press Show all text to skip the typing.",
          "Arrive from a search engine, or refresh the page, and the whole article is there at once.",
          "If your device asks for reduced motion, the movement and the typing are skipped.",
        ],
      },
      {
        title: "Views and likes",
        changes: [
          "Each article shows how many times it has been viewed and liked.",
          "Like an article with one tap. Your like is remembered in your browser, with no account.",
          "Sort the list by newest, most viewed or most liked.",
          {
            segments: [
              "No visitor identifier is stored. The ",
              { text: "privacy page", href: "/privacy" },
              " says exactly what is kept.",
            ],
          },
        ],
      },
    ],
  },
  {
    version: "1.2.4",
    publishedAt: "2026-09-19T10:00:00.000+08:00",
    title: "You asked the game to remember. Thank you.",
    summary:
      "A note in the feedback box asked the game to keep your last settings instead of resetting every time. It now does, for presets and for your own mixes, and the pages you load most paint noticeably faster on phones.",
    groups: [
      {
        title: "Your last settings, remembered",
        description:
          "One of you wrote: \"When clicking 'New game' the view should keep the last settings we played with.\" Fair point, and thank you for writing it down. Every new game used to snap back to Medium, whatever you had just played.",
        changes: [
          "New game now opens on the pieces and look time you last played, whether that was a preset like Hard or your own mix, such as 3 pieces with 18 seconds to look.",
          "Your settings stay put after a reload, in a new tab, and the next time you visit, on the same browser.",
          "A link that names a level or a drill, like the buttons in the guides, still opens exactly that setup.",
        ],
        note: "Keep the suggestions coming. This one took a single sentence in the feedback box to set off.",
      },
      {
        title: "A simpler settings page",
        changes: [
          "The Difficulty and time controls on the settings page never changed the game. They are gone, because the game screen is where you choose, and it now remembers. Board coordinates stay on the settings page.",
        ],
      },
      {
        title: "Faster on phones",
        changes: [
          "On a typical phone the home page and the game now paint their main text in about 1.4 to 1.5 seconds, down from up to 3.8. The game screen arrives ready instead of waiting for scripts, and pages no longer download fonts they never use.",
        ],
      },
      {
        title: "Fly your flag on the leaderboard",
        description:
          "A score used to be a name and a number. Now it can say where you played from, if you want it to.",
        changes: [
          "Pick a country when you submit a score, and its flag sits beside your name on the board.",
          "The globe is the default, because not everyone wants to say where they are. Leave it alone and it stays a globe.",
          "Start typing to find a country instead of scrolling the whole list.",
          "Your choice is remembered for next time, the same way your game settings are.",
          "Every score already on the board keeps the globe. Nothing was guessed on your behalf.",
        ],
      },
      {
        title: "We now say when a score is worth submitting",
        changes: [
          "Finish a round and the result screen tells you, in one line, whether that score reaches the leaderboard.",
          "It compares against the lowest score actually on that board, so it is an answer rather than encouragement. On the quieter boards there is still room, and it says so.",
          "The line appears only when the answer is yes, and it leaves once you have submitted.",
        ],
      },
    ],
  },
  {
    version: "1.2.3",
    publishedAt: "2026-08-28T12:00:00.000+08:00",
    title: "You found the knight bug. Thank you.",
    summary:
      "Two notes left in the feedback box turned out to be real bugs: one had been quietly marking correct answers wrong, the other was eating pieces when you placed them quickly. Both are fixed, and the board is steadier and quicker while we were in there.",
    groups: [
      {
        title: "The knight that was scored as a king",
        description:
          "One of you wrote: \"The system doesn't see the placed knight and shows that it has been missed.\" You were exactly right, and it was worse than it looked.",
        changes: [
          "Every knight you placed was recorded as a king, so a knight on the right square was marked wrong. Rebuild a six-piece position perfectly with one knight in it and you scored 67%.",
          "It could take a second piece down with it. Once a knight had claimed a square as a king, the next king or knight of that colour silently failed to appear at all.",
          "Knights are knights again. A perfect rebuild scores 100%, as it always should have.",
        ],
        note: "If your scores looked stingy, they were. Sorry about that.",
      },
      {
        title: "Pieces that vanished when you played fast",
        description:
          "Another note: \"the pieces I put on the board originally isn't exactly the submitted position board... especially if I put some pieces fast.\" Also exactly right.",
        changes: [
          "A hidden timer was throttling taps, and when they came close together it threw the earlier ones away. Tap eight squares quickly and four of them never happened.",
          "Every tap now lands, however fast you go.",
          "Removing a piece straight after placing it works too. That used to be ignored for half a second.",
        ],
      },
      {
        title: "A board that stays put",
        changes: [
          "The board no longer jumps or slides when the timer runs out and it is your turn to place. It stays exactly where it was.",
          "Memorising and placing no longer scroll. The board is sized to the screen you actually have, so there is nothing to scroll to.",
          "On a phone the board is bigger and sits 4px from the edge instead of 15px, so the squares are easier to hit. The timer and the piece tray now line up with the board's edges instead of drifting wider than it.",
        ],
      },
      {
        title: "Quicker under the finger",
        changes: [
          "Every tap used to wait 50 milliseconds before anything happened, whether you were rushing or not. That pause is gone.",
          "The board also redraws less. Keeping track of a tap no longer re-renders all 64 squares, and the selected square's highlight animates only the two properties that actually change.",
          "The ring marking the square you tapped is now drawn on all four sides. It always had been on two.",
        ],
      },
      {
        title: "Housekeeping",
        changes: [
          "The board used to be told how big to be, worked out from a hand-written guess at how much room everything else needed. Five copies of that guess had to agree with each other, and they drifted apart, which is how a good deal of the above went unnoticed. The board now measures the space it has, and the guess is gone along with 73 lines of code.",
          "One stray English line on the memorise screen had escaped the 24-language release. It now counts your pieces in all of them, in the right plural.",
        ],
        note: "Both of the bugs above came from the feedback box after a game. If something feels off, tell us — it is by far the fastest way to get it fixed.",
      },
    ],
  },
  {
    version: "1.2.2",
    publishedAt: "2026-08-27T12:00:00.000+08:00",
    title: "Memory Chess now speaks your language",
    summary:
      "The game and every Learn guide are now available in 24 languages, and the site starts in yours.",
    groups: [
      {
        title: "24 languages",
        changes: [
          "Memory Chess is now available in 24 languages: English, Spanish, Russian, Brazilian Portuguese, German, French, Hindi, Italian, Simplified Chinese, Turkish, Swedish, Dutch, Polish, Indonesian, Norwegian, Finnish, Romanian, Vietnamese, Czech, Japanese, Korean, Traditional Chinese, Danish, and Hungarian.",
          "Everything you read while playing is translated, from the home page and settings to the timer, the results screen, the leaderboard, and this changelog.",
        ],
        note: "As of September 2026, this changelog is back to English only. The game itself still plays in all 24 languages.",
      },
      {
        title: "All 16 Learn guides, in every language",
        changes: [
          {
            segments: [
              "Every guide in ",
              {
                text: "Learn",
                href: "/learn",
              },
              " has been translated in full. The practice steps, the drills, the weekly plan, and the questions at the end all read naturally in your language, with chess terms that match how players actually speak it.",
            ],
          },
        ],
        note: "As of September 2026, the Learn guides are in English only, and two of them have been merged into others. Chess board vision drills is now part of How to stop blundering in chess, and Working memory exercises for chess is now part of Chess calculation exercises for beginners. The game itself still plays in all 24 languages.",
      },
      {
        title: "Switch language whenever you like",
        changes: [
          "A globe at the top of every page opens the language list. Each language is written in its own name, so you can find yours without reading English first.",
          "Choosing a language keeps you exactly where you were, and Memory Chess remembers your choice the next time you visit.",
        ],
      },
      {
        title: "We try to get it right before you ask",
        changes: [
          "New visitors now start in the language their browser or region suggests, whenever we have it. If the guess is wrong, the globe is right there to fix it.",
        ],
      },
    ],
  },
  {
    version: "1.2.1",
    publishedAt: "2026-08-16T12:00:00.000+08:00",
    title: "Smoother games, clearer results",
    summary:
      "Your board stays steady, random positions make more sense, and results are easier to review.",
    groups: [
      {
        title: "Steadier gameplay",
        changes: [
          "Thanks to helpful player feedback, the board now stays in the same place when memorization ends and placement begins. The controls and piece picker line up with the board too.",
          "Page headers, sound controls, and spacing now stay more consistent as you move through the game. Board pieces and labels can no longer be selected by accident.",
        ],
      },
      {
        title: "Better random positions",
        changes: [
          "Thanks to a player who reported this on Reddit, random positions no longer place kings beside each other, two bishops for one side on the same square color, pawns on the first or eighth rank, or both kings in check.",
        ],
      },
      {
        title: "Clearer results",
        changes: [
          "After each game, you can now compare the position you memorized with the board you submitted. Clear markers show correct, incorrect, and missed pieces.",
          "Your accuracy and the main replay and leaderboard actions now stay together at the top of the results. Missed pieces use a clear black dotted outline while the board remains visible underneath.",
        ],
      },
      {
        title: "A clearer finish",
        changes: [
          "When you submit, the timer stops for one second so you can see your locked-in time and final board before the results appear. A quick GAME! flash marks the end of the round, and the placement timer now shows milliseconds.",
        ],
      },
      {
        title: "Some statistics for everyone!",
        description:
          "Here is a snapshot of public leaderboard submissions through August 16, 2026.",
        tables: [
          {
            caption: "Accuracy",
            columns: ["Leaderboard submissions", "Through 2025", "2026"],
            rows: [
              {
                label: "Average accuracy",
                values: ["72.3%", "89.1%"],
              },
              {
                label: "Perfect-score rate",
                values: ["56.4%", "77.3%"],
              },
              {
                label: "Medium average accuracy",
                values: ["65.6%", "75.7%"],
              },
              {
                label: "Medium perfect-score rate",
                values: ["35.4%", "52.5%"],
              },
              {
                label: "Hard average accuracy",
                values: ["50.0%", "72.9%"],
              },
              {
                label: "Grandmaster average accuracy",
                values: ["21.7%", "52.3%"],
              },
            ],
          },
          {
            caption: "Submission speed",
            columns: ["Perfect-score solution time", "Through 2025", "2026"],
            rows: [
              {
                label: "All difficulties, median",
                values: ["5.42s", "5.42s"],
              },
              {
                label: "Easy, median",
                values: ["4.86s", "4.85s"],
              },
              {
                label: "Medium, median",
                values: ["15.88s", "17.60s"],
              },
            ],
          },
        ],
        note: "Among 50 repeated player-name and difficulty combinations, 33 had a faster latest solution and 17 had a slower one. Accuracy improved strongly overall, but taking more time can also lead to a better score. These figures cover voluntary leaderboard submissions, not every game, and the Easy leaderboard is limited to its top 200 entries.",
      },
      {
        title: "Thank you for playing",
        changes: [
          {
            segments: [
              "A huge thank you to everyone who helped Memory Chess reach more than 800 monthly players and over 32,000 games played. We are especially grateful to everyone who shared ideas, encouragement, and bug reports through the ",
              {
                text: "Contact us page",
                href: "/contact-us",
              },
              " or the end-of-game feedback form. Every game and message helps Memory Chess keep growing.",
            ],
          },
        ],
      },
    ],
  },
  {
    version: "1.2.0",
    publishedAt: "2026-08-15T00:00:00.000+08:00",
    title: "Learn more. Play smoother.",
    summary:
      "New guides, a clearer home page, quieter sounds, and an easy way to share feedback.",
    groups: [
      {
        title: "Learn and improve",
        changes: [
          "Explore new, easy-to-follow guides for chess memory and visualization.",
          "The refreshed home page now explains how Memory Chess trains your spatial memory.",
        ],
      },
      {
        title: "Everyday improvements",
        changes: [
          "Mobile play, piece setups, and leaderboard rankings are more reliable.",
          "Game sounds now start at a gentler 10% volume.",
        ],
      },
      {
        title: "Feedback and updates",
        changes: [
          "You can now rate the game after you play and see new releases in the changelog. The feedback prompt appears at most once a day.",
          "A new privacy page explains saved settings, analytics, feedback, and future ads in simple language.",
        ],
      },
    ],
  },
  {
    version: "1.1.0",
    publishedAt: "2025-04-04T00:00:00.000+08:00",
    title: "Picking pieces feels better",
    summary: "Choosing white or black pieces is now clearer and easier.",
    groups: [
      {
        title: "Piece selection",
        changes: [
          "The color picker has a fresh new look.",
          "It is easier to see which color you picked.",
          "Buttons now feel smoother and more consistent.",
        ],
      },
    ],
  },
  {
    version: "1.0.1",
    publishedAt: "2025-04-03T00:00:00.000+08:00",
    title: "Better on phones",
    summary:
      "Memory Chess is now easier and more comfortable to play on a small screen.",
    groups: [
      {
        title: "Mobile play",
        changes: [
          "The game, timer, and Skip button fit small screens better.",
          "Taps and spacing feel better on mobile.",
          "Sounds behave better as you move through the game.",
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    publishedAt: "2025-03-28T00:00:00.000+08:00",
    title: "Let the memory games begin!",
    summary: "The first version of Memory Chess is ready to play.",
    groups: [
      {
        title: "The first release",
        changes: [
          "Memorize a chess position, then rebuild it from memory.",
          "Pick your difficulty, number of pieces, time, and board labels.",
          "See your score and time after every game.",
        ],
      },
    ],
  },
] as const;

export const LATEST_CHANGELOG_ENTRY = CHANGELOG_ENTRIES[0];

export function getChangelogEntryId(version: string): string {
  return `v${version.replaceAll(".", "-")}`;
}

export function isChangelogAnnouncementActive(
  entry: ChangelogEntry,
  now: Date = new Date(),
): boolean {
  return isAnnouncementActive(entry.publishedAt, now);
}
