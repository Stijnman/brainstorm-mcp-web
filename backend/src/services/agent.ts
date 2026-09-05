import { AgentSpec, ResolvedAgent } from "../../types/types.js";
import { resolveModel, ResolvedModel } from "./models.js";
import { getPersona, PersonaDefinition } from "./personas.js";

export async function resolveAgent(agent: AgentSpec): Promise<ResolvedAgent> {
  const resolvedModel = await resolveModel(agent.model);
  const persona = getPersona(agent.persona);
  return {
    ...agent,
    model: resolvedModel,
    systemPrompt: agent.systemPrompt ?? persona.system,
    temperature: agent.temperature ?? persona.temperature ?? 0.7,
    topP: agent.topP ?? persona.topP ?? 1,
    seed: agent.seed ?? persona.seed,
    history: agent.history ?? [],
  };
}

export function modelsToAgents(modelIds: string[]): AgentSpec[] {
  const defaultPersonas = [
    "architect",
    "critic",
    "tester",
    "judge",
    "simplifier",
    "costGuardian",
    "securityReviewer",
  ];
  return modelIds.map((model, idx) => ({
    id: model,
    model,
    persona: defaultPersonas[idx % defaultPersonas.length],
  }));
}