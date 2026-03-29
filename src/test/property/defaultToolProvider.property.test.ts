import { expect } from 'chai';
import * as fc from 'fast-check';
import { ToolDefinition } from '../../types';
import { getDefaultTool, getToolsWithDefault, OS_COMMAND_MAP, DEFAULT_COMMAND, shouldPromptForPersistence, ToolsConfigInspection } from '../../defaultToolProvider';

/**
 * Property 1: デフォルトツールの条件付き追加
 *
 * 任意のツール定義リストに対して、リストが空（0件）の場合はデフォルトツールが1件追加され、
 * そのツールの表示名が「エクスプローラーで開く」であること。
 * リストが1件以上の場合はデフォルトツールが追加されず、元のリストがそのまま返されること。
 *
 * **Validates: Requirements 3.1, 3.2, 3.6**
 */
describe('Feature: open-settings-json, Property 1: デフォルトツールの条件付き追加', function () {
  /** ToolDefinition を生成するArbitrary */
  const toolDefinitionArb: fc.Arbitrary<ToolDefinition> = fc
    .record({
      name: fc.stringMatching(/^[a-zA-Z0-9 _.-]+$/).filter((s) => s.trim().length > 0),
      command: fc.stringMatching(/^[a-zA-Z0-9 _./\\${}()-]+$/).filter((s) => s.trim().length > 0),
    });

  /** プラットフォーム文字列を生成するArbitrary */
  const platformArb: fc.Arbitrary<string> = fc.oneof(
    fc.constant('win32'),
    fc.constant('darwin'),
    fc.constant('linux'),
  );

  it('ツール定義が0件の場合、デフォルトツールが1件追加され表示名が「エクスプローラーで開く」である', function () {
    fc.assert(
      fc.property(platformArb, (platform) => {
        const result = getToolsWithDefault([], platform);

        expect(result).to.have.lengthOf(1);
        expect(result[0].name).to.equal('エクスプローラーで開く');
      }),
      { numRuns: 100 },
    );
  });

  it('ツール定義が1件以上の場合、デフォルトツールが追加されず元のリストがそのまま返される', function () {
    fc.assert(
      fc.property(
        fc.array(toolDefinitionArb, { minLength: 1, maxLength: 10 }),
        platformArb,
        (tools, platform) => {
          const result = getToolsWithDefault(tools, platform);

          // 元のリストと同じ長さであること
          expect(result).to.have.lengthOf(tools.length);
          // 元のリストと同じ参照であること
          expect(result).to.equal(tools);
        },
      ),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 2: OSプラットフォームとデフォルトコマンドの正しい対応
 *
 * サポート対象3種（win32, darwin, linux）+ 未知の文字列を生成し、
 * 正しいコマンドが返されることを検証する。
 * 未知のプラットフォームでもエラーを発生させずフォールバックコマンドを返すことを検証する。
 *
 * **Validates: Requirements 3.3, 3.4, 3.5**
 */
describe('Feature: open-settings-json, Property 2: OSプラットフォームとデフォルトコマンドの正しい対応', function () {
  /** サポート対象プラットフォームとその期待コマンド */
  const EXPECTED_COMMANDS: Record<string, string> = {
    win32: 'explorer ${dir}',
    darwin: 'open ${dir}',
    linux: 'xdg-open ${dir}',
  };

  /** サポート対象プラットフォームを生成するArbitrary */
  const supportedPlatformArb: fc.Arbitrary<string> = fc.oneof(
    fc.constant('win32'),
    fc.constant('darwin'),
    fc.constant('linux'),
  );

  /** 未知のプラットフォーム文字列を生成するArbitrary */
  const unknownPlatformArb: fc.Arbitrary<string> = fc
    .stringMatching(/^[a-zA-Z0-9_-]+$/)
    .filter((s) => s.length > 0 && !['win32', 'darwin', 'linux'].includes(s));

  it('サポート対象プラットフォームに対して正しいコマンドが返される', function () {
    fc.assert(
      fc.property(supportedPlatformArb, (platform) => {
        const tool = getDefaultTool(platform);

        expect(tool.command).to.equal(EXPECTED_COMMANDS[platform]);
        expect(tool.name).to.equal('エクスプローラーで開く');
      }),
      { numRuns: 100 },
    );
  });

  it('未知のプラットフォームでもエラーを発生させずフォールバックコマンドを返す', function () {
    fc.assert(
      fc.property(unknownPlatformArb, (platform) => {
        const tool = getDefaultTool(platform);

        expect(tool.command).to.equal(DEFAULT_COMMAND);
        expect(tool.name).to.equal('エクスプローラーで開く');
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 1: 永続化判定の正確性
 *
 * 任意の ToolsConfigInspection に対して、shouldPromptForPersistence は
 * globalValue が undefined または空配列（要素数0）の場合にのみ true を返し、
 * globalValue が1件以上の要素を持つ配列の場合は false を返すこと。
 *
 * preworkの分析:
 * - 要件1.1（0件/未定義でダイアログ表示）、2.1（1件以上で表示しない）、
 *   2.2（再アクティベート時の冪等性）、2.3（判定条件の仕様）はすべて同一の判定ロジックに帰着する。
 * - globalValue が undefined（設定キー未定義）の場合と空配列の場合を区別せず、
 *   どちらも「永続化が必要」と判定する。
 * - 冪等性（2.2）は、書き込み後に globalValue が非空になることで自動的に false を返すため、
 *   このプロパティに包含される。
 *
 * **Validates: Requirements 1.1, 2.1, 2.2, 2.3**
 */
describe('Feature: default-tool-persistence, Property 1: 永続化判定の正確性', function () {
  /** ToolDefinition を生成するArbitrary */
  const toolDefinitionArb: fc.Arbitrary<ToolDefinition> = fc.record({
    name: fc.stringMatching(/^[a-zA-Z0-9 _.\-]+$/).filter((s) => s.trim().length > 0),
    command: fc.stringMatching(/^[a-zA-Z0-9 _./\\${}()\-]+$/).filter((s) => s.trim().length > 0),
  });

  /** globalValue が undefined の ToolsConfigInspection を生成するArbitrary */
  const undefinedInspectionArb: fc.Arbitrary<ToolsConfigInspection> = fc.constant({
    globalValue: undefined,
  });

  /** globalValue が空配列の ToolsConfigInspection を生成するArbitrary */
  const emptyArrayInspectionArb: fc.Arbitrary<ToolsConfigInspection> = fc.constant({
    globalValue: [],
  });

  /** globalValue が1件以上の配列を持つ ToolsConfigInspection を生成するArbitrary */
  const nonEmptyArrayInspectionArb: fc.Arbitrary<ToolsConfigInspection> = fc
    .array(toolDefinitionArb, { minLength: 1, maxLength: 10 })
    .map((tools) => ({ globalValue: tools }));

  /** 永続化が必要な ToolsConfigInspection（undefined または空配列）を生成するArbitrary */
  const needsPersistenceArb: fc.Arbitrary<ToolsConfigInspection> = fc.oneof(
    undefinedInspectionArb,
    emptyArrayInspectionArb,
  );

  /** 任意の ToolsConfigInspection を生成するArbitrary */
  const anyInspectionArb: fc.Arbitrary<ToolsConfigInspection> = fc.oneof(
    undefinedInspectionArb,
    emptyArrayInspectionArb,
    nonEmptyArrayInspectionArb,
  );

  it('globalValue が undefined または空配列の場合、true を返す', function () {
    fc.assert(
      fc.property(needsPersistenceArb, (inspection) => {
        const result = shouldPromptForPersistence(inspection);
        expect(result).to.equal(true);
      }),
      { numRuns: 100 },
    );
  });

  it('globalValue が1件以上の要素を持つ配列の場合、false を返す', function () {
    fc.assert(
      fc.property(nonEmptyArrayInspectionArb, (inspection) => {
        const result = shouldPromptForPersistence(inspection);
        expect(result).to.equal(false);
      }),
      { numRuns: 100 },
    );
  });

  it('任意の ToolsConfigInspection に対して、返り値は globalValue の状態と一致する', function () {
    fc.assert(
      fc.property(anyInspectionArb, (inspection) => {
        const result = shouldPromptForPersistence(inspection);

        // 期待値: globalValue が undefined または空配列なら true、それ以外は false
        const expected =
          inspection.globalValue === undefined || inspection.globalValue.length === 0;

        expect(result).to.equal(expected);
      }),
      { numRuns: 100 },
    );
  });
});


import { DefaultToolPersistenceService } from '../../defaultToolPersistenceService';
import * as vscode from 'vscode';

/**
 * Property 2: 書き込み内容と getDefaultTool の一致性
 *
 * 任意のOSプラットフォーム文字列に対して、settings.json に書き込まれるデフォルトツール定義は
 * getDefaultTool(platform) の返り値と完全に一致すること。
 * すなわち、永続化される内容とメモリ上のフォールバックで使用される内容が同一であること。
 *
 * preworkの分析:
 * - 要件1.2（「はい」で書き込み）と要件3.1〜3.5（OS別コマンド）を組み合わせると、
 *   書き込まれる内容が getDefaultTool の出力と一致することが重要。
 * - これにより、「はい」を選んで永続化した場合と「いいえ」を選んでメモリフォールバックした場合で、
 *   ユーザーが得るツール定義が同一であることを保証する。
 *
 * **Validates: Requirements 1.2, 3.1, 3.2, 3.3, 3.4, 3.5**
 */
describe('Feature: default-tool-persistence, Property 2: 書き込み内容と getDefaultTool の一致性', function () {
  /** サポート対象プラットフォームを生成するArbitrary */
  const supportedPlatformArb: fc.Arbitrary<string> = fc.oneof(
    fc.constant('win32'),
    fc.constant('darwin'),
    fc.constant('linux'),
  );

  /** 未知のプラットフォーム文字列を生成するArbitrary */
  const unknownPlatformArb: fc.Arbitrary<string> = fc
    .stringMatching(/^[a-zA-Z0-9_-]+$/)
    .filter((s) => s.length > 0 && !['win32', 'darwin', 'linux'].includes(s));

  /** サポート対象 + 未知のプラットフォームを混合して生成するArbitrary */
  const anyPlatformArb: fc.Arbitrary<string> = fc.oneof(
    supportedPlatformArb,
    unknownPlatformArb,
  );

  /** config.update() に渡された値をキャプチャする変数 */
  let capturedTools: ToolDefinition[] | undefined;

  /** VSCode APIモックの元の状態を保持 */
  let originalGetConfiguration: typeof vscode.workspace.getConfiguration;
  let originalShowInformationMessage: typeof vscode.window.showInformationMessage;

  before(function () {
    // 元のモック関数を保存
    originalGetConfiguration = vscode.workspace.getConfiguration;
    originalShowInformationMessage = vscode.window.showInformationMessage;

    // getConfiguration をオーバーライド: inspect() は globalValue: undefined を返し、
    // update() は書き込み値をキャプチャする
    (vscode.workspace as any).getConfiguration = (_section: string) => ({
      inspect: (_key: string) => ({
        globalValue: undefined,
      }),
      update: async (_key: string, value: any, _target: any) => {
        capturedTools = value;
      },
    });

    // 「はい」を選択したことをシミュレート
    (vscode.window as any).showInformationMessage = async () => 'はい';
  });

  after(function () {
    // モックを元に戻す
    (vscode.workspace as any).getConfiguration = originalGetConfiguration;
    (vscode.window as any).showInformationMessage = originalShowInformationMessage;
  });

  beforeEach(function () {
    // 各イテレーション前にキャプチャをリセット
    capturedTools = undefined;
  });

  it('「はい」選択時に config.update() に渡される値が getDefaultTool(platform) と一致する', async function () {
    await fc.assert(
      fc.asyncProperty(anyPlatformArb, async (platform) => {
        // キャプチャをリセット
        capturedTools = undefined;

        const service = new DefaultToolPersistenceService();
        const result = await service.resolveTools(platform);
        const expectedTool = getDefaultTool(platform);

        // config.update() に渡された値が [getDefaultTool(platform)] と一致すること
        expect(capturedTools).to.not.be.undefined;
        expect(capturedTools).to.have.lengthOf(1);
        expect(capturedTools![0].name).to.equal(expectedTool.name);
        expect(capturedTools![0].command).to.equal(expectedTool.command);

        // resolveTools の返り値も getDefaultTool(platform) と一致すること
        expect(result).to.have.lengthOf(1);
        expect(result[0].name).to.equal(expectedTool.name);
        expect(result[0].command).to.equal(expectedTool.command);
      }),
      { numRuns: 100 },
    );
  });
});
