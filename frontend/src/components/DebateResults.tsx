import ReactMarkdown from "react-markdown";
import { DebateResult } from "../../types/types";

interface DebateResultsProps {
  result: DebateResult;
}

export function DebateResults({ result }: DebateResultsProps) {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
      <h2 className="text-lg font-bold">Debate Results</h2>

      <div>
        <h3 className="font-medium mb-2">Topic: {result.topic}</h3>
        <p className="text-sm text-gray-500">
          Rounds: {result.rounds} • Synthesizer: {result.synthesizer} • Estimated Tokens: {result.estimatedTokens}
        </p>
      </div>

      <div className="space-y-4">
        {result.responses.map((response, i) => (
          <div key={i} className="p-3 border rounded-lg">
            <p className="font-medium">
              Round {response.round} - {response.model}:
            </p>
            <ReactMarkdown className="prose">{response.response}</ReactMarkdown>
          </div>
        ))}
      </div>

      <div className="p-3 border rounded-lg bg-gray-50">
        <h3 className="font-medium mb-2">Final Synthesis:</h3>
        <ReactMarkdown className="prose">{result.finalSynthesis}</ReactMarkdown>
      </div>
    </div>
  );
}