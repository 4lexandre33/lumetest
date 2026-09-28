/**
 * Lume EMPA Platform Bootstrap & Kernel Host
 * Initializes Core Microkernel, registers and activates all domain plugins
 */

import { createCore, Core } from './core/index.ts';
import { ordemDeBoot } from './core/boot-order.ts';
import { OPCIONAIS } from './opcionais.ts';

// 1. Core Narrative Engine Plugin
import {
  NARRATIVE_ENGINE_MANIFEST,
  createNarrativeEnginePlugin,
  type NarrativeEngineService,
  type TaxonomyService,
  type QueryEngineService,
  type LanguageToolsService
} from './plugins/narrative-engine/index.ts';

import {
  MUTATION_GATEWAY_MANIFEST,
  createMutationGatewayPlugin
} from './plugins/mutation-gateway/index.ts';

import {
  AI_RUNTIME_MANIFEST,
  createAiRuntimePlugin
} from './plugins/ai-runtime/index.ts';

import {
  AUTHORING_RUNTIME_MANIFEST,
  createAuthoringRuntimePlugin
} from './plugins/authoring-runtime/index.ts';

import {
  MANUSCRIPT_MANIFEST,
  createManuscriptPlugin
} from './plugins/manuscript/index.ts';

import {
  SENTENCE_CONTEXT_MANIFEST,
  createSentenceContextPlugin
} from './plugins/sentence-context/index.ts';

import {
  NARRATIVE_GRAPH_MANIFEST,
  createNarrativeGraphPlugin
} from './plugins/narrative-graph/index.ts';

// 2. Project Cloud & Persistence Plugin
import {
  PROJECT_CLOUD_MANIFEST,
  createProjectCloudPlugin,
  type ProjectCloudService,
  type ProjectHistoryService
} from './plugins/project-cloud/index.ts';

// 3. IDE State & Orchestration Plugin
import {
  IDE_STATE_MANIFEST,
  createIdeStatePlugin,
  type IdeStateService
} from './plugins/ide-state/index.ts';

import {
  INTENT_ENGINE_MANIFEST,
  createIntentEnginePlugin,
  type IntentEngineService,
  type IntentCatalogService
} from './plugins/intent-engine/index.ts';

import {
  RULE_SEMANTICS_MANIFEST,
  createRuleSemanticsPlugin,
  type RuleSemanticsService
} from './plugins/rule-semantics/index.ts';

import {
  WORLD_EVENTS_MANIFEST,
  createWorldEventsPlugin,
  type WorldEventsService
} from './plugins/world-events/index.ts';

import {
  KNOWLEDGE_MANIFEST,
  createKnowledgePlugin,
  type KnowledgeService
} from './plugins/knowledge/index.ts';

import {
  AGENCY_MANIFEST,
  createAgencyPlugin,
  type AgencyService
} from './plugins/agency/index.ts';

import {
  SPATIAL_MANIFEST,
  createSpatialPlugin,
  type SpatialService
} from './plugins/spatial/index.ts';

import {
  SENSES_MANIFEST,
  createSensesPlugin,
  type SensesService
} from './plugins/senses/index.ts';

import {
  KIT_ADVENTURE_MANIFEST,
  createKitAdventurePlugin,
  type AdventureKitService
} from './plugins/kit-adventure/index.ts';

import {
  KIT_SOCIAL_MANIFEST,
  createKitSocialPlugin,
  type SocialKitService
} from './plugins/kit-social/index.ts';

import {
  KIT_CHANNEL_MANIFEST,
  createKitChannelPlugin,
  type ChannelKitService
} from './plugins/kit-channel/index.ts';

import {
  KIT_COMBAT_MANIFEST,
  createKitCombatPlugin,
  type CombatKitService
} from './plugins/kit-combat/index.ts';

import {
  KIT_PROSE_MANIFEST,
  createKitProsePlugin,
  type ProseService
} from './plugins/kit-prose/index.ts';

import {
  SIFT_MANIFEST,
  createSiftPlugin,
  type SiftService
} from './plugins/sift/index.ts';

import {
  DRY_RUN_MANIFEST,
  createDryRunPlugin,
  type DryRunService
} from './plugins/dry-run/index.ts';

import {
  PROCESS_MANIFEST,
  createProcessPlugin,
  type ProcessService
} from './plugins/process/index.ts';

import {
  CHAIN_MANIFEST,
  createChainPlugin,
  type ChainService
} from './plugins/chain/index.ts';

import {
  LIFE_MANIFEST,
  createLifePlugin,
  type LifeService
} from './plugins/life/index.ts';

import {
  VOCAB_MANIFEST,
  createVocabPlugin,
  type VocabService
} from './plugins/vocab/index.ts';

import {
  NLP_MANIFEST,
  createNlpPlugin,
  type NlpService
} from './plugins/nlp/index.ts';

import {
  NOTEBOOK_MANIFEST,
  createNotebookPlugin,
  type NotebookService
} from './plugins/notebook/index.ts';

import type { RuleEffectsService } from './plugins/narrative-engine/index.ts';

