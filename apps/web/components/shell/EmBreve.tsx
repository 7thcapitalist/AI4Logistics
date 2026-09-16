import { EstadoVazio } from "@ai4l/ui";

import { t } from "@/lib/i18n/pt-BR";
import { MolduraPagina } from "./MolduraPagina";

/**
 * Área que ainda não existe. A rota existe e o menu leva a ela, mas a tela diz
 * o que é e o que ainda não faz — em vez de um link morto ou de uma tela que
 * finge funcionar.
 */
export function EmBreve({
  titulo,
  rota,
  orgId,
}: {
  titulo: string;
  rota: string;
  orgId?: string | undefined;
}) {
  return (
    <MolduraPagina orgId={orgId} titulo={titulo} rotaAtiva={rota} destinoTrocaOrg={rota}>
      <EstadoVazio
        titulo={t.emBreve.titulo}
        descricao={t.emBreve.descricao(titulo.toLowerCase())}
      />
    </MolduraPagina>
  );
}
