import { expect } from 'chai';
import * as fc from 'fast-check';
import { validateTools, ValidationResult } from '../../configurationService';
import { ToolDefinition } from '../../types';

/**
 * Property 1: ツール定義のバリデーション — 有効な定義のみが返される
 *
 * 任意のオブジェクト配列に対して、nameとcommandの両方を持つオブジェクトのみが
 * 有効なToolDefinitionとして返され、それ以外はフィルタリングされることを検証する。
 *
 * **Validates: Requirements 1.2, 1.3**
 */
describe('Feature: vscode-external-tools, Property 1: ツール定義のバリデーション', function () {

  /**
   * 有効なツール定義を生成するArbitrary
   * nameとcommandが非空文字列であるオブジェクトを生成する
   */
  const validToolArb: fc.Arbitrary<Record<string, unknown>> = fc.record({
    name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    command: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    cwd: fc.option(fc.string(), { nil: undefined }),
  }).map((r) => {
    const obj: Record<string, unknown> = { name: r.name, command: r.command };
    if (r.cwd !== undefined) {
      obj['cwd'] = r.cwd;
    }
    return obj;
  });

  /**
   * 無効なツール定義を生成するArbitrary
   * nameまたはcommandが欠落・空文字列・非文字列であるオブジェクトを生成する
   */
  const invalidToolArb: fc.Arbitrary<unknown> = fc.oneof(
    // nameが欠落
    fc.record({ command: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0) }),
    // commandが欠落
    fc.record({ name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0) }),
    // nameが空文字列
    fc.record({
      name: fc.constant(''),
      command: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    }),
    // commandが空文字列
    fc.record({
      name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      command: fc.constant(''),
    }),
    // nameが空白のみ
    fc.record({
      name: fc.constant('   '),
      command: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    }),
    // commandが空白のみ
    fc.record({
      name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      command: fc.constant('   '),
    }),
    // nameが非文字列
    fc.record({
      name: fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
      command: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    }),
    // commandが非文字列
    fc.record({
      name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      command: fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
    }),
    // オブジェクトでない値
    fc.oneof(fc.integer(), fc.string(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
    // 配列（オブジェクトだがArray）
    fc.array(fc.anything()),
  );

  /**
   * 有効・無効な定義を混在させた配列を生成するArbitrary
   */
  const mixedToolsArb: fc.Arbitrary<{ items: unknown[]; validCount: number; invalidCount: number }> =
    fc.tuple(
      fc.array(validToolArb, { minLength: 0, maxLength: 10 }),
      fc.array(invalidToolArb, { minLength: 0, maxLength: 10 }),
    ).chain(([validItems, invalidItems]) => {
      // 有効・無効をシャッフルして混在させる
      const allItems: { item: unknown; isValid: boolean }[] = [
        ...validItems.map((item) => ({ item, isValid: true })),
        ...invalidItems.map((item) => ({ item, isValid: false })),
      ];
      return fc.shuffledSubarray(allItems, { minLength: allItems.length, maxLength: allItems.length }).map(
        (shuffled) => ({
          items: shuffled.map((s) => s.item),
          validCount: validItems.length,
          invalidCount: invalidItems.length,
        }),
      );
    });

  it('有効な定義のみが返され、無効な定義はフィルタリングされる', function () {
    fc.assert(
      fc.property(mixedToolsArb, ({ items, validCount, invalidCount }) => {
        const result: ValidationResult = validateTools(items);

        // 返されるツール数は有効な定義の数と一致する
        expect(result.validTools).to.have.lengthOf(validCount);

        // 警告数はフィルタリングされた（無効な）定義の数と一致する
        expect(result.warnings).to.have.lengthOf(invalidCount);

        // 返されたすべてのツールがnameとcommandを持つ
        for (const tool of result.validTools) {
          expect(tool.name).to.be.a('string');
          expect(tool.name.trim()).to.not.equal('');
          expect(tool.command).to.be.a('string');
          expect(tool.command.trim()).to.not.equal('');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('すべて有効な定義の場合、警告は0件で全定義が返される', function () {
    fc.assert(
      fc.property(fc.array(validToolArb, { minLength: 1, maxLength: 20 }), (items) => {
        const result: ValidationResult = validateTools(items);

        expect(result.validTools).to.have.lengthOf(items.length);
        expect(result.warnings).to.have.lengthOf(0);
      }),
      { numRuns: 100 },
    );
  });

  it('すべて無効な定義の場合、有効なツールは0件で警告が全件生成される', function () {
    fc.assert(
      fc.property(fc.array(invalidToolArb, { minLength: 1, maxLength: 20 }), (items) => {
        const result: ValidationResult = validateTools(items);

        expect(result.validTools).to.have.lengthOf(0);
        expect(result.warnings).to.have.lengthOf(items.length);
      }),
      { numRuns: 100 },
    );
  });

  it('空配列の場合、有効なツールも警告も0件', function () {
    const result: ValidationResult = validateTools([]);
    expect(result.validTools).to.have.lengthOf(0);
    expect(result.warnings).to.have.lengthOf(0);
  });
});
