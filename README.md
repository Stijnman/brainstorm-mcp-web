# Brainstorm MCP Web

A web-based interface for **brainstorm-mcp v4**, enabling multi-agent debates with auto/hosted modes, dry-run validation, and real-time monitoring.

## Features

- **Multi-Agent Debates**: Configure agents with unique personas, models, and parameters.
- **Auto/Hosted Modes**:
  - **Auto**: Run debates automatically via API.
  - **Hosted**: Generate prompts for manual execution (e.g., with Ollama).
- **Dry-Run Validation**: Validate agent configurations before execution.
- **Real-Time Streaming**: WebSocket-based progress updates.
- **Debate History**: Store and replay past debates.
- **Monitoring**: Prometheus metrics for Grafana dashboards.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Fastify + TypeScript
- **Real-Time**: WebSockets
- **Containerization**: Docker + Docker Compose

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (optional)

### Local Development
1. Clone the repository:
   ```bash
   git clone git@github.com:Stijnman/brainstorm-mcp-web.git
   cd brainstorm-mcp-web
   ```

2. Start the backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. Start the frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

### Docker
1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```
2. Open:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:3001](http://localhost:3001)
   - Metrics: [http://localhost:3001/metrics](http://localhost:3001/metrics)

## Configuration
- **Backend**: Edit `backend/config.json` to customize personas, models, and providers.
- **Frontend**: Modify `frontend/src/` to adjust the UI.

## License
MIT