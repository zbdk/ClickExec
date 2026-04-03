# 要件ドキュメント: 「設定を開く」メニュー項目の削除

## はじめに

ClickExec拡張機能において、右クリックのコンテキストメニュー（「ClickExecで実行」サブメニュー）内の「設定を開く...」メニュー項目、および関連する `clickExec.openSettings` コマンドを削除する。

サンプルコマンド自動追加機能（ツール定義が0件の場合にOS標準エクスプローラーで開くコマンドをデフォルトで追加する機能）が実装済みであるため、ユーザーが手動で設定を開く導線は不要となった。ただし、`SettingsOpener` モジュール（`openSettings()` 関数）は、サンプルコマンド書き込み後の自動オープン機能（`DefaultToolPersistenceService`）で引き続き使用されるため、モジュール自体は保持する。

## 用語集

- **Extension**: VSCode上で動作するClickExec拡張機能
- **Context_Menu**: エクスプローラーのファイル/フォルダ、またはエディタタブを右クリックした際に表示されるメニュー
- **Submenu**: Context_Menu 内の「ClickExecで実行」サブメニュー
- **Open_Settings_Command**: `clickExec.openSettings` コマンド。settings.json の clickExec.tools セクションを開くためのVSCodeコマンド
- **SettingsOpener**: settings.json を開いて `clickExec.tools` セクションにカーソルを移動する内部モジュール（`openSettings()` 関数）
- **DefaultToolPersistenceService**: サンプルコマンドの永続化を管理するサービス。書き込み成功後に SettingsOpener を呼び出す

## 要件

### 要件 1: コンテキストメニューから「設定を開く...」メニュー項目を削除

**ユーザーストーリー:** 開発者として、右クリックメニューの「ClickExecで実行」サブメニューから「設定を開く...」メニュー項目を削除したい。サンプルコマンド自動追加機能があるため、手動で設定を開く導線が不要になった。

#### 受け入れ基準

1. THE Extension SHALL Submenu 内に「設定を開く...」メニュー項目を表示しない
2. THE Extension SHALL `package.json` の `contributes.menus.clickExec.submenu` から `clickExec.openSettings` コマンドのエントリを削除する
3. WHEN ユーザーが Submenu を開いた場合、THE Extension SHALL ツール一覧のみを表示する（区切り線と「設定を開く...」は表示しない）

### 要件 2: `clickExec.openSettings` コマンドの登録解除

**ユーザーストーリー:** 開発者として、コマンドパレットから「ClickExec: 設定を開く」コマンドを削除したい。メニュー項目の削除に伴い、コマンド自体も不要になった。

#### 受け入れ基準

1. THE Extension SHALL `package.json` の `contributes.commands` から `clickExec.openSettings` コマンドの定義を削除する
2. THE Extension SHALL `extension.ts` から `clickExec.openSettings` コマンドの登録処理を削除する
3. WHEN ユーザーがコマンドパレットを開いた場合、THE Extension SHALL 「ClickExec: 設定を開く」コマンドを表示しない

### 要件 3: SettingsOpener モジュールの保持

**ユーザーストーリー:** 開発者として、`openSettings()` 関数は内部的に引き続き使用されるため、モジュール自体は削除せず保持したい。

#### 受け入れ基準

1. THE Extension SHALL `settingsOpener.ts` モジュールを削除しない
2. THE Extension SHALL DefaultToolPersistenceService からの `openSettings()` 呼び出しを維持する
3. WHEN サンプルコマンドの settings.json への書き込みが成功した場合、THE Extension SHALL 従来通り SettingsOpener を使用して settings.json を開く

### 要件 4: 既存スペックとの整合性

**ユーザーストーリー:** 開発者として、この機能変更に伴い既存のスペックドキュメントが更新されてほしい。これにより、ドキュメント間の整合性が保たれる。

#### 受け入れ基準

1. THE Extension SHALL 既存スペック（`.kiro/specs/features/open-settings-json/requirements.md`）の要件1（コマンド登録）と要件2（コンテキストメニュー追加）を削除済みとして更新する
2. THE Extension SHALL 既存スペック（`.kiro/specs/features/open-settings-json/design.md`）の SettingsOpener セクションと package.json メニュー定義を更新する
3. THE Extension SHALL メインスペック（`.kiro/specs/vscode-external-tools/requirements.md`）の要件7（コマンド登録）と要件8（メニュー追加）を削除済みとして更新する
4. THE Extension SHALL メインスペック（`.kiro/specs/vscode-external-tools/design.md`）の package.json contributes 定義と Extension Entry Point セクションを更新する
