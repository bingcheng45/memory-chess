import type { Article } from "../schema";

const article: Article = {
  slug: "garry-kasparov",
  publishedAt: "2026-10-28T00:00:00.000Z",
  updatedAt: "2026-10-28T00:00:00.000Z",
  title: "Garry Kasparov's memory test: 117 of 120 pieces",
  searchTitle: "Garry Kasparov's IQ and memory, tested in 1987",
  relatedGuides: [
    { slug: "chess-memory-training", anchor: "train your chess memory step by step" },
    { slug: "chess-pattern-recognition-drills", anchor: "drills that build chess patterns" },
  ],
  description: "In 1987 Der Spiegel tested Garry Kasparov's memory and IQ. He recalled 117 of 120 pieces after 5-second views, yet trailed students on visual tasks.",
  summary: "In 1987 Der Spiegel spent three days testing Garry Kasparov in Baku. This article follows his chess recall, his IQ scores and his weak results on picture tasks, then sets them beside research on expert memory.",
  person: {
    name: "Garry Kasparov",
    role: "World chess champion, 1985 to 2000",
  },
  photo: {
    src: "/images/articles/garry-kasparov.jpg",
    width: 840,
    height: 1050,
    alt: "Garry Kasparov in April 1987",
    author: "Comet Photo AG (Zürich), ETH-Bibliothek Zürich",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Garry_Kasparov_-_1987_-_cropped.jpg",
    changes: "Cropped and resized",
  },
  facts: {
    born: "13 Apr 1963, Baku, Azerbaijan SSR",
    country: "Soviet Union, then Russia",
    title: "Grandmaster, 1980",
    peakRating: "2851 (1999)",
    worldChampion: "1985 to 2000",
    knownFor: "Ranked world number 1 for 255 months",
    memoryFeat: "Recalled 117 of 120 pieces after 5-second views",
  },
  drill: {
    pieceCount: 8,
    memorizeTime: 5,
    why: "Kasparov had 5 seconds per diagram. His only misses on those diagrams came on a constructed position, which is closer to a Memory Chess board than a game is.",
  },
  sections: [
    {
      heading: "Five seconds in a Baku hotel room",
      paragraphs: [
        "The diagram was no bigger than a credit card. It usually showed a position from a real game, with between 22 and 30 pieces. Garry Kasparov, the 24-year-old world champion, could look at it for five seconds. Then he had to draw the position on an empty diagram.",
        "He was shown five of these cards. Across them he saw 120 pieces and placed 117 correctly. A team from the German news magazine Der Spiegel ran the test over three days. They worked in a room of the Hotel Azerbaijan in Baku, his home city. The same team measured his IQ at 135 on one test and 123 on another.",
        "The tests were his last outside contacts before a training camp and then Seville, where he defended his title against Anatoly Karpov. That match ended 12 to 12 in December 1987, and Kasparov kept the title.",
        "Der Spiegel published the results in two issues at the end of December 1987. The first covered intelligence and the second covered chess and memory. Kasparov had agreed to be tested about two years earlier, in a Hamburg interview with the Spiegel journalist Werner Harenberg.",
      ],
    },
    {
      heading: "Do chess players have a photographic memory?",
      paragraphs: [
        "No, not in the sense of a camera. Der Spiegel wrote that his brain worked like one, but its own follow-up report shows something more specific. Four of the five positions came from real games. They held 98 pieces, and Kasparov placed every one. The fifth position was not from a game. It had been constructed artificially, and he missed 3 of its 22 pieces.",
        "A second task moved further from real chess. Gisbert Jacoby, the Hamburg trainer who designed the chess test, built a 40-move game in which a die chose which type of piece moved. Kasparov watched it played through in 50 seconds and then had to repeat it.",
        "He rebuilt it up to move 32 and then got stuck. So he set up the final position and worked backward to move 35. In total he found 37 of the 40 moves. Two young Hamburg players from the national league tried the same task. Oliver Schulte got as far as move 20, and Matthias Wahls reached move 13.",
        "Kasparov's recall slipped as the material moved away from real games. Der Spiegel's explanation was that he compares whatever he sees with thousands of patterns from typical game positions. Two years earlier he had recognized master games from a single position, naming the players, the place and the year. He said he held as many games in his head as other people hold words.",
      ],
    },
    {
      heading: "Kasparov's IQ, and the picture tests he lost",
      paragraphs: [
        "The intelligence tests gave two different numbers. On a test that the psychologist Hans Jürgen Eysenck assembled for him, Kasparov scored 135. On Raven's Advanced Progressive Matrices he scored 123. The magazine noted that Eysenck himself warned against reading such scores too precisely. Its verdict was that his intelligence was well above average but far below the levels claimed for historic geniuses.",
        "A third test, Adolf Otto Jäger's Berlin Intelligence Structure model, broke ability into parts. Kasparov led on almost every task with numbers. His figural and pictorial thinking was weak. On those tasks he trailed 30 German league players and also Berlin school and university students. One of those tasks asked him to memorize a dozen buildings, cars and trees on a section of city map, then draw them into a plan.",
        "Another gave him a sheet of 24 ellipses and three minutes to turn them into as many patterns as possible. For half the time he drew nothing. He finished with three. Young players from the Hamburger SV chess section averaged seven.",
        "Der Spiegel explained the gap with a remark from Siegbert Tarrasch, a leading player of an earlier era. A good player does not see a knight as a wooden horse's head. The player sees a piece with a peculiar move, worth about three pawns. On this account the chess eye is abstract and has little to do with ordinary seeing.",
        "Words were easier for him. Copying a stunt by the 19th-century player Harry Pillsbury, the team gave him a list of 29 words, some of them invented. He wrote down 20 after three minutes and 7 more five minutes later. He missed the name Achtenbach entirely and recalled only three letters of the made-up word Hatjiroomutos.",
      ],
    },
    {
      heading: "Chess memory and general memory are different skills",
      paragraphs: [
        "His results match a pattern psychologists described long before 1987. In 1927 a team led by I. N. Djakow gave top masters a battery of psychological tests. According to a later review by Fernand Gobet and Herbert Simon, the masters beat a control group on chess material. On tests unrelated to chess they did no better.",
        "Gobet and Simon also reviewed recall of random positions. Strong players still remember slightly more of them than weak players do. The gap is roughly one piece per 400 rating points. On positions from real games, the same 400 points typically add about five pieces.",
        "The evidence on general intelligence has moved since 1987. Der Spiegel reported no correlation between IQ and playing strength among the 30 league players it tested. A 2016 meta-analysis led by Alexander Burgoyne pooled 19 studies with 1,779 participants. It found a modest average correlation of 0.24 between cognitive ability and chess skill, stronger in young players and in lower-skill samples.",
        "The same paper found that numerical ability went with chess skill most strongly, at 0.35. Visuospatial ability went with it least, at 0.13. Kasparov's own profile, strong with numbers and weak with pictures, follows the same order. One player is not a sample, though, and none of these studies tested him. The next paragraph is this article's interpretation, not a result from any study.",
        "On that reading, his perfect game positions and his three lost pieces on the constructed card are one result. Familiar groups of pieces could be stored as single units. Where the groups were missing, he was left with something closer to ordinary memory, still good but no longer a camera.",
      ],
    },
    {
      heading: "Try his five-second card",
      paragraphs: [
        "Der Spiegel gave Kasparov 5 seconds a card. Give yourself the same in Memory Chess, with 8 pieces. Memory Chess places its pieces by program rather than taking them from games, so its boards are closer to his constructed fifth card. While the board shows, look for any group that could occur in a real game, such as a king behind its pawns. Name those groups first, then the stray pieces. When 8 pieces feel easy, try 10 at the same 5 seconds.",
      ],
    },
  ],
  sources: [
    {
      title: "Genieblitze und Blackouts, Werner Harenberg, Der Spiegel 52/1987, 21 December 1987",
      url: "https://www.spiegel.de/politik/genieblitze-und-blackouts-a-1a1cbaba-0002-0001-0000-000013526693",
      note: "Supports: three days of testing in the Hotel Azerbaijan in Baku, the diagrams the size of a bank card, five seconds for positions of 22 or 30 pieces, 117 of 120 pieces, the camera comparison, the last contacts before the camp and Seville, the Hamburg interview about two years earlier, the scores of 135 and 123, Eysenck's warning and the verdict on his intelligence, Jäger's model, the numerical results, the weak figural thinking against 30 league players and Berlin students, the city map task, the 24 ellipses and his three patterns against an average of seven, the Tarrasch knight remark, the report of no IQ correlation among the league players.",
    },
    {
      title: "Hausmitteilung: Datum 21. Dezember 1987, Kasparow, Der Spiegel 52/1987",
      url: "https://www.spiegel.de/politik/datum-21-dezember-1987-kasparow-a-e0973ef5-0002-0001-0000-000013526237",
      note: "Supports: the issue date, Werner Harenberg as the Spiegel editor who interviewed Kasparov about his memory two years earlier, the three days of tests in Baku before the title match against Karpov, Harenberg as author of the report.",
    },
    {
      title: "Hatjiroomutos und Hübners Finger, Der Spiegel 53/1987",
      url: "https://www.spiegel.de/sport/hatjiroomutos-und-huebners-finger-a-69fd83b9-0002-0001-0000-000013527413",
      note: "Supports: the second issue covering chess and memory, the 98 pieces placed without error in four game positions, the 3 of 22 missed in the constructed fifth position, Jacoby as designer of the chess test, the comparison with thousands of stored patterns, the recognition two years earlier of master games by players, place and year, the remark about games and words, Pillsbury's word stunt, the list of 29 words, 20 and then 7 more, Achtenbach and Hatjiroomutos.",
    },
    {
      title: "Eine letzte Lücke blieb, Der Spiegel 53/1987",
      url: "https://www.spiegel.de/sport/eine-letzte-luecke-blieb-a-45bd1463-0002-0001-0000-000013527427",
      note: "Supports: the dice game where a die chose the piece type, its 40 moves shown in 50 seconds, Kasparov's reconstruction to move 32, the backward work from move 40 to 35, 37 of 40 moves, Schulte reaching move 20 and Wahls move 13.",
    },
    {
      title: "Recall of rapidly presented random chess positions is a function of skill, Fernand Gobet and Herbert A. Simon, 1996, Brunel author preprint",
      url: "https://bura.brunel.ac.uk/bitstream/2438/1346/1/FullText.pdf",
      note: "Supports: the 1927 tests by Djakow, Petrowski and Rudik and the masters' advantage only on chess material, the small advantage of strong players on random positions, about one piece per 400 rating points against about five on game positions.",
    },
    {
      title: "The relationship between cognitive ability and chess skill: A comprehensive meta-analysis, Alexander P. Burgoyne and others, Intelligence 59, pages 72 to 83 (2016)",
      url: "https://www.psychologie.uzh.ch/dam/jcr:4b13cd49-3e58-409f-988e-1e73693e1e0b/Burgoyne.Intelligence.2016.pdf",
      note: "Supports: 19 studies with 1,779 participants, the average correlation of 0.24, the stronger link in youth and unranked samples, the correlations of 0.35 for numerical and 0.13 for visuospatial ability.",
    },
    {
      title: "Garry Kasparov, Wikipedia",
      url: "https://en.wikipedia.org/wiki/Garry_Kasparov",
      note: "Supports: birth date and place, the countries he represented, the grandmaster title in 1980, world champion from 1985 to 2000, peak rating 2851 in 1999, 255 months as world number 1.",
    },
    {
      title: "World Chess Championship 1987, Wikipedia",
      url: "https://en.wikipedia.org/wiki/World_Chess_Championship_1987",
      note: "Supports: the match in Seville against Karpov, its end in December 1987, the 12 to 12 score, Kasparov keeping the title.",
    },
  ],
};

export default article;
