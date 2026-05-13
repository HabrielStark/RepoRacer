import { defineConfig } from "vitepress";

export default defineConfig({
  title: "RepoRacer",
  description: "Benchmark AI coding agents on your own repository using real tasks mined from git history.",
  cleanUrls: true,
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
