import type { Article } from "../schema";

const article: Article = {
  slug: "miguel-najdorf",
  publishedAt: "2026-10-28T00:00:00.000Z",
  updatedAt: "2026-10-28T00:00:00.000Z",
  title: "How Miguel Najdorf played 45 blindfold games at once",
  searchTitle: "Blindfold chess record: Najdorf's 45 games",
  relatedGuides: [
    { slug: "blindfold-chess-training-for-beginners", anchor: "blindfold chess training for beginners" },
    { slug: "chess-visualization-exercises", anchor: "visualization exercises for the board in your head" },
  ],
  description: "In 1947 Miguel Najdorf played 45 blindfold chess games at once in São Paulo. How he set the record, where sources disagree, and a memory drill to try.",
  summary: "In January 1947 Miguel Najdorf played 45 opponents blindfold in São Paulo, a record that stood for 64 years. This article follows the display, the record line before and after it, the numbers sources disagree on, and what blindfold masters say they actually remember.",
  person: {
    name: "Miguel Najdorf",
    role: "Grandmaster, blindfold record holder from 1943 to 2011",
  },
  photo: {
    src: "/images/articles/miguel-najdorf.jpg",
    width: 840,
    height: 1050,
    alt: "Miguel Najdorf at the closing banquet of the 1950 Amsterdam chess tournament",
    author: "Carel L. de Vogel, Anefo, Nationaal Archief",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Miguel_Najdorf_1950.jpg",
    changes: "Cropped to Najdorf alone and resized",
  },
  facts: {
    born: "15 Apr 1910, Grodzisk Mazowiecki, Poland",
    died: "4 Jul 1997, Málaga, Spain",
    country: "Argentina",
    title: "Grandmaster, 1950",
    knownFor: "The Najdorf Variation of the Sicilian Defense",
    memoryFeat: "45 blindfold games at once, São Paulo, 1947",
  },
  drill: {
    pieceCount: 12,
    memorizeTime: 15,
    why: "In 1925 the psychologist Édouard Claparède showed Alekhine 12 pieces for 15 seconds, and Alekhine placed every one.",
  },
  sections: [
    {
      heading: "A shirt soaked through in São Paulo",
      paragraphs: [
        "In January 1947 Miguel Najdorf sat alone in a room at the Prestes Maia Gallery in São Paulo. In another room, 45 opponents sat at 45 boards. Najdorf could see none of them. Each move reached him through a microphone, called out in chess notation.",
        "The Austrian master Erich Eliskases acted as the teller who relayed the moves. After hours of play Najdorf had to leave to shower and change, because his shirt was wet through. One of his opponents, Luciano Nilo de Andrade, recalled this in an account the historian Eliot Hearst published in 2009.",
        "The display ran through the night and into the next day. Najdorf won 39 games, drew 4 and lost 2. Nobody had played that many blindfold games at once under conditions that historians accept. The record stood for 64 years.",
      ],
    },
    {
      heading: "What is the blindfold chess world record?",
      paragraphs: [
        "The short answer today is 48. Najdorf's 45 was the record from 1947 until 2011, when the German FIDE master Marc Lang played 46 opponents in Sontheim an der Brenz. Lang scored 25 wins, 19 draws and 2 losses in a little over 21 hours. A display of 48 boards in Las Vegas in 2016 raised the mark again.",
        "Najdorf's number sits at the end of a long climb. Eliot Hearst and John Knott list the accepted records in their 2009 history Blindfold Chess. François-André Danican Philidor played 3 games at once in London in 1783. Harry Nelson Pillsbury reached 22 in Moscow in 1902. Alexander Alekhine played 32 in Chicago in 1933. George Koltanowski played 34 in Edinburgh in 1937.",
        "Najdorf broke the record twice. He played 40 boards in Rosario, Argentina, in 1943. Then came the 45 in São Paulo. Larger numbers have been claimed. János Flesch reported 52 games in Budapest in 1960, but conditions that came to light later cast doubt on it. Hearst and Knott leave it off their list.",
        "Najdorf could handle crowds with his eyes open too. Hearst and Knott note that he met about 250 opponents in a regular simultaneous display in 1950, which took 11 hours.",
      ],
    },
    {
      heading: "A display meant to reach his family",
      paragraphs: [
        "Najdorf was born in Grodzisk Mazowiecki, Poland, in 1910. He was in Buenos Aires for the 1939 Chess Olympiad when the Second World War broke out. He stayed in Argentina and became a citizen in 1944.",
        "His wife, his child, his mother and four brothers were killed by the Nazis, according to a 2020 ChessBase tribute. The same piece says he hoped news of the 1947 display would reach Germany, Poland or Russia and somehow reach his family. He did not hear from them. Albert Silver, writing for ChessBase in 2017, tells it a little differently. In his account Najdorf already knew his wife and child had died. He still hoped the news would reach other family and friends.",
      ],
    },
    {
      heading: "The numbers that drift",
      paragraphs: [
        "The numbers around the display do not all agree. Edward Winter, citing a 2002 Najdorf biography, gives the dates as 24 and 25 January 1947 and the length as about 23 hours. Guinness World Records gives both 21 and 25 January on one page, with 23 hours and 25 minutes. Hearst and Knott say it took nearly 24 hours. The score of 39 wins, 4 draws and 2 losses is the same in every source checked here.",
        "Not everyone accepted Najdorf's records. Koltanowski, whose 34 boards Najdorf had passed, claimed the attempts were not properly monitored. Andrade's account shows loose rules. Several opponents could share a board and consult, and a move could be taken back before Najdorf answered. Both rules favored his opponents. Hearst and Knott call him the rightful holder of the 45-game record.",
      ],
    },
    {
      heading: "What a blindfold master actually sees",
      paragraphs: [
        "Playing blind does not mean holding 45 photographs in your head. Alekhine described his picture to Claparède, who quoted him in the Journal de Genève in 1925. He said he saw only a vague surface, with no colors. He knew where the pieces were, and each square had a meaning for him.",
        "The Genevese psychologist Édouard Claparède tested him that year. He set out 12 pieces, six white and six black, and gave Alekhine 15 seconds to look. Alekhine placed every piece correctly. Claparède and two colleagues managed only three or four. On words, shapes and everyday objects, Alekhine scored about average.",
        "Hearst and Knott describe blindfold skill in the same spirit. They write that it needs a memory linked with understanding, expertise, imagery and calculation. They also report that the psychologists Endel Tulving and Douglas Hofstadter told Hearst that no other human memory feat surpasses the best blindfold displays.",
        "Many boards bring a special danger. Early in a display the games look alike, and Silver notes the real risk of confusing one board with another. In the classic routine Hearst and Knott describe, the master does not play the same first move on every board.",
        "This next part is this article's own reading. No study has tested it. Varying the openings helps give each board its own signature from the first moves. After that the master needs to recall what makes each game different, not every piece from scratch. Claparède's test fits that reading. Alekhine's memory was ordinary everywhere except on a chessboard, where each square already meant something to him.",
      ],
    },
    {
      heading: "Try Claparède's test: 12 pieces, 15 seconds",
      paragraphs: [
        "Claparède's test fits a single Memory Chess round. Choose 12 pieces and 15 seconds, then resist the urge to photograph the board. Give it a signature instead, the way a blindfold master varies the openings. Find the one or two pieces that stand out, such as a queen in a corner or two knights side by side. Hang the rest on those landmarks in small groups. Rebuild in the same order, landmarks first and groups after. Then score yourself against Geneva. Three or four correct pieces is where Claparède and his colleagues landed. All twelve is Alekhine's result.",
      ],
    },
  ],
  sources: [
    {
      title: "Najdorf's Only Surviving 1947 Opponent?, Eliot Hearst, blindfoldchess.net, April 11, 2009",
      url: "https://www.blindfoldchess.net/blog/2009/04/najdorfs-only-surviving-1947-opponent",
      note: "Supports: the Prestes Maia Gallery venue, the separate room and microphone, Eliskases as teller, the soaked shirt and the break to shower and change, Luciano Nilo de Andrade as the source, several players sharing a board and taking back moves before Najdorf replied.",
    },
    {
      title: "After 64 Years: New World Blindfold Record Set by Marc Lang Playing 46 Games at Once, Eliot Hearst, blindfoldchess.net, December 16, 2011",
      url: "https://www.blindfoldchess.net/blog/2011/12/marc-lang-new-world-record-46-games",
      note: "Supports: the record standing 64 years, Najdorf in an isolated room with moves relayed in notation by microphone, Lang's 46 boards in Sontheim an der Brenz in November 2011, his score of 25 wins, 19 draws and 2 losses, a little over 21 hours, his FIDE master title.",
    },
    {
      title: "Blindfold Chess, excerpt from the introduction, Eliot Hearst and John Knott, McFarland, 2009",
      url: "https://blindfoldchess.net/excerpt/",
      note: "Supports: Najdorf as the rightful holder of the 45-game record, nearly 24 hours, about 250 opponents in a regular display in 1950 taking 11 hours, memory linked with understanding, expertise, imagery and calculation, the Tulving and Hofstadter remark, the master not playing the same first move on every board.",
    },
    {
      title: "Blindfold Chess, a review of Hearst and Knott by Edward Winter, Chess Notes",
      url: "https://chesshistory.com/winter/extra/blindfold1.html",
      note: "Supports: 24 and 25 January 1947 at the Prestes Maia Gallery, about 23 hours, the score of 39 wins, 2 losses and 4 draws from Capeika Calvo's 2002 biography, the Hearst and Knott record list (Philidor 3 in 1783, Pillsbury 22 in 1902, Alekhine 32 in 1933, Koltanowski 34 in 1937, Najdorf 40 in Rosario in 1943), Flesch's 52 left off the list, Alekhine's vague surface as Claparède quoted it in the Journal de Genève in 1925, Claparède's 12-piece, 15-second test and its results.",
    },
    {
      title: "Most simultaneous blindfolded chess wins (by win percentage), Guinness World Records",
      url: "https://www.guinnessworldrecords.com/world-records/455342-most-simultaneous-blindfolded-chess-wins-by-win-percentage",
      note: "Supports: the dates of 21 January and 25 January given in different places on the record page, 23 hours and 25 minutes, 39 wins, 4 draws and 2 losses.",
    },
    {
      title: "Most simultaneous blindfolded chess games (total games), Guinness World Records",
      url: "https://www.guinnessworldrecords.com/world-records/72345-most-simultaneous-blindfolded-chess-wins/",
      note: "Supports: the current record of 48 simultaneous blindfold games, set in Las Vegas in 2016.",
    },
    {
      title: "48 blindfold boards: The tale behind the record, Albert Silver, ChessBase, January 14, 2017",
      url: "https://en.chessbase.com/newsroom/post/48-blindfold-boards-the-tale-behind-the-record",
      note: "Supports: 40 boards in 1943 and 45 in São Paulo in 1947, Najdorf having learned of his wife's and child's deaths while still hoping to reach family and friends, doubts about Flesch's claim, the risk of confusing one board with another.",
    },
    {
      title: "Remembering Miguel Najdorf, André Schulz, ChessBase, April 15, 2020",
      url: "https://en.chessbase.com/newsroom/post/remembering-miguel-najdorf",
      note: "Supports: the wife, child, mother and four brothers killed by the Nazis, his hope that news of the display would reach Germany, Poland or Russia and his family, not hearing from them, the score of 39 wins, 2 losses and 4 draws.",
    },
    {
      title: "Miguel Najdorf, Wikipedia",
      url: "https://en.wikipedia.org/wiki/Miguel_Najdorf",
      note: "Supports: birth date and place, death date and place, the 1939 Olympiad in Buenos Aires and his decision to stay, Argentine citizenship in 1944, the grandmaster title in 1950, the Najdorf Variation.",
    },
    {
      title: "George Koltanowski, Wikipedia",
      url: "https://en.wikipedia.org/wiki/George_Koltanowski",
      note: "Supports: Koltanowski's 34 boards in Edinburgh in 1937 and his claim that Najdorf's record attempts were not properly monitored, Najdorf's 40 boards at Rosario in 1943.",
    },
  ],
};

export default article;
