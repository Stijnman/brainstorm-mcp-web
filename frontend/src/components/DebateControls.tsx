import { Dispatch, SetStateAction } from "react";

interface DebateControlsProps {
  topic: string;
  setTopic: Dispatch<SetStateAction<string>>;
  rounds: number;
  setRounds: Dispatch<SetStateAction<number>>;
  mode: "auto" | "hosted";
  setMode: Dispatch<SetStateAction<"auto" | "hosted">>;
  onRunDebate: () => void;
  onRunDryRun: () => void;
  loading: boolean;
}

export function DebateControls({
  topic,
  setTopic,
  rounds,
  setRounds,
  mode,
  setMode,
  onRunDebate,
  onRunDryRun,
  loading,
}: DebateControlsProps) {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Debate Topic</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rounds</label>
          <input
            type="number"
            value={rounds}
            onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
            min={1}
            max={10}
            className="p-2 border rounded w-20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "auto" | "hosted")}
            className="p-2 border rounded"
          >
            <option value="auto">Auto (Run Debate)</option>
            <option value="hosted">Hosted (Generate Prompts)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRunDryRun}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Dry Run
        </button>
        <button
          onClick={onRunDebate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Debate"}
        </button>
      </div>
    </div>
  );
}