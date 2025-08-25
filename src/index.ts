import { 
  DefaultRequestHandler, 
  InMemoryTaskStore, 
  JsonRpcTransportHandler 
} from "@a2a-js/sdk/server";
import { chatAgentCard } from "./agent-card";
import { ChatAgentExecutor } from "./chat-agent-executor";

// Environment interface for Cloudflare Workers (simplified - no Durable Objects needed)
export interface Env {}

// Create shared instances
const taskStore = new InMemoryTaskStore();
const agentExecutor = new ChatAgentExecutor();
const requestHandler = new DefaultRequestHandler(chatAgentCard, taskStore, agentExecutor);
const jsonRpcHandler = new JsonRpcTransportHandler(requestHandler);

// Main worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle agent card endpoint
    if (url.pathname === "/.well-known/agent-card.json") {
      const agentCard = await requestHandler.getAgentCard();
      return new Response(JSON.stringify(agentCard, null, 2), {
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

    // Handle JSON-RPC requests using SDK handler
    if (request.method === "POST" && url.pathname === "/") {
      try {
        const requestBody = await request.json();
        const response = await jsonRpcHandler.handle(requestBody);
        
        // Handle streaming responses (AsyncGenerator)
        if (typeof response === 'object' && 'next' in response) {
          // For now, collect all streaming responses and return as array
          // In a real implementation, you might want to use Server-Sent Events
          const results = [];
          for await (const result of response) {
            results.push(result);
          }
          return new Response(JSON.stringify(results), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        } else {
          // Non-streaming response
          return new Response(JSON.stringify(response), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }
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
  },
};