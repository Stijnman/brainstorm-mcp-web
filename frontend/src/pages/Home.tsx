import { useState } from "react";
import { AgentConfig } from "../components/AgentConfig";
import { DebateControls } from "../components/DebateControls";
import { DebateResults } from "../components/DebateResults";
import { DryRunModal } from "../components/DryRunModal";
import { AgentSpec, DebateResult } from "../../types/types";
import axios from "axios";

export function Home() {
  const [agents, setAgents] = useState<AgentSpec[]>([
    { id: "1", model: "ollama:qwen", persona: "architect" },
    { id: "2", model: "openrouter:free-coder", persona: "critic" },
  ]);
  const [topic, setTopic] = useState("Should we use WebSockets or Server-Sent Events for real-time updates?");
  const [rounds, setRounds] = useState(3);
  const [mode, setMode] = useState<"auto" | "hosted">("auto");
  const [result, setResult] = useState<DebateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDryRun, setShowDryRun] = useState(false);
  const [dryRunOutput, setDryRunOutput] = useState("");

  const runDebate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/debate", {
        topic,
        agents,
        rounds,
        mode,
      });
      setResult(response.data);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const runDryRun = async () => {
    try {
      const response = await axios.post("/api/dry-run", { agents });
      setDryRunOutput(response.data.output);
      setShowDryRun(true);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error : "Unknown error");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Multi-Agent Debate</h1>

      <AgentConfig agents={agents} setAgents={setAgents} />

      <DebateControls
        topic={topic}
        setTopic={setTopic}
        rounds={rounds}
        setRounds={setRounds}
        mode={mode}
        setMode={setMode}
        onRunDebate={runDebate}
        onRunDryRun={runDryRun}
        loading={loading}
      />

      {error && <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {result && <DebateResults result={result} />}

      <DryRunModal
        isOpen={showDryRun}
        onClose={() => setShowDryRun(false)}
        output={dryRunOutput}
      />
    </div>
  );
}