import { expect } from 'chai';
import * as fc from 'fast-check';
import { ToolDefinition } from '../../types';
import { getDefaultTool, getToolsWithDefault, OS_COMMAND_MAP, DEFAULT_COMMAND } from '../../defaultToolProvider';

/**
 * Property 1: デフォルトツールの条件付き追加
 *
 * 任意のツール定義リストに対して、リストが空（0件）の場合はデフォルトツールが1件追加され、
 * そのツールの表示名が「エクスプローラーで開く」であること。
 * リストが1件以上の場合はデフォルトツールが追加されず、元のリストがそのまま返されること。
 *
 * **Validates: Requirements 3.1, 3.2, 3.6**
 */
describe('Feature: open-settings-json, Property 1: デフォルトツールの条件付き追加', function () {
  /** ToolDefinition を生成するArbitrary */
  const toolDefinitionArb: fc.Arbitrary<ToolDefinition> = fc
    .record({
      name: fc.stringMatching(/^[a-zA-Z0-9 _.-]+$/).filter((s) => s.trim().length > 0),
      command: fc.stringMatching(/^[a-zA-Z0-9 _./\\${}()-]+$/).filter((s) => s.trim().length > 0),
    });

  /** プラットフォーム文字列を生成するArbitrary */
  const platformArb: fc.Arbitrary<string> = fc.oneof(
    fc.constant('win32'),
    fc.constant('darwin'),
    fc.constant('linux'),
  );

  it('ツール定義が0件の場合、デフォルトツールが1件追加され表示名が「エクスプローラーで開く」である', function () {
    fc.assert(
      fc.property(platformArb, (platform) => {
        const result = getToolsWithDefault([], platform);

        expect(result).to.have.lengthOf(1);
        expect(result[0].name).to.equal('エクスプローラーで開く');
      }),
      { numRuns: 100 },
    );
  });

  it('ツール定義が1件以上の場合、デフォルトツールが追加されず元のリストがそのまま返される', function () {
    fc.assert(
      fc.property(
        fc.array(toolDefinitionArb, { minLength: 1, maxLength: 10 }),
        platformArb,
        (tools, platform) => {
          const result = getToolsWithDefault(tools, platform);

          // 元のリストと同じ長さであること
          expect(result).to.have.lengthOf(tools.length);
          // 元のリストと同じ参照であること
          expect(result).to.equal(tools);
        },
      ),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 2: OSプラットフォームとデフォルトコマンドの正しい対応
 *
 * サポート対象3種（win32, darwin, linux）+ 未知の文字列を生成し、
 * 正しいコマンドが返されることを検証する。
 * 未知のプラットフォームでもエラーを発生させずフォールバックコマンドを返すことを検証する。
 *
 * **Validates: Requirements 3.3, 3.4, 3.5**
 */
describe('Feature: open-settings-json, Property 2: OSプラットフォームとデフォルトコマンドの正しい対応', function () {
  /** サポート対象プラットフォームとその期待コマンド */
  const EXPECTED_COMMANDS: Record<string, string> = {
    win32: 'explorer ${dir}',
    darwin: 'open ${dir}',
    linux: 'xdg-open ${dir}',
  };

  /** サポート対象プラットフォームを生成するArbitrary */
  const supportedPlatformArb: fc.Arbitrary<string> = fc.oneof(
    fc.constant('win32'),
    fc.constant('darwin'),
    fc.constant('linux'),
  );

  /** 未知のプラットフォーム文字列を生成するArbitrary */
  const unknownPlatformArb: fc.Arbitrary<string> = fc
    .stringMatching(/^[a-zA-Z0-9_-]+$/)
    .filter((s) => s.length > 0 && !['win32', 'darwin', 'linux'].includes(s));

  it('サポート対象プラットフォームに対して正しいコマンドが返される', function () {
    fc.assert(
      fc.property(supportedPlatformArb, (platform) => {
        const tool = getDefaultTool(platform);

        expect(tool.command).to.equal(EXPECTED_COMMANDS[platform]);
        expect(tool.name).to.equal('エクスプローラーで開く');
      }),
      { numRuns: 100 },
    );
  });

  it('未知のプラットフォームでもエラーを発生させずフォールバックコマンドを返す', function () {
    fc.assert(
      fc.property(unknownPlatformArb, (platform) => {
        const tool = getDefaultTool(platform);

        expect(tool.command).to.equal(DEFAULT_COMMAND);
        expect(tool.name).to.equal('エクスプローラーで開く');
      }),
      { numRuns: 100 },
    );
  });
});
