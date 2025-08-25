import { A2AHandler } from "./a2a-handler";
import type { JSONRPCRequest } from "@a2a-js/sdk";

// Durable Object for managing agent state
export class AgentState {
  private state: DurableObjectState;
  private env: Env;
  private a2aHandler: A2AHandler;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.a2aHandler = new A2AHandler();
  }

  // Handle HTTP requests for this Durable Object
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Handle JSON-RPC requests
    if (request.method === "POST" && url.pathname === "/") {
      try {
        const jsonRpcRequest: JSONRPCRequest = await request.json();
        const response = await this.a2aHandler.handleRequest(jsonRpcRequest);
        
        return new Response(JSON.stringify(response), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      } catch (error) {
        console.error("Error processing JSON-RPC request:", error);
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error",
          },
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // Return 404 for unknown endpoints
    return new Response("Not found", { status: 404 });
  }
}

// Environment interface for Cloudflare Workers
export interface Env {
  AGENT_STATE: DurableObjectNamespace;
}

// Main worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle agent card endpoint
    if (url.pathname === "/.well-known/agent-card.json") {
      const { chatAgentCard } = await import("./agent-card");
      return new Response(JSON.stringify(chatAgentCard, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Handle OPTIONS requests for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // For other endpoints, use the Durable Object
    const id = env.AGENT_STATE.idFromName("main-agent");
    const obj = env.AGENT_STATE.get(id);
    return obj.fetch(request);
  },
};