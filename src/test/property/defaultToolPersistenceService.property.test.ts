import { expect } from 'chai';
import * as fc from 'fast-check';
import * as vscode from 'vscode';
import { DefaultToolPersistenceService } from '../../defaultToolPersistenceService';
import { getToolsWithDefault } from '../../defaultToolProvider';

/** サポート対象 + 未知のプラットフォームを混合して生成するArbitrary */
const supportedPlatformArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant('win32'),
  fc.constant('darwin'),
  fc.constant('linux'),
);

const unknownPlatformArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z0-9_-]+$/)
  .filter((s) => s.length > 0 && !['win32', 'darwin', 'linux'].includes(s));

const anyPlatformArb: fc.Arbitrary<string> = fc.oneof(
  supportedPlatformArb,
  unknownPlatformArb,
);

/**
 * Property 1: 書き込み成功時の空配列返却
 *
 * 任意のOSプラットフォーム文字列に対して、確認ダイアログで「はい」が選択され、
 * settings.json への書き込みが成功した場合、resolveTools() は空配列 [] を返すこと。
 * また、openSettingsFn が呼ばれること。
 *
 * **Validates: Requirements 1.1, 2.2**
 */
describe('Feature: open-settings-after-sample-add, Property 1: 書き込み成功時の空配列返却', function () {
  let originalGetConfiguration: typeof vscode.workspace.getConfiguration;
  let originalShowInformationMessage: typeof vscode.window.showInformationMessage;

  before(function () {
    originalGetConfiguration = vscode.workspace.getConfiguration;
    originalShowInformationMessage = vscode.window.showInformationMessage;

    // globalValue: undefined → shouldPromptForPersistence が true を返す
    (vscode.workspace as any).getConfiguration = (_section: string) => ({
      inspect: (_key: string) => ({ globalValue: undefined }),
      update: async (_key: string, _value: any, _target: any) => {
        // 書き込み成功をシミュレート
      },
    });

    // 「はい」を選択
    (vscode.window as any).showInformationMessage = async () => 'はい';
  });

  after(function () {
    (vscode.workspace as any).getConfiguration = originalGetConfiguration;
    (vscode.window as any).showInformationMessage = originalShowInformationMessage;
  });

  it('任意のプラットフォームで書き込み成功時に空配列を返し、openSettingsFn が呼ばれる', async function () {
    await fc.assert(
      fc.asyncProperty(anyPlatformArb, async (platform) => {
        let openSettingsCalled = false;
        const mockOpenSettings = async () => { openSettingsCalled = true; };

        const service = new DefaultToolPersistenceService(mockOpenSettings);
        const result = await service.resolveTools(platform);

        // 書き込み成功後は空配列が返される
        expect(result).to.deep.equal([]);
        // openSettingsFn が呼ばれる
        expect(openSettingsCalled).to.equal(true);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 2: 非確認時の非空配列返却と openSettings 非呼び出し
 *
 * 任意のOSプラットフォーム文字列に対して、確認ダイアログで「いいえ」が選択された場合、
 * またはダイアログが閉じられた場合（undefined）、resolveTools() は1件以上の要素を持つ配列を返し、
 * openSettings() は呼び出されないこと。
 *
 * **Validates: Requirements 1.3, 1.4**
 */
describe('Feature: open-settings-after-sample-add, Property 2: 非確認時の非空配列返却と openSettings 非呼び出し', function () {
  let originalGetConfiguration: typeof vscode.workspace.getConfiguration;
  let originalShowInformationMessage: typeof vscode.window.showInformationMessage;

  /** 非確認応答（「いいえ」または undefined）を生成するArbitrary */
  const nonConfirmResponseArb: fc.Arbitrary<string | undefined> = fc.oneof(
    fc.constant('いいえ' as string | undefined),
    fc.constant(undefined as string | undefined),
  );

  before(function () {
    originalGetConfiguration = vscode.workspace.getConfiguration;
    originalShowInformationMessage = vscode.window.showInformationMessage;

    // globalValue: undefined → shouldPromptForPersistence が true を返す
    (vscode.workspace as any).getConfiguration = (_section: string) => ({
      inspect: (_key: string) => ({ globalValue: undefined }),
      update: async (_key: string, _value: any, _target: any) => {},
    });
  });

  after(function () {
    (vscode.workspace as any).getConfiguration = originalGetConfiguration;
    (vscode.window as any).showInformationMessage = originalShowInformationMessage;
  });

  it('非確認応答時に非空配列を返し、openSettingsFn が呼ばれない', async function () {
    await fc.assert(
      fc.asyncProperty(anyPlatformArb, nonConfirmResponseArb, async (platform, response) => {
        // ダイアログの応答をモック
        (vscode.window as any).showInformationMessage = async () => response;

        let openSettingsCalled = false;
        const mockOpenSettings = async () => { openSettingsCalled = true; };

        const service = new DefaultToolPersistenceService(mockOpenSettings);
        const result = await service.resolveTools(platform);

        // 非空配列が返される（メモリフォールバック）
        expect(result).to.have.length.greaterThan(0);
        // getToolsWithDefault と一致する
        const expected = getToolsWithDefault([], platform);
        expect(result).to.deep.equal(expected);
        // openSettingsFn が呼ばれない
        expect(openSettingsCalled).to.equal(false);
      }),
      { numRuns: 100 },
    );
  });
});


import { selectAndRunTool } from '../../extension';
import { PlaceholderContext } from '../../types';
import { CommandBuilder } from '../../commandBuilder';
import { PlaceholderResolver } from '../../placeholderResolver';
import { TerminalManager } from '../../terminalManager';

/**
 * Property 3: 空配列時のクイックピック非表示
 *
 * 任意の PlaceholderContext を生成し、resolveTools() が空配列を返すモック環境で
 * selectAndRunTool を呼び出した際に showQuickPick が呼ばれないことを検証する。
 *
 * **Validates: Requirements 2.1**
 */
describe('Feature: open-settings-after-sample-add, Property 3: 空配列時のクイックピック非表示', function () {
  let originalShowQuickPick: typeof vscode.window.showQuickPick;

  before(function () {
    originalShowQuickPick = vscode.window.showQuickPick;
  });

  after(function () {
    (vscode.window as any).showQuickPick = originalShowQuickPick;
  });

  /** ランダムな PlaceholderContext を生成するArbitrary */
  const placeholderContextArb: fc.Arbitrary<PlaceholderContext> = fc.record({
    filePath: fc.option(fc.stringMatching(/^[a-zA-Z]:\\[a-zA-Z0-9_\\]+$/), { nil: undefined }),
    workspaceFolder: fc.option(fc.stringMatching(/^[a-zA-Z]:\\[a-zA-Z0-9_\\]+$/), { nil: undefined }),
    isFolder: fc.option(fc.boolean(), { nil: undefined }),
  });

  it('ツール定義が空配列で resolveTools も空配列を返す場合、showQuickPick が呼ばれない', async function () {
    await fc.assert(
      fc.asyncProperty(placeholderContextArb, async (context) => {
        let showQuickPickCalled = false;
        (vscode.window as any).showQuickPick = async () => {
          showQuickPickCalled = true;
          return undefined;
        };

        // resolveTools が空配列を返す persistenceService のモック
        const mockPersistenceService = {
          resolveTools: async () => [] as any[],
        } as unknown as DefaultToolPersistenceService;

        const resolver = new PlaceholderResolver();
        const commandBuilder = new CommandBuilder(resolver);
        const terminalManager = new TerminalManager();

        await selectAndRunTool(
          [],  // ツール定義が0件 → persistenceService.resolveTools が呼ばれる
          context,
          commandBuilder,
          terminalManager,
          mockPersistenceService,
        );

        // showQuickPick が呼ばれないこと
        expect(showQuickPickCalled).to.equal(false);

        terminalManager.dispose();
      }),
      { numRuns: 100 },
    );
  });
});
