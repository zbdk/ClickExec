# 要件ドキュメント

## 概要

ClickExec拡張機能のコンテキストメニュー構造をフラット化する。現在、ツール実行コマンド（`clickExec.runTool`）は「ClickExecで実行」サブメニューの中に配置されているが、このサブメニューを廃止し、コマンドをコンテキストメニューの一階層目に直接表示するように変更する。これにより、ユーザーはワンクリック少なくツールを実行できるようになる。

## 用語集

- **Context_Menu**: VSCodeのエクスプローラーやエディタタブを右クリックした際に表示されるメニュー
- **Submenu**: コンテキストメニュー内のネストされたメニュー項目で、ホバーまたはクリックで子メニューを展開する
- **Flat_Menu**: サブメニューを使用せず、コマンドをコンテキストメニューの一階層目に直接配置する構造
- **Explorer_Context**: VSCodeエクスプローラービューのファイル・フォルダを右クリックした際のコンテキストメニュー
- **Editor_Tab_Context**: VSCodeエディタのタブを右クリックした際のコンテキストメニュー
- **ClickExec**: 本VSCode拡張機能の名称
- **Package_Json**: VSCode拡張機能のマニフェストファイルで、メニュー構成やコマンド定義を含む

## 要件

### 要件1: サブメニュー定義の削除

**ユーザーストーリー:** 開発者として、不要になったサブメニュー定義を削除したい。それにより、拡張機能のマニフェストが簡潔になり保守性が向上する。

#### 受け入れ基準

1. WHEN ClickExec がアクティベートされた時、THE Package_Json SHALL 「clickExec.submenu」のサブメニュー定義を含まない
2. WHEN ClickExec がアクティベートされた時、THE Package_Json SHALL `submenus` セクションから「ClickExecで実行」ラベルのエントリを含まない
3. WHEN ClickExec がアクティベートされた時、THE Package_Json SHALL `menus` セクションから「clickExec.submenu」キーのメニュー定義を含まない

### 要件2: コンテキストメニューへの直接配置

**ユーザーストーリー:** 開発者として、エクスプローラーやエディタタブのコンテキストメニューからサブメニューを経由せずに直接ツール実行コマンドにアクセスしたい。それにより、操作ステップが1つ減り作業効率が向上する。

#### 受け入れ基準

1. WHEN ユーザーがエクスプローラーでファイルまたはフォルダを右クリックした時、THE Context_Menu SHALL `clickExec.runTool` コマンドを一階層目に「ClickExec: ツールを実行」というラベルで表示する
2. WHEN ユーザーがエディタタブを右クリックした時、THE Context_Menu SHALL `clickExec.runTool` コマンドを一階層目に「ClickExec: ツールを実行」というラベルで表示する
3. THE Context_Menu SHALL `clickExec.runTool` コマンドを `clickExec` グループに配置する

### 要件3: 既存機能の維持

**ユーザーストーリー:** 開発者として、メニュー構造の変更後もツール実行機能が従来通り動作することを確認したい。それにより、リファクタリングによる機能退行を防止できる。

#### 受け入れ基準

1. WHEN ユーザーがエクスプローラーのコンテキストメニューから「ClickExec: ツールを実行」を選択した時、THE ClickExec SHALL 選択されたファイルまたはフォルダのURIを `clickExec.runTool` コマンドに渡してツール選択ダイアログを表示する
2. WHEN ユーザーがエディタタブのコンテキストメニューから「ClickExec: ツールを実行」を選択した時、THE ClickExec SHALL 対象ファイルのURIを `clickExec.runTool` コマンドに渡してツール選択ダイアログを表示する
3. WHEN ユーザーがコマンドパレットから「ClickExec: ツールを選択して実行」を実行した時、THE ClickExec SHALL 従来通りツール選択ダイアログを表示する
