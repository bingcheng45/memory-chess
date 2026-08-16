import type { Metadata } from "next";
import LearnHubPageContent from "@/components/learn/LearnHubPageContent";

export const metadata: Metadata = {
  title: "Chess Learning Center for Beginners",
  description:
    "Read simple chess guides about board vision, visualization, memory, calculation, blunders, and building a useful practice routine.",
  alternates: {
    canonical: "/learn",
  },
  openGraph: {
    title: "Chess Learning Center for Beginners",
    description:
      "Simple guides and practical drills for chess memory, board vision, calculation, and fewer blunders.",
    url: "https://thememorychess.com/learn",
    images: [
      {
        url: "https://thememorychess.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Memory Chess Learning Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Learning Center for Beginners",
    description:
      "Simple guides and practical drills for chess memory, board vision, calculation, and fewer blunders.",
    images: ["https://thememorychess.com/twitter-image"],
  },
};

export default function LearnHubPage() {
  return <LearnHubPageContent />;
}
