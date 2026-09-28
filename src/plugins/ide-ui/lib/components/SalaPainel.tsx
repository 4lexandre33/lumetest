import { isSystemEntityId } from "../../../narrative-engine/index.ts";
import { useIdeStore } from "../../../ide-state/index.ts";
import { lerFrase } from "../leitura.ts";
import type { Superficie } from "../superficie.ts";

export function SalaPainel({ sala }: { sala: Superficie }) {
  if (sala === "escrever" || sala === "tecnico") return null;
  const project = useIdeStore((s) => s.project);
  const compiled = useIdeStore((s) => s.compiled);
  const prosa = project?.notebooksSource ?? "";
  const mundo = [...(compiled?.worldModel.values() ?? [])].filter((entity) => !isSystemEntityId(entity.id) && !entity.tags.has("molde"));
  const pessoas = mundo.filter((entity) => entity.tags.has("agent"));
  const resto = mundo.filter((entity) => !entity.tags.has("agent"));
  const inicio = prosa.indexOf("\n\n");
  const leitura = lerFrase(prosa, inicio < 0 ? 0 : inicio + 2, project?.entitiesSource ?? "");
  const cenas = (leitura?.manuscrito.books ?? []).flatMap((book) => book.chapters.flatMap((chapter) => chapter.scenes.map((scene) => ({ book: book.title, chapter: chapter.title, scene: scene.title }))));
  const notas = sala === "revisao" ? leitura?.diagnostico.notas ?? [] : [];

  return (
    <div className="h-full min-h-0 overflow-auto bg-bg px-4 py-4 text-sm">
      {sala === "pessoas" ? (
        pessoas.length ? (
          <ul className="space-y-2">
            {pessoas.map((entity) => (
              <li key={entity.id}>
                {entity.name || entity.id} <span className="text-subtle">{entity.id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Ainda não há pessoas.</p>
        )
      ) : null}
      {sala === "cenas" ? (
        cenas.length ? (
          <ul className="space-y-2">
            {cenas.map((item) => (
              <li key={`${item.book}-${item.chapter}-${item.scene}`}>{item.scene}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Ainda não há cenas.</p>
        )
      ) : null}
      {sala === "cronologia" ? (
        cenas.length ? (
          <ol className="space-y-2">
            {cenas.map((item, index) => (
              <li key={`${item.scene}-${index}`}>
                {index + 1}. {item.chapter} — {item.scene}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted">Ainda não há cronologia.</p>
        )
      ) : null}
      {sala === "universo" ? (
        resto.length ? (
          <ul className="space-y-2">
            {resto.map((entity) => (
              <li key={entity.id}>
                {entity.name || entity.id} <span className="text-subtle">{entity.id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Ainda não há universo.</p>
        )
      ) : null}
      {sala === "revisao" ? (
        notas.length ? (
          <ul className="space-y-2">
            {notas.map((nota, index) => (
              <li key={`${nota.codigo}-${nota.cena}-${index}`}>{nota.texto}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Sem avisos.</p>
        )
      ) : null}
      {sala === "assistente" ? (
        leitura?.contexto ? (
          <div className="space-y-2">
            <p>{leitura.contexto.text}</p>
            <p className="text-subtle">{leitura.historia === prosa && !leitura.proposta.desceu ? "A proposta não desceu. O texto não muda." : "O texto não muda."}</p>
          </div>
        ) : (
          <p className="text-muted">O assistente não altera o texto. Não há modelo nesta sala.</p>
        )
      ) : null}
    </div>
  );
}
