import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const API_RPC_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/rpc';

const rpcLink = new RPCLink({
  url: API_RPC_URL,
});

export const orpc: any = createORPCClient(rpcLink);
