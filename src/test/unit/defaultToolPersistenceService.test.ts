import { expect } from 'chai';
import * as vscode from 'vscode';
import { DefaultToolPersistenceService } from '../../defaultToolPersistenceService';
import { getDefaultTool, getToolsWithDefault } from '../../defaultToolProvider';

/**
 * DefaultToolPersistenceService のユニットテスト
 * VSCode APIのモックを使用して、確認ダイアログと settings.json 書き込みの動作を検証する。
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
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
      const service = new DefaultToolPersistenceService();
      await service.resolveTools('win32');

      expect(updateCalls).to.have.lengthOf(1);
      expect(updateCalls[0].key).to.equal('tools');
      expect(updateCalls[0].target).to.equal(vscode.ConfigurationTarget.Global);
    });

    // Requirements 1.4: 書き込み成功後に書き込んだツール定義が返されること
    it('書き込み成功後に書き込んだツール定義が返される', async () => {
      const service = new DefaultToolPersistenceService();
      const result = await service.resolveTools('win32');

      const expected = getDefaultTool('win32');
      expect(result).to.have.lengthOf(1);
      expect(result[0].name).to.equal(expected.name);
      expect(result[0].command).to.equal(expected.command);
    });
  });

  // Requirements 1.5: 「いいえ」選択時に書き込みが行われず、メモリデフォルトが返されること
  describe('「いいえ」選択時', () => {
    beforeEach(() => {
      setupConfigMock(undefined, 'success');
      (vscode.window as any).showInformationMessage = async () => 'いいえ';
    });

    it('config.update() が呼ばれない', async () => {
      const service = new DefaultToolPersistenceService();
      await service.resolveTools('darwin');

      expect(updateCalls).to.have.lengthOf(0);
    });

    it('メモリ上のデフォルトツールが返される', async () => {
      const service = new DefaultToolPersistenceService();
      const result = await service.resolveTools('darwin');

      const expected = getToolsWithDefault([], 'darwin');
      expect(result).to.deep.equal(expected);
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
      const service = new DefaultToolPersistenceService();
      await service.resolveTools('linux');

      expect(updateCalls).to.have.lengthOf(0);
    });

    it('メモリ上のデフォルトツールが返される', async () => {
      const service = new DefaultToolPersistenceService();
      const result = await service.resolveTools('linux');

      const expected = getToolsWithDefault([], 'linux');
      expect(result).to.deep.equal(expected);
    });
  });

  // Requirements 1.7: 書き込み失敗時にエラーメッセージが表示され、メモリデフォルトが返されること
  describe('書き込み失敗時', () => {
    beforeEach(() => {
      setupConfigMock(undefined, 'fail');
      (vscode.window as any).showInformationMessage = async () => 'はい';
    });

    it('エラーメッセージが表示される', async () => {
      const service = new DefaultToolPersistenceService();
      await service.resolveTools('win32');

      expect(errorMessages).to.have.lengthOf(1);
      expect(errorMessages[0]).to.include('書き込みに失敗しました');
    });

    it('メモリ上のデフォルトツールがフォールバックとして返される', async () => {
      const service = new DefaultToolPersistenceService();
      const result = await service.resolveTools('win32');

      const expected = getToolsWithDefault([], 'win32');
      expect(result).to.deep.equal(expected);
    });
  });
});
