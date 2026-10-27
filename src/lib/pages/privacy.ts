import type { PageText } from "./schema";

const privacy: PageText = {
  meta: {
    title: "Privacy Policy",
    description: "Learn how Memory Chess uses data, browser storage, analytics, cookies, and advertising services.",
    socialTitle: "Memory Chess Privacy Policy",
    socialDescription: "Learn how Memory Chess handles data, cookies, analytics, and advertising.",
  },
  kicker: "Your privacy",
  title: "Privacy Policy",
  lede: "A simple guide to what Memory Chess collects, why we use it, and the choices you have.",
  sections: {
    "short-version": {
      title: "The short version",
      blocks: [
        {
          p: "You can play Memory Chess without creating an account. We use a small amount of data to run the game, remember your settings, understand how the site performs, respond to messages, maintain the leaderboard, and improve the experience. We also use Google AdSense, which may use cookies and similar technology for ads when advertising is enabled.",
        },
      ],
    },
    controller: {
      title: "Who is responsible for your data",
      blocks: [
        {
          p: "Memory Chess is run by Bing Cheng, an independent developer, who acts as the data controller for the personal information described in this policy. For any privacy question or request, email <mail>{email}</mail> or use the contact form.",
        },
      ],
    },
    "information-you-give": {
      title: "Information you give us",
      blocks: [
        {
          ul: [
            "<b>Contact messages:</b> your name, email address, inquiry type, and message when you use the contact form.",
            "<b>Game feedback:</b> your star rating, optional comments, and game details such as accuracy, difficulty, piece count, and completion times. This feedback form does not ask for your name or email address.",
            "<b>Leaderboard entries:</b> the player name you choose, the score details you submit, your skill rating at the time, and the country you pick, if any. These are displayed publicly, so please do not use your real name if you would rather keep it private. When you join the daily board, the form suggests a country from the country your connection comes from, which our hosting provider reports; we do not store that guess, and the country you choose is the one saved.",
          ],
        },
      ],
    },
    "collected-automatically": {
      title: "Information collected automatically",
      blocks: [
        {
          p: "Our measurement providers may receive technical and usage information such as pages viewed, approximate location, browser and device type, referring page, IP address, and performance timings. Memory Chess uses Google Analytics, Vercel Analytics, Vercel Speed Insights, Ahrefs Analytics, and Databuddy to understand traffic and keep the site fast and reliable.",
        },
        {
          p: "Databuddy uses no cookies. It keeps a random visitor id in your browser's local storage and a session id in its session storage. It records the pages you view, performance timings, JavaScript errors, clicks on links that leave the site, clicks that are repeated or get no response, and forms left before they are sent. It also receives an event when a round starts or finishes, with the number of pieces, the study time and where the round started, and an event when a score is sent to a leaderboard or the daily board, with its difficulty and number of pieces. These events never carry your accuracy, your player name or the positions you played.",
        },
        {
          p: "We do not ask these tools to collect the content of your contact messages or game-feedback comments.",
        },
        {
          p: "Your browser also reports to our own server when a page tries to load something our content security policy does not allow. A report keeps the directive that was violated, the website the blocked item came from, the page path without its query string, and, when the browser includes one, the first 80 characters of the blocked script. It keeps no IP address and no browser details. We use these reports only to keep the site secure and working, and we delete them after 30 days.",
        },
      ],
    },
    "cookies-and-storage": {
      title: "Cookies and browser storage",
      blocks: [
        {
          p: "Memory Chess uses browser storage to keep game history and settings on your device, remember sound preferences, avoid repeating a dismissed update banner, and time when the feedback prompt may return. Clearing your browser data resets these choices.",
        },
        {
          p: "The homepage lab record keeps every round you finish, including the practice reading on the homepage, in your browser's IndexedDB and local storage: the position you studied, the one you rebuilt, your timings, your scores, your time zone offset, where you started the round (such as the homepage or a guide), and the order and timing of each piece you placed. It is used only to draw your streak, personal bests, accuracy trend, miss map, today's board, review queue and forgetting curve on this device. The record itself, with its positions, squares, placements and history, never leaves this device. A round you choose to share is the one exception, described below. Local storage also keeps the UTC day you last opened today's board, so it offers you one try a day, and which review steps you opened, so a board left before its result is not shown twice at one delay. Google Analytics receives an event for each round you finish, on the homepage or in the game, with the number of pieces, the study time, how many pieces you recalled, your accuracy and where the round started, which can name today's board, a review or a plan. It receives an event when a round starts too, with the number of pieces, the study time and where it started. It also receives a few lab events: when the lab section comes into view, when you follow one of its play links, the number of rounds when you download or ask for cross-device backup, and the number of rounds added and skipped when you import. None of these events carry positions, squares, round ids or streaks. When you start, stop or finish a plan, or set or clear a goal, Google Analytics receives an event that names only that action, with no plan name and no numbers. The plan and goal you choose are kept in your browser's local storage on this device, as is the number of days a week you aim to play, which sends no event. Download my lab record saves a copy as a file you control, and clearing your browser data deletes the record. Private windows do not keep it. Only when you press Copy my reading does your browser put a short text on your clipboard with your memory span, and your pieces held and speed when the record can read them, each with its number of rounds. It names no positions, squares or dates and is not sent anywhere. Local storage also keeps the time the note about keeping your record in this browser first came into view, so the note is shown once, the time you last saw your notebook, so newer entries are marked as new, and the time you last downloaded the record. After a few rounds the site asks your browser once to keep the record when space runs low, and local storage notes that it asked.",
        },
        {
          p: "The progress page reads the same record in your browser and sends nothing. Only when you press Share my progress does your browser draw a picture of the figures the record can read: your memory span, skill rating, pieces held, speed, best and recent accuracy, win streak, days in a row, rounds played and days played. Only when you press Share result on the game's result screen does your browser draw a picture of that round: its accuracy, the pieces you recalled, the number of pieces, the study time allowed and taken, the rebuild time, and, except on a review, your rating, its change and any win streak, and, except on today's board, the board you studied and the board you rebuilt.",
        },
        {
          p: "Either button opens a share window, and nothing leaves your browser until you choose one of its actions: hand the picture, a short caption and a link to your device's share sheet, download the picture, copy the picture, copy the caption with its link, or open the post page of X, Facebook, LinkedIn, Reddit, WhatsApp, Threads or Bluesky with the link, and on all but Facebook and LinkedIn the caption, filled in. What you send there is handled under that service's own privacy terms.",
        },
        {
          p: "The link in the caption opens the card's own page on Memory Chess, and the card's figures are written into the link itself. A shared result link, under /share/result/, also carries the board you studied, the board you rebuilt, and the order and timing of each piece you placed, unless the round was today's board, whose link carries no position. Anyone who opens the link can read them, and Memory Chess reads them from the link to draw the page and its preview. A link is made only when you share a card, and Memory Chess does not save it. Like any page on the site, the analytics tools named above record the page's address, link included, when someone opens it.",
        },
        {
          p: "Google Analytics receives a lab_dashboard_share event when a progress card leaves the page and a result_share event when a result card does. Each names only how it left, as its method: native for the share sheet, download for a downloaded picture, copy_image for a copied picture, copy for a copied caption, or post for a network's post page, with that network named as x, facebook, linkedin, reddit, whatsapp, threads or bluesky. Neither event carries the card's figures, its boards or its link.",
        },
        {
          p: "The Remind me daily button on today's board saves a daily calendar event as a file on your device, and the file is not sent to Memory Chess. Google Analytics receives a reminder_set event when you press the button. It names only where the button was, as its surface: result, dashboard or daily. It carries no time zone, no time and no board.",
        },
        {
          p: "When you submit a score to the leaderboard, local storage on this device also keeps the id the leaderboard gives that entry, with its difficulty, country, score and the time you sent it, for your best entry on each difficulty. Only when you press Check my standing in the lab record does your browser send that entry id to Memory Chess, with whether to rank it worldwide or within the entry's own country. Memory Chess reads the entry from the leaderboard and replies with its rank and the number of entries it was ranked against. The reply is not stored. To limit how often standing can be checked, the server counts checks from each IP address in its memory for one minute, and drops an address at the first check after its minute is up. If the leaderboard no longer has the entry, its id is removed from this device. Google Analytics receives an event that says a standing check was made, with no entry id and no rank.",
        },
        {
          p: "Liking an article saves the id of that article and the like count shown at that moment in the local storage of your browser, so the like button stays pressed and its count does not fall when you come back. Session storage remembers which articles you opened in the current tab, so opening one again there does not add a view. Both lists stay in your browser. When you like an article, Google Analytics also receives a like event that names the article.",
        },
        {
          p: "The Learn search ranks guides in your browser, or on the server when you search from the search page. Google Analytics receives an event for a search with how many characters you typed, how many guides matched, the top guide and whether the match was close, and an event when you open a result with that guide and its place in the list. Neither event carries the words you typed. A search made from the search page itself puts your words in that page's address, and the analytics tools record the address of every page viewed, so those words can reach them.",
        },
        {
          p: "Google Analytics and advertising services may use cookies or similar identifiers. You can block or delete cookies in your browser, although some preferences may stop working as expected.",
        },
      ],
    },
    advertising: {
      title: "Advertising and Google AdSense",
      blocks: [
        {
          p: "Memory Chess uses Google AdSense to support the site. Third-party vendors, including Google, may place or read cookies, use web beacons, or process IP addresses when advertising services or ad tags are used.",
        },
        {
          p: "Google and its advertising partners may use advertising cookies to serve ads based on your visits to Memory Chess and other websites. Depending on your location, choices, and settings, ads may be personalized or non-personalized. Other Google-certified ad vendors may also participate in serving and measuring ads.",
        },
        {
          p: "Google is one of these vendors and uses the DoubleClick cookie, also known as the DART cookie, to serve ads based on your visits to this site and other sites on the internet. You can opt out of the DART cookie through Google's ad settings linked below.",
        },
        {
          p: "Learn more about <partnerSites>how Google uses information from partner sites</partnerSites>. You can manage personalized advertising in <adCenter>My Ad Center</adCenter> and opt out of some other vendors through <adChoices>YourAdChoices</adChoices>.",
        },
      ],
    },
    consent: {
      title: "Consent choices",
      blocks: [
        {
          p: "Where required, visitors are shown a consent message before eligible advertising data is used. Visitors in the European Economic Area, the United Kingdom, and Switzerland can consent, decline, or manage individual choices through Google's consent platform. You can also change cookie controls in your browser and adjust Google advertising preferences in My Ad Center.",
        },
      ],
    },
    "use-and-sharing": {
      title: "How we use and share information",
      blocks: [
        {
          p: "We use information to provide and secure Memory Chess, calculate results, publish submitted leaderboard scores, reply to contact messages, review feedback, measure site performance, prevent abuse, and support the site with advertising. We do not sell the contact details or feedback you submit.",
        },
        {
          p: "Data is handled by service providers only where needed: Google Sheets for contact messages and game feedback, Supabase for game statistics, leaderboard entries, and article view and like totals, Vercel for hosting and performance measurement, Ahrefs and Databuddy for analytics, and Google for analytics, consent, and advertising. These providers may process data in other countries under their own privacy terms.",
        },
        {
          p: "When you open or like an article, Supabase stores only a total of views and a total of likes for each article, with the time of the last change and no visitor identifier.",
        },
        {
          p: "On the <data>recall data page</data> we publish counts of finished rounds by number of pieces, study time and accuracy, taken from Google Analytics. They are aggregate counts only, with no names, player IDs or positions, and a group of fewer than 30 rounds or 5 players is left out.",
        },
      ],
    },
    retention: {
      title: "Retention and security",
      blocks: [
        {
          p: "We keep submitted information only for as long as it remains useful for the purposes described above, including maintaining the public leaderboard and responding to messages, or as required by law. No online service is perfectly secure, but we limit access and use reasonable safeguards for the systems we control.",
        },
      ],
    },
    "your-choices": {
      title: "Your choices",
      blocks: [
        {
          ul: [
            "Play without submitting a leaderboard name or feedback.",
            "Clear stored game data and preferences in your browser.",
            "Manage cookies, consent choices, and personalized ads.",
            "Ask us about, correct, or request deletion of information you submitted, subject to applicable law and our ability to verify the request.",
          ],
        },
      ],
    },
    "gdpr-ccpa": {
      title: "Your rights under GDPR and CCPA",
      blocks: [
        {
          p: "If you are in the European Economic Area or the United Kingdom, the GDPR gives you the rights of access, rectification, erasure, restriction of processing, objection to processing, and data portability. The legal bases we rely on are your consent, for personalized advertising and analytics cookies where consent is required, and our legitimate interests, for running and securing the site, publishing the leaderboard scores you submit, and answering the messages you send. You may withdraw consent at any time through the consent message or your browser settings, and you may lodge a complaint with your local supervisory authority.",
        },
        {
          p: "If you are a California resident, the CCPA gives you the right to know what personal information is collected, to request its deletion, and to opt out of its sale or sharing. We do not sell your personal information. Cookies used for personalized advertising may count as sharing under the CCPA, and you can opt out through the consent message, My Ad Center, and YourAdChoices linked above. This is our Do Not Sell or Share My Personal Information notice. To exercise any of these rights, email <mail>{email}</mail>.",
        },
      ],
    },
    children: {
      title: "Children's privacy",
      blocks: [
        {
          p: "Memory Chess is a general-audience training game and is not designed to collect personal information from children. If you are a parent or guardian and believe a child submitted personal information, please contact us so we can review and remove it where appropriate.",
        },
      ],
    },
    changes: {
      title: "Changes and contact",
      blocks: [
        {
          p: "We may update this policy when the site or our service providers change. The date at the top shows the latest revision. For privacy questions or requests, use the <contact>Memory Chess contact form</contact>.",
        },
      ],
    },
  },
};

export default privacy;
