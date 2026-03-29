# 要件ドキュメント

## はじめに

ClickExec拡張機能において、サンプルコマンドを `settings.json` に書き込んだ後、自動的に `settings.json` を開いて書き込んだ `clickExec.tools` セクションにカーソルを移動する機能を追加する。現在の動作では、サンプルコマンド書き込み後にクイックピックが表示されるが、ユーザーが書き込まれた内容を確認・カスタマイズする導線がない。本機能により、書き込み直後に設定ファイルを開くことで、ユーザーが書き込まれた内容を即座に確認・編集できるようにする。

## 用語集

- **Extension**: VSCode上で動作するClickExec拡張機能
- **Settings_JSON**: VSCodeのユーザー設定またはワークスペース設定を保持するJSONファイル
- **Default_Tool**: ツール定義が0件の場合にOS判定に基づいて自動生成されるデフォルトのツール定義（OS標準エクスプローラーで対象を開くコマンド）
- **Confirmation_Dialog**: ユーザーにデフォルトツールの Settings_JSON への書き込み可否を確認するダイアログ
- **DefaultToolPersistenceService**: デフォルトツールの永続化を管理するサービス。確認ダイアログの表示と Settings_JSON への書き込みを担当する
- **SettingsOpener**: Settings_JSON を開いて `clickExec.tools` セクションにカーソルを移動するモジュール
- **Tool_Definition**: ユーザーがVSCode設定（Settings_JSON）で定義する外部ツールの構成情報

## 要件

### 要件 1: サンプルコマンド書き込み後の settings.json 自動オープン

**ユーザーストーリー:** 開発者として、サンプルコマンドが settings.json に書き込まれた後、自動的に settings.json が開かれて該当箇所にカーソルが合った状態にしてほしい。これにより、書き込まれた内容を即座に確認・編集できる。

#### 受け入れ基準

1. WHEN ユーザーが Confirmation_Dialog で「はい」を選択し、Default_Tool の Settings_JSON への書き込みが成功した場合、THE Extension SHALL Settings_JSON を開き、`clickExec.tools` セクションにカーソルを移動する
2. WHEN Settings_JSON を開いた場合、THE Extension SHALL 既存の SettingsOpener の `openSettings()` 関数を使用して `clickExec.tools` セクションへのカーソル移動を行う
3. WHEN ユーザーが Confirmation_Dialog で「いいえ」を選択した場合、THE Extension SHALL Settings_JSON を開かない
4. WHEN ユーザーが Confirmation_Dialog を閉じた場合（Escキー等）、THE Extension SHALL Settings_JSON を開かない
5. IF Default_Tool の Settings_JSON への書き込みに失敗した場合、THEN THE Extension SHALL Settings_JSON を開かない

### 要件 2: settings.json オープン後のツール実行フローの継続

**ユーザーストーリー:** 開発者として、settings.json が開かれた後はツール実行のクイックピックを表示せず、設定の確認・編集に集中したい。これにより、書き込まれた内容の確認と編集がスムーズに行える。

#### 受け入れ基準

1. WHEN サンプルコマンドの書き込み後に Settings_JSON を開いた場合、THE Extension SHALL クイックピックによるツール選択を表示しない
2. WHEN サンプルコマンドの書き込み後に Settings_JSON を開いた場合、THE DefaultToolPersistenceService の `resolveTools()` SHALL 空配列を返すことで、呼び出し元にツール実行をスキップさせる

### 要件 3: 既存スペックとの整合性

**ユーザーストーリー:** 開発者として、この機能追加に伴い既存のスペックドキュメントが更新されてほしい。これにより、ドキュメント間の整合性が保たれる。

#### 受け入れ基準

1. THE Extension SHALL 既存スペック（`.kiro/specs/features/default-tool-persistence/requirements.md`）の要件1に、サンプルコマンド書き込み成功後に Settings_JSON を開く動作を追加する
2. THE Extension SHALL 既存スペック（`.kiro/specs/features/default-tool-persistence/design.md`）の DefaultToolPersistenceService セクションに、書き込み成功後の Settings_JSON オープン処理を含む設計に更新する
