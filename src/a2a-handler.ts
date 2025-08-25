import type {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCSuccessResponse,
  JSONRPCErrorResponse,
  SendMessageResponse,
  GetTaskResponse,
  CancelTaskResponse,
  SendMessageSuccessResponse,
  GetTaskSuccessResponse,
  CancelTaskSuccessResponse,
  Message,
  Task,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  MessageSendParams,
  TaskQueryParams,
  Part,
  TextPart,
} from "@a2a-js/sdk";
import { v4 as uuidv4 } from "uuid";

export interface TaskStore {
  [taskId: string]: Task;
}

export class A2AHandler {
  private tasks: TaskStore = {};

  constructor() {}

  // Handle JSON-RPC requests
  async handleRequest(request: JSONRPCRequest): Promise<SendMessageResponse | GetTaskResponse | CancelTaskResponse | JSONRPCErrorResponse> {
    try {
      switch (request.method) {
        case "sendMessage":
          return await this.sendMessage(request);
        case "getTask":
          return await this.getTask(request);
        case "cancelTask":
          return await this.cancelTask(request);
        default:
          return this.createErrorResponse(request.id, -32601, "Method not found");
      }
    } catch (error) {
      console.error("Error handling A2A request:", error);
      return this.createErrorResponse(request.id, -32603, "Internal error");
    }
  }

  private async sendMessage(request: JSONRPCRequest): Promise<SendMessageResponse> {
    if (!request.params || typeof request.params !== 'object') {
      return this.createErrorResponse(request.id, -32602, "Invalid params");
    }
    
    const params = request.params as unknown as MessageSendParams;
    if (!params.message) {
      return this.createErrorResponse(request.id, -32602, "Missing message in params");
    }
    
    const userMessage = params.message;
    const messageText = this.extractTextFromMessage(userMessage);

    // Determine response based on message content
    if (messageText.toLowerCase().includes("create:task")) {
      // Create a task that will complete after 10 seconds
      return this.createTask(request.id, userMessage, messageText);
    } else if (messageText.toLowerCase().includes("create:artifact")) {
      // Create an artifact
      return this.createArtifact(request.id, userMessage, messageText);
    } else {
      // Simple message response with random characters
      return this.createSimpleMessageResponse(request.id, userMessage, messageText);
    }
  }

  private createTask(requestId: any, userMessage: Message, messageText: string): SendMessageSuccessResponse {
    const taskId = uuidv4();
    const contextId = userMessage.contextId || uuidv4();

    const task: Task = {
      kind: "task",
      id: taskId,
      contextId: contextId,
      status: {
        state: "submitted",
        timestamp: new Date().toISOString(),
      },
      history: [userMessage],
      metadata: userMessage.metadata,
      artifacts: [],
    };

    this.tasks[taskId] = task;

    // Schedule task completion after 10 seconds
    this.scheduleTaskCompletion(taskId);

    return {
      jsonrpc: "2.0",
      id: requestId,
      result: task,
    };
  }

  private createArtifact(requestId: any, userMessage: Message, messageText: string): SendMessageSuccessResponse {
    const taskId = uuidv4();
    const contextId = userMessage.contextId || uuidv4();
    const artifactId = uuidv4();

    const task: Task = {
      kind: "task",
      id: taskId,
      contextId: contextId,
      status: {
        state: "completed",
        timestamp: new Date().toISOString(),
        message: {
          kind: "message",
          role: "agent",
          messageId: uuidv4(),
          parts: [{ kind: "text", text: "Created artifact successfully" }],
          taskId: taskId,
          contextId: contextId,
        },
      },
      history: [userMessage],
      metadata: userMessage.metadata,
      artifacts: [
        {
          artifactId: artifactId,
          name: "created-artifact.txt",
          parts: [{ kind: "text", text: `Artifact created in response to: ${messageText}` }],
        },
      ],
    };

    this.tasks[taskId] = task;

    return {
      jsonrpc: "2.0",
      id: requestId,
      result: task,
    };
  }

  private createSimpleMessageResponse(requestId: any, userMessage: Message, messageText: string): SendMessageSuccessResponse {
    const responseMessage: Message = {
      kind: "message",
      role: "agent",
      messageId: uuidv4(),
      parts: [
        {
          kind: "text",
          text: `You said: "${messageText}". Here are some random characters: ${this.generateRandomChars()}`,
        },
      ],
      contextId: userMessage.contextId,
    };

    return {
      jsonrpc: "2.0",
      id: requestId,
      result: responseMessage,
    };
  }

  private async getTask(request: JSONRPCRequest): Promise<GetTaskResponse> {
    if (!request.params || typeof request.params !== 'object') {
      return this.createErrorResponse(request.id, -32602, "Invalid params");
    }
    
    const params = request.params as unknown as TaskQueryParams;
    if (!params.id) {
      return this.createErrorResponse(request.id, -32602, "Missing task id in params");
    }
    
    const task = this.tasks[params.id];

    if (!task) {
      return this.createErrorResponse(request.id, -32602, "Task not found");
    }

    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result: task,
    };
  }

  private async cancelTask(request: JSONRPCRequest): Promise<CancelTaskResponse> {
    if (!request.params || typeof request.params !== 'object') {
      return this.createErrorResponse(request.id, -32602, "Invalid params");
    }
    
    const params = request.params as unknown as { id: string };
    if (!params.id) {
      return this.createErrorResponse(request.id, -32602, "Missing task id in params");
    }
    
    const task = this.tasks[params.id];

    if (!task) {
      return this.createErrorResponse(request.id, -32602, "Task not found");
    }

    // Update task status to canceled
    task.status = {
      state: "canceled",
      timestamp: new Date().toISOString(),
    };

    // Return the updated task instead of a success object
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result: task,
    };
  }

  private scheduleTaskCompletion(taskId: string) {
    // In a real implementation, this would use Cloudflare's Durable Objects alarms
    // For now, we'll simulate with setTimeout (which won't persist across requests)
    setTimeout(() => {
      const task = this.tasks[taskId];
      if (task && task.status.state !== "canceled") {
        task.status = {
          state: "completed",
          timestamp: new Date().toISOString(),
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: "text", text: "Task completed after 10 seconds" }],
            taskId: taskId,
            contextId: task.contextId,
          },
        };
      }
    }, 10000);
  }

  private extractTextFromMessage(message: Message): string {
    return message.parts
      .filter((part): part is TextPart => part.kind === "text")
      .map((part) => part.text)
      .join(" ");
  }

  private generateRandomChars(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private createErrorResponse(id: any, code: number, message: string): JSONRPCErrorResponse {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
      },
    };
  }
}