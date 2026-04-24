# 実装計画: コンテキストメニューのフラット化

## 概要

`package.json` のメニュー定義を変更し、「ClickExecで実行」サブメニューを廃止して `clickExec.runTool` コマンドをコンテキストメニューの一階層目に直接配置する。TypeScriptコードの変更は不要。既存スペックドキュメントを更新して整合性を維持する。

## タスク

- [x] 1. package.json のメニュー構造をフラット化
  - [x] 1.1 `contributes.submenus` セクションを完全に削除する
    - `{ "id": "clickExec.submenu", "label": "ClickExecで実行" }` エントリを含むセクション全体を削除
    - _要件: 1.1, 1.2_
  - [x] 1.2 `contributes.menus` から `clickExec.submenu` キーのメニュー定義を削除する
    - `"clickExec.submenu": [{ "command": "clickExec.runTool", "group": "tools" }]` を削除
    - _要件: 1.3_
  - [x] 1.3 `contributes.menus.explorer/context` のエントリを `submenu` 参照から `command` 直接参照に変更する
    - `{ "submenu": "clickExec.submenu", "group": "clickExec" }` → `{ "command": "clickExec.runTool", "group": "clickExec" }`
    - _要件: 2.1, 2.3_
  - [x] 1.4 `contributes.menus.editor/title/context` のエントリを `submenu` 参照から `command` 直接参照に変更する
    - `{ "submenu": "clickExec.submenu", "group": "clickExec" }` → `{ "command": "clickExec.runTool", "group": "clickExec" }`
    - _要件: 2.2, 2.3_

- [x] 2. チェックポイント — package.json 変更の検証
  - `npm run compile` でコンパイルが通ることを確認
  - `npm test` で既存テストがすべてパスすることを確認（回帰テスト）
  - 問題があればユーザーに確認する
  - _要件: 3.1, 3.2, 3.3_

- [x] 3. ユニットテストの作成
  - [x] 3.1 `src/test/unit/flattenContextMenu.test.ts` を新規作成し、package.json 構造検証テストを実装する
    - `contributes.submenus` セクションが存在しないことを検証
    - `contributes.menus` に `clickExec.submenu` キーが存在しないことを検証
    - _要件: 1.1, 1.2, 1.3_
  - [x] 3.2 同テストファイルにコマンド直接配置の検証テストを追加する
    - `contributes.menus.explorer/context` に `clickExec.runTool` コマンドが直接配置されていることを検証
    - `contributes.menus.editor/title/context` に `clickExec.runTool` コマンドが直接配置されていることを検証
    - 各エントリが `clickExec` グループに属していることを検証
    - _要件: 2.1, 2.2, 2.3_

- [x] 4. 既存スペックドキュメントの更新（open-settings-json）
  - [x] 4.1 `.kiro/specs/features/open-settings-json/design.md` を更新する
    - package.json の contributes 定義からサブメニュー関連の記述をフラット構造に変更
    - `submenus` セクションと `menus.clickExec.submenu` セクションの記述を削除し、`explorer/context` と `editor/title/context` を直接コマンド参照に更新
    - _要件: 設計ドキュメント 3.1_

- [x] 5. 既存スペックドキュメントの更新（remove-open-settings-menu）
  - [x] 5.1 `.kiro/specs/features/remove-open-settings-menu/design.md` を更新する
    - package.json の最終状態をフラット構造に更新
    - `submenus` セクションと `menus.clickExec.submenu` セクションの記述を削除し、`explorer/context` と `editor/title/context` を直接コマンド参照に更新
    - _要件: 設計ドキュメント 3.2_

- [x] 6. 既存スペックドキュメントの更新（vscode-external-tools）
  - [x] 6.1 `.kiro/specs/vscode-external-tools/design.md` を更新する
    - メニュー構成の記述をフラット構造に更新
    - `submenus` セクションと `menus.clickExec.submenu` セクションの記述を削除し、`explorer/context` と `editor/title/context` を直接コマンド参照に更新
    - _要件: 設計ドキュメント 3.3_

- [x] 7. 最終チェックポイント — 全テストパスの確認
  - `npm run compile` でコンパイルが通ることを確認
  - `npm test` で全テスト（新規 + 既存）がパスすることを確認
  - `npm run test:property` で既存プロパティテストがすべてパスすることを確認（回帰テスト）
  - 問題があればユーザーに確認する

## 備考

- 各タスクは具体的な要件番号を参照しトレーサビリティを確保
- チェックポイントでインクリメンタルな検証を実施
- この機能は `package.json` の宣言的な設定変更のみであり、新しいTypeScriptロジックの追加はないため、プロパティベーステスト（PBT）は適用しない
- ユニットテストは package.json の静的構造検証として実装
- 既存のプロパティテスト・ユニットテストの回帰確認で既存機能の維持を検証
