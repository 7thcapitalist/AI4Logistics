/**
 * The provider-agnostic emission interface. See ADR 0003, which is still OPEN.
 *
 * We never call SEFAZ or ANTT directly. Certificates, per-state quirks and the
 * compliance burden are not a realistic use of a three-person team's first six
 * months.
 *
 * WARNING ABOUT THIS INTERFACE: it was written before reading any provider's real
 * API docs. ADR 0003 requires reading at least TWO before this is settled,
 * otherwise it silently encodes one vendor's assumptions and an abstraction that
 * only fits one vendor is worse than no abstraction, because it costs indirection
 * and buys nothing. Expect to change this file. That is fine, and it is why
 * everything downstream is built against FakeProvider first.
 */
export type DocumentKind = "cte" | "mdfe" | "ciot" | "vale_pedagio";

export interface EmissionRequest {
  kind: DocumentKind;
  /** From @ai4l/core idempotencyKey(). A duplicate CT-e is a real fiscal problem. */
  idempotencyKey: string;
  orgId: number;
  tripId: number;
  payload: Record<string, unknown>;
}

export type EmissionResult =
  | {
      status: "authorized";
      externalId: string;
      accessKey: string;
      protocolNumber: string;
      /** The provider returns XML; we put it in blob storage, never in Turso. */
      xml: string;
      authorizedAt: number;
    }
  | {
      status: "pending";
      externalId: string;
    }
  | {
      status: "rejected";
      externalId: string | null;
      code: string;
      /**
       * Owner-facing, already translated. P0 requirement 5 is a clear, specific
       * error, never the raw SEFAZ text. If a provider gives us only raw text,
       * translating it is OUR job, in the adapter, not the UI's.
       */
      ownerMessage: string;
      /** Kept for document_events forensics. Never rendered. */
      rawMessage: string;
    };

export interface FiscalProvider {
  readonly name: string;

  issue(request: EmissionRequest): Promise<EmissionResult>;

  /** Poll, for providers without webhooks. ADR 0003 open question. */
  status(externalId: string): Promise<EmissionResult>;

  /** MDF-e closure. The operation this entire product exists to get right. */
  close(externalId: string, closedAt: number): Promise<EmissionResult>;

  cancel(externalId: string, reason: string): Promise<EmissionResult>;
}
