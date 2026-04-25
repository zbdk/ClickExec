# 実装計画: GitHub Actionsリリースワークフロー

## 概要

ClickExec拡張機能のリリースプロセスをGitHub Actionsで自動化する。`@vscode/vsce` の devDependencies 追加、`vsce:package` npm script の定義、`.github/workflows/release.yml` の作成、既存vsixファイルの削除、および関連スペックの更新を行う。

## タスク

- [x] 1. `@vscode/vsce` の追加と `vsce:package` スクリプトの定義
  - [x] 1.1 `package.json` の `devDependencies` に `@vscode/vsce` を追加する
    - `"@vscode/vsce": "^3.0.0"` を devDependencies に追加
    - `npm install` を実行して `package-lock.json` を更新
    - _要件: 1.1_
  - [x] 1.2 `package.json` の `scripts` セクションに `vsce:package` コマンドを追加する
    - `"vsce:package": "vsce package"` を scripts に追加
    - _要件: 1.2_

- [x] 2. GitHub Actionsリリースワークフローの作成
  - [x] 2.1 `.github/workflows/release.yml` ファイルを新規作成する
    - `name: Release` でワークフロー名を定義
    - `on.push.tags: ['v*']` でトリガー条件を設定
    - `permissions.contents: write` で最小権限を指定
    - `jobs.release` を `ubuntu-latest` で定義
    - _要件: 2.1, 2.2, 4.1_
  - [x] 2.2 ビルド・テストステップを定義する
    - `actions/checkout@v4` でリポジトリをチェックアウト
    - `actions/setup-node@v4` で Node.js 20 をセットアップ（`cache: 'npm'` を有効化）
    - `npm ci` で依存関係をインストール
    - `npm run compile` で TypeScript をコンパイル
    - `npm test` でテストを実行
    - _要件: 2.3, 2.4, 2.5, 2.7, 4.3, 4.4_
  - [x] 2.3 vsixパッケージ生成とGitHub Releaseステップを定義する
    - `npm run vsce:package` でvsixパッケージを生成
    - `softprops/action-gh-release@v2` でGitHub Releaseを作成
    - `files: '*.vsix'` でvsixファイルをアセットとして添付
    - `generate_release_notes: true` でリリースノートを自動生成
    - `draft: false` で公開状態に設定
    - `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` を環境変数として設定
    - _要件: 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 4.2_

- [x] 3. チェックポイント - ワークフロー定義の確認
  - ワークフローYAMLの構文が正しいことを確認し、ユーザーに質問があれば確認する

- [x] 4. 既存vsixファイルのクリーンアップ
  - [x] 4.1 リポジトリルートの既存vsixファイルを削除する
    - `clickexec-0.0.1.vsix` を削除
    - `clickexec-0.0.2.vsix` を削除
    - `clickexec-0.0.3.vsix` を削除
    - `clickexec-0.0.4.vsix` を削除
    - _要件: 5.1_
  - [x] 4.2 `.gitignore` と `.vscodeignore` に `*.vsix` パターンが含まれていることを確認する
    - `.gitignore` に `*.vsix` が既に含まれていることを確認（変更不要の場合はスキップ）
    - `.vscodeignore` に `*.vsix` が既に含まれていることを確認（変更不要の場合はスキップ）
    - _要件: 5.2, 5.3_

- [x] 5. 関連スペックの更新
  - [x] 5.1 `vscode-external-tools` スペックの `design.md` にリリースワークフロー関連の情報を反映する
    - `.kiro/specs/vscode-external-tools/design.md` のビルド・実行コマンドセクションに `vsce:package` スクリプトの説明を追加
    - devDependencies に `@vscode/vsce` が追加されたことを反映
    - _要件: 1.1, 1.2_

- [x] 6. 最終チェックポイント - 全体確認
  - 全ての変更が正しく行われていることを確認し、ユーザーに質問があれば確認する

## 備考

- 本機能はCI/CDパイプラインの構築であり、プロパティベーステスト（PBT）は適用しない
- 各タスクは具体的な要件番号を参照しており、トレーサビリティを確保している
- `.gitignore` と `.vscodeignore` には既に `*.vsix` パターンが含まれているため、変更は不要の見込み
- チェックポイントでは段階的な検証を行う
