import { ToolDefinition } from './types';

/** OS種別を表す型。process.platform の値のサブセット。 */
export type OsPlatform = 'win32' | 'darwin' | 'linux' | string;

/** OS別のデフォルトコマンドマッピング */
export const OS_COMMAND_MAP: Record<string, string> = {
  win32: 'explorer ${dir}',
  darwin: 'open ${dir}',
  linux: 'xdg-open ${dir}',
};

/** 未知のプラットフォーム用フォールバックコマンド */
export const DEFAULT_COMMAND = 'xdg-open ${dir}';

/**
 * 指定されたOSプラットフォームに対応するデフォルトツール定義を返す。
 * 未知のプラットフォームはLinuxと同じコマンドにフォールバックする。
 */
export function getDefaultTool(platform: OsPlatform): ToolDefinition {
  return {
    name: 'エクスプローラーで開く',
    command: Object.prototype.hasOwnProperty.call(OS_COMMAND_MAP, platform) ? OS_COMMAND_MAP[platform] : DEFAULT_COMMAND,
  };
}

/**
 * ユーザー定義ツールが0件の場合のみデフォルトツールを追加して返す。
 * 1件以上の場合はそのまま返す。
 */
export function getToolsWithDefault(userTools: ToolDefinition[], platform: OsPlatform): ToolDefinition[] {
  if (userTools.length === 0) {
    return [getDefaultTool(platform)];
  }
  return userTools;
}

/** settings.json の clickExec.tools 設定の検査結果 */
export interface ToolsConfigInspection {
  /** グローバル設定に値が存在するか（undefined = 未定義） */
  globalValue: ToolDefinition[] | undefined;
}

/**
 * デフォルトツールの永続化確認が必要かどうかを判定する純粋関数。
 * globalValue が undefined（設定キー未定義）または空配列の場合に true を返す。
 */
export function shouldPromptForPersistence(inspection: ToolsConfigInspection): boolean {
  return inspection.globalValue === undefined || inspection.globalValue.length === 0;
}
