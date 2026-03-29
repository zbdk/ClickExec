# 要件ドキュメント

## はじめに

VSCode拡張機能「ClickExec」は、ユーザーが事前に定義した外部コマンドを、エクスプローラーやエディタタブのコンテキストメニューから実行できる機能を提供する。Visual Studioの「外部ツール」機能に相当するもので、ファイルパスやディレクトリパスなどのプレースホルダーを使って柔軟にコマンドを構成できる。コマンドの実行はVSCodeの統合ターミナル上で行われる。

## 用語集

- **Extension**: VSCode上で動作する本拡張機能
- **Tool_Definition**: ユーザーがVSCode設定（settings.json）で定義する外部ツールの構成情報。コマンド文字列、表示名、プレースホルダーを含む
- **Context_Menu**: エクスプローラーのファイル/フォルダ、またはエディタタブを右クリックした際に表示されるメニュー
- **Placeholder**: コマンド文字列内でファイルパスやディレクトリパスなどの動的な値に置換される変数（例: `${file}`, `${dir}`）
- **Terminal**: VSCodeの統合ターミナル
- **Explorer**: VSCodeのサイドバーに表示されるファイルエクスプローラービュー

## 要件

### 要件 1: ツール定義の設定

**ユーザーストーリー:** 開発者として、外部ツールのコマンドをVSCodeの設定で定義したい。これにより、よく使うコマンドを事前に登録して繰り返し利用できる。

#### 受け入れ基準

1. THE Extension SHALL VSCodeの設定（settings.json）から Tool_Definition の配列を読み込む
2. THE Extension SHALL 各 Tool_Definition に対して、表示名（`name`）、コマンド文字列（`command`）の2つの必須フィールドをサポートする
3. WHEN Tool_Definition に `name` または `command` が未指定の場合、THEN THE Extension SHALL 該当の Tool_Definition を無視し、警告メッセージを出力する
4. THE Extension SHALL 設定変更時に Tool_Definition の一覧を再読み込みする

### 要件 2: プレースホルダーの解決

**ユーザーストーリー:** 開発者として、コマンド文字列内にファイルパスやディレクトリパスのプレースホルダーを使いたい。これにより、対象ファイルに応じた動的なコマンドを実行できる。

#### 受け入れ基準

1. THE Extension SHALL 以下のプレースホルダーをサポートする:
   - `${file}` — 対象ファイルの絶対パス
   - `${fileBasename}` — 対象ファイルのファイル名（拡張子を含む）
   - `${fileBasenameNoExtension}` — 対象ファイルのファイル名（拡張子を除く）
   - `${fileExtname}` — 対象ファイルの拡張子（ドットを含む）
   - `${dir}` — 対象ファイルが存在するディレクトリの絶対パス
   - `${workspaceFolder}` — ワークスペースのルートディレクトリの絶対パス
2. WHEN コマンド文字列にプレースホルダーが含まれる場合、THE Extension SHALL 実行前にすべてのプレースホルダーを対応する実際の値に置換する
3. WHEN コマンド文字列に未知のプレースホルダー（`${...}` 形式で定義外のもの）が含まれる場合、THE Extension SHALL 該当のプレースホルダーを空文字列に置換し、警告メッセージを出力する
4. WHEN プレースホルダーの値が解決できない場合（例: ワークスペースが開かれていない状態での `${workspaceFolder}`）、THEN THE Extension SHALL エラーメッセージを表示し、コマンドの実行を中止する

### 要件 3: コンテキストメニューからの実行

**ユーザーストーリー:** 開発者として、エクスプローラーやエディタタブのファイルを右クリックして、登録済みの外部ツールを実行したい。これにより、ファイル操作のワークフローを効率化できる。

#### 受け入れ基準

1. THE Extension SHALL エクスプローラーのファイル右クリック時の Context_Menu に「ClickExeで実行」サブメニューを表示する
2. THE Extension SHALL エディタタブの右クリック時の Context_Menu に「ClickExeで実行」サブメニューを表示する
3. WHEN Tool_Definition が1つも定義されていない場合、THE Extension SHALL Context_Menu のサブメニュー内に「ツールが未設定です」というメッセージを表示する
4. WHEN ユーザーがサブメニューから Tool_Definition を選択した場合、THE Extension SHALL 選択された Tool_Definition のコマンドを、右クリック対象のファイル情報を使って実行する
5. THE Extension SHALL エクスプローラーのフォルダ右クリック時にも Context_Menu に「外部ツールで実行」サブメニューを表示する
6. WHEN フォルダに対してコマンドが実行された場合、THE Extension SHALL `${file}` と `${dir}` の両方をフォルダの絶対パスに解決する

### 要件 4: ターミナルでのコマンド実行

**ユーザーストーリー:** 開発者として、外部ツールのコマンドをVSCodeの統合ターミナルで実行したい。これにより、コマンドの出力を確認しながら作業を続けられる。

