import { aiderPreset } from "./aider.js";
import { claudePreset } from "./claude.js";
import { codexPreset } from "./codex.js";
import { geminiPreset } from "./gemini.js";
import { opencodePreset } from "./opencode.js";
export const agentPresets = {
    codex: codexPreset,
    claude: claudePreset,
    gemini: geminiPreset,
    aider: aiderPreset,
    opencode: opencodePreset
};
export function isBuiltInAgent(name) {
    return name === "fake-success" || name === "fake-noop" || name === "fake-risky" || name === "fake-timeout";
}
export function isPresetAgent(name) {
    return name === "codex" || name === "claude" || name === "gemini" || name === "aider" || name === "opencode";
}
export function resolveAgents(configAgents, requested) {
    const byName = new Map(configAgents.map((agent) => [agent.name, agent]));
    const names = requested !== undefined && requested.length > 0
        ? requested
        : configAgents.filter((agent) => agent.enabled).map((agent) => agent.name);
    return names.map((name) => {
        if (isBuiltInAgent(name)) {
            const configured = byName.get(name);
            const runtime = {
                name,
                command: null,
                builtIn: name,
                source: configured === undefined ? "builtin" : "config"
            };
            if (configured?.timeoutMinutes !== undefined) {
                runtime.timeoutMinutes = configured.timeoutMinutes;
            }
            return runtime;
        }
        const configured = byName.get(name);
        if (configured === undefined) {
            if (isPresetAgent(name)) {
                return {
                    name,
                    command: agentPresets[name].command,
                    source: "preset"
                };
            }
            return {
                name,
                command: null,
                source: "missing"
            };
        }
        const runtime = {
            name: configured.name,
            command: configured.command ?? null,
            source: "config"
        };
        if (configured.timeoutMinutes !== undefined) {
            runtime.timeoutMinutes = configured.timeoutMinutes;
        }
        return runtime;
    });
}
//# sourceMappingURL=types.js.map