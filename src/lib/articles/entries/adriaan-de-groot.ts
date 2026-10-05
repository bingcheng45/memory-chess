import type { Article } from "../schema";

const article: Article = {
  slug: "adriaan-de-groot",
  publishedAt: "2026-10-05T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
  title: "Adriaan de Groot's 1944 test of chess memory, by the numbers",
  description: "Adriaan de Groot tested four players on chess positions shown for 2 to 15 seconds in 1944. Here are his real scores and what later research changed.",
  person: {
    name: "Adriaan de Groot",
    role: "Dutch chess master and psychologist",
  },
  photo: {
    src: "/images/articles/adriaan-de-groot.jpg",
    width: 531,
    height: 664,
    alt: "Adriaan de Groot as a young man, around 1930",
    author: "Unknown photographer",
    license: "Public domain",
    licenseUrl: null,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Adrianus_Dingeman_de_Groot.jpg",
    changes: "Cropped",
  },
  facts: {
    born: "26 Oct 1914, Santpoort, Netherlands",
    died: "14 Aug 2006, aged 91",
    country: "Netherlands",
    knownFor: "Thought and Choice in Chess (1965)",
    memoryFeat: "Scored 93% recalling positions seen for 2 to 15 seconds",
  },
  drill: {
    pieceCount: 22,
    memorizeTime: 5,
    why: "De Groot's Rohacek against Rabar test position had 22 pieces, and Max Euwe saw it for 5 seconds.",
  },
  sections: [
    {
      heading: "Four players and a few seconds",
      paragraphs: [
        "In 1944 Adriaan de Groot showed Max Euwe a chess position and took it away five seconds later. The position came from a game between Rohacek and Rabar, after White's 20th move, with 22 pieces on the board. Euwe, world champion from 1935 to 1937, then dictated where every piece stood. He got all 22 right.",
        "De Groot, a master himself, took the same test, added one pawn that was not there, and scored 21 points. A. Fast, the 1942 champion of Utrecht, placed 17 pieces correctly but judged the material equal when it was not, and scored 16. G. P. Hauer, a weaker class player, scored 9.",
        "Retellings disagree about the exposure time and the percentages, so the figures below come from de Groot's own book.",
      ],
    },
    {
      heading: "A master who studied masters",
      paragraphs: [
        "De Groot played for the Netherlands at the Chess Olympiads of 1937 and 1939. Between 1938 and 1943 he wrote down what players said as they thought aloud while choosing a move. His subjects included the grandmasters Keres, Alekhine, Flohr, Fine, Euwe, and Tartakower.",
        "By his counts, grandmasters did not look further ahead than expert players, and they did not examine more moves. \"The master does not necessarily calculate deeper,\" he wrote. De Groot suspected that the difference showed in the first seconds of looking at the board, and he designed the 1944 experiment to test that idea.",
      ],
    },
    {
      heading: "What the 1944 experiment measured",
      paragraphs: [
        "One player stood for each class. Euwe represented the grandmasters, de Groot the masters, Fast the experts, and Hauer the weaker class players.",
        "Each position came from a master game and stayed in view for 2 to 10 seconds, with one exposure of 15 seconds. The two weaker subjects got 3 to 4 seconds on the shortest trials so that they would not score zero. Each subject was asked to take about half a minute to organize what he retained. Euwe and de Groot then dictated the position from memory, and Fast and Hauer set it up on a board.",
        "The scoring gave one point for each correct piece and took points off for pieces added, dropped, or shifted. De Groot discarded two positions, the first in the series and one with a timing fault, and counted fourteen, which ranged from 7 to 26 pieces. Out of 234 possible points, the four subjects scored as follows.",
        "Euwe scored 217 points, or 93%, with five positions perfect.",
        "De Groot scored 217 points, or 93%, with four perfect.",
        "Fast scored 158 points, or 68%, with none perfect.",
        "Hauer scored 119 points, or 51%, with none perfect.",
        "De Groot then set aside two trials with long exposures, 15 and 7 seconds, and two that a lapse in concentration had spoiled. In the remaining ten, with intended exposures of 2, 3, or 5 seconds, the mean scores were 93.0%, 92.6%, 72.3%, and 51.1%.",
        "Both tables are his, which is probably why retellings give the expert either 68% or 72%. The exposure was never a fixed five seconds.",
        "De Groot cared most about the gap in the middle, which he called \"the gulf that separates the master from the non-master.\" His explanation was that a master does not store 22 separate pieces. He perceives a large group of pieces as one unit, because he knows how that group arises and what it is for.",
        "A few such units cover the board, and on de Groot's account a weaker player has fewer of them. Later researchers called the units chunks.",
      ],
    },
    {
      heading: "From a Dutch thesis to random boards",
      paragraphs: [
        "De Groot presented the work in 1946 in his doctoral thesis at the University of Amsterdam, Het denken van den schaker. Mouton published the English edition, Thought and Choice in Chess, in The Hague in 1965.",
        "In 1973 William Chase and Herbert Simon reran the test at Carnegie Mellon with a master, a Class A player, and a beginner. They fixed the exposure at 5 seconds. Their middle-game positions had 24 to 26 pieces, and the master recalled about twice as many pieces as the Class A player.",
        "They videotaped each reconstruction and treated a pause longer than 2 seconds as the boundary between two chunks. The master's first chunk averaged 3.8 pieces against 2.6 for the Class A player, and he produced 7.7 chunks per position against 5.7. Of his 77 chunks across fourteen positions, 47 contained a pawn chain, and Simon and Chase counted 10 castled king positions.",
        "Their addition was a control, the same pieces placed on random squares. Simon and Chase reported that every player then recalled about three or four pieces, fewer than the beginner managed on real positions. They noted that W. Lemmens and R. W. Jongman had found the same result in the Amsterdam laboratory and never published it.",
        "Chase and Simon's own introduction presents the random-board result as de Groot's, and many later accounts repeat that. His book reports no random-board trial.",
      ],
    },
    {
      heading: "What later research changed",
      paragraphs: [
        "Textbooks took that result to mean a master has no advantage at all on meaningless boards. In 1996 Fernand Gobet and Herbert Simon checked that reading against thirteen experiments with exposures of 10 seconds or less. In twelve of the thirteen, the strongest group recalled more random pieces than the weakest. The exception was Chase and Simon's own study, where the master did worst.",
        "The advantage is small. Gobet and Simon put it at about one extra piece per 400 Elo points on random boards, against about five extra pieces on game positions. In a 1998 review, Gobet gave the averages at 5 seconds as 5.5 random pieces for masters and 2.6 for players below class B.",
        "The explanation leaves de Groot's idea standing. A player with a very large store of patterns sometimes finds one by accident in a jumble. Random boards shrink the expert's edge without removing it. Gobet and Simon added that small samples hide so small an effect, and the 1973 study had three subjects.",
      ],
    },
    {
      heading: "Try de Groot's test",
      paragraphs: [
        "Set Memory Chess to 22 pieces and 5 seconds. That matches the size of de Groot's Rohacek against Rabar position and the time Euwe had to look at it. Rebuild the board and work out what share of the pieces you placed correctly. About half is where Hauer finished, about 70% is where Fast finished, and 93% is what Euwe and de Groot averaged.",
        "The comparison is rough, because de Groot also took points off for errors. Then check which pieces you kept. They probably came in groups, such as a pawn chain or a castled king.",
      ],
    },
  ],
  sources: [
    {
      title: "Thought and Choice in Chess, 2nd edition (1978), Adriaan D. de Groot, Mouton, The Hague, full text",
      url: "https://archive.org/details/adriaan_d._de_groot_-_thought_and_choice_in_chess_2nd_ed._1978",
      note: "Supports: the 1944 date, the four subjects with their names and classes, exposure times of 2 to 15 seconds, the longer times for the weaker subjects, the half-minute pause, who dictated and who set up the board, the scoring rules, the Rohacek against Rabar position with its 5-second exposure and four scores, Table 13 (217, 217, 158, 119 of 234), Table 14 (the ten-trial means), both quotes, the think-aloud sessions of 1938 to 1943, the six grandmasters, the 1946 Amsterdam thesis, and the 1965 Mouton copyright. The text contains no random-board experiment.",
    },
    {
      title: "Skill in Chess, Herbert A. Simon and William G. Chase, American Scientist 61(4), pages 394 to 403 (1973)",
      url: "https://paulogentil.com/pdf/Skill%20in%20chess.pdf",
      note: "Supports: search statistics that did not separate grandmasters from weaker players, the 93% and 72% figures as later cited, the master recalling about twice as many pieces as the Class A player, chunk sizes 3.8 and 2.6, chunk counts 7.7 and 5.7, the 2-second pause, 47 pawn chains and 10 castled king positions among 77 chunks, three or four pieces on random boards, and the unpublished Lemmens and Jongman result.",
    },
    {
      title: "Perception in Chess, William G. Chase and Herbert A. Simon, Cognitive Psychology 4, pages 55 to 81 (1973)",
      url: "https://andymatuschak.org/prompts/Chase1973.pdf",
      note: "Supports: the three subjects, the 5-second exposure, middle-game positions of 24 to 26 pieces, videotaped reconstructions, 77 chunks over fourteen positions with 47 containing a pawn chain, chunk sizes 3.8 and 2.6, chunk counts 7.7 and 5.7, and the authors' own summary of de Groot as a 5-second experiment that included random boards.",
    },
    {
      title: "Recall of rapidly presented random chess positions is a function of skill, Fernand Gobet and Herbert A. Simon, Psychonomic Bulletin and Review 3, pages 159 to 163 (1996)",
      url: "https://bura.brunel.ac.uk/bitstream/2438/1346/1/FullText.pdf",
      note: "Supports: thirteen experiments, exposures of at most 10 seconds, twelve of thirteen favoring the strongest group, the Chase and Simon exception, one piece per 400 Elo points on random boards against about five on game positions, the textbook status of the old result, the small-sample point, and the chunk-based explanation.",
    },
    {
      title: "Expert memory: a comparison of four theories, Fernand Gobet, Cognition 66, pages 115 to 152 (1998)",
      url: "https://cognitivearchaeologyblog.wordpress.com/wp-content/uploads/2015/11/1996-gobet.pdf",
      note: "Supports: de Groot's exposures of 2 to 15 seconds, Euwe as the grandmaster and his years as world champion, the half-minute pause, the 5-second design of Chase and Simon, the textbook status of the random-board result, and the 5.5 against 2.6 piece averages.",
    },
    {
      title: "Cognitive and Neuropsychological Mechanisms of Expertise: Studies with Chess Masters, Christopher F. Chabris, doctoral thesis, Harvard University (1999)",
      url: "https://www.chabris.com/Chabris1999d.pdf",
      note: "Supports: the four-subject design, the 2 to 15 second exposures, and the statement that the random-board control is often wrongly credited to de Groot and belongs to Chase and Simon.",
    },
    {
      title: "Adriaan de Groot, Wikipedia",
      url: "https://en.wikipedia.org/wiki/Adriaan_de_Groot",
      note: "Supports: birth and death dates and places, the 1937 and 1939 Olympiads, the 1946 thesis and the 1965 English edition.",
    },
    {
      title: "Adriaan de Groot, chess psychologist (1914-2006), ChessBase",
      url: "https://en.chessbase.com/post/adriaan-de-groot-che-psychologist-1914-2006-",
      note: "Supports: birth and death dates and places, age 91. Also an example of a retelling that gives the exposure as 3 to 4 seconds.",
    },
    {
      title: "OlimpBase team page for the Netherlands, 1937 Olympiad",
      url: "https://www.olimpbase.org/1937/1937ned.html",
      note: "Supports: de Groot on the Dutch teams of 1937 and 1939.",
    },
    {
      title: "OlimpBase team page for the Netherlands, 1939 Olympiad",
      url: "https://www.olimpbase.org/1939/1939ned.html",
      note: "Supports: de Groot on the Dutch teams of 1937 and 1939.",
    },
    {
      title: "A Chess-Position Memory Test (from Adriaan de Groot), Eliot Hearst",
      url: "https://www.blindfoldchess.net/blog/2009/06/chess-position-memory-test",
      note: "Supports: the 22-piece test position and the scores of 22, 21, 16, and 9.",
    },
  ],
};

export default article;
