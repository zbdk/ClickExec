# 実装計画: settings.json を開く機能

## 概要

ClickExec拡張機能に `clickExec.openSettings` コマンド、コンテキストメニューへの「設定を開く...」項目追加、およびツール未設定時のデフォルトツール自動追加機能を実装する。純粋関数として `DefaultToolProvider` を新規作成し、`extension.ts` と `package.json` を変更する。

## タスク

- [x] 1. DefaultToolProvider の実装
  - [x] 1.1 `src/defaultToolProvider.ts` を新規作成し、`getDefaultTool(platform)` 純粋関数を実装する
    - `OsPlatform` 型の定義（`'win32' | 'darwin' | 'linux' | string`）
    - `OS_COMMAND_MAP` 定数の定義（win32→`explorer ${dir}`, darwin→`open ${dir}`, linux→`xdg-open ${dir}`）
    - `DEFAULT_COMMAND` 定数の定義（`xdg-open ${dir}`）
    - `getDefaultTool(platform)` 関数: 指定プラットフォームに対応する `ToolDefinition` を返す
    - 表示名は「エクスプローラーで開く」固定
    - 未知のプラットフォームは Linux と同じコマンドにフォールバック
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 1.2 `getToolsWithDefault(userTools, platform)` ヘルパー関数を実装する
    - `userTools` が0件の場合のみ `getDefaultTool(platform)` の結果を含む配列を返す
    - `userTools` が1件以上の場合はそのまま返す
    - _Requirements: 3.1, 3.6, 3.7_
  - [x]* 1.3 Property 1 のプロパティテストを作成する（`src/test/property/defaultToolProvider.property.test.ts`）
    - **Property 1: デフォルトツールの条件付き追加**
    - ランダムなツール定義リスト（0件〜N件）を生成し、0件の場合のみデフォルトツールが1件追加されること、表示名が「エクスプローラーで開く」であることを検証
    - 1件以上の場合はデフォルトツールが追加されず元のリストがそのまま返されることを検証
    - 最低100回のイテレーション
    - **Validates: Requirements 3.1, 3.2, 3.6**
  - [x]* 1.4 Property 2 のプロパティテストを作成する（`src/test/property/defaultToolProvider.property.test.ts`）
    - **Property 2: OSプラットフォームとデフォルトコマンドの正しい対応**
    - サポート対象3種（win32, darwin, linux）+ 未知の文字列を生成し、正しいコマンドが返されることを検証
    - 未知のプラットフォームでもエラーを発生させずフォールバックコマンドを返すことを検証
    - 最低100回のイテレーション
    - **Validates: Requirements 3.3, 3.4, 3.5**
  - [x]* 1.5 DefaultToolProvider のユニットテストを作成する（`src/test/unit/defaultToolProvider.test.ts`）
    - 各OS（Windows, macOS, Linux）に対する具体的なコマンド文字列の検証
    - 未知のOSに対するフォールバック動作の検証
    - `getToolsWithDefault` の0件/1件以上の場合の動作検証
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 2. チェックポイント - DefaultToolProvider のテスト確認
  - `npm run compile` でコンパイルが通ることを確認
  - `npm test` で全テストがパスすることを確認
  - 問題があればユーザーに確認する

- [x] 3. SettingsOpener の実装
  - [x] 3.1 `src/settingsOpener.ts` を新規作成し、`openSettings()` 非同期関数を実装する
    - `vscode.commands.executeCommand('workbench.action.openSettingsJson')` で settings.json を開く
    - 開かれたドキュメント内で `"clickExec.tools"` を検索
    - 見つかった場合、その位置にカーソルを移動し該当行を表示する
    - 見つからない場合はファイルの先頭を表示する
    - エラー時は `vscode.window.showErrorMessage` で通知する
    - _Requirements: 1.2_

- [x] 4. package.json の更新
  - [x] 4.1 `clickExec.openSettings` コマンド定義を `contributes.commands` に追加する
    - `title`: `"ClickExec: 設定を開く"`
    - _Requirements: 1.1, 1.3_
  - [x] 4.2 `contributes.menus.clickExec.submenu` のメニュー定義を更新する
    - 既存の `clickExec.runTool` の `group` を `"tools"` に変更
    - `clickExec.openSettings` を `group: "settings"` で追加（区切り線で分離）
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. extension.ts の統合
  - [x] 5.1 `clickExec.openSettings` コマンドを登録する
    - `vscode.commands.registerCommand` で `openSettings()` を呼び出すコマンドを登録
    - Disposable を `context.subscriptions` に追加
    - _Requirements: 1.1, 1.2_
  - [x] 5.2 `selectAndRunTool` 関数にデフォルトツール追加ロジックを統合する
    - `currentTools` が0件の場合に `getToolsWithDefault(currentTools, process.platform)` を使用
    - 既存の「ツールが未設定です」メッセージの代わりにデフォルトツールを表示
    - _Requirements: 3.1, 3.6, 3.7_

- [x] 6. 既存スペックへの反映
  - [x] 6.1 `.kiro/specs/vscode-external-tools/requirements.md` に open-settings-json 機能の要件（settings.json を開くコマンド、コンテキストメニュー追加、デフォルトツール自動追加）を追記する
  - [x] 6.2 `.kiro/specs/vscode-external-tools/design.md` に open-settings-json 機能の設計（DefaultToolProvider、SettingsOpener、package.json 変更、extension.ts 統合）を追記する

- [x] 7. 最終チェックポイント - 全テスト確認
  - `npm run compile` でコンパイルが通ることを確認
  - `npm test` で全テストがパスすることを確認
  - 問題があればユーザーに確認する

## 備考

- `*` マーク付きのタスクはオプションであり、スキップ可能
- 各タスクは具体的な要件番号を参照しトレーサビリティを確保
- チェックポイントでインクリメンタルな検証を実施
- プロパティテストは設計ドキュメントの正確性プロパティを検証
- ユニットテストは具体的なエッジケースを検証
