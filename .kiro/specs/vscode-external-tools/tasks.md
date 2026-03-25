# 実装計画: ClickExec

## 概要

VSCode拡張機能「ClickExec」を、設計ドキュメントに基づきモジュール分割で段階的に実装する。コアロジック（プレースホルダー解決、ツール定義バリデーション）を純粋関数として先に実装し、その後VSCode APIとの統合を行う。

## タスク

- [ ] 1. プロジェクト構造のセットアップ
  - [ ] 1.1 VSCode拡張機能プロジェクトの初期化
    - `package.json` を作成し、拡張機能のメタデータ、`activationEvents`、`contributes`（configuration, commands, menus, submenus）を定義する
    - `tsconfig.json` を作成し、TypeScriptコンパイル設定を行う
    - 開発依存パッケージ（`@types/vscode`, `typescript`, `mocha`, `chai`, `fast-check`, `@vscode/test-electron`）をインストールする
    - _Requirements: 6.1, 6.2_

  - [ ] 1.2 コアインターフェースと型定義の作成
    - `src/types.ts` に `ToolDefinition`, `PlaceholderContext`, `ResolveResult`, `ExecutionCommand` インターフェースを定義する
    - _Requirements: 1.2, 2.1_

- [ ] 2. ConfigurationService の実装
  - [ ] 2.1 ConfigurationService クラスの実装
    - `src/configurationService.ts` を作成する
    - `loadTools()` メソッドで `vscode.workspace.getConfiguration('clickExec').get<any[]>('tools')` からツール定義を読み込む
    - `name`（非空文字列）と `command`（非空文字列）のバリデーションを行い、無効な定義をスキップして警告を出力する
    - `onDidChangeTools()` メソッドで `vscode.workspace.onDidChangeConfiguration` を監視する
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 2.2 Property 1 のプロパティテストを作成
    - **Property 1: ツール定義のバリデーション — 有効な定義のみが返される**
    - 任意のオブジェクト配列に対して、`name`と`command`の両方を持つオブジェクトのみが返され、それ以外はフィルタリングされることを検証する
    - `src/test/property/configurationService.property.test.ts` に実装する
    - **Validates: Requirements 1.2, 1.3**

- [ ] 3. PlaceholderResolver の実装
  - [ ] 3.1 PlaceholderResolver クラスの実装
    - `src/placeholderResolver.ts` を作成する
    - `resolve(template, context)` メソッドで6種の既知プレースホルダー（`${file}`, `${fileBasename}`, `${fileBasenameNoExtension}`, `${fileExtname}`, `${dir}`, `${workspaceFolder}`）を対応する値に置換する
    - 未知のプレースホルダー（`${...}` 形式で定義外のもの）を空文字列に置換し、警告リストに追加する
    - プレースホルダーの値が解決できない場合（例: `context.workspaceFolder` が undefined で `${workspaceFolder}` が使用された場合）はエラーをスローする
    - フォルダコンテキストの場合、`${file}` と `${dir}` の両方をフォルダパスに解決する
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.6_

  - [ ]* 3.2 Property 2 のプロパティテストを作成
    - **Property 2: 既知プレースホルダーの正しい解決**
    - 任意のファイルパスとワークスペースフォルダパスに対して、各既知プレースホルダーが正しい値に解決されることを検証する
    - `src/test/property/placeholderResolver.property.test.ts` に実装する
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.3 Property 3 のプロパティテストを作成
    - **Property 3: 未知プレースホルダーの空文字列置換**
    - 任意の未知プレースホルダー名を含むコマンド文字列に対して、空文字列に置換され警告が生成されることを検証する
    - `src/test/property/placeholderResolver.property.test.ts` に追加する
    - **Validates: Requirements 2.3**

  - [ ]* 3.4 Property 4 のプロパティテストを作成
    - **Property 4: フォルダコンテキストでのプレースホルダー解決**
    - 任意のフォルダパスに対して、`${file}` と `${dir}` の両方がフォルダパスに解決されることを検証する
    - `src/test/property/placeholderResolver.property.test.ts` に追加する
    - **Validates: Requirements 3.6**

  - [ ]* 3.5 Property 6 のプロパティテストを作成
    - **Property 6: プレースホルダー解決のべき等性**
    - 任意のコマンド文字列に対して、1回と2回の解決結果が同一であることを検証する
    - `src/test/property/placeholderResolver.property.test.ts` に追加する
    - **Validates: Requirements 2.2**

