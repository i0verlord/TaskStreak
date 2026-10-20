import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const API_RPC_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/rpc';

// Direct connection for seamless single-user sync
const rpcLink = new RPCLink({
  url: API_RPC_URL,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const orpc: any = createORPCClient(rpcLink);
