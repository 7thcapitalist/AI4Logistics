/**
 * WhatsApp is the channel this market actually reads, which is why it is also the
 * GTM channel in the thesis. Push is the PWA fallback.
 *
 * Every alert send is recorded in document_events as "alert_sent". If a carrier
 * disputes a fine claiming we never warned them, that row is the answer.
 */
export interface Notification {
  to: string;
  /** Must name the specific trip and document, per P0 requirement 2. */
  body: string;
  orgId: number;
  tripId?: number;
  documentId?: number;
}

export interface NotificationChannel {
  readonly name: string;
  send(n: Notification): Promise<{ ok: boolean; externalId?: string; error?: string }>;
}

export class ConsoleChannel implements NotificationChannel {
  readonly name = "console";
  async send(n: Notification) {
    console.log(`[notify:${n.orgId}] -> ${n.to}: ${n.body}`);
    return { ok: true, externalId: `console-${Date.now()}` };
  }
}

export function mdfeClosureAlert(args: {
  orgId: number;
  tripId: number;
  documentId: number;
  to: string;
  plate: string;
  destination: string;
  hoursOpen: number;
}): Notification {
  return {
    to: args.to,
    orgId: args.orgId,
    tripId: args.tripId,
    documentId: args.documentId,
    body:
      `MDF-e still open: truck ${args.plate}, trip to ${args.destination}, ` +
      `open for ${args.hoursOpen}h. Close it to avoid an ANTT fine.`,
  };
}
