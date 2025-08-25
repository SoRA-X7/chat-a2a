import { 
  AgentExecutor, 
  RequestContext, 
  ExecutionEventBus,
  A2AError
} from "@a2a-js/sdk/server";
import { 
  Message, 
  Task,
  TaskStatusUpdateEvent,
  TextPart
} from "@a2a-js/sdk";
import { v4 as uuidv4 } from "uuid";

export class ChatAgentExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const userMessage = requestContext.userMessage;
    const messageText = this.extractTextFromMessage(userMessage);

    try {
      // Determine response based on message content
      if (messageText.toLowerCase().includes("create:task")) {
        await this.handleTaskCreation(requestContext, eventBus, messageText);
      } else if (messageText.toLowerCase().includes("create:artifact")) {
        await this.handleArtifactCreation(requestContext, eventBus, messageText);
      } else {
        await this.handleSimpleMessage(requestContext, eventBus, messageText);
      }
    } catch (error) {
      console.error("Error in agent execution:", error);
      // Publish error status
      const errorEvent: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId: requestContext.taskId,
        contextId: requestContext.contextId,
        final: true,
        status: {
          state: "failed",
          timestamp: new Date().toISOString(),
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: "text", text: "An error occurred while processing your request." }],
            taskId: requestContext.taskId,
            contextId: requestContext.contextId,
          },
        },
      };
      eventBus.publish(errorEvent);
      eventBus.finished();
    }
  }

  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    // Get task from store to get the contextId
    // In a real implementation, we'd get this from the task store
    // For now, we'll have to use a placeholder
    const cancelEvent: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId: taskId,
      contextId: "unknown", // TODO: Get this from task store
      final: true,
      status: {
        state: "canceled",
        timestamp: new Date().toISOString(),
      },
    };
    eventBus.publish(cancelEvent);
    eventBus.finished();
  }

  private async handleSimpleMessage(
    requestContext: RequestContext, 
    eventBus: ExecutionEventBus, 
    messageText: string
  ): Promise<void> {
    // Create a simple response message
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
      contextId: requestContext.contextId,
    };

    eventBus.publish(responseMessage);
    eventBus.finished();
  }

  private async handleTaskCreation(
    requestContext: RequestContext, 
    eventBus: ExecutionEventBus, 
    messageText: string
  ): Promise<void> {
    // Create initial task with submitted status
    const task: Task = {
      kind: "task",
      id: requestContext.taskId,
      contextId: requestContext.contextId,
      status: {
        state: "submitted",
        timestamp: new Date().toISOString(),
      },
      history: [requestContext.userMessage],
      metadata: requestContext.userMessage.metadata,
      artifacts: [],
    };

    // Publish the initial task
    eventBus.publish(task);

    // Simulate async processing - don't await so the task is returned in submitted state
    this.simulateTaskProcessing(requestContext.taskId, requestContext.contextId, eventBus);
    
    // Don't call eventBus.finished() here - let the async processing handle it
  }

  private async handleArtifactCreation(
    requestContext: RequestContext, 
    eventBus: ExecutionEventBus, 
    messageText: string
  ): Promise<void> {
    const artifactId = uuidv4();

    // Create task with artifact
    const task: Task = {
      kind: "task",
      id: requestContext.taskId,
      contextId: requestContext.contextId,
      status: {
        state: "completed",
        timestamp: new Date().toISOString(),
        message: {
          kind: "message",
          role: "agent",
          messageId: uuidv4(),
          parts: [{ kind: "text", text: "Created artifact successfully" }],
          taskId: requestContext.taskId,
          contextId: requestContext.contextId,
        },
      },
      history: [requestContext.userMessage],
      metadata: requestContext.userMessage.metadata,
      artifacts: [
        {
          artifactId: artifactId,
          name: "created-artifact.txt",
          parts: [{ kind: "text", text: `Artifact created in response to: ${messageText}` }],
        },
      ],
    };

    eventBus.publish(task);
    eventBus.finished();
  }

  private async simulateTaskProcessing(taskId: string, contextId: string, eventBus: ExecutionEventBus): Promise<void> {
    // In a real implementation, this would be proper async processing
    // For now, we'll use a timeout to simulate the 10-second completion
    setTimeout(() => {
      const completionEvent: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId: taskId,
        contextId: contextId,
        final: true,
        status: {
          state: "completed",
          timestamp: new Date().toISOString(),
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: "text", text: "Task completed after 10 seconds" }],
            taskId: taskId,
            contextId: contextId,
          },
        },
      };
      eventBus.publish(completionEvent);
      eventBus.finished();
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
}