import {
  EXT_HOST_MANIFEST,
  createExtHostPlugin,
  type ExtHostService
} from './plugins/ext-host/index.ts';

// 4. IDE UI & Presentation Plugin
import {
  IDE_UI_MANIFEST,
  createIdeUIPlugin,
  type IdeUIService,
  type IdeComponentsService
} from './plugins/ide-ui/index.ts';

// 5. Support Plugins (Guide, Settings, Extras, Multiplayer)
import {
  IDE_GUIDE_MANIFEST,
  createIdeGuidePlugin,
  type IdeGuideService
} from './plugins/ide-guide/index.ts';

import {
  IDE_SETTINGS_MANIFEST,
  createIdeSettingsPlugin,
  type IdeSettingsPluginService
} from './plugins/ide-settings/index.ts';

import {
  ENTITY_EXTRAS_MANIFEST,
  createEntityExtrasPlugin,
  type EntityExtrasService
} from './plugins/entity-extras/index.ts';

import {
  MULTIPLAYER_MANIFEST,
  createMultiplayerPlugin,
  type MultiplayerService
} from './plugins/multiplayer/index.ts';

declare global {
  var __LUME_CORE__: Core | undefined;
}

export interface LumePlatformServices {
  narrativeEngine: NarrativeEngineService;
  taxonomy: TaxonomyService;
  queryEngine: QueryEngineService;
  languageTools: LanguageToolsService;
  projectCloud: ProjectCloudService;
  projectHistory: ProjectHistoryService;
  ideState: IdeStateService;
  intentEngine: IntentEngineService;
  intentCatalog: IntentCatalogService;
  ruleEffects: RuleEffectsService;
  ruleSemantics: RuleSemanticsService;
  worldEvents: WorldEventsService;
  knowledge: KnowledgeService;
  agency: AgencyService;
  spatial: SpatialService | null;
  senses: SensesService | null;
  adventureKit: AdventureKitService | null;
  socialKit: SocialKitService | null;
  channelKit: ChannelKitService | null;
  combatKit: CombatKitService | null;
  prose: ProseService | null;
  sift: SiftService | null;
  dryRun: DryRunService;
  process: ProcessService | null;
  chain: ChainService;
  life: LifeService | null;
  vocab: VocabService;
  nlp: NlpService;
  notebook: NotebookService;
  ideUI: IdeUIService;
  ideComponents: IdeComponentsService;
  ideGuide: IdeGuideService;
  ideSettings: IdeSettingsPluginService;
  entityExtras: EntityExtrasService;
  multiplayer: MultiplayerService | null;
  extHost: ExtHostService;
}

let platformCore: Core | null = null;

/**
 * Boots the Extensible Microkernel Platform and activates all domain plugins
 */
export async function bootLumePlatform(opts?: { opcionais?: boolean; servicos?: boolean }): Promise<{ core: Core; services?: LumePlatformServices }> {
  const guardar = opts?.opcionais !== false;
  if (guardar && platformCore) {
    return {
      core: platformCore,
      ...(opts?.servicos ? { services: getPlatformServices(platformCore) } : {})
    };
  }

  const core = createCore();
  if (guardar) {
    platformCore = core;
    if (typeof globalThis !== 'undefined') {
      globalThis.__LUME_CORE__ = core;
    }
  }

  // Register all plugins
  core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
  core.registerPlugin(MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin);
  core.registerPlugin(AI_RUNTIME_MANIFEST, createAiRuntimePlugin);
  core.registerPlugin(AUTHORING_RUNTIME_MANIFEST, createAuthoringRuntimePlugin);
  core.registerPlugin(PROJECT_CLOUD_MANIFEST, createProjectCloudPlugin);
  core.registerPlugin(IDE_STATE_MANIFEST, createIdeStatePlugin);
  core.registerPlugin(INTENT_ENGINE_MANIFEST, createIntentEnginePlugin);
  core.registerPlugin(RULE_SEMANTICS_MANIFEST, createRuleSemanticsPlugin);
  core.registerPlugin(WORLD_EVENTS_MANIFEST, createWorldEventsPlugin);
  core.registerPlugin(KNOWLEDGE_MANIFEST, createKnowledgePlugin);
  core.registerPlugin(AGENCY_MANIFEST, createAgencyPlugin);
  core.registerPlugin(SPATIAL_MANIFEST, createSpatialPlugin);
  core.registerPlugin(NARRATIVE_GRAPH_MANIFEST, createNarrativeGraphPlugin);
  core.registerPlugin(SENSES_MANIFEST, createSensesPlugin);
  core.registerPlugin(KIT_ADVENTURE_MANIFEST, createKitAdventurePlugin);
  core.registerPlugin(KIT_SOCIAL_MANIFEST, createKitSocialPlugin);
  core.registerPlugin(KIT_CHANNEL_MANIFEST, createKitChannelPlugin);
  core.registerPlugin(KIT_COMBAT_MANIFEST, createKitCombatPlugin);
  core.registerPlugin(KIT_PROSE_MANIFEST, createKitProsePlugin);
  core.registerPlugin(SIFT_MANIFEST, createSiftPlugin);
  core.registerPlugin(DRY_RUN_MANIFEST, createDryRunPlugin);
  core.registerPlugin(PROCESS_MANIFEST, createProcessPlugin);
  core.registerPlugin(CHAIN_MANIFEST, createChainPlugin);
  core.registerPlugin(LIFE_MANIFEST, createLifePlugin);
  core.registerPlugin(VOCAB_MANIFEST, createVocabPlugin);
  core.registerPlugin(NLP_MANIFEST, createNlpPlugin);
  core.registerPlugin(MANUSCRIPT_MANIFEST, createManuscriptPlugin);
  core.registerPlugin(SENTENCE_CONTEXT_MANIFEST, createSentenceContextPlugin);
  core.registerPlugin(NOTEBOOK_MANIFEST, createNotebookPlugin);
  core.registerPlugin(IDE_UI_MANIFEST, createIdeUIPlugin);
  core.registerPlugin(IDE_GUIDE_MANIFEST, createIdeGuidePlugin);
  core.registerPlugin(IDE_SETTINGS_MANIFEST, createIdeSettingsPlugin);
  core.registerPlugin(ENTITY_EXTRAS_MANIFEST, createEntityExtrasPlugin);
  core.registerPlugin(MULTIPLAYER_MANIFEST, createMultiplayerPlugin);
  core.registerPlugin(EXT_HOST_MANIFEST, createExtHostPlugin);

  // Activate plugins respecting dependency graph.
  const opcional = new Set(OPCIONAIS.map((item) => item.plugin));
  const ordem = ordemDeBoot(core.listPlugins().map((manifest) => ({
    name: manifest.name,
    provides: manifest.capabilities?.provides?.map((item) => item.name) ?? [],
    requires: manifest.requires?.mandatory?.map((item) => item.name) ?? [],
  })));
  for (const name of ordem) {
    if (!guardar && opcional.has(name)) continue;
    await core.activatePlugin(name);
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.__LUME_CORE__ = core;
  }

  return {
    core,
    ...(opts?.servicos ? { services: getPlatformServices(core) } : {})
  };
}

