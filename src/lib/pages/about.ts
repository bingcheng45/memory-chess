import type { PageText } from "./schema";

const about: PageText = {
  meta: {
    title: "About",
    description:
      "Who builds Memory Chess, why the game exists, how a round is scored, and how the Learn guides are written.",
    socialTitle: "About Memory Chess",
    socialDescription: "Who builds Memory Chess, why the game exists, and how it works.",
  },
  kicker: "About",
  title: "About Memory Chess",
  lede: "Memory Chess is a free board-memory game built and run by one person. This page explains who that is, why the game exists, and how it actually works.",
  sections: {
    "who-runs-this-site": {
      title: "Who runs this site",
      blocks: [
        {
          p: "I am Bing Cheng, a solo developer. I run Memory Chess on my own, with AI assistance for the code and the site copy. There is no team and no company behind it. I also build <tont>Tont</tont>, and I post updates about this site at <x>@TheMemoryChess</x>.",
        },
        {
          p: "Because one person runs all of it, the site stays small on purpose. One game, a set of training guides, a leaderboard, and a changelog that records what actually shipped.",
        },
        {
          p: "The game is free and needs no account. Ads through Google AdSense help cover the hosting costs, and nothing on the site is locked behind a payment or a signup.",
        },
      ],
    },
    "why-the-game-exists": {
      title: "Why the game exists",
      blocks: [
        {
          p: "Most chess improvement advice points beginners at openings, puzzles, and courses. In my experience the earlier problem sits underneath all of that. Beginners lose track of the board. They miss a defender, forget a piece moved two turns ago, and blunder into captures they would spot instantly on a diagram.",
        },
        {
          p: "Holding a position in your head is a trainable skill, and there were few places to practice it directly. So I built one. Memory Chess isolates that one skill and gives it a score, so you can watch it improve. If you want stakes, you can put a chosen name on the public leaderboard and measure yourself against everyone else.",
        },
      ],
    },
    "how-a-round-works": {
      title: "How a round works",
      blocks: [
        {
          p: "You choose how many pieces to face and how long you may study them. The presets range from Easy, two pieces with ten seconds, up to Grandmaster, twenty pieces with five seconds, and you can set any custom combination. Then the round runs in three phases.",
        },
        {
          p: "First you memorize. The board shows a position for the time you chose, and then it disappears. Next you rebuild. You place pieces on an empty board from memory. Finally you get your result. The game compares your board with the original, square by square.",
        },
        {
          p: "The scoring is strict. A piece counts as correct only when the right piece of the right color stands on the exact square it occupied in the original position. A rook where a knight belongs is wrong twice over. It counts as a misplaced piece, and the knight it displaced counts as missing. Your accuracy is the share of the original pieces you reproduced exactly.",
        },
        {
          p: "The results screen shows all three groups, the placements you got right, the ones you got wrong, and the pieces you forgot entirely, so every round tells you what to attack next time. You can <game>try a round</game> in under a minute.",
        },
      ],
    },
    "how-the-guides-are-written": {
      title: "How the Learn guides are written",
      blocks: [
        {
          p: "The <learn>Learn library</learn> holds {count, plural, one {# guide} other {# guides}} on board vision, visualization, and memory training. They are written with AI assistance. Every chess position in them is checked by a script for piece counts, legality, and each attack the text claims. Every statement about how Memory Chess works is traced to the game's code. Each guide has drills. Some open a round in the game with the right settings. The rest are meant for a real board.",
        },
        {
          p: "Where the guides make claims about memory and learning, they cite published research, including Gobet and Simon's work on chess memory and the experimental literature on retrieval and spaced practice. Every citation links its source. I have not conducted research of my own, and the guides do not pretend otherwise.",
        },
      ],
    },
    "where-the-site-has-been": {
      title: "Where the site has been",
      blocks: [
        {
          p: "The first release went live in March 2025 as a bare version of the game. Mobile play and piece selection followed within weeks. The Learn library launched in March 2026, and in August 2026 the game itself began playing in 24 languages. The guides and the changelog are in English. The <changelog>changelog</changelog> records every versioned release, including the bug fixes. I keep it honest because I use it myself to remember what changed and when.",
        },
      ],
    },
    "get-in-touch": {
      title: "Get in touch",
      blocks: [
        {
          p: "Write to me at <mail>{email}</mail> or use the <contact>contact form</contact>. I read everything, and player reports have fixed real bugs before. If you want the fine print, the <privacy>privacy policy</privacy> and the <terms>terms of service</terms> cover how the site handles data and what you agree to by playing.",
        },
      ],
    },
  },
};

export default about;
