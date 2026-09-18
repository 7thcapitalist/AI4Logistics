import type { Documento, DocumentoTipo, Risco, Viagem } from "@ai4l/core";

/** Documento principal de um tipo. O primeiro emitido é o que a tela mostra. */
export function documentoPrincipal(
  v: Viagem,
  tipo: DocumentoTipo,
): Documento | undefined {
  return v.documentos.find((d) => d.tipo === tipo);
}

export function riscosDoDocumento(riscos: Risco[], documentoId: string): Risco[] {
  return riscos.filter((r) => r.documentoId === documentoId);
}
