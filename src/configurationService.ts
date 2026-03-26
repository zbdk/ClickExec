import * as vscode from 'vscode';
import { ToolDefinition } from './types';

/** バリデーション結果の型 */
export interface ValidationResult {
  /** 有効なツール定義の配列 */
  validTools: ToolDefinition[];
  /** スキップされた定義に対する警告メッセージの配列 */
  warnings: string[];
}

/**
 * ツール定義のバリデーションを行う純粋関数。
 * VSCode APIに依存しないため、単体テスト・プロパティテストが容易。
 * nameとcommandが非空文字列であるもののみを有効とし、それ以外はスキップして警告を生成する。
 */
export function validateTools(rawTools: unknown[]): ValidationResult {
  const validTools: ToolDefinition[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < rawTools.length; i++) {
    const item = rawTools[i];

    // オブジェクトでない場合はスキップ
    if (item === null || item === undefined || typeof item !== 'object' || Array.isArray(item)) {
      warnings.push(`ClickExec: ツール定義[${i}]はオブジェクトではないためスキップされました`);
      continue;
    }

    const obj = item as Record<string, unknown>;
    const name = obj['name'];
    const command = obj['command'];

    // nameが非空文字列であるかチェック
    const hasValidName = typeof name === 'string' && name.trim().length > 0;
    // commandが非空文字列であるかチェック
    const hasValidCommand = typeof command === 'string' && command.trim().length > 0;

    if (!hasValidName || !hasValidCommand) {
      const displayName = typeof name === 'string' && name.trim().length > 0 ? name : `index ${i}`;
      warnings.push(
        `ClickExec: ツール定義 '${displayName}' は name または command が未指定のためスキップされました`
      );
      continue;
    }

    // 有効なツール定義を構築
    const tool: ToolDefinition = {
      name: name as string,
      command: command as string,
    };

    // cwdが文字列の場合のみ設定
    if (typeof obj['cwd'] === 'string') {
      tool.cwd = obj['cwd'];
    }

    validTools.push(tool);
  }

  return { validTools, warnings };
}

/**
 * settings.jsonからツール定義を読み込み、バリデーション済みの配列を提供するサービス。
 * 設定変更の監視機能も提供する。
 */
export class ConfigurationService {
  /** settings.jsonからツール定義を読み込み、バリデーション済みの配列を返す */
  loadTools(): ToolDefinition[] {
    const config = vscode.workspace.getConfiguration('clickExec');
    const rawTools = config.get<unknown[]>('tools') ?? [];

    const { validTools, warnings } = validateTools(rawTools);

    // 警告メッセージを出力
    for (const warning of warnings) {
      vscode.window.showWarningMessage(warning);
    }

    return validTools;
  }

  /** 設定変更を監視し、clickExec.toolsが変更された場合にコールバックを呼び出す */
  onDidChangeTools(callback: (tools: ToolDefinition[]) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('clickExec.tools')) {
        const tools = this.loadTools();
        callback(tools);
      }
    });
  }
}
