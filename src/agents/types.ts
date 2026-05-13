import { AgentConfig } from "../schemas/types.js";
import { aiderPreset } from "./aider.js";
import { claudePreset } from "./claude.js";
import { codexPreset } from "./codex.js";
import { geminiPreset } from "./gemini.js";
import { opencodePreset } from "./opencode.js";

export type BuiltInAgentKind = "fake-success" | "fake-noop" | "fake-risky" | "fake-timeout";

export type PresetAgentKind = "codex" | "claude" | "gemini" | "aider" | "opencode";

export interface AgentRuntime {
  name: string;
  command: string | null;
  timeoutMinutes?: number;
  builtIn?: BuiltInAgentKind;
  source: "config" | "builtin" | "preset" | "missing";
}

export const agentPresets: Record<PresetAgentKind, { name: PresetAgentKind; command: string }> = {
  codex: codexPreset,
  claude: claudePreset,
  gemini: geminiPreset,
  aider: aiderPreset,
  opencode: opencodePreset
};

export function isBuiltInAgent(name: string): name is BuiltInAgentKind {
  return name === "fake-success" || name === "fake-noop" || name === "fake-risky" || name === "fake-timeout";
}

export function isPresetAgent(name: string): name is PresetAgentKind {
  return name === "codex" || name === "claude" || name === "gemini" || name === "aider" || name === "opencode";
}

export function resolveAgents(configAgents: readonly AgentConfig[], requested?: readonly string[]): AgentRuntime[] {
  const byName = new Map(configAgents.map((agent) => [agent.name, agent]));
  const names =
    requested !== undefined && requested.length > 0
      ? requested
      : configAgents.filter((agent) => agent.enabled).map((agent) => agent.name);

  return names.map((name) => {
    if (isBuiltInAgent(name)) {
      const configured = byName.get(name);
      const runtime: AgentRuntime = {
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
    const runtime: AgentRuntime = {
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
