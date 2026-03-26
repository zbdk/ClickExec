# 技術スタック

## ランタイム・フレームワーク

- VSCode Extension API（`vscode` ^1.85.0）
- TypeScript 5.3+
- Node.js（CommonJS モジュール、ES2020ターゲット）

## テスト

- Mocha + Chai（ユニットテスト・統合テスト）
- fast-check（プロパティベーステスト）
- @vscode/test-electron（VSCode統合テスト）

## ビルド・実行コマンド

| コマンド | 説明 |
|---|---|
| `npm run compile` | TypeScriptコンパイル（`tsc -p ./`） |
| `npm run watch` | ウォッチモードでコンパイル |
| `npm test` | 全テスト実行（`mocha ./out/test/**/*.test.js`） |
| `npm run test:property` | プロパティテストのみ実行（タイムアウト30秒） |

## ビルド出力

- ソース: `src/` → 出力: `out/`
- `strict: true` で厳密な型チェックを適用
