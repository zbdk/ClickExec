# 要件ドキュメント

## はじめに

VSCode拡張機能「ClickExec」のリリースプロセスを自動化する。GitHub Actionsを使用して、Gitタグのプッシュをトリガーにvsixパッケージをビルドし、GitHub Releaseとして公開する。これにより、手動でのvsixビルド・アップロード作業を排除し、一貫性のあるリリースフローを実現する。

## 用語集

- **Release_Workflow**: GitHub Actionsで定義されるCI/CDワークフロー。タグプッシュをトリガーにvsixパッケージのビルドとGitHub Releaseの作成を自動実行する
- **VSIX_Package**: VSCode拡張機能の配布形式ファイル（`.vsix`）。`@vscode/vsce` ツールによって生成される
- **GitHub_Release**: GitHubリポジトリ上のリリースページに公開されるバージョン付きリリース。リリースノートとアセット（vsixファイル）を含む
- **Version_Tag**: セマンティックバージョニングに基づくGitタグ（例: `v0.0.5`）。リリースワークフローのトリガーとなる
- **VSCE_CLI**: `@vscode/vsce` パッケージが提供するコマンドラインツール。vsixパッケージの生成に使用する
- **Package_Script**: `package.json` の `scripts` セクションに定義される `vsce:package` コマンド。vsixパッケージ生成を実行する

## 要件

### 要件 1: vsixパッケージ生成の準備

**ユーザーストーリー:** 開発者として、vsixパッケージをコマンド一つで生成できるようにしたい。これにより、ローカルでもCI環境でも同じ方法でパッケージを作成できる。

#### 受け入れ基準

1. THE Package_Script SHALL `@vscode/vsce` パッケージを devDependencies に含める
2. THE Package_Script SHALL `package.json` の `scripts` セクションに `vsce:package` コマンドを定義し、`vsce package` を実行する
3. WHEN `npm run vsce:package` が実行された場合、THE VSCE_CLI SHALL カレントディレクトリに `clickexec-{version}.vsix` ファイルを生成する
4. THE Package_Script SHALL `.vscodeignore` ファイルにより、ソースファイル（`src/`）、テストファイル（`out/test/`）、既存のvsixファイル（`*.vsix`）をパッケージから除外する

### 要件 2: GitHub Actionsリリースワークフローの定義

**ユーザーストーリー:** 開発者として、Gitタグをプッシュするだけで自動的にvsixパッケージがビルドされ、GitHub Releaseが作成されるようにしたい。これにより、リリース作業を簡素化し、人的ミスを防げる。

#### 受け入れ基準

1. THE Release_Workflow SHALL `.github/workflows/release.yml` ファイルとして定義される
2. WHEN `v*` パターンに一致する Version_Tag がプッシュされた場合、THE Release_Workflow SHALL 自動的に実行を開始する
3. THE Release_Workflow SHALL Node.js環境をセットアップし、`npm ci` で依存関係をインストールする
4. THE Release_Workflow SHALL `npm run compile` でTypeScriptのコンパイルを実行する
5. THE Release_Workflow SHALL `npm test` でテストを実行し、全テストが成功することを確認する
6. THE Release_Workflow SHALL テスト成功後に `npm run vsce:package` でvsixパッケージを生成する
7. IF コンパイルまたはテストが失敗した場合、THEN THE Release_Workflow SHALL vsixパッケージの生成とリリースの作成を中止する

### 要件 3: GitHub Releaseの作成

**ユーザーストーリー:** 開発者として、GitHub Releaseページにvsixパッケージが自動的にアップロードされるようにしたい。これにより、ユーザーがリリースページからvsixファイルを直接ダウンロードできる。

#### 受け入れ基準

1. WHEN vsixパッケージの生成が成功した場合、THE Release_Workflow SHALL GitHub Releaseを作成する
2. THE Release_Workflow SHALL Version_Tag の値をリリースタイトルとして使用する（例: `v0.0.5`）
3. THE Release_Workflow SHALL 生成されたvsixファイルをGitHub Releaseのアセットとして添付する
4. THE Release_Workflow SHALL リリースノートをGitHubの自動生成機能（`generate_release_notes: true`）で作成する
5. THE Release_Workflow SHALL リリースをドラフトではなく公開状態で作成する

### 要件 4: ワークフローの権限とセキュリティ

**ユーザーストーリー:** 開発者として、リリースワークフローが必要最小限の権限で動作するようにしたい。これにより、セキュリティリスクを最小化できる。

#### 受け入れ基準

1. THE Release_Workflow SHALL `permissions` セクションで `contents: write` 権限を明示的に指定する
2. THE Release_Workflow SHALL GitHub Actionsが提供する `GITHUB_TOKEN` を使用してリリースを作成する（追加のシークレット設定を不要とする）
3. THE Release_Workflow SHALL 公式のGitHubアクション（`actions/checkout`, `actions/setup-node`）および信頼性の高いコミュニティアクション（`softprops/action-gh-release`）のみを使用する
4. THE Release_Workflow SHALL 使用するアクションのバージョンをメジャーバージョンタグで固定する（例: `actions/checkout@v4`）

### 要件 5: 既存vsixファイルのクリーンアップ

**ユーザーストーリー:** 開発者として、リポジトリルートに残っている過去のvsixファイルを整理したい。これにより、リポジトリをクリーンに保ち、自動リリースへの移行を完了できる。

#### 受け入れ基準

1. THE Release_Workflow SHALL リポジトリルートに存在する既存のvsixファイル（`clickexec-0.0.1.vsix` ～ `clickexec-0.0.4.vsix`）の削除をリリース移行タスクとして含める
2. THE Release_Workflow SHALL `.gitignore` に `*.vsix` が含まれていることを前提とし、今後vsixファイルがリポジトリにコミットされないことを保証する
3. THE Release_Workflow SHALL `.vscodeignore` に `*.vsix` パターンを含め、vsixパッケージ内に過去のvsixファイルが含まれないようにする
