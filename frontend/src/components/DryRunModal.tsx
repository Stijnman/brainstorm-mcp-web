import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DryRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  output: string;
}

export function DryRunModal({ isOpen, onClose, output }: DryRunModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold mb-4">Dry Run Output</h2>
        <ReactMarkdown className="prose">{output}</ReactMarkdown>
      </div>
    </div>
  );
}