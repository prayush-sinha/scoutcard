"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

export interface ApplicationCreatedPayload {
  applicationId: string;
  playerId: string;
  playerName: string;
  status: string;
}

export interface ApplicationStatusChangedPayload {
  applicationId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
}

export interface NotificationNewPayload {
  type: string;
  applicationId: string;
  message: string;
}

/**
 * A single discriminated union (tagged by `event`) rather than three loose
 * callback overloads — this is what lets TypeScript actually narrow `data`'s
 * shape when a consumer checks `payload.event === "..."`.
 */
export type SocketPayload =
  | { event: "application:created"; data: ApplicationCreatedPayload }
  | { event: "application:status_changed"; data: ApplicationStatusChangedPayload }
  | { event: "notification:new"; data: NotificationNewPayload };

type Handler = (payload: SocketPayload) => void;

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    sharedSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
      withCredentials: true,
      autoConnect: true,
    });
  }
  return sharedSocket;
}

/**
 * Subscribes the current client to a team's Kanban room (if teamId is given)
 * plus the caller's own notification room (joined automatically server-side),
 * and forwards every relevant event to the provided handler.
 *
 * Applicants viewing "My Applications" can pass teamId={undefined} to only
 * receive their personal `notification:new` events.
 */
export function useApplicationSocket(teamId: string | undefined, onEvent: Handler) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (data: ApplicationCreatedPayload) => handlerRef.current({ event: "application:created", data });
    const onStatusChanged = (data: ApplicationStatusChangedPayload) =>
      handlerRef.current({ event: "application:status_changed", data });
    const onNotification = (data: NotificationNewPayload) => handlerRef.current({ event: "notification:new", data });

    socket.on("application:created", onCreated);
    socket.on("application:status_changed", onStatusChanged);
    socket.on("notification:new", onNotification);

    if (teamId) socket.emit("team:subscribe", teamId);

    return () => {
      socket.off("application:created", onCreated);
      socket.off("application:status_changed", onStatusChanged);
      socket.off("notification:new", onNotification);
      if (teamId) socket.emit("team:unsubscribe", teamId);
    };
  }, [teamId]);
}
