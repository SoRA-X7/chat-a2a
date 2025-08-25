// Import A2A SDK types and interfaces
import type {
  AgentCard,
  Message,
  Task,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  MessageSendParams,
  JSONRPCRequest,
  JSONRPCResponse,
  Part,
  TextPart,
} from "@a2a-js/sdk";

// Define our agent card following A2A Protocol
const chatAgentCard: AgentCard = {
  name: "Simple Chat Agent",
  description: "A simple A2A Protocol compliant chat agent that responds with messages and creates tasks/artifacts",
  url: "https://chat-a2a.example.workers.dev/",
  provider: {
    organization: "SoRA-X7",
    url: "https://github.com/SoRA-X7/chat-a2a",
  },
  protocolVersion: "0.3.0",
  version: "1.0.0",
  capabilities: {
    streaming: true,
    pushNotifications: false,
    stateTransitionHistory: true,
  },
  securitySchemes: undefined,
  security: undefined,
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  skills: [
    {
      id: "simple_chat",
      name: "Simple Chat",
      description: "Simple chat with message responses and random characters",
      tags: ["chat", "simple"],
      examples: [
        "Hello",
        "How are you?",
        "Tell me a joke",
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
    },
    {
      id: "task_creation",
      name: "Task Creation", 
      description: "Create tasks that complete after 10 seconds",
      tags: ["task", "async"],
      examples: [
        "create:task",
        "start a task",
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
    },
    {
      id: "artifact_creation",
      name: "Artifact Creation",
      description: "Create artifacts with content",
      tags: ["artifact", "creation"],
      examples: [
        "create:artifact",
        "make an artifact",
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};

// For now, just export the card to test the types
export { chatAgentCard };