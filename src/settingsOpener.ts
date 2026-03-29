import * as vscode from 'vscode';

/** 検索対象のキー文字列 */
const SETTINGS_KEY = '"clickExec.tools"';

/**
 * settings.json を開き、clickExec.tools セクションにカーソルを移動する。
 * セクションが見つからない場合はファイルの先頭を表示する。
 */
export async function openSettings(): Promise<void> {
  try {
    await vscode.commands.executeCommand('workbench.action.openSettingsJson');

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const index = text.indexOf(SETTINGS_KEY);

    if (index >= 0) {
      // clickExec.tools が見つかった場合、その位置にカーソルを移動
      const position = document.positionAt(index);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    } else {
      // 見つからない場合はファイルの先頭を表示
      const start = new vscode.Position(0, 0);
      editor.selection = new vscode.Selection(start, start);
      editor.revealRange(new vscode.Range(start, start));
    }
  } catch (error) {
    vscode.window.showErrorMessage('ClickExec: settings.json を開けませんでした');
  }
}
