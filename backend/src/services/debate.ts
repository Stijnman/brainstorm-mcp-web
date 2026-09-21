import { AgentSpec, ResolvedAgent, DebateOptions, DebateResult } from "../../../shared/types.js";
import { resolveAgent } from "./agent.js";
import { callModel } from "./client.js";
import { estimateTokens } from "./token-estimate.js";

export async function explainAgentRoster(agents: AgentSpec[]): Promise<string> {
  const resolved = await Promise.all(agents.map(resolveAgent));
  return resolved
    .map((agent) => `${agent.id}: ${agent.model.provider}/${agent.model.modelId} (${agent.persona})`)
    .join("\n");
}

export async function runDebateWithAgents(options: DebateOptions): Promise<DebateResult> {
  const { topic, agents: agentSpecs, rounds = 3, synthesizer: synthesizerSpec, systemPrompt, context, style, participate, onProgress } = options;
  const log = onProgress || (() => {});
  const resolvedAgents: ResolvedAgent[] = [];
  const agentMap = new Map<string, ResolvedAgent>();
  for (const spec of agentSpecs) {
    const resolved = await resolveAgent(spec);
    resolvedAgents.push(resolved);
    agentMap.set(resolved.id, resolved);
  }
  if (!resolvedAgents.length) throw new Error("At least one agent is required");

  let synthesizerId: string;
  let synthesizerAgent: ResolvedAgent | undefined;
  if (synthesizerSpec) {
    if (typeof synthesizerSpec === "string") {
      const found = resolvedAgents.find((a) => a.id === synthesizerSpec);
      if (found) { synthesizerId = found.id; synthesizerAgent = found; }
      else {
        const tempResolved = await resolveAgent({ id: "synthesizer", model: synthesizerSpec, persona: "judge" });
        synthesizerId = tempResolved.id; synthesizerAgent = tempResolved;
      }
    } else {
      const resolved = await resolveAgent(synthesizerSpec);
      synthesizerId = resolved.id; synthesizerAgent = resolved;
      if (!agentMap.has(resolved.id)) { agentMap.set(resolved.id, resolved); resolvedAgents.push(resolved); }
    }
  } else { synthesizerId = resolvedAgents[0].id; synthesizerAgent = resolvedAgents[0]; }

  const effectiveTopic = buildEffectiveTopic(topic, context, style);
  const effectiveSystemPrompt = systemPrompt || "You are a participant in a debate. Provide a well-reasoned argument.";
  const history: string[] = [];
  const allResponses: Array<{ round: number; model: string; response: string }> = [];
  const agentIds = resolvedAgents.map((a) => a.id);

  for (let round = 1; round <= rounds; round++) {
    log(`Starting round ${round}/${rounds}...`);
    const roundPrompt = buildRoundPrompt(round, rounds, effectiveTopic, history, participate || false);
    const roundResults = await runExternalRound(agentIds, round, rounds, { prompt: roundPrompt, history, agentMap }, log);
    allResponses.push(...roundResults.map((result) => ({ round, ...result })));
  }

  const finalRoundResponses = allResponses.filter((r) => r.round === rounds);
  const synthResult = await runSynthesis(resolvedAgents, finalRoundResponses.map((r) => ({ model: r.model, response: r.response })), effectiveTopic, synthesizerId, synthesizerAgent?.systemPrompt || effectiveSystemPrompt, log);
  history.push(`Synthesis: ${synthResult}`);
  return { topic, responses: allResponses, finalSynthesis: synthResult, rounds, modelIdentifiers: resolvedAgents.map((a) => a.model.modelId), synthesizer: synthesizerId, estimatedTokens: resolvedAgents.length * 4096 * rounds + estimateTokens(effectiveTopic) * rounds };
}

async function runExternalRound(modelIdentifiers: string[], roundNumber: number, totalRounds: number, context: { prompt: string; history: string[]; agentMap?: Map<string, ResolvedAgent> }, onProgress?: (msg: string) => void): Promise<Array<{ model: string; response: string }>> {
  const log = onProgress || (() => {}); const agentMap = context.agentMap || new Map();
  log(`Round ${roundNumber}/${totalRounds}: ${modelIdentifiers.join(", ")} responding...`);
  const roundResults: Array<{ model: string; response: string }> = [];
  for (const id of modelIdentifiers) {
    const agent = agentMap.get(id); const resolved = agent?.model ?? { provider: "unknown", modelId: id, kind: "api" as const };
    const response = await callModel(resolved, id, agent?.systemPrompt || context.prompt, context.history, context.prompt, { temperature: agent?.temperature ?? 0.7 });
    roundResults.push({ model: id, response }); log(`  ${id}: ${response.substring(0, 100)}...`);
  }
  return roundResults;
}

async function runSynthesis(resolvedAgents: ResolvedAgent[], responses: Array<{ model: string; response: string }>, topic: string, synthesizerIdentifier: string, systemPrompt: string, onProgress?: (msg: string) => void): Promise<string> {
  const log = onProgress || (() => {}); const responseText = responses.map((r) => `**${r.model}**:\n${r.response}`).join("\n\n");
  const synthesisPrompt = `You are the synthesizer. Given the following debate on "${topic}", produce a balanced final summary that incorporates the strongest points from each participant. Keep it concise and actionable.\n\n${responseText}`;
  log(`Synthesizing final output using ${synthesizerIdentifier}...`);
  for (const agent of [...resolvedAgents.filter((a) => a.id === synthesizerIdentifier), ...resolvedAgents.filter((a) => a.id !== synthesizerIdentifier)]) {
    try { return await callModel(agent.model, agent.id, systemPrompt, [], synthesisPrompt, { temperature: 0.3 }); } catch (err) { log(`Synthesis with ${agent.id} failed: ${err instanceof Error ? err.message : String(err)}`); }
  }
  throw new Error("Synthesis failed: no model could produce a summary.");
}

function buildEffectiveTopic(topic: string, context?: string, style?: string): string { return topic + (context ? `\n\nContext: ${context}` : "") + (style ? `\n\nStyle: ${style}` : ""); }
function buildRoundPrompt(round: number, totalRounds: number, topic: string, history: string[], participate: boolean): string { return `Round ${round}/${totalRounds}: ${topic}${history.length ? `\n\nPrevious responses:\n${history.join("\n")}` : ""}${participate ? "\n\nRespond as if you are participating in the debate." : ""}`; }
