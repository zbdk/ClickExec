# 実装計画: 「設定を開く」メニュー項目の削除

## 概要

コンテキストメニューの「ClickExecで実行」サブメニューから「設定を開く...」メニュー項目を削除し、`clickExec.openSettings` コマンドの登録を解除する。`settingsOpener.ts` モジュールは `DefaultToolPersistenceService` から引き続き使用されるため保持する。既存スペックドキュメントを更新して整合性を維持する。

## タスク

- [x] 1. package.json から `clickExec.openSettings` 関連の定義を削除
  - [x] 1.1 `contributes.commands` 配列から `clickExec.openSettings` コマンド定義を削除する
    - `{ "command": "clickExec.openSettings", "title": "ClickExec: 設定を開く" }` エントリを削除
    - _要件: 1.2, 2.1_
  - [x] 1.2 `contributes.menus.clickExec.submenu` から `clickExec.openSettings` メニューエントリを削除する
    - `{ "command": "clickExec.openSettings", "group": "settings" }` エントリを削除
    - サブメニュー内は `tools` グループのみとなる
    - _要件: 1.1, 1.2, 1.3_

- [x] 2. extension.ts から `clickExec.openSettings` コマンド登録処理を削除
  - [x] 2.1 `openSettings` のインポート文を削除する
    - `import { openSettings } from './settingsOpener';` を削除
    - `DefaultToolPersistenceService` のコンストラクタに渡す `openSettings` は `defaultToolPersistenceService.ts` 内で直接インポートされているため影響なし
    - _要件: 2.2_
  - [x] 2.2 `clickExec.openSettings` コマンド登録処理と `openSettingsDisposable` を削除する
    - `vscode.commands.registerCommand('clickExec.openSettings', ...)` の呼び出しを削除
    - `context.subscriptions.push(...)` から `openSettingsDisposable` を削除
    - _要件: 2.2, 2.3_

- [x] 3. チェックポイント — コード変更の検証
  - すべてのテストがパスすることを確認し、疑問があればユーザーに確認する。
  - `settingsOpener.ts` が保持されていること、`DefaultToolPersistenceService` からの `openSettings` 使用が維持されていることを確認する。
  - _要件: 3.1, 3.2, 3.3_

- [x] 4. ユニットテストの作成
  - [x] 4.1 `src/test/unit/removeOpenSettingsMenu.test.ts` を作成し、package.json の構造検証テストを実装する
    - `contributes.commands` に `clickExec.openSettings` が含まれないことを検証
    - `contributes.menus.clickExec.submenu` に `clickExec.openSettings` が含まれないことを検証
    - **Property 1: package.json にコマンド定義が存在しないことの検証**
    - **検証対象: 要件 1.1, 1.2, 2.1**
  - [x] 4.2 同テストファイルに `settingsOpener.ts` モジュール存在確認テストを追加する
    - `settingsOpener.ts` ファイルが存在し、`openSettings` 関数がエクスポートされていることを検証
    - **検証対象: 要件 3.1**

- [x] 5. 既存プロパティテストの回帰確認
  - [ ]* 5.1 `defaultToolPersistenceService.property.test.ts` の既存テストがパスすることを確認する
    - **Property 2: DefaultToolPersistenceService の openSettings 呼び出し保持**
    - **検証対象: 要件 3.2, 3.3**
  - [ ]* 5.2 `defaultToolProvider.property.test.ts` の既存テストがパスすることを確認する
    - DefaultToolProvider の動作が変更されていないことを確認
    - **検証対象: 要件 3.2**

- [x] 6. 既存スペックドキュメントの更新（open-settings-json）
  - [x] 6.1 `.kiro/specs/features/open-settings-json/requirements.md` を更新する
    - 要件1（コマンド登録）と要件2（コンテキストメニュー追加）に「削除済み — remove-open-settings-menu により削除」の注記を追加
    - _要件: 4.1_
  - [x] 6.2 `.kiro/specs/features/open-settings-json/design.md` を更新する
    - SettingsOpener セクションに「コマンド登録は削除済み、内部APIとしてのみ使用」の注記を追加
    - package.json の contributes 定義から `clickExec.openSettings` 関連を削除
    - _要件: 4.2_

- [x] 7. 既存スペックドキュメントの更新（vscode-external-tools）
  - [x] 7.1 `.kiro/specs/vscode-external-tools/requirements.md` を更新する
    - 要件7（コマンド登録）と要件8（メニュー追加）に「削除済み — remove-open-settings-menu により削除」の注記を追加
    - _要件: 4.3_
  - [x] 7.2 `.kiro/specs/vscode-external-tools/design.md` を更新する
    - Extension Entry Point セクションから `clickExec.openSettings` コマンド登録を削除
    - package.json の contributes 定義を更新（`clickExec.openSettings` 関連を削除）
    - _要件: 4.4_

- [x] 8. 最終チェックポイント — 全テストパスの確認
  - すべてのテストがパスすることを確認し、疑問があればユーザーに確認する。

## 備考

- `*` マーク付きのタスクはオプションであり、スキップ可能
- 各タスクは具体的な要件を参照しており、トレーサビリティを確保
- チェックポイントでインクリメンタルな検証を実施
- プロパティテストは既存テストの回帰確認のみ（新規プロパティベーステストの追加は不要）
- ユニットテストは静的検証（package.json 構造確認 + モジュール存在確認）
