import { AgentSpec } from "../../types/types";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface AgentConfigProps {
  agents: AgentSpec[];
  setAgents: (agents: AgentSpec[]) => void;
}

const defaultPersonas = [
  "general",
  "architect",
  "critic",
  "tester",
  "simplifier",
  "costGuardian",
  "securityReviewer",
  "judge",
];

export function AgentConfig({ agents, setAgents }: AgentConfigProps) {
  const [newAgent, setNewAgent] = useState<Omit<AgentSpec, "id">>({
    model: "ollama:qwen",
    persona: "general",
  });

  const addAgent = () => {
    if (!newAgent.model) return;
    setAgents([...agents, { id: `agent-${Date.now()}`, ...newAgent }]);
    setNewAgent({ model: "", persona: "general" });
  };

  const removeAgent = (id: string) => {
    setAgents(agents.filter((a) => a.id !== id));
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-bold mb-4">Agent Configuration</h2>
      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="p-3 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">ID: {agent.id}</p>
              <p>Model: {agent.model}</p>
              <p>Persona: {agent.persona}</p>
            </div>
            <button
              onClick={() => removeAgent(agent.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Model (e.g., ollama:qwen)"
          value={newAgent.model}
          onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
          className="flex-1 p-2 border rounded"
        />
        <select
          value={newAgent.persona}
          onChange={(e) => setNewAgent({ ...newAgent, persona: e.target.value })}
          className="p-2 border rounded"
        >
          {defaultPersonas.map((persona) => (
            <option key={persona} value={persona}>
              {persona}
            </option>
          ))}
        </select>
        <button
          onClick={addAgent}
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}