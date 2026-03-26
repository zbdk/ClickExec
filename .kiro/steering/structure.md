# プロジェクト構成

```
src/
├── extension.ts          # エントリポイント（activate/deactivate）
├── types.ts              # 共通型定義（ToolDefinition, PlaceholderContext, ResolveResult, ExecutionCommand）
├── configurationService.ts  # settings.json からのツール定義読み込み・バリデーション
├── placeholderResolver.ts   # プレースホルダー解決（純粋関数）
├── commandBuilder.ts        # ExecutionCommand の構築
├── terminalManager.ts       # ターミナル作成・再利用・コマンド送信
└── test/
    ├── unit/              # Mocha + Chai ユニットテスト
    ├── property/          # fast-check プロパティベーステスト
    └── integration/       # @vscode/test-electron 統合テスト
```

## アーキテクチャ

3層構造:

1. VSCode API Layer（`extension.ts`）— コマンド登録、メニュー、イベントハンドリング
2. Core Logic Layer — `ConfigurationService`, `PlaceholderResolver`, `CommandBuilder`（VSCode API非依存、テスト容易）
3. Execution Layer — `TerminalManager`（ターミナル管理）

## 設計方針

- コアロジック（プレースホルダー解決等）はVSCode APIに依存しない純粋関数として実装し、テスタビリティを確保
- 型定義は `src/types.ts` に集約
- スペックは `.kiro/specs/` 配下、バグ修正スペックは `.kiro/specs/bugfixes/` 配下に配置
