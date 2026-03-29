# 要件ドキュメント

## はじめに

ClickExec拡張機能において、ツール定義が0件または `clickExec.tools` 設定キー自体が未定義の場合に、デフォルトツール（OS標準エクスプローラーで開くコマンド）をユーザーの確認を得た上で `settings.json` に書き込む機能を追加する。ユーザーが書き込みを拒否した場合はメモリ上のデフォルトツールをフォールバックとして使用する。これにより、ユーザーの意図しない設定変更を防ぎつつ、初回利用時の透明性と設定のカスタマイズ性を向上させる。

## 用語集

- **Extension**: VSCode上で動作するClickExec拡張機能
- **Tool_Definition**: ユーザーがVSCode設定（settings.json）で定義する外部ツールの構成情報。コマンド文字列、表示名、プレースホルダーを含む
- **Default_Tool**: ツール定義が0件の場合にOS判定に基づいて自動生成されるデフォルトのツール定義（OS標準エクスプローラーで対象を開くコマンド）
- **Settings_JSON**: VSCodeのユーザー設定またはワークスペース設定を保持するJSONファイル
- **ConfigurationService**: settings.json からツール定義を読み込み・バリデーションするサービスモジュール
- **DefaultToolProvider**: OS判定に基づくデフォルトツール定義の生成を担当するモジュール
- **Confirmation_Dialog**: ユーザーにデフォルトツールの settings.json への書き込み可否を確認するダイアログ

## 要件

### 要件 1: デフォルトツールの settings.json への書き込み前のユーザー確認

**ユーザーストーリー:** 開発者として、ClickExecを初めて使う際にデフォルトツールが settings.json に勝手に書き込まれるのではなく、書き込み前に確認を求められたい。これにより、意図しない設定変更を防ぎつつ、必要に応じてデフォルトツールを永続化できる。

#### 受け入れ基準

1. WHEN Tool_Definition が0件の場合、または Settings_JSON に `clickExec.tools` 設定キーが存在しない（未定義）場合、THE Extension SHALL 「サンプルコマンドを追加しますか？」という確認メッセージを Confirmation_Dialog で表示する
2. WHEN ユーザーが Confirmation_Dialog で「はい」を選択した場合、THE Extension SHALL Default_Tool の定義を Settings_JSON の `clickExec.tools` に書き込む
3. WHEN Default_Tool を Settings_JSON に書き込む場合、THE Extension SHALL VSCode の Configuration API（`WorkspaceConfiguration.update`）を使用してグローバル設定（`ConfigurationTarget.Global`）に書き込む
4. WHEN Default_Tool の書き込みが完了した場合、THE Extension SHALL 書き込んだ Tool_Definition を即座にツール一覧として使用する
5. WHEN ユーザーが Confirmation_Dialog で「いいえ」を選択した場合、THE Extension SHALL Settings_JSON への書き込みを行わず、メモリ上の Default_Tool をフォールバックとして使用する
6. WHEN ユーザーが Confirmation_Dialog を閉じた場合（Escキー等）、THE Extension SHALL 「いいえ」を選択した場合と同じ動作をする
7. IF Default_Tool の Settings_JSON への書き込みに失敗した場合、THEN THE Extension SHALL エラーメッセージを表示し、メモリ上のデフォルトツールをフォールバックとして使用する

### 要件 2: デフォルトツール書き込みの冪等性

**ユーザーストーリー:** 開発者として、拡張機能の再起動やリロード時にデフォルトツールが重複して書き込まれないようにしたい。これにより、設定が意図せず汚染されることを防げる。

#### 受け入れ基準

1. WHEN Tool_Definition が1件以上存在する場合、THE Extension SHALL Confirmation_Dialog の表示および Default_Tool の書き込みを実行しない
2. WHEN Default_Tool が既に Settings_JSON に書き込まれている状態で拡張機能が再アクティベートされた場合、THE Extension SHALL 既存の Tool_Definition を読み込み、Confirmation_Dialog の表示および追加の書き込みを実行しない
3. THE Extension SHALL Default_Tool の書き込み判定を `clickExec.tools` 設定キーが未定義であるか、または配列の要素数が0であるかで行う

### 要件 3: OS別デフォルトツールの定義内容

**ユーザーストーリー:** 開発者として、OSに応じた適切なエクスプローラーコマンドがデフォルトツールとして提案・書き込まれてほしい。これにより、OSを問わず初回利用時にすぐ機能を試せる。

#### 受け入れ基準

1. THE Extension SHALL Default_Tool の表示名を「エクスプローラーで開く」とする
2. WHEN OSがWindowsの場合、THE Extension SHALL Default_Tool のコマンドを `explorer ${dir}` とする
3. WHEN OSがmacOSの場合、THE Extension SHALL Default_Tool のコマンドを `open ${dir}` とする
4. WHEN OSがLinuxの場合、THE Extension SHALL Default_Tool のコマンドを `xdg-open ${dir}` とする
5. WHEN OSが上記以外の場合、THE Extension SHALL Default_Tool のコマンドを `xdg-open ${dir}`（Linuxと同一のフォールバック）とする

### 要件 4: 既存スペックとの整合性

**ユーザーストーリー:** 開発者として、この機能追加に伴い既存のスペックドキュメントが更新されてほしい。これにより、ドキュメント間の整合性が保たれる。

#### 受け入れ基準

1. THE Extension SHALL 既存スペック（`.kiro/specs/vscode-external-tools/requirements.md`）の要件9の受け入れ基準7「THE Extension SHALL デフォルトツールを settings.json に書き込まず、メモリ上でのみ保持する」を、ユーザー確認後に settings.json に書き込む動作（確認を拒否した場合はメモリ上のフォールバック）に更新する
2. THE Extension SHALL 既存スペック（`.kiro/specs/vscode-external-tools/design.md`）の DefaultToolProvider セクションを、ユーザー確認ダイアログおよび settings.json への書き込みロジックを含む設計に更新する
