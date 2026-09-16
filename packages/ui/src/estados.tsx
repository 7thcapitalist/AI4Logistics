// ============================================================================
// Estados de tela: vazio, carregando, erro, sem permissão.
//
// Server Components. Sem 'use client': nenhum destes precisa de interação.
//
// Tela em branco é o pior estado possível num produto de conformidade fiscal.
// Se o usuário não sabe se não há nada, se ainda está carregando, se quebrou
// ou se ele não pode ver, ele assume o pior e liga para o contador.
// ============================================================================

import * as React from "react";

export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="estado">
      <span className="estado-marca" aria-hidden="true">
        —
      </span>
      <p className="estado-titulo">{titulo}</p>
      {descricao ? <p className="estado-descricao">{descricao}</p> : null}
      {acao ? <div className="estado-acao">{acao}</div> : null}
    </div>
  );
}

/**
 * Skeleton, não spinner: o spinner não diz quanto vem nem em que formato, e
 * troca a tabela por um buraco. As linhas mantêm a altura de --row-h, então
 * o conteúdo não pula quando chega.
 */
export function EstadoCarregando({ linhas = 3 }: { linhas?: number }) {
  const total = Math.max(1, Math.floor(linhas));
  return (
    <div className="carregando" aria-busy="true" aria-live="polite">
      <span className="visualmente-oculto">Carregando…</span>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="carregando-linha" aria-hidden="true" />
      ))}
    </div>
  );
}

export function EstadoErro({
  titulo = "Não foi possível carregar",
  descricao,
}: {
  titulo?: string;
  descricao?: string;
}) {
  return (
    <div className="estado estado-erro" role="alert">
      <span className="estado-marca" aria-hidden="true">
        ✕
      </span>
      <p className="estado-titulo">{titulo}</p>
      {descricao ? <p className="estado-descricao">{descricao}</p> : null}
    </div>
  );
}

/**
 * Sem permissão diz o que existe e quem libera. Fingir que a tela está vazia
 * faria o usuário procurar um dado que está lá e ele não vê.
 */
export function EstadoSemPermissao() {
  return (
    <div className="estado estado-sem-permissao">
      <span className="estado-marca" aria-hidden="true">
        ◐
      </span>
      <p className="estado-titulo">Você não tem acesso a esta área</p>
      <p className="estado-descricao">
        A informação existe, mas o seu perfil não pode vê-la. Peça liberação ao
        administrador da sua transportadora.
      </p>
    </div>
  );
}
