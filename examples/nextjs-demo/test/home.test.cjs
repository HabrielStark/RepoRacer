const fs = require("node:fs");
const path = require("node:path");

const page = fs.readFileSync(path.join(__dirname, "..", "app", "page.tsx"), "utf8");
if (!page.includes("healthy")) {
  console.error("expected the demo page to render a healthy status");
  process.exit(1);
}
