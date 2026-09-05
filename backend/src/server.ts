import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyMetrics from "@fastify/metrics";
import fastifyWebsocket from "@fastify/websocket";
import { runDebateWithAgents, explainAgentRoster } from "./services/debate.js";
import { DebateOptions, DebateResult, AgentSpec, DebateHistory } from "../../types/types.js";
import { randomUUID } from "crypto";

// In-memory history store (replace with DB in production)
const debateHistory: DebateHistory[] = [];

const app = fastify({ logger: true });

// CORS
app.register(fastifyCors, { origin: true });

// Prometheus metrics
app.register(fastifyMetrics, { endpoint: "/metrics" });

// WebSocket for real-time streaming
app.register(fastifyWebsocket);

// API Routes
app.post("/api/debate", async (req, reply) => {
  const options = req.body as DebateOptions;
  try {
    const result = await runDebateWithAgents({
      ...options,
      onProgress: (msg) => app.log.info(msg),
    });

    // Store in history
    const historyEntry: DebateHistory = {
      id: randomUUID(),
      topic: options.topic,
      agents: options.agents,
      result,
      timestamp: new Date().toISOString(),
    };
    debateHistory.push(historyEntry);

    return reply.send(result);
  } catch (err) {
    app.log.error(err);
    return reply.code(500).send({ error: "Debate failed" });
  }
});

app.post("/api/dry-run", async (req, reply) => {
  const agents = req.body.agents as AgentSpec[];
  try {
    const result = await explainAgentRoster(agents);
    return reply.send({ output: result });
  } catch (err) {
    return reply.code(400).send({ error: "Invalid agents" });
  }
});

app.get("/api/history", async (req, reply) => {
  return reply.send(debateHistory);
});

app.get("/api/history/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const entry = debateHistory.find((h) => h.id === id);
  if (!entry) {
    return reply.code(404).send({ error: "Not found" });
  }
  return reply.send(entry);
});

// WebSocket endpoint for real-time debate streaming
app.get("/ws/debate", { websocket: true }, (connection, req) => {
  const { topic, agents, rounds } = req.query as {
    topic: string;
    agents: string;
    rounds: string;
  };

  const parsedAgents: AgentSpec[] = JSON.parse(agents);
  const options: DebateOptions = {
    topic,
    agents: parsedAgents,
    rounds: parseInt(rounds) || 3,
    mode: "auto",
    onProgress: (msg) => {
      connection.socket.send(JSON.stringify({ type: "progress", data: msg }));
    },
  };

  (async () => {
    try {
      const result = await runDebateWithAgents(options);
      connection.socket.send(
        JSON.stringify({ type: "complete", data: result })
      );
    } catch (err) {
      connection.socket.send(
        JSON.stringify({ type: "error", data: err instanceof Error ? err.message : "Unknown error" })
      );
    }
  })();
});

app.listen({ port: 3001 }, () => {
  app.log.info(`Backend running on http://localhost:3001`);
});