import { AgentSpec, ResolvedAgent, DebateOptions, DebateResult } from "../../types/types.js";
import { resolveAgent, modelsToAgents } from "./agent.js";
import { getPersona } from "./personas.js";
import { callModel } from "./client.js";
import { estimateTokens } from "./token-estimate.js";

export async function runDebateWithAgents(options: DebateOptions): Promise<DebateResult> {
  const {
    topic,
    agents: agentSpecs,
    rounds = 3,
    synthesizer: synthesizerSpec,
    systemPrompt,
    context,
    style,
    participate,
    mode,
    onProgress,
  } = options;

  const log = onProgress || (() => {});

  // Resolve all agents
  const resolvedAgents: ResolvedAgent[] = [];
  const agentMap = new Map<string, ResolvedAgent>();
  for (const spec of agentSpecs) {
    const resolved = await resolveAgent(spec);
    resolvedAgents.push(resolved);
    agentMap.set(resolved.id, resolved);
  }

  // Determine synthesizer
  let synthesizerId: string;
  let synthesizerAgent: ResolvedAgent | undefined;
  if (synthesizerSpec) {
    if (typeof synthesizerSpec === "string") {
      const found = resolvedAgents.find((a) => a.id === synthesizerSpec);
      if (found) {
        synthesizerId = found.id;
        synthesizerAgent = found;
      } else {
        const tempSpec = { id: "synthesizer", model: synthesizerSpec, persona: "judge" };
        const tempResolved = await resolveAgent(tempSpec);
        synthesizerId = tempResolved.id;
        synthesizerAgent = tempResolved;
      }
    } else {
      const resolved = await resolveAgent(synthesizerSpec);
      synthesizerId = resolved.id;
      synthesizerAgent = resolved;
      if (!agentMap.has(resolved.id)) {
        agentMap.set(resolved.id, resolved);
        resolvedAgents.push(resolved);
      }
    }
  } else {
    synthesizerId = resolvedAgents[0].id;
    synthesizerAgent = resolvedAgents[0];
  }

  const effectiveTopic = buildEffectiveTopic(topic, context, style);
  const effectiveSystemPrompt = systemPrompt || "You are a participant in a debate. Provide a well-reasoned argument.";

  const history: string[] = [];
  const allResponses: Array<{ round: number; model: string; response: string }> = [];
  const agentIds = resolvedAgents.map((a) => a.id);

  for (let round = 1; round <= rounds; round++) {
    log(`Starting round ${round}/${rounds}...`);
    const roundPrompt = buildRoundPrompt(round, rounds, effectiveTopic, history, participate || false);
    const roundResults = await runExternalRound(
      agentIds,
      round,
      rounds,
      { prompt: roundPrompt, history, agentMap },
      log
    );

    for (const result of roundResults) {
      allResponses.push({ round, model: result.model, response: result.response });
    }
  }

  // Synthesis
  const finalRoundResponses = allResponses.filter((r) => r.round === rounds);
  const synthResult = await runSynthesis(
    resolvedAgents,
    finalRoundResponses.map((r) => ({ model: r.model, response: r.response })),
    effectiveTopic,
    synthesizerId,
    synthesizerAgent?.systemPrompt || effectiveSystemPrompt,
    log
  );
  history.push(`Synthesis: ${synthResult}`);

  const estimatedTokensPerRound = resolvedAgents.length * 4096;
  const totalEstimate = estimatedTokensPerRound * rounds + estimateTokens(effectiveTopic) * rounds;

  return {
    topic,
    responses: allResponses,
    finalSynthesis: synthResult,
    rounds,
    modelIdentifiers: resolvedAgents.map((a) => a.model.modelId),
    synthesizer: synthesizerId,
    estimatedTokens: totalEstimate,
  };
}

async function runExternalRound(
  modelIdentifiers: string[],
  roundNumber: number,
  totalRounds: number,
  context: { prompt: string; history: string[]; agentMap?: Map<string, ResolvedAgent> },
  onProgress?: (msg: string) => void,
  previousResponses?: string[]
): Promise<Array<{ model: string; response: string }>> {
  const log = onProgress || (() => {});
  const agentMap = context.agentMap || new Map();
  const getSystemPrompt = (id: string): string =>
    agentMap.get(id)?.systemPrompt || context.prompt || "You are a helpful assistant.";

  const models = await Promise.all(
    modelIdentifiers.map(async (id) => ({
      resolved: agentMap.get(id)?.model ?? { provider: "unknown", modelId: id, kind: "api" },
      label: id,
    }))
  );

  log(`Round ${roundNumber}/${totalRounds}: ${models.map((m) => m.label).join(", ")} responding...`);

  const roundResults: Array<{ model: string; response: string }> = [];
  for (const { resolved, label } of models) {
    const systemPrompt = getSystemPrompt(label);
    const temperature = agentMap.get(label)?.temperature ?? 0.7;

    const response = await callModel(
      resolved,
      label,
      systemPrompt,
      context.history.length ? context.history : [],
      context.prompt,
      { temperature }
    );
    roundResults.push({ model: label, response });
    log(`  ${label}: ${response.substring(0, 100)}...`);
  }

  return roundResults;
}

async function runSynthesis(
  resolvedAgents: ResolvedAgent[],
  responses: Array<{ model: string; response: string }>,
  topic: string,
  synthesizerIdentifier: string,
  systemPrompt: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  const log = onProgress || (() => {});
  const responseText = responses.map((r) => `**${r.model}**:\n${r.response}`).join("\n\n");
  const synthesisPrompt = `You are the synthesizer. Given the following debate on "${topic}", produce a balanced final summary that incorporates the strongest points from each participant. Keep it concise and actionable.\n\n${responseText}`;

  log(`Synthesizing final output using ${synthesizerIdentifier}...`);

  try {
    const synthesizerAgent = resolvedAgents.find((a) => a.id === synthesizerIdentifier);
    if (synthesizerAgent) {
      const result = await callModel(
        synthesizerAgent.model,
        synthesizerAgent.id,
        systemPrompt,
        [],
        synthesisPrompt,
        { temperature: 0.3 }
      );
      return result;
    }
  } catch (err) {
    log(`Synthesis with primary model failed: ${err instanceof Error ? err.message : String(err)}. Trying fallback...`);
  }

  // Fallback: try each other agent in the roster
  for (const agent of resolvedAgents) {
    if (agent.id === synthesizerIdentifier) continue;
    try {
      const result = await callModel(
        agent.model,
        agent.id,
        systemPrompt,
        [],
        synthesisPrompt,
        { temperature: 0.3 }
      );
      return result;
    } catch (_) {
      /* continue */
    }
  }

  throw new Error(
    `Synthesis failed: no model in the roster (${resolvedAgents.map((a) => a.id).join(", ")}) could produce a summary.`
  );
}

function buildEffectiveTopic(topic: string, context?: string, style?: string): string {
  let effectiveTopic = topic;
  if (context) {
    effectiveTopic += `\n\nContext: ${context}`;
  }
  if (style) {
    effectiveTopic += `\n\nStyle: ${style}`;
  }
  return effectiveTopic;
}

function buildRoundPrompt(
  round: number,
  totalRounds: number,
  topic: string,
  history: string[],
  participate: boolean
): string {
  const roundLabel = `Round ${round}/${totalRounds}`;
  const historyText = history.length ? `\n\nPrevious responses:\n${history.join("\n")}` : "";
  const participationNote = participate ? "\n\nRespond as if you are participating in the debate." : "";
  return `${roundLabel}: ${topic}${historyText}${participationNote}`;
}