import { expect } from 'chai';
import { getDefaultTool, getToolsWithDefault, OS_COMMAND_MAP, DEFAULT_COMMAND, shouldPromptForPersistence } from '../../defaultToolProvider';
import { ToolDefinition } from '../../types';

/**
 * DefaultToolProvider のユニットテスト
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
describe('DefaultToolProvider', () => {
  describe('getDefaultTool', () => {
    // Requirements 3.3: Windowsの場合 explorer ${dir}
    it('Windowsの場合、explorer ${dir} コマンドを返す', () => {
      const tool = getDefaultTool('win32');
      expect(tool.command).to.equal('explorer ${dir}');
      expect(tool.name).to.equal('エクスプローラーで開く');
    });

    // Requirements 3.4: macOSの場合 open ${dir}
    it('macOSの場合、open ${dir} コマンドを返す', () => {
      const tool = getDefaultTool('darwin');
      expect(tool.command).to.equal('open ${dir}');
      expect(tool.name).to.equal('エクスプローラーで開く');
    });

    // Requirements 3.5: Linuxの場合 xdg-open ${dir}
    it('Linuxの場合、xdg-open ${dir} コマンドを返す', () => {
      const tool = getDefaultTool('linux');
      expect(tool.command).to.equal('xdg-open ${dir}');
      expect(tool.name).to.equal('エクスプローラーで開く');
    });

    // 未知のOSに対するフォールバック
    it('未知のOSの場合、xdg-open ${dir} にフォールバックする', () => {
      const tool = getDefaultTool('freebsd');
      expect(tool.command).to.equal(DEFAULT_COMMAND);
      expect(tool.name).to.equal('エクスプローラーで開く');
    });

    it('空文字列のプラットフォームでもフォールバックする', () => {
      const tool = getDefaultTool('');
      expect(tool.command).to.equal(DEFAULT_COMMAND);
    });
  });

  describe('getToolsWithDefault', () => {
    // Requirements 3.1, 3.6: ツール定義が0件の場合デフォルトツールを追加
    it('ツール定義が0件の場合、デフォルトツールを1件含む配列を返す', () => {
      const result = getToolsWithDefault([], 'win32');
      expect(result).to.have.lengthOf(1);
      expect(result[0].name).to.equal('エクスプローラーで開く');
      expect(result[0].command).to.equal('explorer ${dir}');
    });

    // Requirements 3.6: 1件以上の場合はそのまま返す
    it('ツール定義が1件以上の場合、元のリストをそのまま返す', () => {
      const tools: ToolDefinition[] = [
        { name: 'テストツール', command: 'echo test' },
      ];
      const result = getToolsWithDefault(tools, 'win32');
      expect(result).to.equal(tools);
      expect(result).to.have.lengthOf(1);
    });

    // Requirements 3.7: settings.json に書き込まない（メモリ上のみ）
    it('複数のツール定義がある場合、元のリストを変更しない', () => {
      const tools: ToolDefinition[] = [
        { name: 'ツール1', command: 'cmd1' },
        { name: 'ツール2', command: 'cmd2' },
      ];
      const original = [...tools];
      const result = getToolsWithDefault(tools, 'darwin');
      expect(result).to.deep.equal(original);
    });
  });

  /**
   * shouldPromptForPersistence のユニットテスト
   * 永続化確認ダイアログの表示判定ロジックを検証する
   * Requirements: 1.1, 2.1, 2.3
   */
  describe('shouldPromptForPersistence', () => {
    // Requirements 1.1, 2.3: globalValue が undefined（設定キー未定義）の場合、永続化が必要
    it('globalValue が undefined の場合、true を返す', () => {
      const result = shouldPromptForPersistence({ globalValue: undefined });
      expect(result).to.be.true;
    });

    // Requirements 1.1, 2.3: globalValue が空配列（要素数0）の場合、永続化が必要
    it('globalValue が空配列の場合、true を返す', () => {
      const result = shouldPromptForPersistence({ globalValue: [] });
      expect(result).to.be.true;
    });

    // Requirements 2.1: globalValue が1件以上の要素を持つ場合、永続化不要
    it('globalValue が1件以上の要素を持つ場合、false を返す', () => {
      const result = shouldPromptForPersistence({
        globalValue: [{ name: 'test', command: 'test' }],
      });
      expect(result).to.be.false;
    });
  });
});
