"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { API_ORIGIN } from "@/lib/config";

interface SocketState {
  socket: Socket | null;
  notificationSocket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketState>({
  socket: null,
  notificationSocket: null,
  isConnected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SocketState>({
    socket: null,
    notificationSocket: null,
    isConnected: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const baseOpts = {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    };

    const s = io(`${API_ORIGIN}/ws`, baseOpts);
    const ns = io(`${API_ORIGIN}/ws-attention`, baseOpts);

    s.on("connect", () =>
      setState((prev) => ({ ...prev, socket: s, isConnected: true })),
    );
    s.on("disconnect", () =>
      setState((prev) => ({ ...prev, isConnected: false })),
    );
    s.on("connect_error", () =>
      setState((prev) => ({ ...prev, isConnected: false })),
    );

    ns.on("connect", () =>
      setState((prev) => ({ ...prev, notificationSocket: ns })),
    );

    return () => {
      s.disconnect();
      ns.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={state}>{children}</SocketContext.Provider>
  );
}
