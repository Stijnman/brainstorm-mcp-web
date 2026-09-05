import { useEffect, useState } from "react";
import axios from "axios";
import { DebateHistory } from "../../types/types";
import { Link } from "react-router-dom";

export function History() {
  const [history, setHistory] = useState<DebateHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get("/api/history");
        setHistory(response.data);
      } catch (err) {
        setError(axios.isAxiosError(err) ? err.response?.data?.error : "Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Debate History</h1>
      {history.length === 0 ? (
        <p className="text-gray-500">No debates yet. Run a debate to see it here.</p>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <h2 className="text-lg font-semibold">{entry.topic}</h2>
              <p className="text-sm text-gray-500">
                {new Date(entry.timestamp).toLocaleString()} • {entry.agents.length} agents • {entry.result.rounds} rounds
              </p>
              <Link
                to={`/?history=${entry.id}`}
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}