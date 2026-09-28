import type { NotebookCompile } from "./lib/notebook.ts";
import type { AssistWorld, NotebookAssist } from "./lib/assist.ts";
import type { ReferenceHit } from "./lib/reference.ts";
import type { WorldModel } from "../narrative-engine/index.ts";

export type { NotebookCompile, NotebookIssue } from "./lib/notebook.ts";
export type { AssistWorld, AssistWorldEntity, NotebookAssist } from "./lib/assist.ts";

export interface NotebookService {
  compile(text: string): NotebookCompile;
  assist(text: string, world?: AssistWorld): NotebookAssist;
  exportCaderno(text: string, bookId?: string): string;
  importCaderno(into: string, incoming: string): string;
  cadernoFilename(title: string): string;
  referencias(text: string, world: WorldModel): ReferenceHit[];
}