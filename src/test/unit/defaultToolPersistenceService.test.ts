import { expect } from 'chai';
import * as vscode from 'vscode';
import { DefaultToolPersistenceService } from '../../defaultToolPersistenceService';
import { getToolsWithDefault } from '../../defaultToolProvider';

/**
 * DefaultToolPersistenceService のユニットテスト
 * VSCode APIのモックを使用して、確認ダイアログと settings.json 書き込みの動作を検証する。
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.2
 */
describe('DefaultToolPersistenceService', () => {
  /** VSCode APIモックの元の状態を保持 */
  let originalGetConfiguration: typeof vscode.workspace.getConfiguration;
  let originalShowInformationMessage: typeof vscode.window.showInformationMessage;
  let originalShowErrorMessage: typeof vscode.window.showErrorMessage;

  /** config.update() の呼び出しを追跡する */
  let updateCalls: { key: string; value: any; target: any }[];

  /** showErrorMessage の呼び出しを追跡する */
  let errorMessages: string[];

  /** openSettingsFn の呼び出し回数を追跡する */
  let openSettingsCalls: number;

  /** openSettingsFn のモック関数 */
  const mockOpenSettings = async () => { openSettingsCalls++; };

  before(() => {
    // 元のモック関数を保存
    originalGetConfiguration = vscode.workspace.getConfiguration;
    originalShowInformationMessage = vscode.window.showInformationMessage;
    originalShowErrorMessage = vscode.window.showErrorMessage;
  });

  after(() => {
    // モックを元に戻す
    (vscode.workspace as any).getConfiguration = originalGetConfiguration;
    (vscode.window as any).showInformationMessage = originalShowInformationMessage;
    (vscode.window as any).showErrorMessage = originalShowErrorMessage;
  });

  beforeEach(() => {
    updateCalls = [];
    errorMessages = [];
    openSettingsCalls = 0;

    // showErrorMessage のモック: 呼び出しを記録
    (vscode.window as any).showErrorMessage = (message: string) => {
      errorMessages.push(message);
    };
  });

  /**
   * ヘルパー: getConfiguration モックをセットアップする
   * @param globalValue - inspect() が返す globalValue
   * @param updateBehavior - update() の動作（デフォルトは成功）
   */
  function setupConfigMock(
    globalValue: any,
    updateBehavior: 'success' | 'fail' = 'success',
  ) {
    (vscode.workspace as any).getConfiguration = (_section: string) => ({
      inspect: (_key: string) => ({ globalValue }),
      update: async (key: string, value: any, target: any) => {
        updateCalls.push({ key, value, target });
        if (updateBehavior === 'fail') {
          throw new Error('書き込みに失敗しました');
        }
      },
    });
  }

  // Requirements 1.2, 1.3: 「はい」選択時に config.update() が ConfigurationTarget.Global で呼ばれること
  describe('「はい」選択時', () => {
    beforeEach(() => {
      setupConfigMock(undefined, 'success');
      (vscode.window as any).showInformationMessage = async () => 'はい';
    });

    it('config.update() が ConfigurationTarget.Global で呼ばれる', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      await service.resolveTools('win32');

      expect(updateCalls).to.have.lengthOf(1);
      expect(updateCalls[0].key).to.equal('tools');
      expect(updateCalls[0].target).to.equal(vscode.ConfigurationTarget.Global);
    });

    // Requirements 1.1, 1.2: 書き込み成功後に openSettingsFn が呼ばれること
    it('書き込み成功後に openSettingsFn が呼ばれる', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      await service.resolveTools('win32');

      expect(openSettingsCalls).to.equal(1);
    });

    // Requirements 2.2: 書き込み成功後の返り値が空配列であること
    it('書き込み成功後に空配列が返される', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      const result = await service.resolveTools('win32');

      expect(result).to.deep.equal([]);
    });
  });

  // Requirements 1.5: 「いいえ」選択時に書き込みが行われず、メモリデフォルトが返されること
  describe('「いいえ」選択時', () => {
    beforeEach(() => {
      setupConfigMock(undefined, 'success');
      (vscode.window as any).showInformationMessage = async () => 'いいえ';
    });

    it('config.update() が呼ばれない', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      await service.resolveTools('darwin');

      expect(updateCalls).to.have.lengthOf(0);
    });

    it('メモリ上のデフォルトツールが返される', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      const result = await service.resolveTools('darwin');

      const expected = getToolsWithDefault([], 'darwin');
      expect(result).to.deep.equal(expected);
    });

    // Requirements 1.3: 「いいえ」選択時に openSettingsFn が呼ばれないこと
    it('openSettingsFn が呼ばれない', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      await service.resolveTools('darwin');

      expect(openSettingsCalls).to.equal(0);
    });
  });

  // Requirements 1.6: ダイアログ閉じ（undefined）時に「いいえ」と同じ動作をすること
  describe('ダイアログ閉じ（undefined）時', () => {
    beforeEach(() => {
      setupConfigMock(undefined, 'success');
      // Escキー等でダイアログを閉じた場合、showInformationMessage は undefined を返す
      (vscode.window as any).showInformationMessage = async () => undefined;
    });

    it('config.update() が呼ばれない', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      await service.resolveTools('linux');

      expect(updateCalls).to.have.lengthOf(0);
    });

    it('メモリ上のデフォルトツールが返される', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      const result = await service.resolveTools('linux');

      const expected = getToolsWithDefault([], 'linux');
      expect(result).to.deep.equal(expected);
    });

    // Requirements 1.4: ダイアログ閉じ時に openSettingsFn が呼ばれないこと
    it('openSettingsFn が呼ばれない', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      await service.resolveTools('linux');

      expect(openSettingsCalls).to.equal(0);
    });
  });

  // Requirements 1.7: 書き込み失敗時にエラーメッセージが表示され、メモリデフォルトが返されること
  describe('書き込み失敗時', () => {
    beforeEach(() => {
      setupConfigMock(undefined, 'fail');
      (vscode.window as any).showInformationMessage = async () => 'はい';
    });

    it('エラーメッセージが表示される', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      await service.resolveTools('win32');

      expect(errorMessages).to.have.lengthOf(1);
      expect(errorMessages[0]).to.include('書き込みに失敗しました');
    });

    it('メモリ上のデフォルトツールがフォールバックとして返される', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      const result = await service.resolveTools('win32');

      const expected = getToolsWithDefault([], 'win32');
      expect(result).to.deep.equal(expected);
    });

    // Requirements 1.5: 書き込み失敗時に openSettingsFn が呼ばれないこと
    it('openSettingsFn が呼ばれない', async () => {
      const service = new DefaultToolPersistenceService(mockOpenSettings);
      await service.resolveTools('win32');

      expect(openSettingsCalls).to.equal(0);
    });
  });
});
