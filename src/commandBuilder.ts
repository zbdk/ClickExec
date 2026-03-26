import { PlaceholderResolver } from './placeholderResolver';
import { ToolDefinition, PlaceholderContext, ExecutionCommand } from './types';

/** cwdが未指定の場合に使用するデフォルトのテンプレート */
const DEFAULT_CWD_TEMPLATE = '${workspaceFolder}';

/** CommandBuilder.build() の戻り値 */
export interface BuildResult {
  /** 実行用コマンド情報 */
  executionCommand: ExecutionCommand;
  /** プレースホルダー解決時の警告リスト */
  warnings: string[];
}

/**
 * プレースホルダー解決済みのコマンドと作業ディレクトリを構築するビルダー。
 * PlaceholderResolverを使ってコマンド文字列とcwdのプレースホルダーを解決し、
 * ExecutionCommandを生成する。
 */
export class CommandBuilder {
  constructor(private resolver: PlaceholderResolver) {}

  /**
   * ツール定義とコンテキストからExecutionCommandを構築する。
   * - コマンド文字列のプレースホルダーを解決する
   * - cwdが指定されていればそのプレースホルダーを解決する
   * - cwdが未指定の場合は ${workspaceFolder} をデフォルトとして解決する
   * - プレースホルダー解決に失敗した場合はエラーをスローする
   */
  build(tool: ToolDefinition, context: PlaceholderContext): BuildResult {
    // コマンド文字列のプレースホルダーを解決
    const commandResult = this.resolver.resolve(tool.command, context);

    // cwdのプレースホルダーを解決（未指定時は ${workspaceFolder} をデフォルトとする）
    const cwdTemplate = tool.cwd ?? DEFAULT_CWD_TEMPLATE;
    const cwdResult = this.resolver.resolve(cwdTemplate, context);

    // コマンドとcwdの両方の警告をマージ
    const warnings = [...commandResult.warnings, ...cwdResult.warnings];

    return {
      executionCommand: {
        command: commandResult.resolved,
        cwd: cwdResult.resolved,
        toolName: tool.name,
      },
      warnings,
    };
  }
}
