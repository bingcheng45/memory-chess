import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "how-to-play-memory-chess-board-game",
    title: "How to Play Memory Chess: Wooden Board Game Rules",
    h1: "How to play Memory Chess, the wooden board game",
    description:
      "Learn how to play Memory Chess, the wooden peg board game. See what is in the box, how to set up, take a turn and win, and the common variants.",
    group: "memory",
    level: "beginner",
    publishedAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    questions: [
      "How do you play memory chess?",
      "What are the rules of the wooden memory chess game?",
      "How do you win memory chess?",
      "What happens if you pick the wrong colour in memory chess?",
    ],
    keywords: {
      primary: "how to play memory chess",
      secondary: ["memory chess game rules", "memory chess board game", "memory chess game instructions", "wooden memory chess"],
    },
  },
  intro: {
    quickAnswer:
      "Stand all 24 pegs in the round board with their coloured ends down. On your turn, roll the colour die and lift one peg. If its base matches the die, keep it and roll again. If not, put it back in the same hole and the next player goes. The first to hold four pegs of one colour wins.",
    takeaways: [
      "The colour is painted on the bottom of each peg, so it is hidden while the peg stands in the board.",
      "A missed peg goes back in the hole it came from. Remembering those misses is the whole game.",
      "The rules card in the box plays to four of one colour. Other printed rules play until the board is empty.",
    ],
    audience: [
      "You have the wooden set with 24 pegs and a colour die, and the rules card is lost or hard to read.",
      "You are teaching the game to a child of three or older.",
      "You searched for Memory Chess and want to know which game you found.",
    ],
  },
  sections: [
    {
      id: "whats-in-the-box",
      heading: "What comes in a wooden Memory Chess set",
      blocks: [
        {
          kind: "list",
          ordered: false,
          items: [
            "A round wooden board with 24 holes: 16 in an outer ring and 8 in an inner ring.",
            "24 wooden pegs, four each of six colours. The usual colours are red, yellow, blue, green, black and white.",
            "One wooden die with a colour on each face, one for each peg colour.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Each peg is plain wood on top. Its colour is painted on the base, the end that goes down into the hole. Once a peg stands in the board, nobody can see its colour until it is lifted out.",
            "Sets from different makers look alike and play the same way. Most are sold for ages 3 and up, and a few say 4 and up.",
          ],
        },
      ],
    },
    {
      id: "setup",
      heading: "How to set up the board",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Tip the pegs out beside the board so every player sees the six colours.",
            "Without looking at the colours, stand all 24 pegs in the holes, colour end down.",
            "Turn the board around a few times, so nobody knows which peg went where.",
            "Put the die in the middle of the board and pick a first player.",
          ],
        },
      ],
    },
    {
      id: "take-a-turn",
      heading: "How a turn works: roll, lift, keep or put back",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Roll the die. The face that lands on top is the colour you are looking for.",
            "Lift one peg you think has that colour and look at its base.",
            "If the colours match, keep the peg in front of you and roll again.",
            "If they do not match, put the peg back in exactly the same hole. Your turn ends and the next player rolls.",
          ],
        },
        {
          kind: "rulesDemo",
          caption: "A two-player game step by step: setup, a match, a miss that goes back in its hole, and a win.",
        },
        {
          kind: "affiliate",
          label: "See the wooden Memory Chess set on Amazon",
        },
        {
          kind: "prose",
          paragraphs: [
            "A miss is what makes it a memory game. Everyone at the table saw that colour, and it is back where it was. The next player to roll it can go straight to that hole.",
          ],
        },
      ],
    },
    {
      id: "winning",
      heading: "How to win wooden Memory Chess",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The rules card in the box gives the win to the first player holding all four pegs of one colour. Pegs of other colours do not count towards it.",
            "If nobody gets four of a colour before the board is empty, the player with the most pegs wins. Agree on the win before the first roll, as the variants below change it.",
          ],
        },
      ],
    },
    {
      id: "variants",
      heading: "Memory Chess variants and house rules",
      summary: "Printed rules differ between makers. Each row comes from at least one published rule sheet or listing.",
      blocks: [
        {
          kind: "table",
          columns: ["Variant", "What changes", "Where it comes from"],
          rows: [
            {
              label: "Empty the board",
              cells: ["Play until every peg is taken. Whoever holds the most pegs wins.", "Coopers of Stortford rule sheet, the Huskespil listing and other shops"],
            },
            {
              label: "One of each colour",
              cells: ["The first player to hold one peg of all six colours wins.", "Coopers of Stortford rule sheet"],
            },
            {
              label: "No extra roll",
              cells: ["After a match you keep the peg, but the die passes to the next player.", "Coopers of Stortford rule sheet, which only says players take turns"],
            },
            {
              label: "Moving pegs",
              cells: ["A missed peg goes back in a different hole, so what you remember goes out of date.", "The advanced rule on the Coopers of Stortford sheet"],
            },
            {
              label: "Pairs, no die",
              cells: ["Lift two pegs. Keep both if their colours match, otherwise put both back.", "Coopers of Stortford sheet and the small foot Colours Memory game"],
            },
            {
              label: "Look first",
              cells: ["Everyone studies the colours for about 10 seconds before they are hidden.", "One shop's listing"],
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Most sets say two to four players, and some shops list up to six. With more players, each one gets fewer turns, so a miss stays useful for longer.",
          ],
        },
      ],
    },
    {
      id: "tips",
      heading: "Tips for playing with children and with adults",
      blocks: [
        {
          kind: "list",
          ordered: false,
          items: [
            "With a young child, say the colour out loud every time a peg is lifted, and point to its hole.",
            "For a shorter game, take out the pegs of two colours before you set up. Fewer pegs means fewer places to remember.",
            "After a miss, ask who remembers the colour in that hole before the next roll.",
            "Adults and older children can play the moving-pegs rule or the one-of-each-colour win. Both stop one good memory from settling the game early.",
          ],
        },
      ],
    },
    {
      id: "two-games",
      heading: "Two games share the name Memory Chess",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The wooden peg game has no chess rules. Its pegs just look a little like chess pawns.",
            [
              "This site is a different game with the same name. ",
              { text: "Memory Chess online", href: "/" },
              " trains memory for real chess positions. You study a position for a few seconds, the board clears, and you rebuild it piece by piece.",
            ],
            [
              "It suits chess players, and children who have learnt how the pieces move. ",
              { text: "Start a round", href: "/game" },
              " to try it.",
            ],
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Try 4 pieces, 10 seconds", pieceCount: 4, memorizeTime: 10 },
      why: "Like finding a peg you saw lifted earlier, this round asks where each piece stood. Four chess pieces is a gentle start for a child who knows them.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "How many pegs are in a wooden Memory Chess set?",
          answer:
            "Most sets have 24 pegs, four in each of six colours, plus one colour die and the round board. Shops often call this a 26-piece set, counting the board and the die. A few makers list a different count, so check the box.",
        },
        {
          question: "What age is wooden Memory Chess for?",
          answer:
            "Most sets are sold for ages 3 and up, and a few makers say 4 and up. A three-year-old can roll the die, name the colour and lift a peg. Older children and adults can add the harder variants.",
        },
        {
          question: "Do you roll again after a match?",
          answer:
            "On the rules card in the box, yes. You keep the peg and roll again, so one good memory can win several pegs in a row. Some rule sheets pass the die after every turn instead. Agree on it before you start.",
        },
        {
          question: "Is wooden Memory Chess the same as Toy Theater's Memory Chess?",
          answer:
            "No, but it plays the same way. Toy Theater's free online game has you roll a colour die and pick pins. A wrong pin stays where it was for you to remember. It offers 24, 36 or 40 pieces, against the computer or up to six friends.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-memory-training",
          reason: "How the chess version of Memory Chess trains recall of real positions.",
        },
        {
          kind: "guide",
          slug: "how-to-get-better-at-chess-for-beginners",
          reason: "Where to start once a child has learnt how chess pieces move.",
        },
        {
          kind: "guide",
          slug: "chess-pattern-recognition-drills",
          reason: "Why remembering positions gets easier once you see familiar shapes.",
        },
      ],
    },
    {
      kind: "sources",
      items: [
        {
          title: "Coopers of Stortford, Wooden Memory Match Game instructions (P731)",
          url: "https://www.coopersofstortford.co.uk/images/pdf/P731i.pdf",
          note: "Printed rules: setup without looking, a missed peg returns to its hole, three ways to win, and the moving-pegs and pairs variants.",
        },
        {
          title: "Huskespil, board game listing",
          url: "https://tarsasjatekok.com/tarsasjatek/huskespil-i353813",
          note: "24 pegs in 6 colours, 16 outer and 8 inner holes, a colour die, roll again after a match, most points wins.",
        },
        {
          title: "small foot, Colours Memory",
          url: "https://b2b.small-foot.de/en/shop/games/parlor-games/colours-memory",
          note: "24 pieces in 6 colours, one die, 2 to 4 players, and a find-two-of-four rule.",
        },
        {
          title: "Toy Theater, Memory Chess",
          url: "https://toytheater.com/memory-chess/",
          note: "The free online version of the wooden game.",
        },
      ],
    },
  ],
};

export default guide;
