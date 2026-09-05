import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Brainstorm MCP
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="text-gray-600 hover:text-blue-600">
            Home
          </Link>
          <Link to="/history" className="text-gray-600 hover:text-blue-600">
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}