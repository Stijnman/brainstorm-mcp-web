import { ResolvedModel } from "../../types/types.js";

export async function callModel(
  model: ResolvedModel,
  label: string,
  systemPrompt: string,
  history: string[],
  userPrompt: string,
  options: { temperature?: number }
): Promise<string> {
  // Mock implementation: replace with actual API calls
  console.log(`[Mock] Calling model ${model.provider}:${model.modelId} with prompt: ${userPrompt.substring(0, 50)}...`);
  return `Mock response from ${label}: This is a simulated response to "${userPrompt.substring(0, 30)}..."`;
}