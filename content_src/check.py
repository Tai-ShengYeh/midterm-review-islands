"""檢查 content_src/<id>.json 是否符合 SCHEMA.md。用法：python check.py gchem.json"""
import json, sys
from pathlib import Path

LANDMARKS = {'flask', 'balance', 'oven', 'burette', 'molecule', 'atom', 'helix', 'enzyme',
             'book', 'scroll', 'chart', 'food', 'cup', 'microscope', 'leaf'}
BANNED = ['以上皆', '皆是', '皆非', '以上都', 'A 和 B', 'A和B', '選項']


def check(path):
    p = Path(path)
    if not p.is_absolute():
        p = Path(__file__).parent / p
    raw = p.read_bytes()
    errs = []
    if raw.startswith(b'\xef\xbb\xbf'):
        errs.append('檔案有 BOM')
    d = json.loads(raw.decode('utf-8-sig'))
    L = lambda s: len(str(s))

    def need(cond, msg):
        if not cond:
            errs.append(msg)

    for k in ['id', 'title', 'tagline', 'audience', 'scope', 'mascot', 'center', 'islands']:
        need(k in d, f'缺少 {k}')
    need(L(d.get('title', '')) <= 10, 'title 超過 10 字')
    need(L(d.get('tagline', '')) <= 25, 'tagline 超過 25 字')
    need(L(d.get('center', {}).get('name', '')) <= 8, 'center.name 超過 8 字')
    isl = d.get('islands', [])
    need(4 <= len(isl) <= 8, f'islands 有 {len(isl)} 座，要 4–8 座')
    groups = {s.get('group') for s in isl}
    need(len(groups) <= 4, f'分類有 {len(groups)} 種，最多 4 種')
    stems = set()
    for i, s in enumerate(isl, 1):
        t = f'島{i}「{s.get("name")}」'
        need(L(s.get('name', '')) <= 8, f'{t} 島名超過 8 字')
        need(L(s.get('group', '')) <= 4, f'{t} 分類超過 4 字')
        need(L(s.get('intro', '')) <= 25, f'{t} intro 超過 25 字')
        need(s.get('landmark') in LANDMARKS, f'{t} landmark 不在清單')
        need(len(s.get('icon', '')) >= 1, f'{t} 缺 icon')
        need(L(s.get('npc', {}).get('name', '')) <= 4, f'{t} 導師名超過 4 字')
        need(L(s.get('helper', {}).get('name', '')) <= 5, f'{t} 島民名超過 5 字')
        pts = s.get('points', [])
        need(len(pts) == 3, f'{t} points 不是 3 點')
        need(all(L(x) <= 15 for x in pts), f'{t} 有 point 超過 15 字')
        need(len(s.get('lessons', [])) == 3, f'{t} lessons 不是 3 則')
        need(all(x.get('text') and x.get('example') for x in s.get('lessons', [])), f'{t} lesson 缺 text 或 example')
        need(len(s.get('worksheet', [])) == 3, f'{t} worksheet 不是 3 題')
        qs = s.get('quiz', [])
        need(len(qs) == 6, f'{t} quiz 有 {len(qs)} 題，要 6 題')
        for j, q in enumerate(qs, 1):
            qt = f'{t} 第{j}題'
            o = q.get('options', [])
            need(len(o) == 4, f'{qt} 不是 4 個選項')
            need(len(set(o)) == len(o), f'{qt} 選項重複')
            need(isinstance(q.get('answer'), int) and 0 <= q['answer'] < len(o), f'{qt} answer 索引錯')
            need(q.get('explanation'), f'{qt} 缺詳解')
            need(not any(b in x for x in o for b in BANNED), f'{qt} 有依賴位置的選項')
            stem = q.get('prompt', '')
            need(stem not in stems, f'{qt} 題目和別題重複')
            stems.add(stem)
            if len(o) == 4 and isinstance(q.get('answer'), int) and 0 <= q['answer'] < 4:
                longest = max(range(4), key=lambda k: L(o[k]))
                if longest == q['answer'] and L(o[longest]) > 1.6 * max(L(x) for k, x in enumerate(o) if k != longest):
                    errs.append(f'{qt} 正解明顯比其他選項長')
    return errs


if __name__ == '__main__':
    errs = check(sys.argv[1])
    for e in errs:
        print('✗', e)
    print(f'{len(errs)} 個問題')
    sys.exit(1 if errs else 0)
