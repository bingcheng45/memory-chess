import type { Article } from "../schema";

const article: Article = {
  slug: "dominic-obrien",
  publishedAt: "2026-10-28T00:00:00.000Z",
  updatedAt: "2026-10-28T00:00:00.000Z",
  title: "Dominic O'Brien's memory palace, and what it means for chess",
  searchTitle: "Dominic O'Brien's memory palace and chess memory",
  relatedGuides: [
    { slug: "chess-memory-training", anchor: "chess memory training" },
    { slug: "chess-visualization-exercises", anchor: "chess visualization exercises" },
  ],
  description: "Dominic O'Brien won eight World Memory Championships with the memory palace technique. What brain scans show it does, and why chess memory differs.",
  summary: "In 1987 Dominic O'Brien watched a man memorize a deck of cards on television and could not remember six cards himself. This article follows how he built a memory palace, what brain scans of top memorizers found, and why a chess master's memory rests on a different skill.",
  person: {
    name: "Dominic O'Brien",
    role: "Eight-time World Memory Champion",
  },
  photo: {
    src: "/images/articles/dominic-obrien.jpg",
    width: 640,
    height: 800,
    alt: "Dominic O'Brien in a dinner jacket and bow tie in 2012",
    author: "djbrubru",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dominic_O%27Brien,_2012_(cropped).jpg",
    changes: "Cropped and resized",
  },
  facts: {
    born: "10 Aug 1957",
    country: "United Kingdom",
    title: "World Memory Champion, 1991 to 2001",
    knownFor: "Eight World Memory Championship titles",
    memoryFeat: "Memorized 54 shuffled decks, each card seen once",
  },
  drill: {
    pieceCount: 12,
    memorizeTime: 20,
    why: "O'Brien stores items at fixed stops on a route, and Chase and Ericsson found trained memory runs on groups of 3 or 4 items. Twelve pieces make four stops, about 5 seconds each.",
  },
  sections: [
    {
      heading: "Half a dozen cards in 1987",
      paragraphs: [
        "In 1987 Dominic O'Brien watched Creighton Carvello memorize a whole deck of cards on the BBC program Record Breakers. O'Brien recalled in a 2023 Naked Scientists interview that it took just under three minutes. Carvello's Wikipedia entry gives 2 minutes 59 seconds. Then O'Brien sat down with a deck of his own. He could not hold more than about half a dozen cards.",
        "Nothing in his past suggested he would catch up. \"I was absolutely hopeless academically,\" he said in the same interview. He has said he was diagnosed with dyslexia. He decided there had to be a method, and he began building one out of his imagination.",
        "Four years later he won the first World Memory Championship, held in London in 1991. He has said there were just seven competitors that year. The event was created by Tony Buzan and co-founded with Raymond Keene, a chess grandmaster. O'Brien won the title eight times between 1991 and 2001.",
        "On 1 May 2002 he set a Guinness record. He memorized 54 shuffled packs, 2,808 cards in all, after seeing each card only once. Wikipedia reports eight errors in his recall, four of which he corrected as soon as he was told. In 2007 Dave Farrow raised the record to 59 packs.",
      ],
    },
    {
      heading: "How the memory palace technique works",
      paragraphs: [
        "O'Brien's method is often called the journey. Most people know it as the memory palace, and psychologists call it the method of loci. You take a route you know well, such as a walk through your childhood home. You turn each item into a vivid image and leave it at the next stop on the route. To recall, you walk the route again in your mind.",
        "O'Brien builds his routes from places he knew as a child. In the 2023 interview he estimated that he has about 70 routes of 50 stages each. He codes the information, brings the images to life and ties each one to its place. For numbers he devised the Dominic System, which is similar to the Major System.",
        "The method is old. A 2003 paper by Eleanor Maguire and colleagues traces it to the Greek poet Simonides of Ceos. They note that it has been used in almost unchanged form for two and a half thousand years.",
      ],
    },
    {
      heading: "What brain scans of top memorizers found",
      paragraphs: [
        "Maguire's team, writing in Nature Neuroscience, tested ten people with superior memory. Eight had placed at the highest levels of the World Memory Championships. The paper does not name them, so it is not known whether O'Brien was one. The team compared them with ten matched controls.",
        "The memorizers did not have higher intellect than the controls. Brain scans found no structural differences either. Nine of the ten used the method of loci for some or all of the tasks. While learning, they activated brain regions tied to spatial memory and navigation more than the controls did.",
        "The test materials made the most telling point. The memorizers recognized far more three-digit numbers than the controls, 25.9 against 18.5 out of 30. With faces the gap was small. With snowflake drawings, which are hard to put into words, both groups scored 19.7. Their advantage lay in their method, not in a better camera.",
        "A 2017 study in Neuron, led by Martin Dresler, went further. It tested 23 memory athletes from the world's top 50 on a list of 72 words. The athletes recalled almost all of them, while controls managed about 40. Volunteers who practiced the method of loci for six weeks more than doubled their recall. Four months later they still did almost as well.",
      ],
    },
    {
      heading: "Can a memory palace help at chess?",
      paragraphs: [
        "It helps you store moves, but it does not help you see the board. In a 2017 ChessBase column, David Fadul wrote that a memory palace can store hundreds of games or openings. He added that it will not let you see a chess board in your mind.",
        "A famous lab case shows how narrow a trained memory can be. In a 1980 report, William Chase and K. Anders Ericsson described a student known as SF, who practiced recalling spoken digits. Over 25 months and more than 250 hours of practice, his digit span rose from 7 to over 80. Chase had co-written the 1973 study with Herbert Simon showing that masters remember positions in chunks, familiar groups of pieces held as one unit.",
        "SF was a good long-distance runner, and he coded groups of 3 or 4 digits as running times. The skill stayed with the digits. After three months of practice his span for consonants was tested, and it was still around 6. Chase and Ericsson reported no transfer at all.",
        "They tied SF to chess directly. Their 1980 report says research on chess experts suggests that meaningful patterns stored in long-term memory underlie superior memory. A memory champion turns arbitrary items into images and places them on a route. A chess master recognizes familiar groups of pieces. Both lean on knowledge, but different knowledge.",
        "Random material shows the split. Memory athletes compete on shuffled cards and random digits, which their method turns into images. Maguire's snowflakes show that the method has limits. Chess players lose most of their edge on random positions. Fernand Gobet and Herbert Simon found in 1996 that strong players keep a small advantage there, much smaller than on game positions.",
        "So is chess good for memory, or memory training good for chess? The studies here measured gains on the material that was trained. None of them tested chess strength, and SF's skill did not carry over even to letters. So they cannot settle the question.",
        "O'Brien's routes and SF's groups share one structure. Each holds a few items at a time and puts them at fixed stops in a fixed order. Chase and Ericsson called this a retrieval structure. A chess board already has one. Its quarters, ranks and files are stops you never have to invent. That last step is this article's own idea, not something the studies tested.",
      ],
    },
    {
      heading: "Walk the board in four stops",
      paragraphs: [
        "Use the board's own route. In Memory Chess, choose 12 pieces and 20 seconds. Before the board appears, fix a route of four stops: bottom left, bottom right, top right, then top left. While the board shows, visit each quarter in that order. Take in its pieces as one small picture, usually 3 or 4 of them. When the board clears, walk the route again and place each quarter's group. If one quarter keeps failing, start the route there next round.",
      ],
    },
  ],
  sources: [
    {
      title: "How to make your memory better, interview with Dominic O'Brien, The Naked Scientists, May 16, 2023",
      url: "https://www.thenakedscientists.com/articles/interviews/how-make-your-memory-better",
      note: "Supports: the 1987 TV segment and the deck memorized in just under three minutes, failing to remember more than about half a dozen cards, the quote about being hopeless academically, his dyslexia diagnosis, building a method from imagination, seven competitors in 1991, routes from childhood places, about 70 routes of 50 stages, coding and associating images with places.",
    },
    {
      title: "Creighton Carvello, Wikipedia",
      url: "https://en.wikipedia.org/wiki/Creighton_Carvello",
      note: "Supports: Carvello's 1987 Record Breakers appearance, the 2 minutes 59 seconds deck, and that this feat inspired O'Brien.",
    },
    {
      title: "Dominic O'Brien, Wikipedia",
      url: "https://en.wikipedia.org/wiki/Dominic_O%27Brien",
      note: "Supports: birth date, British nationality, eight World Memory Championship titles, the Dominic System and its likeness to the Major System, the 1 May 2002 record of 54 packs and 2,808 cards seen once, eight errors with four corrected when told.",
    },
    {
      title: "World Memory Championships, Wikipedia",
      url: "https://en.wikipedia.org/wiki/World_Memory_Championships",
      note: "Supports: the first championship in London in 1991, Tony Buzan as originator and co-founder with Ray Keene, O'Brien's titles in 1991, 1993, 1995, 1996, 1997, 1999, 2000 and 2001.",
    },
    {
      title: "Most decks of playing cards memorized by a single sighting, Guinness World Records",
      url: "https://www.guinnessworldrecords.com/world-records/most-decks-of-playing-cards-memorized-single-sighting",
      note: "Supports: Dave Farrow's 2007 record of 59 packs.",
    },
    {
      title: "Total recall, Raymond Keene, The Spectator, September 8, 2012",
      url: "https://www.spectator.com/article/total-recall/",
      note: "Supports: Keene as a chess grandmaster writing on memory sport and O'Brien as eight-times World Memory Champion.",
    },
    {
      title: "Routes to remembering: the brains behind superior memory, Eleanor Maguire, Elizabeth Valentine, John Wilding and Narinder Kapur, Nature Neuroscience 6, pages 90 to 95 (2003)",
      url: "https://www.nature.com/articles/nn988",
      note: "Supports: ten superior memorizers, eight from the highest levels of the World Memory Championships, ten matched controls, no exceptional intellect or structural brain differences, nine of ten using the method of loci, Simonides of Ceos, use over two and a half millennia, activity in regions tied to spatial memory and navigation, recognition scores of 25.9 against 18.5 for digits and 19.7 for both groups on snowflakes, a small gap on faces.",
    },
    {
      title: "Mental Training Evokes Superior Memory, Transforms Brain Networks, Gwyneth Dickey Zakaib, Alzforum, March 10, 2017, on Dresler and colleagues in Neuron",
      url: "https://alzforum.org/node/761291",
      note: "Supports: 23 memory athletes from the world's top 50, the 72-word list, athletes recalling almost all and controls about 40, six weeks of method of loci training more than doubling recall, near-equal recall four months later.",
    },
    {
      title: "Mnemonic Training Reshapes Brain Networks to Support Superior Memory, Martin Dresler and colleagues, Neuron 93, pages 1227 to 1235 (2017)",
      url: "https://doi.org/10.1016/j.neuron.2017.02.003",
      note: "Supports: the 2017 Neuron study led by Martin Dresler on memory athletes and six weeks of method of loci training. The figures in the body are taken from the Alzforum report of this paper.",
    },
    {
      title: "Skilled Memory, William G. Chase and K. Anders Ericsson, Carnegie-Mellon University Technical Report No. 5, November 6, 1980 (DTIC ADA114635)",
      url: "https://mlc-wels.edu/continuing-education/wp-content/uploads/sites/11/2024/06/ADA114635-PDS0105-5.pdf",
      note: "Supports: SF's 25 months and over 250 hours of practice, digit span from 7 to over 80, coding digits as running times, groups of 3 and 4 digits, consonant span around 6 with no transfer after three months, meaningful patterns in long-term memory underlying chess experts' memory, the term retrieval structure.",
    },
    {
      title: "Recall of rapidly presented random chess positions is a function of skill, Fernand Gobet and Herbert A. Simon, Psychonomic Bulletin and Review 3, pages 159 to 163 (1996)",
      url: "https://bura.brunel.ac.uk/bitstream/2438/1346/1/FullText.pdf",
      note: "Supports: Chase and Simon's 1973 chunking theory of chess memory, strong players keeping some advantage on random positions, much smaller than on game positions.",
    },
    {
      title: "Memory Techniques: An Introduction, David Fadul, ChessBase, May 30, 2017",
      url: "https://en.chessbase.com/newsroom/post/memory-techniques-an-introduction",
      note: "Supports: the short answer that a memory palace helps store moves but not see the board, that it can store hundreds of games or openings, and it will not let you see a chess board in your mind.",
    },
  ],
};

export default article;