export function getPlatformServices(core: Core): LumePlatformServices {
  const talvez = <T,>(name: string): T | null => {
    try {
      return core.getService<T>(name);
    } catch {
      return null;
    }
  };
  return {
    narrativeEngine: core.getService<NarrativeEngineService>('NarrativeEngine'),
    taxonomy: core.getService<TaxonomyService>('Taxonomy'),
    queryEngine: core.getService<QueryEngineService>('QueryEngine'),
    languageTools: core.getService<LanguageToolsService>('LanguageTools'),
    projectCloud: core.getService<ProjectCloudService>('ProjectCloud'),
    projectHistory: core.getService<ProjectHistoryService>('ProjectHistory'),
    ideState: core.getService<IdeStateService>('IdeState'),
    intentEngine: core.getService<IntentEngineService>('IntentEngine'),
    intentCatalog: core.getService<IntentCatalogService>('IntentCatalog'),
    ruleEffects: core.getService<RuleEffectsService>('RuleEffects'),
    ruleSemantics: core.getService<RuleSemanticsService>('RuleSemantics'),
    worldEvents: core.getService<WorldEventsService>('WorldEvents'),
    knowledge: core.getService<KnowledgeService>('Knowledge'),
    agency: core.getService<AgencyService>('Agency'),
    spatial: talvez<SpatialService>('Spatial'),
    senses: talvez<SensesService>('Senses'),
    adventureKit: talvez<AdventureKitService>('AdventureKit'),
    socialKit: talvez<SocialKitService>('SocialKit'),
    channelKit: talvez<ChannelKitService>('ChannelKit'),
    combatKit: talvez<CombatKitService>('CombatKit'),
    prose: talvez<ProseService>('Prose'),
    sift: talvez<SiftService>('Sift'),
    dryRun: core.getService<DryRunService>('DryRun'),
    process: talvez<ProcessService>('Process'),
    chain: core.getService<ChainService>('Chain'),
    life: talvez<LifeService>('Life'),
    vocab: core.getService<VocabService>('Vocab'),
    nlp: core.getService<NlpService>('Nlp'),
    notebook: core.getService<NotebookService>('Notebook'),
    ideUI: core.getService<IdeUIService>('IdeUI'),
    ideComponents: core.getService<IdeComponentsService>('IdeComponents'),
    ideGuide: core.getService<IdeGuideService>('IdeGuide'),
    ideSettings: core.getService<IdeSettingsPluginService>('IdeSettingsService'),
    entityExtras: core.getService<EntityExtrasService>('EntityExtras'),
    multiplayer: talvez<MultiplayerService>('Multiplayer'),
    extHost: core.getService<ExtHostService>('ExtHost')
  };
}

export function getLumeCore(): Core {
  if (!platformCore) {
    platformCore = createCore();
  }
  return platformCore;
}
