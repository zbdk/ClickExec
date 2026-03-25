/** ユーザーがsettings.jsonで定義する外部ツールの構成情報 */
export interface ToolDefinition {
  name: string;
  command: string;
  cwd?: string;
}

/** プレースホルダー解決に必要なコンテキスト情報 */
export interface PlaceholderContext {
  /** 対象ファイルの絶対パス（フォルダの場合はフォルダパス） */
  filePath?: string;
  /** ワークスペースルートの絶対パス */
  workspaceFolder?: string;
  /** フォルダコンテキストかどうか */
  isFolder?: boolean;
}

/** プレースホルダー解決の結果 */
export interface ResolveResult {
  /** 解決済みの文字列 */
  resolved: string;
  /** 未知のプレースホルダーに関する警告リスト */
  warnings: string[];
}

/** 実行用のコマンド情報 */
export interface ExecutionCommand {
  /** プレースホルダー解決済みのコマンド文字列 */
  command: string;
  /** 作業ディレクトリ */
  cwd: string;
  /** ツールの表示名（ターミナル名に使用） */
  toolName: string;
}
