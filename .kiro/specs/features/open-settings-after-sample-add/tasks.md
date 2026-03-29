# 実装計画: サンプルコマンド書き込み後の settings.json 自動オープン

## 概要

`DefaultToolPersistenceService` にコンストラクタインジェクションで `openSettings` 関数を注入し、書き込み成功後に `settings.json` を自動オープンして空配列を返す。`extension.ts` 側で空配列ガードを追加し、クイックピック表示をスキップする。既存テストの拡張とプロパティベーステストの新規作成、関連スペックの更新を含む。

## タスク

- [x] 1. DefaultToolPersistenceService のコンストラクタインジェクション追加と書き込み成功後の動作変更
  - [x] 1.1 `src/defaultToolPersistenceService.ts` にコンストラクタインジェクションと書き込み成功後ロジックを追加
    - `openSettingsFn` を受け取る `constructor` を追加（デフォルト値: `settingsOpener.openSettings`）
    - `resolveTools()` の書き込み成功パスで `await this.openSettingsFn()` を呼び出す
    - 書き込み成功後の返り値を `defaultTools`（1件配列）から `[]`（空配列）に変更
    - 書き込み失敗時・「いいえ」選択時・ダイアログ閉じ時は従来通りメモリフォールバック（変更なし）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2_

  - [x] 1.2 `src/extension.ts` の `DefaultToolPersistenceService` 初期化に `openSettings` を渡す
    - `activate` 内の `new DefaultToolPersistenceService()` を `new DefaultToolPersistenceService(openSettings)` に変更
    - _Requirements: 1.2_

  - [x] 1.3 `src/extension.ts` の `selectAndRunTool` に空配列ガードを追加
    - `effectiveTools.length === 0` の場合に早期リターンする条件分岐を追加
    - クイックピック表示の前に配置
    - _Requirements: 2.1, 2.2_

- [x] 2. 既存ユニットテストの拡張
  - [x] 2.1 `src/test/unit/defaultToolPersistenceService.test.ts` に openSettings 関連のテストケースを追加
    - `openSettingsFn` のモック関数を使用してテスト
    - 書き込み成功後に `openSettingsFn` が呼ばれることを検証（Requirements 1.1, 1.2）
    - 書き込み成功後の返り値が空配列であることを検証（Requirements 2.2）
    - 書き込み失敗時に `openSettingsFn` が呼ばれないことを検証（Requirements 1.5）
    - 「いいえ」選択時に `openSettingsFn` が呼ばれないことを検証（Requirements 1.3）
    - ダイアログ閉じ時に `openSettingsFn` が呼ばれないことを検証（Requirements 1.4）
    - 既存テストの `new DefaultToolPersistenceService()` をモック付きに更新
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2_

- [x] 3. チェックポイント - コンパイルとユニットテスト確認
  - `npm run compile` でコンパイルが通ること、`npm test` で全テストがパスすることを確認。問題があればユーザーに質問する。

- [x] 4. プロパティベーステストの作成
  - [x]* 4.1 `src/test/property/defaultToolPersistenceService.property.test.ts` を新規作成し Property 1 を実装
    - **Property 1: 書き込み成功時の空配列返却**
    - ランダムなOSプラットフォーム文字列を生成し、ダイアログ「はい」+ 書き込み成功のモック環境で `resolveTools()` が空配列を返すことを検証
    - `openSettingsFn` のモックが呼ばれることも検証
    - 最低100回のイテレーション
    - **Validates: Requirements 1.1, 2.2**

  - [x]* 4.2 同ファイルに Property 2 を実装
    - **Property 2: 非確認時の非空配列返却と openSettings 非呼び出し**
    - ランダムなOSプラットフォーム文字列と非確認応答（「いいえ」または `undefined`）を生成し、`resolveTools()` が非空配列を返し、`openSettingsFn` が呼ばれないことを検証
    - 最低100回のイテレーション
    - **Validates: Requirements 1.3, 1.4**

  - [x]* 4.3 同ファイルに Property 3 を実装
    - **Property 3: 空配列時のクイックピック非表示**
    - ランダムな `PlaceholderContext` を生成し、`resolveTools()` が空配列を返すモック環境で `selectAndRunTool` を呼び出した際に `showQuickPick` が呼ばれないことを検証
    - 最低100回のイテレーション
    - **Validates: Requirements 2.1**

- [x] 5. チェックポイント - プロパティテスト確認
  - `npm run compile` でコンパイルが通ること、`npm run test:property` でプロパティテストがパスすることを確認。問題があればユーザーに質問する。

- [x] 6. 既存スペックの更新
  - [x] 6.1 `.kiro/specs/features/default-tool-persistence/requirements.md` の要件1に書き込み成功後の settings.json オープン動作を追加
    - 要件1の受け入れ基準4（書き込み成功後の動作）に、settings.json を開いて `clickExec.tools` セクションにカーソルを移動する記述を追加
    - 書き込み成功後の返り値が空配列に変わることを記述
    - _Requirements: 3.1_

  - [x] 6.2 `.kiro/specs/features/default-tool-persistence/design.md` の DefaultToolPersistenceService セクションを更新
    - コンストラクタインジェクション（`openSettingsFn`）の記述を追加
    - 書き込み成功後の `openSettings()` 呼び出しと空配列返却のフローを追加
    - `resolveTools` の返り値テーブルに空配列のケースを追加
    - _Requirements: 3.2_

- [x] 7. 最終チェックポイント - 全テスト確認
  - `npm run compile` でコンパイルが通ること、`npm test` で全テストがパスすることを確認。問題があればユーザーに質問する。

## 備考

- `*` 付きのタスクはオプションであり、スキップ可能
- 各タスクは対応する要件番号を参照し、トレーサビリティを確保
- チェックポイントで段階的に動作を検証
- プロパティテストは正確性プロパティの普遍的な検証、ユニットテストは具体的なエッジケースの検証を担当
