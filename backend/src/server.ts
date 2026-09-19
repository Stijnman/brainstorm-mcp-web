import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyMetrics from "fastify-metrics";
import fastifyWebsocket from "@fastify/websocket";
import { runDebateWithAgents, explainAgentRoster } from "./services/debate.js";
import { DebateOptions, AgentSpec, DebateHistory } from "../../shared/types.js";
import { randomUUID } from "crypto";

const debateHistory: DebateHistory[] = [];
const app = fastify({ logger: true });

app.register(fastifyCors, { origin: true });
app.register(fastifyMetrics, { endpoint: "/metrics" });
app.register(fastifyWebsocket);

app.post("/api/debate", async (req, reply) => {
  const options = req.body as DebateOptions;
  try {
    const result = await runDebateWithAgents({
      ...options,
      onProgress: (msg) => app.log.info(msg),
    });
    debateHistory.push({
      id: randomUUID(),
      topic: options.topic,
      agents: options.agents,
      result,
      timestamp: new Date().toISOString(),
    });
    return reply.send(result);
  } catch (err) {
    app.log.error(err);
    return reply.code(500).send({ error: "Debate failed" });
  }
});

app.post("/api/dry-run", async (req, reply) => {
  const agents = (req.body as { agents: AgentSpec[] }).agents;
  try {
    return reply.send({ output: await explainAgentRoster(agents) });
  } catch {
    return reply.code(400).send({ error: "Invalid agents" });
  }
});

app.get("/api/history", async (_req, reply) => reply.send(debateHistory));

app.get("/api/history/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const entry = debateHistory.find((history) => history.id === id);
  return entry
    ? reply.send(entry)
    : reply.code(404).send({ error: "Not found" });
});

app.get("/ws/debate", { websocket: true }, (connection, req) => {
  const { topic, agents, rounds } = req.query as {
    topic: string;
    agents: string;
    rounds: string;
  };
  const options: DebateOptions = {
    topic,
    agents: JSON.parse(agents) as AgentSpec[],
    rounds: parseInt(rounds, 10) || 3,
    mode: "auto",
    onProgress: (msg) =>
      connection.socket.send(JSON.stringify({ type: "progress", data: msg })),
  };
  void runDebateWithAgents(options)
    .then((result) =>
      connection.socket.send(JSON.stringify({ type: "complete", data: result }))
    )
    .catch((err: unknown) =>
      connection.socket.send(
        JSON.stringify({
          type: "error",
          data: err instanceof Error ? err.message : "Unknown error",
        })
      )
    );
});

void app.listen({ port: 3001 }).then(() => {
  app.log.info("Backend running on http://localhost:3001");
});
