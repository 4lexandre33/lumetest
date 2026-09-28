/**
 * Lume Notebook — caderno source. Compiles empty in C1. Does not match ON/IF.
 */

import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import { compileNotebook } from "./lib/notebook.ts";
import { assistNotebook } from "./lib/assist.ts";
import { exportCadernoMd, importCaderno, cadernoFilename } from "./lib/share.ts";
import { lerManuscrito } from "./lib/manuscript.ts";
import { lerIr } from "./lib/narrative-ir.ts";
import { referenciasDe } from "./lib/reference.ts";
import { contextoDaFrase } from "./lib/sentence-context.ts";
import { NOTEBOOK_MANIFEST } from "./manifest.ts";
import type { NotebookService } from "./types.ts";

export * from "./manifest.ts";
export * from "./types.ts";
export * from "./lib/notebook.ts";
export * from "./lib/assist.ts";
export * from "./lib/pages.ts";
export * from "./lib/share.ts";
export * from "./lib/write-menu.ts";
export * from "./lib/annotations.ts";
export * from "./lib/prose-triggers.ts";
export * from "./lib/timeline.ts";
export * from "./lib/manuscript.ts";
export * from "./lib/narrative-ir.ts";
export * from "./lib/reference.ts";
export * from "./lib/sentence-context.ts";
export * from "./lib/causa.ts";
export * from "./lib/continuidade.ts";
export * from "./lib/discurso.ts";
export * from "./lib/impacto.ts";

export class NotebookPlugin implements IPlugin {
  manifest: IPluginManifest = NOTEBOOK_MANIFEST;
  context: PluginContext;
  private service: NotebookService;

  constructor(context: PluginContext) {
    this.context = context;
    this.service = {
      compile: compileNotebook,
      assist: assistNotebook,
      exportCaderno: exportCadernoMd,
      importCaderno,
      cadernoFilename,
      ler: lerManuscrito,
      lerIr,
      referencias: referenciasDe,
      contexto: contextoDaFrase,
    };
  }

  async activate(): Promise<void> {
    this.context.logger.info("Activating Lume Notebook...");
    this.context.registerCapability({
      name: "Notebook",
      version: "1.0.0",
      provider: this.manifest.name,
      api: this.service as any,
    });
    this.context.logger.info("Lume Notebook activated.");
  }

  async deactivate(): Promise<void> {
    this.context.logger.info("Lume Notebook deactivated.");
  }

  getService(): NotebookService {
    return this.service;
  }
}

export function createNotebookPlugin(context: PluginContext): IPlugin {
  return new NotebookPlugin(context);
}
