import type { Article } from "../schema";

const article: Article = {
  slug: "magnus-carlsen",
  publishedAt: "2026-10-05T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
  title: "How Magnus Carlsen names a famous game from one position",
  description: "Filmed tests and blindfold displays show what Magnus Carlsen's chess memory can do, and chunk research suggests it rests on studied games.",
  person: {
    name: "Magnus Carlsen",
    role: "World Chess Champion, 2013-2023",
  },
  photo: {
    src: "/images/articles/magnus-carlsen.jpg",
    width: 840,
    height: 1050,
    alt: "Magnus Carlsen at a press conference in 2025",
    author: "Miroslav.vajdic",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Magnus_Carlsen_at_Rapid_Blitz_2025_(v2).jpg",
    changes: "Cropped and resized",
  },
  facts: {
    born: "30 Nov 1990, Tønsberg, Norway",
    country: "Norway",
    title: "Grandmaster, 2004",
    peakRating: "2882 (2014)",
    worldChampion: "2013-2023",
    knownFor: "Highest official classical rating on record",
    memoryFeat: "Naming historic games from a single position",
  },
  drill: {
    pieceCount: 12,
    memorizeTime: 5,
    why: "Five seconds is the exposure Gobet and Simon used in their recall experiment, and 12 pieces give enough material to practice grouping.",
  },
  sections: [
    {
      heading: "Ten boards he could not see",
      paragraphs: [
        "In February 2012 the CBS program 60 Minutes showed Magnus Carlsen, then 21, playing ten opponents at once. He faced away from all ten boards. The narration counted 320 pieces for him to track and said he came out on top. He told the correspondent Bob Simon that a chess player does not really need the board.",
        "At least two more blindfold displays are documented, both played against the clock.",
        "In May 2015 he took on three opponents at the Sohn Investment Conference in New York. Each opponent had nine minutes, and Carlsen had nine minutes for all three games. He won them all.",
        "That October, in the Hofburg in Vienna, he tried five boards with 12 minutes for all five games. His opponents had 12 minutes each. He won three games and lost two because of time trouble.",
      ],
    },
    {
      heading: "Three filmed tests of his recall",
      paragraphs: [
        "Blindfold play shows that Carlsen can hold a game in his head. Three filmed tests show something else, his store of famous games.",
        "The first is in the same CBS profile. The program said he could draw on ten thousand games by other masters as he prepared, then tested him on one. He said it was played at Simpson's on the Strand in London in 1859. Simon corrected him. The year was 1851. \"It's not what it used to be,\" Carlsen said of his memory.",
        "The second was posted to YouTube by chess24 on 30 April 2021. The English grandmaster David Howell showed him positions from well-known games, and Carlsen named them. He placed one position as the 24th game of a Kasparov match against Karpov in Seville. He said a book about those matches was on his bedside table.",
        "Howell then played through an opening and asked Carlsen to stop him when he knew the game. Carlsen stopped him early and named Viswanathan Anand's game against Zapata. Another position came from his own game against Howell at the 2002 World Youth Championship. Carlsen described what had happened on the next board as well.",
        "One position came from the first Harry Potter film. Carlsen asked for a hint and was told that it came from the entertainment industry. He then recalled the opening moves of the film game. According to the chess writer Nate Solon, it was the only position that stopped him.",
        "The third came at the Casablanca Chess event in May 2024. Chess.com showed Carlsen, Anand, and Hikaru Nakamura positions from famous games with black and white checkers in place of the pieces. ChessBase reported that the handicap was only a minor obstacle for Carlsen.",
      ],
    },
    {
      heading: "What Carlsen says about his memory",
      paragraphs: [
        "Carlsen's own descriptions are modest. At the Sohn conference he told the audience that \"you only need to keep one game in your head at a time.\" He added that blindfold play is manageable for a good chess player. The difficult part, he said, was not knowing how much time he had left.",
        "After the Vienna display he spoke about opponents who leave standard patterns and play unorthodox moves. ChessBase reported that he called them annoying to face blindfolded.",
        "On Joe Rogan's podcast in February 2025 he gave more detail, according to a published transcript. He sees the board in his head. In a simultaneous display he thinks about one game at a time and stores the others away. He said he remembers the games he has played in broad strokes, not move by move. In blindfold games, he added, he can be unsure whether a pawn at the side of the board has moved one square.",
        "Other grandmasters treat the position quiz as professional knowledge. After the chess24 clip appeared, Garry Kasparov wrote that he had been tested the same way during his world championship years. He added that most grandmasters can identify thousands of games and positions.",
      ],
    },
    {
      heading: "What chunk research suggests",
      paragraphs: [
        "The research on chess memory starts with Adriaan de Groot, a chess master and psychologist. He showed players a position from a real game for a few seconds and asked them to rebuild it. The two strongest players scored 93 percent. The weakest of his four subjects scored about half.",
        "In 1973 William Chase and Herbert Simon explained the result with the chunk. A chunk is a pattern of pieces that a player has seen so often that it is stored as one unit. A master who rebuilds a real position recalls a few chunks and does not recall every piece separately. When the pieces are placed at random, the stronger players' advantage nearly disappears.",
        "Simon and a colleague estimated that a top player holds about 50,000 chunks. Later work by Fernand Gobet and Simon added templates. A template is a chunk for a familiar type of position, with open slots for the details.",
        "None of this research tested Carlsen, so applying it to him is an interpretation. On that reading, his record fits the account. The positions he names on film come from famous games, the kind a professional studies. In the checkers test the piece types were hidden, and ChessBase judged that this hardly slowed him. That is what the chunk account would predict for someone who knows a position as a pattern.",
        "His Vienna remark can be read the same way. Opponents who leave familiar patterns may do to a blindfold player what random boards do to a master in the laboratory.",
        "His errors are consistent with this reading too. He named a London venue and missed the year by eight. He needed a hint for a film position that sits outside tournament history. In a blindfold game he can lose track of one pawn's square.",
        "None of this makes his memory ordinary. CBS reported that at five he could name almost all the countries of the world with their capitals and populations. His father told the program that he had a good memory and could concentrate on one topic for hours. Kasparov, in the same comment, called Carlsen's serious interest in past games a competitive advantage.",
      ],
    },
    {
      heading: "A drill to try",
      paragraphs: [
        "Set Memory Chess to 12 pieces and 5 seconds. Five seconds is the exposure Gobet and Simon gave the players in their recall experiment.",
        "While the position is on screen, do not count the pieces one at a time. Pick out two or three groups and say each group to yourself. A group can be a king with the pawns in front of it, or two pieces that protect each other. When the board clears, rebuild it group by group. Once 12 pieces feel easy, add pieces before you add seconds.",
      ],
    },
  ],
  sources: [
    {
      title: "\"Mozart of Chess: Magnus Carlsen\" (60 Minutes script, aired 19 February 2012), CBS News",
      url: "https://www.cbsnews.com/news/mozart-of-chess-magnus-carlsen-19-02-2012/",
      note: "Supports: the ten-board blindfold display, the 320-piece count, his age, his remark about not needing the board, the ten thousand games, the London test with 1859 and 1851, the quote about his memory, the childhood memory report, and his father's comment.",
    },
    {
      title: "\"Magnus Carlsen Plays Three-Board Blindfold Simul\", Peter Doggers, Chess.com, 1 June 2015",
      url: "https://www.chess.com/news/view/magnus-carlsen-plays-three-board-blindfold-simul-5431",
      note: "Supports: the Sohn Conference display in May 2015, the nine-minute clocks, the three wins, the quote about one game at a time, and his remarks about blindfold play and the clock.",
    },
    {
      title: "\"Carlsen plays blindfold simul in Vienna\", ChessBase, October 2015",
      url: "https://en.chessbase.com/post/55596",
      note: "Supports: five boards in the Hofburg, the 12-minute clocks, three wins and two losses through time trouble, and his remark about unorthodox opponents.",
    },
    {
      title: "\"Magnus Carlsen's Mind-Blowing Memory! World Chess Champion tested\", chess24, YouTube, 30 April 2021",
      url: "https://www.youtube.com/watch?v=eC1BAcOzHyY",
      note: "Supports: the publication date, David Howell as the examiner, the Kasparov and Karpov game from Seville, the bedside book, the Anand and Zapata game named during the opening, the 2002 game against Howell, and the Harry Potter position with its hint.",
    },
    {
      title: "\"Memory: The Key To Chess?\", Nate Solon, Zwischenzug, 1 April 2023",
      url: "https://www.zwischenzug.gg/p/memory-the-key-to-chess",
      note: "Supports: the Harry Potter position as the only one that stopped Carlsen.",
    },
    {
      title: "\"Magnus Carlsen's Remarkable Memory\", Jason Kottke, kottke.org, 30 April 2021",
      url: "https://kottke.org/21/04/magnus-carlsens-remarkable-memory",
      note: "Supports: the Howell quiz and both parts of Kasparov's comment.",
    },
    {
      title: "\"Stunning: Carlsen's chess memory\", ChessBase, 26 June 2024",
      url: "https://en.chessbase.com/post/stunning-carlsen-s-chess-memory",
      note: "Supports: the Casablanca checkers test in May 2024, the three players, and how Carlsen handled it.",
    },
    {
      title: "\"#2275 - Magnus Carlsen\", The Joe Rogan Experience (transcript), HappyScribe",
      url: "https://podcasts.happyscribe.com/the-joe-rogan-experience/2275-magnus-carlsen",
      note: "Supports: his description of seeing the board, one game at a time, remembering games in broad strokes, and the pawn remark about blindfold games.",
    },
    {
      title: "Thought and Choice in Chess, 2nd edition (1978), Adriaan D. de Groot, Mouton, The Hague",
      url: "https://archive.org/details/adriaan_d._de_groot_-_thought_and_choice_in_chess_2nd_ed._1978",
      note: "Supports: the recall scores of de Groot's four subjects, 93 percent for the two strongest and 51 percent for the weakest.",
    },
    {
      title: "\"Recall of random and distorted chess positions: Implications for the theory of expertise\", Fernand Gobet and Herbert A. Simon, Memory & Cognition 24(4), 1996",
      url: "https://gwern.net/doc/psychology/chess/1996-gobet-2.pdf",
      note: "Supports: the Chase and Simon chunk model of 1973, the estimate of 50,000 chunks, the near loss of the skill advantage on random positions, templates with slots, and the five-second exposure.",
    },
    {
      title: "\"Magnus Carlsen\" (player profile), Chess.com",
      url: "https://www.chess.com/players/magnus-carlsen",
      note: "Supports: birth date and place, grandmaster at 13, the record 2882 rating in May 2014, and the title won in 2013 and given up in 2023.",
    },
  ],
};

export default article;
