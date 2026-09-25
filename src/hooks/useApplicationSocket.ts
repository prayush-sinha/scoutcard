// ============================================================
// NEW FILE: src/hooks/useApplicationSocket.ts (frontend)
// ============================================================

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth'; // adjust to your auth hook

let socket: Socket | null = null;

export function useApplicationSocket(teamId: string, onEvent: (event: string, data: any) => void) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_API_URL!, {
        auth: { token },
      });
    }

    socket.emit('team:subscribe', teamId);

    socket.on('application:created', (data) => onEvent('application:created', data));
    socket.on('application:status_changed', (data) => onEvent('application:status_changed', data));
    socket.on('notification:new', (data) => onEvent('notification:new', data));

    return () => {
      socket?.emit('team:unsubscribe', teamId);
      socket?.off('application:created');
      socket?.off('application:status_changed');
      socket?.off('notification:new');
    };
  }, [teamId, token, onEvent]);
}

// ============================================================
// USAGE in your Kanban board component:
// ============================================================
//
// useApplicationSocket(teamId, (event, data) => {
//   if (event === 'application:status_changed') {
//     setApplications(prev => prev.map(app =>
//       app.id === data.applicationId ? { ...app, status: data.toStatus } : app
//     ));
//   }
//   if (event === 'application:created') {
//     setApplications(prev => [...prev, data]);
//   }
//   if (event === 'notification:new') {
//     toast(data.message);
//   }
// });
