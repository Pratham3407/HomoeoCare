import { io } from "socket.io-client";
import { useEffect, useRef } from "react";
import { SERVER_URL } from "../config";

const MEET_LINK_EVENT = "appointment:meeting-link-updated";

// A single module-level socket instance shared across components in this tab.
// This prevents creating a new WebSocket/SSE-style connection on every render.
let socket = null;

/**
 * Returns the shared socket, creating it once per page lifetime.
 * The token is read lazily on connect so reconnects always use the latest.
 */
export function getSocket() {
  if (socket) return socket;
  socket = io(SERVER_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 8000,
    auth(cb) {
      cb({ token: localStorage.getItem("token") || "" });
    },
  });
  socket.on("connect_error", (err) => {
    // Connection failures should not crash the app. The component keeps the
    // last known appointment state and retries via reconnection.
    if (err.message === "Unauthorized") {
      socket.disconnect();
    }
  });
  return socket;
}

/**
 * Disconnects and clears the shared socket so no authenticated real-time
 * events continue after logout. The next authenticated login creates a fresh
 * connection (guaranteeing a stale doctor never keeps receiving events and a
 * different doctor cannot reuse an old connection/token).
 */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Connects the socket if a token is present and a listener/tab needs it.
 * Returns a disconnect/cleanup function.
 */
export function connectSocket() {
  const s = getSocket();
  if (!localStorage.getItem("token")) return () => {};
  if (!s.connected) s.connect();
  return () => {
    // Leave the socket connected so other tabs/listeners keep working;
    // per-component cleanup is handled by the hook below.
  };
}

/**
 * Subscribe to a single appointment's room and listen for meeting-link
 * updates. Only the authorized owner will be admitted to the room by the
 * server; unauthorized listeners simply receive no events.
 *
 * @param appointmentId string|null
 * @param onChange (event) => void
 */
export function useAppointmentRealtime(appointmentId, onChange) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const idRef = useRef(appointmentId);
  idRef.current = appointmentId;

  useEffect(() => {
    if (!appointmentId || !localStorage.getItem("token")) return undefined;

    const s = getSocket();
    let cleanup = false;

    const subscribe = () => {
      if (cleanup) return;
      s.emit("appointment:subscribe", { appointmentId: idRef.current }, (ack) => {
        if (ack && ack.ok && onChangeRef.current && !cleanup) {
          // Just joined; Socket.IO will now push updates to us.
        }
      });
    };

    const handleMeetLink = (event) => {
      if (!event || event.appointmentId !== idRef.current) return;
      onChangeRef.current?.(event);
    };

    // Handle token changes across reconnects
    s.auth = (cb) => cb({ token: localStorage.getItem("token") || "" });

    syncConnectionState();

    function syncConnectionState() {
      if (!cleanup && localStorage.getItem("token")) {
        if (s.connected) subscribe();
        else s.connect();
      }
    }

    s.on("connect", subscribe);
    s.on(MEET_LINK_EVENT, handleMeetLink);

    return () => {
      cleanup = true;
      s.off("connect", subscribe);
      s.off(MEET_LINK_EVENT, handleMeetLink);
    };
  }, [appointmentId]);
}

export { MEET_LINK_EVENT };