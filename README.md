# Chat A2A

A simple A2A Protocol compliant chat agent built with TypeScript and Cloudflare Workers.

## Features

This agent implements the [A2A Protocol](https://a2a-protocol.org/) and supports:

- **Simple Chat**: Responds to user messages with the original message plus random characters
- **Task Creation**: Messages containing "create:task" will create a task that completes after 10 seconds
- **Artifact Creation**: Messages containing "create:artifact" will create an artifact with content

## Implementation

- **TypeScript**: Fully typed implementation using `@a2a-js/sdk`
- **Cloudflare Workers**: Serverless runtime for stateless request handling
- **A2A Protocol Compliance**: JSON-RPC 2.0 endpoints and agent card discovery
- **Lightweight**: No persistent state management needed for simple chat functionality

## Usage

### Agent Discovery

The agent exposes its capabilities via the standard A2A agent card endpoint:

```
GET /.well-known/agent-card.json
```

### Supported JSON-RPC Methods

- `sendMessage`: Send a message to the agent
- `getTask`: Get the status of a task by ID  
- `cancelTask`: Cancel a running task

### Example Messages

```typescript
// Simple chat
{
  "jsonrpc": "2.0",
  "method": "sendMessage",
  "params": {
    "message": {
      "messageId": "123",
      "role": "user",
      "parts": [{"kind": "text", "text": "Hello, agent!"}],
      "kind": "message"
    }
  },
  "id": 1
}

// Create a task
{
  "jsonrpc": "2.0", 
  "method": "sendMessage",
  "params": {
    "message": {
      "messageId": "124",
      "role": "user",
      "parts": [{"kind": "text", "text": "create:task"}],
      "kind": "message"
    }
  },
  "id": 2
}

// Create an artifact
{
  "jsonrpc": "2.0",
  "method": "sendMessage", 
  "params": {
    "message": {
      "messageId": "125",
      "role": "user",
      "parts": [{"kind": "text", "text": "create:artifact"}],
      "kind": "message"
    }
  },
  "id": 3
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run locally with Wrangler
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   A2A Client    │───▶│ Cloudflare Worker │───▶│   A2A Handler   │
│                 │    │                  │    │                 │
│ JSON-RPC 2.0    │◀───│  Main Handler    │◀───│ Message Router  │
│ Requests        │    │                  │    │ Task Manager    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

The main worker handles:
- Agent card serving (`/.well-known/agent-card.json`)
- CORS headers
- JSON-RPC 2.0 message processing directly

The A2A Handler manages:
- A2A Protocol message handling
- Task and artifact creation
- Simple in-memory task storage for demonstration

## A2A Protocol Compliance

This implementation follows the A2A Protocol specification:

- ✅ Agent card discovery endpoint
- ✅ JSON-RPC 2.0 request/response format
- ✅ Standard A2A message types (Message, Task, Artifact)
- ✅ Task lifecycle management (submitted → working → completed/canceled)
- ✅ Proper error handling and response codes
- ✅ TypeScript types from `@a2a-js/sdk`

## License

MIT