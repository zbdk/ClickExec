import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: flatten-context-menu
 *
 * コンテキストメニューのフラット化に関するユニットテスト。
 * package.json の構造検証を行い、サブメニュー定義が削除され、
 * コマンドが直接配置されていることを確認する。
 */

/**
 * Property 1: package.json にサブメニュー定義が存在しないことの検証
 * Validates: Requirements 1.1, 1.2, 1.3
 */
describe('Feature: flatten-context-menu, Property 1: package.json にサブメニュー定義が存在しないことの検証', () => {
  let packageJson: any;

  before(() => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  });

  it('contributes.submenus セクションが存在しないこと', () => {
    expect(packageJson.contributes).to.not.have.property('submenus');
  });

  it('contributes.menus に clickExec.submenu キーが存在しないこと', () => {
    const menus = packageJson.contributes.menus;
    expect(menus).to.not.have.property('clickExec.submenu');
  });
});

/**
 * Property 2: コマンドがコンテキストメニューに直接配置されていることの検証
 * Validates: Requirements 2.1, 2.2, 2.3
 */
describe('Feature: flatten-context-menu, Property 2: コマンドがコンテキストメニューに直接配置されていることの検証', () => {
  let packageJson: any;

  before(() => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  });

  it('explorer/context に clickExec.runTool コマンドが直接配置されていること', () => {
    const explorerContext: { command?: string }[] = packageJson.contributes.menus['explorer/context'];
    const commands = explorerContext.map((entry) => entry.command);
    expect(commands).to.include('clickExec.runTool');
  });

  it('editor/title/context に clickExec.runTool コマンドが直接配置されていること', () => {
    const editorTitleContext: { command?: string }[] = packageJson.contributes.menus['editor/title/context'];
    const commands = editorTitleContext.map((entry) => entry.command);
    expect(commands).to.include('clickExec.runTool');
  });

  it('explorer/context の clickExec.runTool エントリが clickExec グループに属していること', () => {
    const explorerContext: { command?: string; group?: string }[] = packageJson.contributes.menus['explorer/context'];
    const entry = explorerContext.find((e) => e.command === 'clickExec.runTool');
    expect(entry).to.not.be.undefined;
    expect(entry!.group).to.equal('clickExec');
  });

  it('editor/title/context の clickExec.runTool エントリが clickExec グループに属していること', () => {
    const editorTitleContext: { command?: string; group?: string }[] = packageJson.contributes.menus['editor/title/context'];
    const entry = editorTitleContext.find((e) => e.command === 'clickExec.runTool');
    expect(entry).to.not.be.undefined;
    expect(entry!.group).to.equal('clickExec');
  });
});
