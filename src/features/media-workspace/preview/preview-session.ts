export type PreviewSessionState = {
  status: "connecting" | "connected" | "expired" | "closed";
  missedHeartbeats: number;
};

export type PreviewSessionEvent = "connect" | "heartbeatReply" | "heartbeatMissed" | "close";

export const initialPreviewSession: PreviewSessionState = { status: "connecting", missedHeartbeats: 0 };

export function reducePreviewSession(state: PreviewSessionState, event: PreviewSessionEvent): PreviewSessionState {
  if (event === "close") return { status: "closed", missedHeartbeats: state.missedHeartbeats };
  if (state.status === "expired" || state.status === "closed") return state;
  if (event === "connect" || event === "heartbeatReply") return { status: "connected", missedHeartbeats: 0 };
  const missedHeartbeats = state.missedHeartbeats + 1;
  return missedHeartbeats >= 2 ? { status: "expired", missedHeartbeats } : { ...state, missedHeartbeats };
}
