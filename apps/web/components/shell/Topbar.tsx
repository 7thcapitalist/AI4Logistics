import { SeletorOrg, type OpcaoOrg } from "./SeletorOrg";
import { SeletorTema } from "./SeletorTema";
import s from "./Topbar.module.css";

export function Topbar({
  titulo,
  orgs,
  orgAtual,
  destinoTrocaOrg,
}: {
  titulo: string;
  orgs: OpcaoOrg[];
  orgAtual: string;
  destinoTrocaOrg: string;
}) {
  return (
    <header className={s.topo}>
      <SeletorOrg orgs={orgs} orgAtual={orgAtual} destino={destinoTrocaOrg} />
      <h1 className={s.titulo}>{titulo}</h1>
      <div className={s.direita}>
        <SeletorTema />
      </div>
    </header>
  );
}
