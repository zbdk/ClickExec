import { expect } from 'chai';
import * as fc from 'fast-check';
import * as path from 'path';
import { PlaceholderResolver } from '../../placeholderResolver';
import { PlaceholderContext } from '../../types';

/**
 * Property 2: 既知プレースホルダーの正しい解決
 *
 * 任意のファイルパスとワークスペースフォルダパスに対して、各既知プレースホルダーが
 * 対応するパス操作の結果と一致する値に解決されることを検証する。
 * また、解決後の文字列に既知プレースホルダーのパターンが残っていないことを検証する。
 *
 * **Validates: Requirements 2.1, 2.2**
 */
describe('Feature: vscode-external-tools, Property 2: 既知プレースホルダーの正しい解決', function () {
  const resolver = new PlaceholderResolver();

  /** 既知プレースホルダーのパターン */
  const KNOWN_PLACEHOLDER_PATTERN = /\$\{(file|fileBasename|fileBasenameNoExtension|fileExtname|dir|workspaceFolder)\}/;

  /**
   * 絶対パス風の文字列を生成するArbitrary
   * '/' で始まり、'${' を含まないパスを生成する
   */
  const absolutePathArb: fc.Arbitrary<string> = fc
    .tuple(
      // ディレクトリ部分: 1〜4階層のパスセグメント
      fc.array(
        fc.stringMatching(/^[a-zA-Z0-9_.-]+$/).filter((s) => s.length > 0 && s.length <= 20),
        { minLength: 1, maxLength: 4 },
      ),
      // ファイル名部分: 拡張子付き
      fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter((s) => s.length > 0 && s.length <= 15),
      fc.constantFrom('.ts', '.js', '.py', '.txt', '.json', '.md', '.html', '.css', '.go', '.rs'),
    )
    .map(([dirs, fileName, ext]) => {
      return '/' + dirs.join('/') + '/' + fileName + ext;
    })
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

  it('${file} は context.filePath に解決される', function () {
    fc.assert(
      fc.property(absolutePathArb, workspaceFolderArb, (filePath, workspaceFolder) => {
        const context: PlaceholderContext = { filePath, workspaceFolder };
        const result = resolver.resolve('${file}', context);
        expect(result.resolved).to.equal(filePath);
      }),
      { numRuns: 100 },
    );
  });

  it('${fileBasename} は path.basename(context.filePath) に解決される', function () {
    fc.assert(
      fc.property(absolutePathArb, workspaceFolderArb, (filePath, workspaceFolder) => {
        const context: PlaceholderContext = { filePath, workspaceFolder };
        const result = resolver.resolve('${fileBasename}', context);
        expect(result.resolved).to.equal(path.posix.basename(filePath));
      }),
      { numRuns: 100 },
    );
  });

  it('${fileBasenameNoExtension} は path.basename(context.filePath, ext) に解決される', function () {
    fc.assert(
      fc.property(absolutePathArb, workspaceFolderArb, (filePath, workspaceFolder) => {
        const context: PlaceholderContext = { filePath, workspaceFolder };
        const ext = path.posix.extname(filePath);
        const result = resolver.resolve('${fileBasenameNoExtension}', context);
        expect(result.resolved).to.equal(path.posix.basename(filePath, ext));
      }),
      { numRuns: 100 },
    );
  });

  it('${fileExtname} は path.extname(context.filePath) に解決される', function () {
    fc.assert(
      fc.property(absolutePathArb, workspaceFolderArb, (filePath, workspaceFolder) => {
        const context: PlaceholderContext = { filePath, workspaceFolder };
        const result = resolver.resolve('${fileExtname}', context);
        expect(result.resolved).to.equal(path.posix.extname(filePath));
      }),
      { numRuns: 100 },
    );
  });

  it('${dir} は path.dirname(context.filePath) に解決される', function () {
    fc.assert(
      fc.property(absolutePathArb, workspaceFolderArb, (filePath, workspaceFolder) => {
        const context: PlaceholderContext = { filePath, workspaceFolder };
        const result = resolver.resolve('${dir}', context);
        expect(result.resolved).to.equal(path.posix.dirname(filePath));
      }),
      { numRuns: 100 },
    );
  });

  it('${workspaceFolder} は context.workspaceFolder に解決される', function () {
    fc.assert(
      fc.property(absolutePathArb, workspaceFolderArb, (filePath, workspaceFolder) => {
        const context: PlaceholderContext = { filePath, workspaceFolder };
        const result = resolver.resolve('${workspaceFolder}', context);
        expect(result.resolved).to.equal(workspaceFolder);
      }),
      { numRuns: 100 },
    );
  });

  it('解決後の文字列に既知プレースホルダーのパターンが残っていない', function () {
    fc.assert(
      fc.property(absolutePathArb, workspaceFolderArb, (filePath, workspaceFolder) => {
        const context: PlaceholderContext = { filePath, workspaceFolder };
        // すべての既知プレースホルダーを含むテンプレート
        const template =
          '${file} ${fileBasename} ${fileBasenameNoExtension} ${fileExtname} ${dir} ${workspaceFolder}';
        const result = resolver.resolve(template, context);
        // 解決後に既知プレースホルダーが残っていないことを検証
        expect(result.resolved).to.not.match(KNOWN_PLACEHOLDER_PATTERN);
        // 警告が生成されていないことを検証（すべて既知プレースホルダーのため）
        expect(result.warnings).to.have.lengthOf(0);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 3: 未知プレースホルダーの空文字列置換
 *
 * 任意の未知プレースホルダー名（既知の6種以外の ${...} パターン）を含むコマンド文字列に対して、
 * 解決後にそのプレースホルダーが空文字列に置換され、警告リストにそのプレースホルダー名が含まれることを検証する。
 *
 * **Validates: Requirements 2.3**
 */
describe('Feature: vscode-external-tools, Property 3: 未知プレースホルダーの空文字列置換', function () {
  const resolver = new PlaceholderResolver();

  /** 既知プレースホルダー名の集合（フィルタリング用） */
  const KNOWN_NAMES = new Set([
    'file',
    'fileBasename',
    'fileBasenameNoExtension',
    'fileExtname',
    'dir',
    'workspaceFolder',
  ]);

  /**
   * 未知プレースホルダー名を生成するArbitrary
   * 英数字のみで構成され、既知の6種のプレースホルダー名に一致しない文字列を生成する
   */
  const unknownPlaceholderNameArb: fc.Arbitrary<string> = fc
    .stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/)
    .filter((s) => s.length >= 1 && s.length <= 30 && !KNOWN_NAMES.has(s));

  /**
   * 絶対パス風の文字列を生成するArbitrary（コンテキスト用）
   */
  const absolutePathArb: fc.Arbitrary<string> = fc
    .tuple(
      fc.array(
        fc.stringMatching(/^[a-zA-Z0-9_.-]+$/).filter((s) => s.length > 0 && s.length <= 20),
        { minLength: 1, maxLength: 3 },
      ),
      fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter((s) => s.length > 0 && s.length <= 15),
      fc.constantFrom('.ts', '.js', '.py', '.txt', '.json'),
    )
    .map(([dirs, fileName, ext]) => '/' + dirs.join('/') + '/' + fileName + ext)
    .filter((p) => !p.includes('${'));

  /**
   * ワークスペースフォルダパスを生成するArbitrary（コンテキスト用）
   */
  const workspaceFolderArb: fc.Arbitrary<string> = fc
    .array(
      fc.stringMatching(/^[a-zA-Z0-9_.-]+$/).filter((s) => s.length > 0 && s.length <= 20),
      { minLength: 1, maxLength: 3 },
    )
    .map((dirs) => '/' + dirs.join('/'))
    .filter((p) => !p.includes('${'));

  it('未知プレースホルダーは空文字列に置換される', function () {
    fc.assert(
      fc.property(
        unknownPlaceholderNameArb,
        absolutePathArb,
        workspaceFolderArb,
        (unknownName, filePath, workspaceFolder) => {
          const context: PlaceholderContext = { filePath, workspaceFolder };
          const template = `echo \${${unknownName}}`;
          const result = resolver.resolve(template, context);

          // 未知プレースホルダーが空文字列に置換されていることを検証
          expect(result.resolved).to.equal('echo ');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('未知プレースホルダーに対して警告が生成される', function () {
    fc.assert(
      fc.property(
        unknownPlaceholderNameArb,
        absolutePathArb,
        workspaceFolderArb,
        (unknownName, filePath, workspaceFolder) => {
          const context: PlaceholderContext = { filePath, workspaceFolder };
          const template = `echo \${${unknownName}}`;
          const result = resolver.resolve(template, context);

          // 警告が1つ生成されていることを検証
          expect(result.warnings).to.have.lengthOf(1);
          // 警告メッセージに未知プレースホルダー名が含まれていることを検証
          expect(result.warnings[0]).to.include(unknownName);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('複数の未知プレースホルダーがすべて空文字列に置換され、それぞれ警告が生成される', function () {
    fc.assert(
      fc.property(
        unknownPlaceholderNameArb,
        unknownPlaceholderNameArb,
        absolutePathArb,
        workspaceFolderArb,
        (unknownName1, unknownName2, filePath, workspaceFolder) => {
          // 同じ名前の場合はスキップ（重複排除のため）
          fc.pre(unknownName1 !== unknownName2);

          const context: PlaceholderContext = { filePath, workspaceFolder };
          const template = `\${${unknownName1}} and \${${unknownName2}}`;
          const result = resolver.resolve(template, context);

          // 両方とも空文字列に置換されていることを検証
          expect(result.resolved).to.equal(' and ');
          // 警告が2つ生成されていることを検証
          expect(result.warnings).to.have.lengthOf(2);
          // 各警告にそれぞれのプレースホルダー名が含まれていることを検証
          const warningText = result.warnings.join(' ');
          expect(warningText).to.include(unknownName1);
          expect(warningText).to.include(unknownName2);
        },
      ),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 4: フォルダコンテキストでのプレースホルダー解決
 *
 * 任意のフォルダパスに対して、フォルダをコンテキストとしてプレースホルダーを解決した場合、
 * `${file}` と `${dir}` の両方がそのフォルダの絶対パスに解決されることを検証する。
 *
 * **Validates: Requirements 3.6**
 */
describe('Feature: vscode-external-tools, Property 4: フォルダコンテキストでのプレースホルダー解決', function () {
  const resolver = new PlaceholderResolver();

  /**
   * フォルダの絶対パスを生成するArbitrary
   * '/' で始まり、'${' を含まないパスを生成する
   */
  const folderPathArb: fc.Arbitrary<string> = fc
    .array(
      fc.stringMatching(/^[a-zA-Z0-9_.-]+$/).filter((s) => s.length > 0 && s.length <= 20),
      { minLength: 1, maxLength: 5 },
    )
    .map((segments) => '/' + segments.join('/'))
    .filter((p) => !p.includes('${'));

  /**
   * ワークスペースフォルダパスを生成するArbitrary
   */
  const workspaceFolderArb: fc.Arbitrary<string> = fc
    .array(
      fc.stringMatching(/^[a-zA-Z0-9_.-]+$/).filter((s) => s.length > 0 && s.length <= 20),
      { minLength: 1, maxLength: 3 },
    )
    .map((dirs) => '/' + dirs.join('/'))
    .filter((p) => !p.includes('${'));

  it('フォルダコンテキストで ${file} はフォルダパスに解決される', function () {
    fc.assert(
      fc.property(folderPathArb, workspaceFolderArb, (folderPath, workspaceFolder) => {
        const context: PlaceholderContext = {
          filePath: folderPath,
          workspaceFolder,
          isFolder: true,
        };
        const result = resolver.resolve('${file}', context);
        // ${file} がフォルダパスそのものに解決されることを検証
        expect(result.resolved).to.equal(folderPath);
      }),
      { numRuns: 100 },
    );
  });

  it('フォルダコンテキストで ${dir} はフォルダパスに解決される', function () {
    fc.assert(
      fc.property(folderPathArb, workspaceFolderArb, (folderPath, workspaceFolder) => {
        const context: PlaceholderContext = {
          filePath: folderPath,
          workspaceFolder,
          isFolder: true,
        };
        const result = resolver.resolve('${dir}', context);
        // ${dir} がフォルダパスそのものに解決されることを検証
        expect(result.resolved).to.equal(folderPath);
      }),
      { numRuns: 100 },
    );
  });

  it('フォルダコンテキストで ${file} と ${dir} は同じ値（フォルダパス）に解決される', function () {
    fc.assert(
      fc.property(folderPathArb, workspaceFolderArb, (folderPath, workspaceFolder) => {
        const context: PlaceholderContext = {
          filePath: folderPath,
          workspaceFolder,
          isFolder: true,
        };
        const fileResult = resolver.resolve('${file}', context);
        const dirResult = resolver.resolve('${dir}', context);
        // ${file} と ${dir} が同じ値に解決されることを検証
        expect(fileResult.resolved).to.equal(dirResult.resolved);
        // その値がフォルダパスであることを検証
        expect(fileResult.resolved).to.equal(folderPath);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 6: プレースホルダー解決のべき等性
 *
 * 任意のコマンド文字列とPlaceholderContextに対して、プレースホルダー解決を1回適用した結果と
 * 2回適用した結果が同一であること（解決済み文字列に新たなプレースホルダーパターンが生じないこと）を検証する。
 *
 * **Validates: Requirements 2.2**
 */
describe('Feature: vscode-external-tools, Property 6: プレースホルダー解決のべき等性', function () {
  const resolver = new PlaceholderResolver();

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

  /** 既知プレースホルダーのリスト */
  const KNOWN_PLACEHOLDERS = [
    '${file}',
    '${fileBasename}',
    '${fileBasenameNoExtension}',
    '${fileExtname}',
    '${dir}',
    '${workspaceFolder}',
  ];

  /**
   * リテラルテキストを生成するArbitrary
   * '${' を含まない安全な文字列を生成する
   */
  const literalTextArb: fc.Arbitrary<string> = fc
    .stringMatching(/^[a-zA-Z0-9 /._-]*$/)
    .filter((s) => !s.includes('${'));

  /**
   * コマンド文字列を生成するArbitrary
   * リテラルテキストと既知プレースホルダーを混合した文字列を生成する
   * '${' を含まないことを保証し、既知プレースホルダーのみを使用する
   */
  const commandTemplateArb: fc.Arbitrary<string> = fc
    .array(
      fc.oneof(
        // リテラルテキスト部分
        literalTextArb,
        // 既知プレースホルダー部分
        fc.constantFrom(...KNOWN_PLACEHOLDERS),
      ),
      { minLength: 1, maxLength: 6 },
    )
    .map((parts) => parts.join(''));

  it('1回の解決結果と2回の解決結果が同一である', function () {
    fc.assert(
      fc.property(
        commandTemplateArb,
        absolutePathArb,
        workspaceFolderArb,
        (template, filePath, workspaceFolder) => {
          const context: PlaceholderContext = { filePath, workspaceFolder };

          // 1回目の解決
          const firstResult = resolver.resolve(template, context);

          // 2回目の解決（1回目の結果に対して再度解決を適用）
          const secondResult = resolver.resolve(firstResult.resolved, context);

          // べき等性: 1回目と2回目の解決結果が同一であることを検証
          expect(secondResult.resolved).to.equal(firstResult.resolved);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('既知プレースホルダーのみを含むテンプレートでべき等性が成立する', function () {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_PLACEHOLDERS),
        absolutePathArb,
        workspaceFolderArb,
        (placeholder, filePath, workspaceFolder) => {
          const context: PlaceholderContext = { filePath, workspaceFolder };

          // 1回目の解決
          const firstResult = resolver.resolve(placeholder, context);

          // 2回目の解決
          const secondResult = resolver.resolve(firstResult.resolved, context);

          // べき等性の検証
          expect(secondResult.resolved).to.equal(firstResult.resolved);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('リテラルテキストと既知プレースホルダーの混合テンプレートでべき等性が成立する', function () {
    fc.assert(
      fc.property(
        literalTextArb,
        fc.constantFrom(...KNOWN_PLACEHOLDERS),
        literalTextArb,
        absolutePathArb,
        workspaceFolderArb,
        (prefix, placeholder, suffix, filePath, workspaceFolder) => {
          const context: PlaceholderContext = { filePath, workspaceFolder };
          const template = prefix + placeholder + suffix;

          // 1回目の解決
          const firstResult = resolver.resolve(template, context);

          // 2回目の解決
          const secondResult = resolver.resolve(firstResult.resolved, context);

          // べき等性の検証
          expect(secondResult.resolved).to.equal(firstResult.resolved);
        },
      ),
      { numRuns: 100 },
    );
  });
});
