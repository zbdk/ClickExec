# 実装計画: デフォルトツールの settings.json 永続化

## 概要

デフォルトツールの永続化機能を段階的に実装する。まず純粋関数（`shouldPromptForPersistence`）を追加し、次にVSCode API依存の永続化サービスを作成、最後に `extension.ts` に統合する。既存スペックの更新も含む。

## タスク

- [x] 1. DefaultToolProvider に永続化判定ロジックを追加
  - [x] 1.1 `ToolsConfigInspection` インターフェースと `shouldPromptForPersistence` 純粋関数を `src/defaultToolProvider.ts` に追加
    - `globalValue` が `undefined` または空配列の場合に `true` を返す
    - `globalValue` が1件以上の要素を持つ配列の場合は `false` を返す
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

  - [x] 1.2 `shouldPromptForPersistence` のプロパティベーステストを作成
    - `src/test/property/defaultToolProvider.property.test.ts` に追加
    - **Property 1: 永続化判定の正確性**
    - ランダムな `ToolsConfigInspection`（`globalValue` が `undefined`、空配列、1件以上の配列）を生成し、返り値が仕様通りであることを検証
    - 最低100回のイテレーション
    - **Validates: Requirements 1.1, 2.1, 2.2, 2.3**

  - [x] 1.3 `shouldPromptForPersistence` のユニットテストを `src/test/unit/defaultToolProvider.test.ts` に追加
    - `globalValue` が `undefined` → `true`
    - `globalValue` が `[]` → `true`
    - `globalValue` が `[{name: "test", command: "test"}]` → `false`
    - _Requirements: 1.1, 2.1, 2.3_

- [x] 2. チェックポイント - テスト確認
  - `npm run compile` でコンパイルが通ること、`npm test` で全テストがパスすることを確認。問題があればユーザーに質問する。

- [x] 3. DefaultToolPersistenceService の実装
  - [x] 3.1 `src/defaultToolPersistenceService.ts` に `DefaultToolPersistenceService` クラスを新規作成
    - `resolveTools(platform: OsPlatform): Promise<ToolDefinition[]>` メソッドを実装
    - `vscode.workspace.getConfiguration('clickExec').inspect<ToolDefinition[]>('tools')` で設定状態を取得
    - `shouldPromptForPersistence` で永続化判定
    - `vscode.window.showInformationMessage` で確認ダイアログ（「はい」「いいえ」）を表示
    - 「はい」→ `config.update('tools', [getDefaultTool(platform)], ConfigurationTarget.Global)` で書き込み、書き込んだ定義を返す
    - 「いいえ」/ `undefined`（Esc等）→ メモリ上の `getToolsWithDefault([], platform)` をフォールバック
    - 書き込み失敗 → `showErrorMessage` でエラー表示 + メモリフォールバック
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 3.2 `DefaultToolPersistenceService` のプロパティベーステストを作成
    - `src/test/property/defaultToolProvider.property.test.ts` に追加
    - **Property 2: 書き込み内容と getDefaultTool の一致性**
    - ランダムなOSプラットフォーム文字列を生成し、永続化サービスが書き込む内容が `getDefaultTool(platform)` の出力と一致することを検証
    - 最低100回のイテレーション
    - **Validates: Requirements 1.2, 3.1, 3.2, 3.3, 3.4, 3.5**

  - [x] 3.3 `DefaultToolPersistenceService` のユニットテストを `src/test/unit/defaultToolPersistenceService.test.ts` に新規作成
    - VSCode API（`workspace.getConfiguration`, `window.showInformationMessage`）のモックを使用
    - 「はい」選択時に `config.update()` が `ConfigurationTarget.Global` で呼ばれること
    - 書き込み成功後に書き込んだツール定義が返されること
    - 「いいえ」選択時に書き込みが行われず、メモリデフォルトが返されること
    - ダイアログ閉じ（`undefined`）時に「いいえ」と同じ動作をすること
    - 書き込み失敗時にエラーメッセージが表示され、メモリデフォルトが返されること
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 4. チェックポイント - テスト確認
  - `npm run compile` でコンパイルが通ること、`npm test` で全テストがパスすることを確認。問題があればユーザーに質問する。

- [x] 5. extension.ts の統合
  - [x] 5.1 `src/extension.ts` で `DefaultToolPersistenceService` をインポートし、`activate` 内でインスタンスを生成
    - `selectAndRunTool` の引数に `persistenceService` を追加
    - `tools.length === 0` の場合に `persistenceService.resolveTools(process.platform)` を呼び出す
    - `tools.length >= 1` の場合は既存のツールをそのまま使用
    - 既存の `getToolsWithDefault` 呼び出しを `persistenceService` 経由に置き換え
    - _Requirements: 1.1, 1.4, 1.5, 2.1_

- [x] 6. チェックポイント - 全体テスト確認
  - `npm run compile` でコンパイルが通ること、`npm test` で全テストがパスすること、`npm run test:property` でプロパティテストがパスすることを確認。問題があればユーザーに質問する。

- [x] 7. 既存スペックの更新
  - [x] 7.1 `.kiro/specs/vscode-external-tools/requirements.md` の要件9.7を更新
    - 「THE Extension SHALL デフォルトツールを settings.json に書き込まず、メモリ上でのみ保持する」を、ユーザー確認後に settings.json に書き込む動作（確認を拒否した場合はメモリ上のフォールバック）に更新
    - _Requirements: 4.1_

  - [x] 7.2 `.kiro/specs/vscode-external-tools/design.md` の DefaultToolProvider セクションを更新
    - `shouldPromptForPersistence` 関数と `ToolsConfigInspection` インターフェースの記述を追加
    - `DefaultToolPersistenceService` の概要を追加
    - 「デフォルトツールは settings.json に書き込まず、メモリ上でのみ保持する」の記述を、ユーザー確認ダイアログおよび settings.json への書き込みロジックを含む設計に更新
    - _Requirements: 4.2_

- [x] 8. 最終チェックポイント - 全テスト確認
  - `npm run compile` でコンパイルが通ること、`npm test` で全テストがパスすることを確認。問題があればユーザーに質問する。

## 備考

- `*` 付きのタスクはオプションであり、スキップ可能
- 各タスクは対応する要件番号を参照し、トレーサビリティを確保
- チェックポイントで段階的に動作を検証
- プロパティテストは正確性プロパティの普遍的な検証、ユニットテストは具体的なエッジケースの検証を担当
