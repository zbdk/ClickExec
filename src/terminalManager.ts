import * as vscode from 'vscode';
import { ExecutionCommand } from './types';

/**
 * ターミナルの作成・再利用・コマンド送信を管理するクラス。
 * ツール名をキーとしてターミナルを保持し、同名ターミナルが存在すれば再利用する。
 */
export class TerminalManager {
  /** ツール名 → ターミナルのマップ */
  private terminals: Map<string, vscode.Terminal> = new Map();

  /** onDidCloseTerminal のサブスクリプション */
  private closeListener: vscode.Disposable;

  constructor() {
    // ターミナルが閉じられたらMapから参照を削除する
    this.closeListener = vscode.window.onDidCloseTerminal((closedTerminal) => {
      for (const [name, terminal] of this.terminals) {
        if (terminal === closedTerminal) {
          this.terminals.delete(name);
          break;
        }
      }
    });
  }

  /**
   * 指定されたコマンドをターミナルで実行する。
   * 同名のターミナルが既に存在する場合は再利用し、なければ新規作成する。
   */
  execute(command: ExecutionCommand): void {
    let terminal = this.terminals.get(command.toolName);

    if (!terminal) {
      try {
        terminal = vscode.window.createTerminal({
          name: command.toolName,
          cwd: command.cwd,
        });
        this.terminals.set(command.toolName, terminal);
      } catch (error) {
        vscode.window.showErrorMessage(
          `ClickExec: ターミナルの作成に失敗しました: ${command.toolName}`
        );
        return;
      }
    }

    terminal.sendText(command.command);
    terminal.show();
  }

  /**
   * 管理中のターミナル参照をすべて解放する。
   * ターミナル自体のdisposeは行わず、参照のみクリアする。
   */
  dispose(): void {
    this.terminals.clear();
    this.closeListener.dispose();
  }
}
