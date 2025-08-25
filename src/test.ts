#!/usr/bin/env node

/**
 * Simple test script to validate the A2A Protocol implementation
 */

import type {
  JSONRPCRequest,
  MessageSendParams,
  Message,
} from "@a2a-js/sdk";
import { v4 as uuidv4 } from "uuid";
import { A2AHandler } from "./a2a-handler.js";

async function testA2AHandler() {
  console.log("🧪 Testing A2A Protocol Handler");
  console.log("================================");

  const handler = new A2AHandler();

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
    method: "sendMessage",
    params: {
      message: simpleMessage,
    } as unknown as { [k: string]: unknown },
    id: 1,
  };

  const simpleResponse = await handler.handleRequest(simpleRequest);
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
    method: "sendMessage",
    params: {
      message: taskMessage,
    } as unknown as { [k: string]: unknown },
    id: 2,
  };

  const taskResponse = await handler.handleRequest(taskRequest);
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
    method: "sendMessage",
    params: {
      message: artifactMessage,
    } as unknown as { [k: string]: unknown },
    id: 3,
  };

  const artifactResponse = await handler.handleRequest(artifactRequest);
  console.log("Request:", JSON.stringify(artifactRequest, null, 2));
  console.log("Response:", JSON.stringify(artifactResponse, null, 2));

  // Test 4: Get task status
  if (taskResponse && 'result' in taskResponse && taskResponse.result && typeof taskResponse.result === 'object' && 'id' in taskResponse.result) {
    console.log("\n4️⃣ Testing get task status...");
    const getTaskRequest: JSONRPCRequest = {
      jsonrpc: "2.0",
      method: "getTask",
      params: {
        id: (taskResponse.result as any).id,
      },
      id: 4,
    };

    const getTaskResponse = await handler.handleRequest(getTaskRequest);
    console.log("Request:", JSON.stringify(getTaskRequest, null, 2));
    console.log("Response:", JSON.stringify(getTaskResponse, null, 2));
  }

  console.log("\n✅ Tests completed!");
}

// Run tests if this file is executed directly
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  testA2AHandler().catch(console.error);
}