#### 受け入れ基準

1. WHEN コマンドが実行される場合、THE Extension SHALL VSCodeの統合 Terminal にコマンドを送信して実行する
2. THE Extension SHALL コマンド実行時に、Tool_Definition の `name` を Terminal の名前として使用する
3. WHEN 同じ Tool_Definition のコマンドが連続して実行された場合、THE Extension SHALL 既存の同名 Terminal を再利用する
4. IF Terminal の作成に失敗した場合、THEN THE Extension SHALL エラーメッセージを表示する

### 要件 5: コマンドパレットからの実行

**ユーザーストーリー:** 開発者として、コマンドパレットからも外部ツールを実行したい。これにより、キーボードだけで素早くツールを呼び出せる。

#### 受け入れ基準

1. THE Extension SHALL コマンドパレットに「ClickExec: ツールを実行」コマンドを登録する
2. WHEN コマンドパレットからコマンドが実行された場合、THE Extension SHALL 登録済みの Tool_Definition の一覧をクイックピックで表示する
3. WHEN クイックピックで Tool_Definition が選択された場合、THE Extension SHALL アクティブなエディタのファイル情報を使ってコマンドを実行する
4. WHEN クイックピックで Tool_Definition が選択され、アクティブなエディタが存在しない場合、THEN THE Extension SHALL ファイル固有のプレースホルダーを空文字列に解決してコマンドを実行する

### 要件 6: 設定スキーマの提供

**ユーザーストーリー:** 開発者として、settings.jsonで外部ツールを定義する際に入力補完やバリデーションを受けたい。これにより、設定ミスを防げる。

#### 受け入れ基準

1. THE Extension SHALL `package.json` の `contributes.configuration` で Tool_Definition の JSON スキーマを定義する
2. THE Extension SHALL settings.json 編集時に Tool_Definition のプロパティに対する入力補完を提供する
3. THE Extension SHALL Tool_Definition に任意フィールドとして `cwd`（作業ディレクトリ）をサポートする
4. WHEN `cwd` が指定された場合、THE Extension SHALL コマンド実行時の作業ディレクトリとして `cwd` の値を使用する（プレースホルダーの解決を含む）
5. WHEN `cwd` が未指定の場合、THE Extension SHALL `${workspaceFolder}` をデフォルトの作業ディレクトリとして使用する

### 要件 7: settings.json を開くコマンドの登録

**ユーザーストーリー:** 開発者として、コンテキストメニューやコマンドパレットから settings.json の clickExec.tools 設定を直接開きたい。これにより、ツール定義の追加・編集を素早く行える。

#### 受け入れ基準

1. THE Extension SHALL コマンド `clickExec.openSettings` を登録する
2. WHEN `clickExec.openSettings` コマンドが実行された場合、THE Extension SHALL Settings_JSON を開き、`clickExec.tools` セクションにカーソルを移動する
3. THE Extension SHALL コマンドパレットに「ClickExec: 設定を開く」コマンドとして表示する

### 要件 8: コンテキストメニューへの設定メニュー追加

**ユーザーストーリー:** 開発者として、右クリックメニューのClickExecサブメニュー内から設定を開きたい。これにより、ツール実行と設定変更を同じメニューから行える。

#### 受け入れ基準

1. THE Extension SHALL Context_Menu の「ClickExecで実行」サブメニュー内に「設定を開く...」メニュー項目を表示する
2. THE Extension SHALL 「設定を開く...」メニュー項目をサブメニュー内のツール一覧の下部に、区切り線で分離して配置する
3. WHEN ユーザーが「設定を開く...」メニュー項目を選択した場合、THE Extension SHALL `clickExec.openSettings` コマンドを実行する

### 要件 9: ツール未設定時のデフォルトツール自動追加

**ユーザーストーリー:** 開発者として、ClickExecを初めて使う際にツールが未設定でも、エクスプローラーで開くコマンドがデフォルトで用意されていてほしい。これにより、初回利用時にすぐ機能を試せる。

#### 受け入れ基準

1. WHEN Tool_Definition が0件の場合、THE Extension SHALL OS標準のエクスプローラーで対象を開くデフォルトツールを自動的に追加する
2. THE Extension SHALL デフォルトツールの表示名を「エクスプローラーで開く」とする
3. WHEN OSがWindowsの場合、THE Extension SHALL デフォルトツールのコマンドを `explorer ${dir}` とする
4. WHEN OSがmacOSの場合、THE Extension SHALL デフォルトツールのコマンドを `open ${dir}` とする
5. WHEN OSがLinuxの場合、THE Extension SHALL デフォルトツールのコマンドを `xdg-open ${dir}` とする
6. WHEN ユーザーが1件以上の Tool_Definition を設定した場合、THE Extension SHALL デフォルトツールを表示しない
7. THE Extension SHALL デフォルトツールを settings.json に書き込まず、メモリ上でのみ保持する
