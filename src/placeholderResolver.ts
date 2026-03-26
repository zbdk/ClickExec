import * as path from 'path';
import { PlaceholderContext, ResolveResult } from './types';

/** 既知のプレースホルダー名の一覧 */
const KNOWN_PLACEHOLDERS = [
  'file',
  'fileBasename',
  'fileBasenameNoExtension',
  'fileExtname',
  'dir',
  'workspaceFolder',
] as const;

/** プレースホルダーのパターン（${...} 形式） */
const PLACEHOLDER_PATTERN = /\$\{([^}]+)\}/g;

/**
 * コマンド文字列内のプレースホルダーを実際の値に置換するリゾルバ。
 * VSCode APIに依存しない純粋関数として実装し、テスタビリティを確保する。
 */
export class PlaceholderResolver {
  /**
   * コマンド文字列内のプレースホルダーを解決する。
   * - 既知のプレースホルダーは対応する値に置換する
   * - 既知のプレースホルダーの値が解決できない場合はエラーをスローする
   * - 未知のプレースホルダーは空文字列に置換し、警告リストに追加する
   */
  resolve(template: string, context: PlaceholderContext): ResolveResult {
    const warnings: string[] = [];

    // 既知プレースホルダーの解決マップを構築
    const resolveMap = this.buildResolveMap(context);

    // すべてのプレースホルダーを一括で処理
    const resolved = template.replace(PLACEHOLDER_PATTERN, (match, name: string) => {
      // 既知のプレースホルダーかチェック
      if (this.isKnownPlaceholder(name)) {
        const value = resolveMap.get(name);
        if (value === undefined) {
          // 既知だが値が解決できない場合はエラー
          throw new Error(this.getUnresolvableErrorMessage(name));
        }
        return value;
      }

      // 未知のプレースホルダーは空文字列に置換し、警告を追加
      warnings.push(
        `ClickExec: 未知のプレースホルダー '\${${name}}' は空文字列に置換されました`
      );
      return '';
    });

    return { resolved, warnings };
  }

  /**
   * コンテキストから既知プレースホルダーの解決マップを構築する。
   * フォルダコンテキストの場合、${file}と${dir}の両方をフォルダパスに解決する。
   */
  private buildResolveMap(context: PlaceholderContext): Map<string, string | undefined> {
    const map = new Map<string, string | undefined>();

    if (context.filePath !== undefined) {
      if (context.isFolder) {
        // フォルダコンテキスト: ${file}と${dir}の両方をフォルダパスに解決
        map.set('file', context.filePath);
        map.set('dir', context.filePath);
        map.set('fileBasename', path.basename(context.filePath));
        const ext = path.extname(context.filePath);
        map.set('fileBasenameNoExtension', path.basename(context.filePath, ext));
        map.set('fileExtname', ext);
      } else {
        // ファイルコンテキスト: 通常のパス操作で解決
        map.set('file', context.filePath);
        map.set('fileBasename', path.basename(context.filePath));
        const ext = path.extname(context.filePath);
        map.set('fileBasenameNoExtension', path.basename(context.filePath, ext));
        map.set('fileExtname', ext);
        map.set('dir', path.dirname(context.filePath));
      }
    }

    // workspaceFolderはfilePathとは独立して設定可能
    if (context.workspaceFolder !== undefined) {
      map.set('workspaceFolder', context.workspaceFolder);
    }

    return map;
  }

  /** 指定された名前が既知のプレースホルダーかどうかを判定する */
  private isKnownPlaceholder(name: string): boolean {
    return (KNOWN_PLACEHOLDERS as readonly string[]).includes(name);
  }

  /** 解決不能なプレースホルダーに対するエラーメッセージを生成する */
  private getUnresolvableErrorMessage(name: string): string {
    switch (name) {
      case 'workspaceFolder':
        return 'ClickExec: ワークスペースが開かれていないため ${workspaceFolder} を解決できません';
      case 'file':
      case 'fileBasename':
      case 'fileBasenameNoExtension':
      case 'fileExtname':
      case 'dir':
        return `ClickExec: ファイルが選択されていないため \${${name}} を解決できません`;
      default:
        return `ClickExec: プレースホルダー \${${name}} を解決できません`;
    }
  }
}
