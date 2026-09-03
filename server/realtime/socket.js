const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const Appointment = require("../models/Appointment");

const MEET_LINK_EVENT = "appointment:meeting-link-updated";
const apptRoom = (id) => `appt:${id}`;

let io = null;

/**
 * Initializes the Socket.IO server attached to the HTTP server.
 * Authenticates each socket using the JWT sent in the auth handshake
 * and only allows joining a per-appointment room when the requester is
 * the owning patient or the owning doctor of that appointment.
 */
function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("appointment:subscribe", async (payload, ack) => {
      try {
        const appointmentId = payload?.appointmentId;
        if (!appointmentId) return ack?.({ ok: false });

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return ack?.({ ok: false });

        const isOwnerPatient =
          socket.user.role === "patient" &&
          appointment.patientId?.toString() === socket.user.id;
        const isOwnerDoctor =
          socket.user.role === "doctor" &&
          (!appointment.doctorId || appointment.doctorId?.toString() === socket.user.id);

        if (!isOwnerPatient && !isOwnerDoctor) return ack?.({ ok: false });

        socket.join(apptRoom(appointmentId));
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false });
      }
    });

    socket.on("disconnect", () => {
      // Rooms are cleaned automatically by Socket.IO; nothing extra required.
    });
  });

  return io;
}

/**
 * Emits a meeting-link update event to all sockets subscribed to the
 * given appointment's room. Emits only the minimal data the patient needs.
 */
function emitMeetingLinkUpdate(appointmentId, meetingLink, updatedAt) {
  if (!io) return;
  io.to(apptRoom(appointmentId)).emit(MEET_LINK_EVENT, {
    appointmentId: appointmentId.toString(),
    meetingLink,
    updatedAt: updatedAt || new Date().toISOString(),
  });
}

module.exports = { initSocketServer, emitMeetingLinkUpdate, MEET_LINK_EVENT };