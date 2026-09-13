import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

/// Single shared socket for the whole app (Architecture Rule, Section 2:
/// "One shared WebSocket gateway handles all real-time push") — features
/// subscribe to events on this one connection rather than opening their own.
let socket: Socket | null = null;

function socketUrl(): string {
  // The backend's Socket.IO gateway listens on the bare HTTP origin, not
  // under the versioned /api/v1 REST prefix.
  return new URL(import.meta.env.VITE_API_BASE_URL).origin;
}

export function connectSocket(): Socket {
  const accessToken = useAuthStore.getState().accessToken;
  if (socket) {
    socket.disconnect();
  }
  socket = io(socketUrl(), {
    // Auth rides the handshake `auth` payload, not cookies — no need for
    // `withCredentials` (which would also require the gateway's CORS to
    // echo a concrete origin instead of accepting the request anonymously).
    auth: { token: accessToken ? `Bearer ${accessToken}` : undefined },
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
