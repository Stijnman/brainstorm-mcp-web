// shared/types.ts
export interface PersonaDefinition {
  system: string;
  temperature?: number;
  topP?: number;
  seed?: number;
}

export interface AgentSpec {
  id: string;
  model: string;
  persona: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  seed?: number;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ResolvedAgent extends AgentSpec {
  model: ResolvedModel;
  systemPrompt: string;
  temperature: number;
}

export interface ResolvedModel {
  provider: string;
  modelId: string;
  kind: "api" | "cli";
}

export interface DebateOptions {
  topic: string;
  agents: AgentSpec[];
  rounds?: number;
  synthesizer?: AgentSpec | string;
  systemPrompt?: string;
  context?: string;
  style?: string;
  participate?: boolean;
  mode?: "auto" | "hosted";
  onProgress?: (msg: string) => void;
}

export interface DebateResult {
  topic: string;
  responses: Array<{ round: number; model: string; response: string }>;
  finalSynthesis: string;
  rounds: number;
  modelIdentifiers: string[];
  synthesizer: string;
  estimatedTokens: number;
}

export interface DebateHistory {
  id: string;
  topic: string;
  agents: AgentSpec[];
  result: DebateResult;
  timestamp: string;
}