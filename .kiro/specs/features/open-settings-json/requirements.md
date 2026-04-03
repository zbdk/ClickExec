# 要件ドキュメント: settings.json を開く機能

## はじめに

ClickExec拡張機能に、右クリックのコンテキストメニューから `settings.json` の `clickExec.tools` 設定を直接開く機能を追加する。ツール定義が0件の場合は、OS標準のエクスプローラーで対象ファイル/フォルダを開くコマンドをデフォルトのツール定義として自動追加する。これにより、ユーザーは設定画面への素早いアクセスと、初回利用時のスムーズなオンボーディングを得られる。

## 用語集

- **Extension**: VSCode上で動作するClickExec拡張機能
- **Tool_Definition**: ユーザーがVSCode設定（settings.json）で定義する外部ツールの構成情報
- **Context_Menu**: エクスプローラーのファイル/フォルダ、またはエディタタブを右クリックした際に表示されるメニュー
- **Settings_JSON**: VSCodeのユーザー設定またはワークスペース設定を格納するJSONファイル
- **Open_Settings_Command**: settings.json の clickExec.tools セクションを開くためのVSCodeコマンド
- **Default_Tool**: ツール定義が0件の場合に自動追加されるOS標準エクスプローラーで開くコマンド

## 要件

### 要件 1: settings.json を開くコマンドの登録

> **削除済み — remove-open-settings-menu により削除**

**ユーザーストーリー:** 開発者として、コンテキストメニューやコマンドパレットから settings.json の clickExec.tools 設定を直接開きたい。これにより、ツール定義の追加・編集を素早く行える。

#### 受け入れ基準

1. THE Extension SHALL コマンド `clickExec.openSettings` を登録する
2. WHEN `clickExec.openSettings` コマンドが実行された場合、THE Extension SHALL Settings_JSON を開き、`clickExec.tools` セクションにカーソルを移動する
3. THE Extension SHALL コマンドパレットに「ClickExec: 設定を開く」コマンドとして表示する

### 要件 2: コンテキストメニューへの設定メニュー追加

> **削除済み — remove-open-settings-menu により削除**

**ユーザーストーリー:** 開発者として、右クリックメニューのClickExecサブメニュー内から設定を開きたい。これにより、ツール実行と設定変更を同じメニューから行える。

#### 受け入れ基準

1. THE Extension SHALL Context_Menu の「ClickExecで実行」サブメニュー内に「設定を開く...」メニュー項目を表示する
2. THE Extension SHALL 「設定を開く...」メニュー項目をサブメニュー内のツール一覧の下部に、区切り線で分離して配置する
3. WHEN ユーザーが「設定を開く...」メニュー項目を選択した場合、THE Extension SHALL `clickExec.openSettings` コマンドを実行する

### 要件 3: ツール未設定時のデフォルトツール自動追加

**ユーザーストーリー:** 開発者として、ClickExecを初めて使う際にツールが未設定でも、エクスプローラーで開くコマンドがデフォルトで用意されていてほしい。これにより、初回利用時にすぐ機能を試せる。

#### 受け入れ基準

1. WHEN Tool_Definition が0件の場合、THE Extension SHALL OS標準のエクスプローラーで対象を開く Default_Tool を自動的に追加する
2. THE Extension SHALL Default_Tool の表示名を「エクスプローラーで開く」とする
3. WHEN OSがWindowsの場合、THE Extension SHALL Default_Tool のコマンドを `explorer ${dir}` とする
4. WHEN OSがmacOSの場合、THE Extension SHALL Default_Tool のコマンドを `open ${dir}` とする
5. WHEN OSがLinuxの場合、THE Extension SHALL Default_Tool のコマンドを `xdg-open ${dir}` とする
6. WHEN ユーザーが1件以上の Tool_Definition を設定した場合、THE Extension SHALL Default_Tool を表示しない
7. THE Extension SHALL Default_Tool を settings.json に書き込まず、メモリ上でのみ保持する
