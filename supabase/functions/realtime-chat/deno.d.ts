declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  
  export const env: Env;
  
  export function upgradeWebSocket(req: Request): {
    socket: WebSocket;
    response: Response;
  };
} 