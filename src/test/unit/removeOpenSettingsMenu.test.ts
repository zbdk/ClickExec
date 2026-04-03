import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: remove-open-settings-menu
 *
 * 「設定を開く」メニュー項目の削除に関するユニットテスト。
 * package.json の構造検証と settingsOpener モジュールの存在確認を行う。
 */

/**
 * Property 1: package.json にコマンド定義が存在しないことの検証
 * Validates: Requirements 1.1, 1.2, 2.1
 */
describe('Feature: remove-open-settings-menu, Property 1: package.json にコマンド定義が存在しないことの検証', () => {
  let packageJson: any;

  before(() => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  });

  it('contributes.commands に clickExec.openSettings が含まれないこと', () => {
    const commands: { command: string }[] = packageJson.contributes.commands;
    const commandIds = commands.map((c) => c.command);
    expect(commandIds).to.not.include('clickExec.openSettings');
  });

  it('contributes.menus.clickExec.submenu に clickExec.openSettings が含まれないこと', () => {
    const submenuEntries: { command: string }[] = packageJson.contributes.menus['clickExec.submenu'];
    const commandIds = submenuEntries.map((e) => e.command);
    expect(commandIds).to.not.include('clickExec.openSettings');
  });
});

/**
 * 要件 3.1: settingsOpener モジュールの保持
 * Validates: Requirements 3.1
 */
describe('Feature: remove-open-settings-menu, 要件 3.1: settingsOpener モジュールの保持', () => {
  it('settingsOpener モジュールが存在し openSettings 関数をエクスポートしていること', () => {
    const settingsOpenerPath = path.resolve(__dirname, '../../settingsOpener.js');
    expect(fs.existsSync(settingsOpenerPath), 'settingsOpener.js が存在すること').to.be.true;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const settingsOpener = require(settingsOpenerPath);
    expect(settingsOpener).to.have.property('openSettings');
    expect(settingsOpener.openSettings).to.be.a('function');
  });
});
