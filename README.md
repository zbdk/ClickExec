# ClickExec

エクスプローラーやエディタタブのコンテキストメニュー、またはコマンドパレットから、ユーザーが事前定義した外部コマンドを実行できるVSCode / Kiro拡張機能です。Visual Studioの「外部ツール」機能に相当します。

## 機能

- `settings.json` でツール定義（名前・コマンド・作業ディレクトリ）を登録
- `${file}`, `${dir}`, `${workspaceFolder}` 等のプレースホルダーによる動的コマンド構成
- コンテキストメニュー（エクスプローラー / エディタタブ）からのツール実行
- コマンドパレットからのツール選択・実行
- VSCode統合ターミナルでのコマンド実行（同名ターミナルの再利用あり）

## 使い方

### ツール定義

`settings.json` に `clickExec.tools` を追加します:

```json
{
  "clickExec.tools": [
    {
      "name": "エクスプローラーで開く",
      "command": "explorer ${dir}"
    },
    {
      "name": "Python実行",
      "command": "python ${file}",
      "cwd": "${dir}"
    },
    {
      "name": "Git Log",
      "command": "git log --oneline -20",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

各ツール定義のフィールド:

| フィールド | 必須 | 説明 |
|---|---|---|
| `name` | ○ | ツールの表示名（ターミナル名にも使用） |
| `command` | ○ | 実行するコマンド文字列（プレースホルダー使用可） |
| `cwd` | | 作業ディレクトリ（未指定時はワークスペースルート） |

### プレースホルダー

コマンド文字列と `cwd` で以下のプレースホルダーが使えます:

| プレースホルダー | 説明 |
|---|---|
| `${file}` | 対象ファイルの絶対パス |
| `${fileBasename}` | ファイル名（拡張子を含む） |
| `${fileBasenameNoExtension}` | ファイル名（拡張子を除く） |
| `${fileExtname}` | 拡張子（ドットを含む） |
| `${dir}` | ファイルが存在するディレクトリの絶対パス |
| `${workspaceFolder}` | ワークスペースのルートディレクトリ |

フォルダを右クリックした場合、`${file}` と `${dir}` の両方がフォルダパスに解決されます。

### 実行方法

1. **コンテキストメニュー**: エクスプローラーまたはエディタタブでファイル/フォルダを右クリック →「ClickExecで実行」
2. **コマンドパレット**: `Ctrl+Shift+P` →「ClickExec: ツールを選択して実行」

## 開発

### セットアップ

```bash
npm install
npm run compile
```


### デバッグ実行（F5）

VSCode / Kiro でこのプロジェクトを開き、`F5` を押すとExtension Development Hostが起動します。新しいウィンドウで拡張機能の動作を確認できます。

- ブレークポイントの設定やステップ実行が可能
- `src/` 内のファイルを変更後、Development Hostをリロード（`Ctrl+Shift+F5`）で反映

### ビルド

```bash
npm run compile    # TypeScriptコンパイル
npm run watch      # ウォッチモードでコンパイル
```

### テスト

```bash
npm test              # 全テスト実行
npm run test:property # プロパティテストのみ実行
```

### VSIXパッケージの作成

```bash
npm install -g @vscode/vsce
vsce package
```

生成された `.vsix` ファイルを、VSCode / Kiro の「拡張機能」→「...」→「VSIXからインストール」で導入できます。

## プロジェクト構成

```
src/
├── extension.ts            # エントリポイント（activate/deactivate）
├── types.ts                # 共通型定義
├── configurationService.ts # ツール定義の読み込み・バリデーション
├── placeholderResolver.ts  # プレースホルダー解決（純粋関数）
├── commandBuilder.ts       # コマンド構築
├── terminalManager.ts      # ターミナル管理
└── test/
    ├── unit/               # ユニットテスト
    └── property/           # プロパティベーステスト（fast-check）
```

## ライセンス

MIT
