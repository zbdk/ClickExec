# バグ修正スペックのルール

## ディレクトリ構造

* bugfixのスペックは `.kiro/specs/bugfixes/` ディレクトリ配下に作成する
* 例: `.kiro/specs/bugfixes/{bugfix-name}/`

## 関連スペックへの反映

* バグ修正の内容は、関係する既存スペックの `requirements.md` と `design.md` にも反映させる
* バグ修正によって要件や設計が変わる場合、元のスペックドキュメントを更新して整合性を保つ
