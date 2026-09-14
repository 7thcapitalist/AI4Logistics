/**
 * The provider we build against while ADR 0003 is open.
 *
 * This is not a stub to be replaced and forgotten. The trip flow, the alert job,
 * settlement and the whole UI are built and tested against it, which is precisely
 * what makes the open provider decision non-blocking. So it should be honest about
 * failure: an emission path that has only ever seen success is an emission path
 * that has never been tested.
 */
import type {
  DocumentKind,
  EmissionRequest,
  EmissionResult,
  FiscalProvider,
} from "./provider";

export interface FakeProviderOptions {
  /** 0 to 1. Fraction of issues that come back rejected. Default 0. */
  rejectionRate?: number;
  /** Fraction that come back pending rather than immediately authorized. */
  pendingRate?: number;
  seed?: number;
}

/** Deterministic, so a test that fails once fails again. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REJECTIONS: Record<DocumentKind, { code: string; owner: string; raw: string }> = {
  cte: {
    code: "539",
    owner: "The recipient's CNPJ is not registered with the state tax authority. Check it and reissue.",
    raw: "Rejeicao: Duplicidade de CT-e com diferenca na chave de acesso",
  },
  mdfe: {
    code: "704",
    owner: "The manifest lists a CT-e that was not authorized. Issue the CT-e first, then the manifest.",
    raw: "Rejeicao: MDFe com documento fiscal nao autorizado",
  },
  ciot: {
    code: "ANTT-12",
    owner: "The driver's RNTRC is inactive. It has to be regularised with ANTT before this trip can be registered.",
    raw: "RNTRC invalido ou inativo para o transportador informado",
  },
  vale_pedagio: {
    code: "VP-03",
    owner: "The toll advance could not be issued because the route has no registered toll plazas.",
    raw: "Rota sem pracas de pedagio cadastradas",
  },
};

export class FakeProvider implements FiscalProvider {
  readonly name = "fake";
  private readonly rand: () => number;
  private readonly rejectionRate: number;
  private readonly pendingRate: number;
  private readonly issued = new Map<string, EmissionResult>();
  /** Idempotency, modelled properly: the same key never emits twice. */
  private readonly byKey = new Map<string, string>();

  constructor(opts: FakeProviderOptions = {}) {
    this.rejectionRate = opts.rejectionRate ?? 0;
    this.pendingRate = opts.pendingRate ?? 0;
    this.rand = mulberry32(opts.seed ?? 1);
  }

  async issue(request: EmissionRequest): Promise<EmissionResult> {
    const existing = this.byKey.get(request.idempotencyKey);
    if (existing) {
      const prior = this.issued.get(existing);
      if (prior) return prior;
    }

    const externalId = `fake-${request.kind}-${this.byKey.size + 1}`;
    const roll = this.rand();

    let result: EmissionResult;
    if (roll < this.rejectionRate) {
      const r = REJECTIONS[request.kind];
      result = {
        status: "rejected",
        externalId,
        code: r.code,
        ownerMessage: r.owner,
        rawMessage: r.raw,
      };
    } else if (roll < this.rejectionRate + this.pendingRate) {
      result = { status: "pending", externalId };
    } else {
      result = {
        status: "authorized",
        externalId,
        accessKey: String(BigInt(Date.now()) * 1000n + BigInt(this.byKey.size)).padStart(44, "5"),
        protocolNumber: `135${String(this.byKey.size + 1).padStart(12, "0")}`,
        xml: `<${request.kind} fake="true" trip="${request.tripId}" />`,
        authorizedAt: Date.now(),
      };
    }

    this.byKey.set(request.idempotencyKey, externalId);
    this.issued.set(externalId, result);
    return result;
  }

  async status(externalId: string): Promise<EmissionResult> {
    const r = this.issued.get(externalId);
    if (!r) throw new Error(`FakeProvider has no document ${externalId}`);
    return r;
  }

  async close(externalId: string, closedAt: number): Promise<EmissionResult> {
    const r = this.issued.get(externalId);
    if (!r) throw new Error(`FakeProvider has no document ${externalId}`);
    if (r.status !== "authorized") {
      throw new Error(`Cannot close ${externalId}: it is "${r.status}", not authorized`);
    }
    const closed: EmissionResult = { ...r, authorizedAt: closedAt };
    this.issued.set(externalId, closed);
    return closed;
  }

  async cancel(externalId: string, reason: string): Promise<EmissionResult> {
    const r = this.issued.get(externalId);
    if (!r) throw new Error(`FakeProvider has no document ${externalId}`);
    const cancelled: EmissionResult = {
      status: "rejected",
      externalId,
      code: "cancelled",
      ownerMessage: `This document was cancelled: ${reason}`,
      rawMessage: `cancelamento solicitado: ${reason}`,
    };
    this.issued.set(externalId, cancelled);
    return cancelled;
  }
}
