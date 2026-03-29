import * as vscode from 'vscode';
import { ToolDefinition } from './types';
import {
  OsPlatform,
  getDefaultTool,
  getToolsWithDefault,
  shouldPromptForPersistence,
  ToolsConfigInspection,
} from './defaultToolProvider';
import { openSettings } from './settingsOpener';

/**
 * デフォルトツールの永続化を管理するサービス。
 * 確認ダイアログの表示、settings.json への書き込み、
 * 書き込み成功後の settings.json オープンを担当する。
 */
export class DefaultToolPersistenceService {
  private readonly openSettingsFn: () => Promise<void>;

  /**
   * @param openSettingsFn - settings.json を開く関数（デフォルト: settingsOpener.openSettings）
   */
  constructor(openSettingsFn: () => Promise<void> = openSettings) {
    this.openSettingsFn = openSettingsFn;
  }
  /**
   * デフォルトツールの永続化を試みる。
   * 1. clickExec.tools の状態を inspect() で確認
   * 2. 永続化が必要な場合、確認ダイアログを表示
   * 3. ユーザーが「はい」を選択した場合、settings.json に書き込み
   *
   * @param platform - OS種別（process.platform の値）
   * @returns 使用すべきツール定義の配列
   */
  async resolveTools(platform: OsPlatform): Promise<ToolDefinition[]> {
    const config = vscode.workspace.getConfiguration('clickExec');
    const inspected = config.inspect<ToolDefinition[]>('tools');

    // 検査結果を ToolsConfigInspection に変換
    const inspection: ToolsConfigInspection = {
      globalValue: inspected?.globalValue,
    };

    // 永続化が不要な場合は既存のツール定義を返す
    if (!shouldPromptForPersistence(inspection)) {
      return inspection.globalValue!;
    }

    // 確認ダイアログを表示
    const answer = await vscode.window.showInformationMessage(
      'ClickExec: サンプルコマンドを追加しますか？',
      'はい',
      'いいえ'
    );

    // 「はい」選択時: settings.json に書き込み
    if (answer === 'はい') {
      const defaultTools = [getDefaultTool(platform)];
      try {
        await config.update('tools', defaultTools, vscode.ConfigurationTarget.Global);
        // 書き込み成功後: settings.json を開き、空配列を返してクイックピック表示をスキップ
        await this.openSettingsFn();
        return [];
      } catch {
        // 書き込み失敗時: エラー表示 + メモリフォールバック
        vscode.window.showErrorMessage(
          'ClickExec: デフォルトツールの設定への書き込みに失敗しました'
        );
        return getToolsWithDefault([], platform);
      }
    }

    // 「いいえ」選択時またはダイアログを閉じた場合（undefined）: メモリフォールバック
    return getToolsWithDefault([], platform);
  }
}
