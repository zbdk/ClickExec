/**
 * Mochaテスト実行前のセットアップ（プレーンJS）。
 * vscodeモジュールのモックをrequire.cacheに事前登録する。
 */
'use strict';

/**
 * テストからモック状態にアクセスするためのグローバルオブジェクト。
 * createTerminalの呼び出し履歴やonDidCloseTerminalコールバックを追跡する。
 */
const mockTerminalState = {
  /** createTerminalの呼び出し引数の履歴 */
  createTerminalCalls: [],
  /** onDidCloseTerminalに登録されたコールバック一覧 */
  closeCallbacks: [],
  /** 状態をリセットする */
  reset() {
    this.createTerminalCalls = [];
    this.closeCallbacks = [];
  },
};

// グローバルに公開してテストからアクセス可能にする
global.__mockTerminalState = mockTerminalState;

const mockVscode = {
  workspace: {
    getConfiguration() {
      return {
        get() {
          return undefined;
        },
      };
    },
    onDidChangeConfiguration() {
      return { dispose() {} };
    },
  },
  window: {
    showWarningMessage() {},
    showErrorMessage() {},
    showInformationMessage() {},
    /**
     * モックターミナルを作成する。
     * sendText()とshow()メソッドを持つオブジェクトを返す。
     */
    createTerminal(options) {
      const terminal = {
        name: options && options.name ? options.name : '',
        sendText() {},
        show() {},
      };
      mockTerminalState.createTerminalCalls.push({ options, terminal });
      return terminal;
    },
    /**
     * ターミナルが閉じられた時のコールバックを登録する。
     * テストからコールバックを発火できるようにする。
     */
    onDidCloseTerminal(callback) {
      mockTerminalState.closeCallbacks.push(callback);
      return { dispose() {} };
    },
  },
  /** ConfigurationTarget の列挙値モック */
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
  },
};

// 'vscode'をresolveしようとするとエラーになるため、
// Module._cacheにダミーエントリを作成してrequire('vscode')をインターセプトする
const Module = require('module');
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'vscode') {
    return mockVscode;
  }
  return originalLoad.call(this, request, parent, isMain);
};