- [ ] 4. CommandBuilder の実装
  - [ ] 4.1 CommandBuilder クラスの実装
    - `src/commandBuilder.ts` を作成する
    - `build(tool, context)` メソッドで `PlaceholderResolver` を使ってコマンド文字列と `cwd` のプレースホルダーを解決する
    - `cwd` 未指定時は `${workspaceFolder}` をデフォルトとする
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ]* 4.2 Property 5 のプロパティテストを作成
    - **Property 5: cwdのプレースホルダー解決とデフォルト値**
    - 任意のToolDefinitionとPlaceholderContextに対して、cwdの解決結果が正しいことを検証する
    - `src/test/property/commandBuilder.property.test.ts` に実装する
    - **Validates: Requirements 6.4, 6.5**

- [ ] 5. チェックポイント — コアロジックの検証
  - すべてのテストが通ることを確認し、ユーザーに質問があれば確認する。

- [ ] 6. TerminalManager の実装
  - [ ] 6.1 TerminalManager クラスの実装
    - `src/terminalManager.ts` を作成する
    - `Map<string, vscode.Terminal>` でターミナルを管理する
    - `execute(command)` メソッドで、同名ターミナルが存在すれば再利用し、なければ新規作成してコマンドを送信する
    - `vscode.window.onDidCloseTerminal` で閉じられたターミナルをMapから削除する
    - `dispose()` メソッドで管理中のターミナル参照をすべて解放する
    - ターミナル作成失敗時はエラーメッセージを表示する
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.2 TerminalManager のユニットテストを作成
    - ターミナル名の設定、同名ターミナルの再利用、閉じられたターミナルの参照解放をテストする
    - `src/test/unit/terminalManager.test.ts` に実装する
    - _Requirements: 4.2, 4.3_

- [ ] 7. Extension Entry Point の実装とメニュー統合
  - [ ] 7.1 extension.ts の実装
    - `src/extension.ts` を作成する
    - `activate()` で ConfigurationService, CommandBuilder, TerminalManager を初期化する
    - コンテキストメニューコマンド `clickExec.runTool` を登録する（URI引数からPlaceholderContextを構築し、ツール選択→コマンド実行）
    - コマンドパレットコマンド `clickExec.selectAndRunTool` を登録する（アクティブエディタからPlaceholderContextを構築、エディタなしの場合はfilePath未定義）
    - ツール定義が0件の場合、クイックピックに「ツールが未設定です」メッセージを表示する
    - 設定変更リスナーを登録する
    - `deactivate()` で TerminalManager を dispose する
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4_

  - [ ] 7.2 package.json のメニュー定義を完成させる
    - `contributes.menus` にエクスプローラーコンテキスト（`explorer/context`）、エディタタブコンテキスト（`editor/title/context`）のサブメニュー登録を追加する
    - `contributes.submenus` に「ClickExecで実行」サブメニューを定義する
    - 動的メニュー項目の登録（ツール定義ごとのメニューアイテム）を実装する
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 8. 最終チェックポイント — 全体の検証
  - すべてのテストが通ることを確認し、ユーザーに質問があれば確認する。

## 備考

- `*` マーク付きのタスクはオプションであり、MVP実装時にはスキップ可能
- 各タスクは特定の要件を参照しており、トレーサビリティを確保している
- チェックポイントで段階的な検証を行う
- プロパティテストは正確性プロパティの検証に使用し、ユニットテストはエッジケースの検証に使用する
