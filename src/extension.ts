import * as vscode from 'vscode';
import { ConfigurationService } from './configurationService';
import { PlaceholderResolver } from './placeholderResolver';
import { CommandBuilder } from './commandBuilder';
import { TerminalManager } from './terminalManager';
import { ToolDefinition, PlaceholderContext } from './types';
import { DefaultToolPersistenceService } from './defaultToolPersistenceService';
import { openSettings } from './settingsOpener';

/** 現在のツール定義リスト（設定変更時に更新される） */
let currentTools: ToolDefinition[] = [];

/** ターミナルマネージャのインスタンス（deactivate時にdisposeする） */
let terminalManager: TerminalManager;

/**
 * ツール選択クイックピックを表示し、選択されたツールのコマンドを実行する。
 * ツール定義が0件の場合は案内メッセージを表示する。
 */
async function selectAndRunTool(
  tools: ToolDefinition[],
  context: PlaceholderContext,
  commandBuilder: CommandBuilder,
  terminal: TerminalManager,
  persistenceService: DefaultToolPersistenceService
): Promise<void> {
  // ツール定義が0件の場合、永続化サービスを通じてツールを解決
  const effectiveTools = tools.length === 0
    ? await persistenceService.resolveTools(process.platform)
    : tools;

  // クイックピックでツール選択
  const items = effectiveTools.map((tool) => ({ label: tool.name, tool }));
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '実行するツールを選択してください',
  });

  if (!selected) {
    return;
  }

  // コマンドを構築して実行
  const buildResult = commandBuilder.build(selected.tool, context);

  // 警告メッセージを表示
  for (const warning of buildResult.warnings) {
    vscode.window.showWarningMessage(warning);
  }

  terminal.execute(buildResult.executionCommand);
}

/**
 * 拡張機能のアクティベーション。
 * サービスの初期化、コマンド登録、設定変更リスナーの登録を行う。
 */
export function activate(context: vscode.ExtensionContext): void {
  // サービスの初期化
  const configService = new ConfigurationService();
  const resolver = new PlaceholderResolver();
  const commandBuilder = new CommandBuilder(resolver);
  terminalManager = new TerminalManager();
  const persistenceService = new DefaultToolPersistenceService();

  // 初回のツール定義読み込み
  currentTools = configService.loadTools();

  // コンテキストメニューコマンド: clickExec.runTool
  const runToolDisposable = vscode.commands.registerCommand(
    'clickExec.runTool',
    async (uri: vscode.Uri) => {
      try {
        // URIがファイルかフォルダかを判定
        const stat = await vscode.workspace.fs.stat(uri);
        const isFolder = (stat.type & vscode.FileType.Directory) !== 0;

        // PlaceholderContextを構築
        const placeholderContext: PlaceholderContext = {
          filePath: uri.fsPath,
          workspaceFolder: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
          isFolder,
        };

        await selectAndRunTool(currentTools, placeholderContext, commandBuilder, terminalManager, persistenceService);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`ClickExec: ${message}`);
      }
    }
  );

  // コマンドパレットコマンド: clickExec.selectAndRunTool
  const selectAndRunToolDisposable = vscode.commands.registerCommand(
    'clickExec.selectAndRunTool',
    async () => {
      try {
        const activeEditor = vscode.window.activeTextEditor;

        // PlaceholderContextを構築
        const placeholderContext: PlaceholderContext = {
          filePath: activeEditor?.document.uri.fsPath,
          workspaceFolder: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        };

        await selectAndRunTool(currentTools, placeholderContext, commandBuilder, terminalManager, persistenceService);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`ClickExec: ${message}`);
      }
    }
  );

  // 設定変更リスナーの登録
  const configChangeDisposable = configService.onDidChangeTools((tools) => {
    currentTools = tools;
  });

  // openSettings コマンドの登録
  const openSettingsDisposable = vscode.commands.registerCommand(
    'clickExec.openSettings',
    () => openSettings()
  );

  // すべてのDisposableを登録
  context.subscriptions.push(
    runToolDisposable,
    selectAndRunToolDisposable,
    openSettingsDisposable,
    configChangeDisposable,
    { dispose: () => terminalManager.dispose() }
  );
}

/**
 * 拡張機能のディアクティベーション。
 * TerminalManagerのリソースを解放する。
 */
export function deactivate(): void {
  if (terminalManager) {
    terminalManager.dispose();
  }
}
