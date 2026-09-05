import { ResolvedModel } from "../../types/types.js";

export async function resolveModel(modelIdentifier: string): Promise<ResolvedModel> {
  // Mock implementation: replace with actual model resolution logic
  if (modelIdentifier.includes(":")) {
    const [provider, modelId] = modelIdentifier.split(":");
    return { provider, modelId, kind: "api" };
  }
  return { provider: "default", modelId: modelIdentifier, kind: "api" };
}

export function getDefaultModels(): string[] {
  return ["ollama:qwen", "openrouter:free-coder", "groq:llama3"];
}