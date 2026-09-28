/**
 * Core — Fachada Principal (Microkernel)
 * Coordena EventBus, PluginRegistry, CapabilityRegistry, ErrorBoundary
 */

import type { PluginStorage } from './api.ts';
import type { TypedEvent, TypedEventConstructor } from './contracts/typed-event.ts';
import type { IPluginManifest, PluginFactory } from './contracts/plugin-manifest.ts';
import type { Logger } from './logger.ts';
import type { PluginContext } from './contracts/plugin-context.ts';
import { PermissionError } from './contracts/errors.ts';

import { EventBus } from './internal/event-bus.ts';
import { PluginRegistry } from './internal/plugin-registry.ts';
import { CapabilityRegistry } from './internal/capability-registry.ts';
import { ErrorBoundary } from './internal/error-boundary.ts';
import { Dispatcher } from './internal/dispatcher.ts';
import { ConsoleLogger, createPluginLogger } from './logger.ts';
import { AppError } from './contracts/errors.ts';
import type { CapabilityHandler, DispatchResult, Envelope } from './contracts/envelope.ts';

/**
 * In-memory storage para plugins
 */
class InMemoryPluginStorage implements PluginStorage {
  private data: Map<string, string> = new Map();

  get(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.data.set(key, value);
  }

  remove(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

type KernelNote = { code: 'lifecycle' | 'permission' | 'dispatch'; message: string; plugin?: string };

/**
 * Core — Microkernel principal
 */
export class Core {
  private eventBus: EventBus;
  private pluginRegistry: PluginRegistry;
  private capabilityRegistry: CapabilityRegistry;
  private errorBoundary: ErrorBoundary;
  private dispatcher: Dispatcher;
  private logger: Logger;
  private notes: KernelNote[] = [];

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger('[Core]');
    this.eventBus = new EventBus(this.logger);
    this.pluginRegistry = new PluginRegistry(this.logger);
    this.capabilityRegistry = new CapabilityRegistry(this.logger);
    this.errorBoundary = new ErrorBoundary(this.logger);
    this.dispatcher = new Dispatcher();

    this.logger.info('Core initialized');
  }

  /**
   * Registrar um plugin (antes de ativar)
   */
  registerPlugin(manifest: IPluginManifest, factory: PluginFactory): void {
    this.pluginRegistry.register(manifest, factory);
  }

  /**
   * Ativar um plugin
   */
  async activatePlugin(pluginName: string): Promise<void> {
    const entry = this.pluginRegistry.get(pluginName);
    if (!entry) {
      throw new AppError('PLUGIN_NOT_FOUND', `Plugin ${pluginName} not registered`);
    }

    // Criar contexto do plugin
    const pluginContext = this.createPluginContext(pluginName, entry.manifest.version!);

    // Ativar via registry (com validação de deps)
    await this.pluginRegistry.activate(pluginName, pluginContext, async (depName) => {
      if (entry.manifest.hooks?.onPluginReady) {
        await entry.manifest.hooks.onPluginReady(depName);
      }
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.note('lifecycle', message, pluginName);
      throw err;
    });
    for (const slot of entry.manifest.slots ?? []) {
      this.dispatcher.bind(pluginName, slot.name, slot.capability);
    }
  }

  /**
   * Desativar um plugin
   */
  async deactivatePlugin(pluginName: string): Promise<void> {
    await this.pluginRegistry.deactivate(pluginName);
    this.dispatcher.unbind(pluginName);
  }

  /**
   * Ativar múltiplos plugins em paralelo (com resolução de deps)
   */
  async activatePlugins(pluginNames: string[]): Promise<void> {
    // Topological sort by dependencies (simples: ativar em ordem)
    for (const pluginName of pluginNames) {
      try {
        await this.activatePlugin(pluginName);
      } catch (err) {
        this.logger.error(`Failed to activate plugin ${pluginName}`, err as Error);
        // Continuar com próximo (ou parar? Por enquanto continuamos)
      }
    }
  }

  /**
   * Criar contexto que será passado ao plugin factory
   */
  private createPluginContext(pluginName: string, pluginVersion: string): PluginContext {
    const manifest = this.pluginRegistry.get(pluginName)?.manifest;
    const storage = this.guardStorage(pluginName, manifest, new InMemoryPluginStorage());
    return {
      pluginName,
      pluginVersion,

      registerCapability: (capability) => {
        this.capabilityRegistry.register(capability);
      },

      emitEvent: async <T,>(event: TypedEvent<T>) => {
        return this.errorBoundary.try(pluginName, async () => {
          await this.eventBus.emit(event, pluginName);
        }).then((result) => {
          if (!result.ok) throw result.error;
        });
      },

      on: <E extends TypedEvent<any>>(
        eventType: TypedEventConstructor<E>,
        handler: (event: E) => void | Promise<void>,
        options?: { once?: boolean; priority?: 'high' | 'normal' | 'low' }
      ) => {
        this.guardEvent(pluginName, manifest, eventType);
        return this.eventBus.on(eventType, handler, pluginName, options);
      },

      getService: <T,>(name: string, version?: string): T => {
        return this.capabilityRegistry.use<T>(name, version);
      },

      registerHandler: (handler) => {
        this.registerHandler({ ...handler, provider: pluginName });
      },

      dispatch: <T,>(envelope: Envelope) => {
        return this.dispatch<T>({ ...envelope, source: pluginName });
      },

      logger: createPluginLogger(pluginName),

      storage,

      diagnostics: {
        listSubscriptions: () => this.eventBus.listSubscriptions(),
        getEventLog: (eventType?, limit?) => this.eventBus.getEventLog(eventType, limit),
        getPluginState: (name) => this.pluginRegistry.getState(name),
        listPlugins: () => this.pluginRegistry.list().map(m => m.name)
      }
    };
  }

  private note(code: KernelNote['code'], message: string, plugin?: string): void {
    this.notes.push({ code, message, plugin });
  }

  private guardStorage(pluginName: string, manifest: IPluginManifest | undefined, storage: PluginStorage): PluginStorage {
    const mode = manifest?.permissions?.storage;
    if (!mode || mode === 'write') return storage;
    const deny = () => {
      this.note('permission', 'storage negado', pluginName);
      throw new PermissionError(pluginName, 'storage', 'storage negado');
    };
    return {
      get: (key) => (mode === 'none' ? null : storage.get(key)),
      set: () => deny(),
      remove: () => deny(),
      clear: () => deny(),
    };
  }

  private guardEvent(pluginName: string, manifest: IPluginManifest | undefined, eventType: TypedEventConstructor): void {
    const allowed = manifest?.permissions?.events;
    if (!allowed) return;
    const type = new eventType(undefined).type;
    if (allowed.includes(type)) return;
    this.note('permission', `evento ${type} negado`, pluginName);
    throw new PermissionError(pluginName, 'events', `evento ${type} negado`);
  }

  /**
   * Registo consultável. Não devolve a implementação das capabilities.
   */
  registry() {
    return {
      plugins: this.pluginRegistry.list().map((manifest) => ({
        name: manifest.name,
        version: manifest.version,
        state: this.pluginRegistry.getState(manifest.name),
        provides: manifest.capabilities?.provides?.map((item) => `${item.name}@${item.version}`) ?? [],
        requires: manifest.requires?.mandatory?.map((item) => `${item.name}@${item.version}`) ?? [],
        permissions: manifest.permissions ?? null,
      })),
      capabilities: this.capabilityRegistry.list().map((item) => ({
        name: item.name,
        version: item.version,
        provider: item.provider,
      })),
      handlers: this.dispatcher.list(),
    };
  }

  /**
   * Estado do ciclo de vida. Não conhece narrativa.
   */
  lifecycle(pluginName: string): { state: 'pending' | 'active' | 'failed' | 'disabled'; error?: string } | undefined {
    const entry = this.pluginRegistry.get(pluginName);
    if (!entry) return undefined;
    return { state: entry.state, error: entry.error?.message };
  }

  /**
   * Avisos do kernel: ciclo de vida e permissão.
   */
  diagnostics(): KernelNote[] {
    return this.notes.map((note) => ({ ...note }));
  }

  /**
   * Emitir evento via Core (nível global / host)
   */
  async emitEvent<T>(event: TypedEvent<T>, source = 'core'): Promise<void> {
    await this.eventBus.emit(event, source);
  }

  /**
   * Subscrever a eventos via Core (nível global / host)
   */
  on<E extends TypedEvent<any>>(
    eventType: TypedEventConstructor<E>,
    handler: (event: E) => void | Promise<void>,
    options?: { once?: boolean; priority?: 'high' | 'normal' | 'low' }
  ): () => void {
    return this.eventBus.on(eventType, handler, 'core', options);
  }

  /**
   * Registrar uma capability (chamado pelo plugin durante init)
   * Exposto via api.getService internamente
   */
  registerCapability(capability: any): void {
    this.capabilityRegistry.register(capability);
  }

  /**
   * Obter uma capability (RPC service)
   */
  getService<T = any>(name: string, version?: string): T {
    return this.capabilityRegistry.use<T>(name, version);
  }

  /**
   * Regista um método. Não substitui getService.
   */
  registerHandler(handler: CapabilityHandler): void {
    this.dispatcher.register(handler);
  }

  /**
   * Entrega o envelope. Não lança.
   */
  async dispatch<T = unknown>(envelope: Envelope): Promise<DispatchResult<T>> {
    const active = envelope?.source === 'core' || this.pluginRegistry.getState(envelope?.source) === 'active';
    const found = this.dispatcher.resolve(envelope, active);
    if ('error' in found) {
      this.note('dispatch', found.error, envelope?.source);
      return { ok: false, error: found.error };
    }
    const result = await this.dispatcher.run(found.handler, envelope);
    if (!result.ok) this.note('dispatch', result.error, envelope.source);
    return result as DispatchResult<T>;
  }

  /**
   * Listar todos os plugins registrados
   */
  listPlugins(): IPluginManifest[] {
    return this.pluginRegistry.list();
  }

  /**
   * Listar plugins ativos
   */
  listActivePlugins(): string[] {
    return this.pluginRegistry
      .list()
      .filter(m => this.pluginRegistry.getState(m.name) === 'active')
      .map(m => m.name);
  }

  /**
   * Diagnostics gerais
   */
  getDiagnostics() {
    return {
      plugins: this.pluginRegistry.list().map(m => ({
        name: m.name,
        version: m.version,
        state: this.pluginRegistry.getState(m.name),
        capabilities: m.capabilities?.provides?.map(c => `${c.name}@${c.version}`) || []
      })),
      subscriptions: this.eventBus.listSubscriptions(),
      isolatedPlugins: this.errorBoundary.listIsolated(),
      capabilities: this.capabilityRegistry.list()
    };
  }

  /**
   * Reset (para testes)
   */
  async shutdown(): Promise<void> {
    const plugins = this.pluginRegistry.list();
    for (const manifest of plugins) {
      await this.deactivatePlugin(manifest.name);
    }
    this.logger.info('Core shutdown complete');
  }
}

/**
 * Factory para criar uma instância do Core
 */
export function createCore(logger?: Logger): Core {
  return new Core(logger);
}
