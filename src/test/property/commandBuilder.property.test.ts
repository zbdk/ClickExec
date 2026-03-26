import { expect } from 'chai';
import * as fc from 'fast-check';
import { CommandBuilder, BuildResult } from '../../commandBuilder';
import { PlaceholderResolver } from '../../placeholderResolver';
import { ToolDefinition, PlaceholderContext } from '../../types';

/**
 * Property 5: cwdのプレースホルダー解決とデフォルト値
 *
 * 任意のToolDefinitionとPlaceholderContextに対して、cwdの解決結果が正しいことを検証する。
 * - cwdが指定されている場合はそのcwd文字列にプレースホルダー解決が適用された値が作業ディレクトリとなる
 * - cwdが未指定の場合は${workspaceFolder}の解決値が作業ディレクトリとなる
 * - cwdの値にプレースホルダーパターン（${...}）が残っていないこと
 *
 * **Validates: Requirements 6.4, 6.5**
 */
describe('Feature: vscode-external-tools, Property 5: cwdのプレースホルダー解決とデフォルト値', function () {
  const resolver = new PlaceholderResolver();
  const builder = new CommandBuilder(resolver);

  /** プレースホルダーパターン（${...} 形式） */
  const PLACEHOLDER_PATTERN = /\$\{[^}]+\}/;

  /**
   * 絶対パス風の文字列を生成するArbitrary
   * '/' で始まり、'${' を含まないパスを生成する
   */
  const absolutePathArb: fc.Arbitrary<string> = fc
    .tuple(
      fc.array(
        fc.stringMatching(/^[a-zA-Z0-9_.-]+$/).filter((s) => s.length > 0 && s.length <= 20),
        { minLength: 1, maxLength: 4 },
      ),
      fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter((s) => s.length > 0 && s.length <= 15),
      fc.constantFrom('.ts', '.js', '.py', '.txt', '.json', '.md'),
    )
    .map(([dirs, fileName, ext]) => '/' + dirs.join('/') + '/' + fileName + ext)
    .filter((p) => !p.includes('${'));

  /**
   * ワークスペースフォルダパスを生成するArbitrary
   * '/' で始まり、'${' を含まないパスを生成する
   */
  const workspaceFolderArb: fc.Arbitrary<string> = fc
    .array(
      fc.stringMatching(/^[a-zA-Z0-9_.-]+$/).filter((s) => s.length > 0 && s.length <= 20),
      { minLength: 1, maxLength: 3 },
    )
    .map((dirs) => '/' + dirs.join('/'))
    .filter((p) => !p.includes('${'));

  /**
   * 非空文字列を生成するArbitrary（ツール名・コマンド用）
   * '${' を含まない安全な文字列を生成する
   */
  const safeNonEmptyStringArb: fc.Arbitrary<string> = fc
    .stringMatching(/^[a-zA-Z0-9 _.-]+$/)
    .filter((s) => s.trim().length > 0 && !s.includes('${'));

  /** 既知プレースホルダーを含むcwd文字列を生成するArbitrary */
  const cwdWithPlaceholdersArb: fc.Arbitrary<string> = fc.oneof(
    fc.constant('${workspaceFolder}'),
    fc.constant('${dir}'),
    fc.constant('${workspaceFolder}/build'),
    fc.constant('${dir}/output'),
    // リテラルのみのcwd
    absolutePathArb,
  );

  /**
   * PlaceholderContextを生成するArbitrary
   * filePath と workspaceFolder の両方が '${' を含まない絶対パスであることを保証する
   */
  const contextArb: fc.Arbitrary<PlaceholderContext> = fc
    .tuple(absolutePathArb, workspaceFolderArb)
    .map(([filePath, workspaceFolder]) => ({
      filePath,
      workspaceFolder,
    }));

  it('cwdが指定されている場合、executionCommand.cwdはcwdのプレースホルダー解決値と一致する', function () {
    fc.assert(
      fc.property(
        safeNonEmptyStringArb,
        safeNonEmptyStringArb,
        cwdWithPlaceholdersArb,
        contextArb,
        (name, command, cwd, context) => {
          const tool: ToolDefinition = { name, command, cwd };
          const result: BuildResult = builder.build(tool, context);

          // cwdを直接PlaceholderResolverで解決した期待値を計算
          const expectedCwd = resolver.resolve(cwd, context);

          // CommandBuilderの結果がPlaceholderResolverの解決値と一致することを検証
          expect(result.executionCommand.cwd).to.equal(expectedCwd.resolved);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('cwdが未指定の場合、executionCommand.cwdはcontext.workspaceFolderと一致する', function () {
    fc.assert(
      fc.property(
        safeNonEmptyStringArb,
        safeNonEmptyStringArb,
        contextArb,
        (name, command, context) => {
          // cwdを指定しないToolDefinition
          const tool: ToolDefinition = { name, command };
          const result: BuildResult = builder.build(tool, context);

          // cwdが未指定の場合、${workspaceFolder}がデフォルトとして使用される
          expect(result.executionCommand.cwd).to.equal(context.workspaceFolder);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('cwdの解決結果にプレースホルダーパターン（${...}）が残っていない', function () {
    fc.assert(
      fc.property(
        safeNonEmptyStringArb,
        safeNonEmptyStringArb,
        fc.option(cwdWithPlaceholdersArb, { nil: undefined }),
        contextArb,
        (name, command, cwd, context) => {
          const tool: ToolDefinition = cwd !== undefined ? { name, command, cwd } : { name, command };
          const result: BuildResult = builder.build(tool, context);

          // 解決後のcwdにプレースホルダーパターンが残っていないことを検証
          expect(result.executionCommand.cwd).to.not.match(PLACEHOLDER_PATTERN);
        },
      ),
      { numRuns: 100 },
    );
  });
});
