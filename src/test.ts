#!/usr/bin/env node

/**
 * Simple test script to validate the A2A Protocol implementation
 */

import type {
  JSONRPCRequest,
  MessageSendParams,
  Message,
} from "@a2a-js/sdk";
import { 
  DefaultRequestHandler, 
  InMemoryTaskStore, 
  JsonRpcTransportHandler 
} from "@a2a-js/sdk/server";
import { v4 as uuidv4 } from "uuid";
import { chatAgentCard } from "./agent-card.js";
import { ChatAgentExecutor } from "./chat-agent-executor.js";

async function testA2AHandler() {
  console.log("🧪 Testing A2A Protocol Handler with SDK");
  console.log("=========================================");

  // Create SDK instances
  const taskStore = new InMemoryTaskStore();
  const agentExecutor = new ChatAgentExecutor();
  const requestHandler = new DefaultRequestHandler(chatAgentCard, taskStore, agentExecutor);
  const jsonRpcHandler = new JsonRpcTransportHandler(requestHandler);

  // Test 1: Simple message response
  console.log("\n1️⃣ Testing simple message response...");
  const simpleMessage: Message = {
    kind: "message",
    role: "user",
    messageId: uuidv4(),
    parts: [{ kind: "text", text: "Hello, agent!" }],
  };

  const simpleRequest: JSONRPCRequest = {
    jsonrpc: "2.0",
    method: "message/send",
    params: {
      message: simpleMessage,
    } as unknown as { [k: string]: unknown },
    id: 1,
  };

  const simpleResponse = await jsonRpcHandler.handle(simpleRequest);
  console.log("Request:", JSON.stringify(simpleRequest, null, 2));
  console.log("Response:", JSON.stringify(simpleResponse, null, 2));

  // Test 2: Task creation
  console.log("\n2️⃣ Testing task creation...");
  const taskMessage: Message = {
    kind: "message",
    role: "user",
    messageId: uuidv4(),
    parts: [{ kind: "text", text: "create:task for me" }],
  };

  const taskRequest: JSONRPCRequest = {
    jsonrpc: "2.0",
    method: "message/send",
    params: {
      message: taskMessage,
    } as unknown as { [k: string]: unknown },
    id: 2,
  };

  const taskResponse = await jsonRpcHandler.handle(taskRequest);
  console.log("Request:", JSON.stringify(taskRequest, null, 2));
  console.log("Response:", JSON.stringify(taskResponse, null, 2));

  // Test 3: Artifact creation
  console.log("\n3️⃣ Testing artifact creation...");
  const artifactMessage: Message = {
    kind: "message",
    role: "user",
    messageId: uuidv4(),
    parts: [{ kind: "text", text: "create:artifact with some content" }],
  };

  const artifactRequest: JSONRPCRequest = {
    jsonrpc: "2.0",
    method: "message/send",
    params: {
      message: artifactMessage,
    } as unknown as { [k: string]: unknown },
    id: 3,
  };

  const artifactResponse = await jsonRpcHandler.handle(artifactRequest);
  console.log("Request:", JSON.stringify(artifactRequest, null, 2));
  console.log("Response:", JSON.stringify(artifactResponse, null, 2));

  // Test 4: Get task status
  if (taskResponse && typeof taskResponse === 'object' && 'result' in taskResponse && taskResponse.result && typeof taskResponse.result === 'object' && 'id' in taskResponse.result) {
    console.log("\n4️⃣ Testing get task status...");
    const getTaskRequest: JSONRPCRequest = {
      jsonrpc: "2.0",
      method: "tasks/get",
      params: {
        id: (taskResponse.result as any).id,
      },
      id: 4,
    };

    const getTaskResponse = await jsonRpcHandler.handle(getTaskRequest);
    console.log("Request:", JSON.stringify(getTaskRequest, null, 2));
    console.log("Response:", JSON.stringify(getTaskResponse, null, 2));
  }

  console.log("\n✅ Tests completed!");
}

// Run tests if this file is executed directly
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  testA2AHandler().catch(console.error);
}