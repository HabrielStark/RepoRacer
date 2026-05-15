import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/RepoRacer/",
  title: "RepoRacer",
  description: "Benchmark AI coding agents on your own repository using real tasks mined from git history.",
  cleanUrls: true,
  head: [
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "RepoRacer" }],
    [
      "meta",
      {
        property: "og:description",
        content: "Benchmark AI coding agents on real tasks mined from your own Git history."
      }
    ],
    ["meta", { property: "og:image", content: "https://habrielstark.github.io/RepoRacer/social-preview.png" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:image", content: "https://habrielstark.github.io/RepoRacer/social-preview.png" }]
  ],
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Guide", link: "/guide" },
      { text: "Architecture", link: "/architecture" },
      { text: "API", link: "/api/" },
      { text: "Security", link: "/security" }
    ],
    sidebar: [
      {
        text: "Start",
        items: [
          { text: "Overview", link: "/" },
          { text: "Guide", link: "/guide" },
          { text: "Agent compatibility", link: "/agent-compatibility" },
          { text: "Examples", link: "/examples" }
        ]
      },
      {
        text: "Reference",
        items: [
          { text: "Architecture", link: "/architecture" },
          { text: "Scoring", link: "/scoring" },
          { text: "Public API", link: "/api-stability" },
          { text: "Adapters", link: "/adapters" },
          { text: "Security", link: "/security" },
          { text: "Troubleshooting", link: "/troubleshooting" },
          { text: "Comparison", link: "/comparison" },
          { text: "Release process", link: "/release" },
          { text: "FAQ", link: "/faq" },
          { text: "Roadmap", link: "/roadmap" }
        ]
      }
    ],
    socialLinks: []
  }
});
