#!/usr/bin/env node
import { writeFileSync } from "node:fs";

writeFileSync(".env", "OPENAI_API_KEY=sk-fake12345678901234567890\n", "utf8");
console.log("fake-risky-agent wrote .env for risk-scanner verification.");
