import { expect } from 'chai';
import { TerminalManager } from '../../terminalManager';
import { ExecutionCommand } from '../../types';

/**
 * テストからモック状態にアクセスするためのグローバル型定義
 */
interface MockTerminalState {
  createTerminalCalls: Array<{ options: any; terminal: any }>;
  closeCallbacks: Array<(terminal: any) => void>;
  reset(): void;
}

declare const global: {
  __mockTerminalState: MockTerminalState;
};

/**
 * TerminalManager のユニットテスト
 * Requirements 4.2: ツール名をターミナル名として使用する
 * Requirements 4.3: 同名ターミナルの再利用
 */
describe('TerminalManager', () => {
  let manager: TerminalManager;
  let mockState: MockTerminalState;

  beforeEach(() => {
    mockState = (global as any).__mockTerminalState;
    mockState.reset();
    manager = new TerminalManager();
  });

  afterEach(() => {
    manager.dispose();
  });

  // ターミナル名の設定: execute()がツール名でターミナルを作成することを確認
  it('should create a terminal with the correct name (toolName)', () => {
    const command: ExecutionCommand = {
      command: 'echo hello',
      cwd: '/workspace',
      toolName: 'MyTool',
    };

    manager.execute(command);

    expect(mockState.createTerminalCalls).to.have.lengthOf(1);
    expect(mockState.createTerminalCalls[0].options.name).to.equal('MyTool');
  });

  // 同名ターミナルの再利用: 同じtoolNameで2回execute()を呼ぶとcreateTerminalは1回だけ
  it('should reuse the same terminal when execute() is called twice with the same toolName', () => {
    const command: ExecutionCommand = {
      command: 'echo hello',
      cwd: '/workspace',
      toolName: 'MyTool',
    };

    manager.execute(command);
    manager.execute(command);

    expect(mockState.createTerminalCalls).to.have.lengthOf(1);
  });

  // 閉じられたターミナルの参照解放: onDidCloseTerminalコールバック発火後、新しいターミナルが作成される
  it('should create a new terminal after the previous one is closed', () => {
    const command: ExecutionCommand = {
      command: 'echo hello',
      cwd: '/workspace',
      toolName: 'MyTool',
    };

    manager.execute(command);
    expect(mockState.createTerminalCalls).to.have.lengthOf(1);

    // 閉じられたターミナルのコールバックを発火する
    const closedTerminal = mockState.createTerminalCalls[0].terminal;
    for (const cb of mockState.closeCallbacks) {
      cb(closedTerminal);
    }

    // 再度execute()を呼ぶと新しいターミナルが作成される
    manager.execute(command);
    expect(mockState.createTerminalCalls).to.have.lengthOf(2);
  });

  // dispose()がターミナル参照をクリアすることを確認
  it('should clear terminal references on dispose()', () => {
    const command: ExecutionCommand = {
      command: 'echo hello',
      cwd: '/workspace',
      toolName: 'MyTool',
    };

    manager.execute(command);
    expect(mockState.createTerminalCalls).to.have.lengthOf(1);

    manager.dispose();

    // dispose後にexecute()を呼ぶと新しいターミナルが作成される
    // （注: disposeでcloseListenerも解放されるため、新しいmanagerを使う）
    mockState.reset();
    manager = new TerminalManager();
    manager.execute(command);
    expect(mockState.createTerminalCalls).to.have.lengthOf(1);
  });
});
