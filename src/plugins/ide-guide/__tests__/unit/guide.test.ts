import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createCore, Core } from '../../../../core/index.ts';
import { IDE_GUIDE_MANIFEST, createIdeGuidePlugin } from '../../index.ts';
import type { IdeGuideService } from '../../types.ts';
import { GUIDE_SLIDES } from '../../lib/guide.ts';
import { SYNTAX_REF } from '../../lib/syntax-ref.ts';

describe('IDE Guide Plugin', () => {
  let core: Core;
  let guideService: IdeGuideService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(IDE_GUIDE_MANIFEST, createIdeGuidePlugin);
    await core.activatePlugin('lume-ide-guide');
    guideService = core.getService<IdeGuideService>('IdeGuide');
  });

  it('declares valid manifest', () => {
    assert.equal(IDE_GUIDE_MANIFEST.name, 'lume-ide-guide');
    assert.equal(IDE_GUIDE_MANIFEST.version, '1.0.0');
    assert.ok(IDE_GUIDE_MANIFEST.capabilities?.provides?.some((c) => c.name === 'IdeGuide'));
  });

  it('maintains 100% parity on tutorial slides and syntax reference', () => {
    const slides = guideService.getGuideSlides();
    assert.equal(slides.length, GUIDE_SLIDES.length);
    assert.deepEqual(slides[0], GUIDE_SLIDES[0]);
    assert.equal(guideService.getTotalSlides(), GUIDE_SLIDES.length);
    assert.deepEqual(guideService.getSlide(1), GUIDE_SLIDES[1]);

    const syntaxRef = guideService.getSyntaxReference();
    assert.equal(syntaxRef.length, SYNTAX_REF.length);
    assert.deepEqual(syntaxRef, SYNTAX_REF);

    const section = guideService.getSection('bloco');
    assert.ok(section);
    assert.equal(section.title, 'Bloco de entidade (FBE)');

    const searchRes = guideService.searchReference('taxonomia');
    assert.ok(searchRes.length > 0);
    assert.ok(searchRes.some((s) => s.id === 'taxonomia'));

    const posse = guideService.getSection('posse');
    assert.ok(posse);
    assert.ok(guideService.searchReference('TEM').some((s) => s.id === 'posse'));
    assert.ok(guideService.searchReference('SET_PHRASE').some((s) => s.id === 'nomeados'));
    assert.ok(guideService.searchReference('gaveta').some((s) => s.id === 'caminhos'));
    assert.ok(guideService.searchReference('/ é OU').some((s) => s.id === 'ramos'));
    const escrita = guideService.getSection('escrita');
    assert.ok(escrita);
    assert.ok(guideService.searchReference('lume-anotacoes').some((s) => s.id === 'escrita'));
    assert.ok(guideService.searchReference('cloneWorldModel').some((s) => s.id === 'escrita'));
    assert.ok(guideService.searchReference('ideMode').some((s) => s.id === 'escrita'));
    assert.ok(guideService.searchReference('Vista do jogador').some((s) => s.id === 'escrita'));
    assert.ok(guideService.searchReference('## regras').some((s) => s.id === 'escrita'));
    assert.ok(guideService.searchReference('CREATE').some((s) => s.id === 'escrita'));
    assert.ok(guideService.searchReference('current_location').some((s) => s.id === 'bloco' || s.id === 'start'));
    assert.ok(guideService.searchReference('CREATE ID.tag').some((s) => s.id === 'bloco' || s.id === 'escrita'));
    assert.ok(guideService.searchReference('Modo Escrita').some((s) => s.id === 'escrita'));
  });
});
