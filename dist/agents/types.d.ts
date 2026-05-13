import { AgentConfig } from "../schemas/types.js";
export type BuiltInAgentKind = "fake-success" | "fake-noop" | "fake-risky" | "fake-timeout";
export type PresetAgentKind = "codex" | "claude" | "gemini" | "aider" | "opencode";
export interface AgentRuntime {
    name: string;
    command: string | null;
    timeoutMinutes?: number;
    builtIn?: BuiltInAgentKind;
    source: "config" | "builtin" | "preset" | "missing";
}
export declare const agentPresets: Record<PresetAgentKind, {
    name: PresetAgentKind;
    command: string;
}>;
export declare function isBuiltInAgent(name: string): name is BuiltInAgentKind;
export declare function isPresetAgent(name: string): name is PresetAgentKind;
export declare function resolveAgents(configAgents: readonly AgentConfig[], requested?: readonly string[]): AgentRuntime[];
