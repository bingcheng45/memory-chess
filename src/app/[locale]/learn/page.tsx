import type { Metadata } from "next";
import LearnHubPageContent from "@/components/learn/LearnHubPageContent";

export const metadata: Metadata = {
  title: "Chess Learning Center: Beginner Guides & Drills",
  description:
    "Read practical beginner chess guides for board vision, visualization, memory, calculation, fewer blunders, and a useful daily practice routine.",
  alternates: {
    canonical: "/learn",
  },
  openGraph: {
    title: "Chess Learning Center: Beginner Guides & Drills",
    description:
      "Practical beginner guides and drills for chess memory, board vision, calculation, and fewer blunders.",
    url: "https://thememorychess.com/learn",
    type: "website",
    images: [
      {
        url: "https://thememorychess.com/learn/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Memory Chess learning guides for clearer board vision",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Learning Center: Beginner Guides & Drills",
    description:
      "Practical beginner guides and drills for chess memory, board vision, calculation, and fewer blunders.",
    images: ["https://thememorychess.com/learn/opengraph-image"],
  },
  category: "Chess education",
};

export default function LearnHubPage() {
  return <LearnHubPageContent />;
}
