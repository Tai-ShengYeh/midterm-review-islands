"""content_src/<id>.json → site/data/<id>.json，並產生 site/data/courses.json。
用法：python build.py          （建全部已完成的科目）
      python build.py foodlab  （只建一科）"""
import json, math, sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC, OUT = ROOT / 'content_src', ROOT / 'docs' / 'data'
ORDER = ['gchem', 'biochem', 'foodsci', 'chinese', 'foodlab']
sys.path.insert(0, str(SRC))
from check import check  # noqa: E402

ITEMS = {'shell': '🐚 貝殼', 'apple': '🍎 蘋果', 'flower': '🌸 花朵', 'paper': '📜 筆記紙',
         'crystal': '💎 靈感石', 'postcard': '✉️ 群島明信片'}
CHAIN = list(ITEMS)
ANIMALS = [('squirrel', '松鼠', '吱吱！複習累了嗎？先去撿顆貝殼休息一下。'),
           ('rabbit', '兔子', '蹦蹦！每座島只要答對兩題就能蓋章喔。'),
           ('duck', '鴨子', '呱呱！錯的題目看完詳解，再挑戰一次。'),
           ('butterfly', '蝴蝶', '我在花田上空飛來飛去。'),
           ('cat', '貓咪', '喵～讀完教材再答題，會順很多。'),
           ('deer', '小鹿', '慢慢逛，不用急。'),
           ('dolphin', '海豚', '噗通！看我躍出雲海！')]
NOTICE = '自編練習題：只依期中範圍的上課內容出題，不是期中考題。答錯沒關係，看完詳解再挑戰。進度只存在這台裝置的瀏覽器。'


def build(cid):
    src = SRC / f'{cid}.json'
    errs = check(src)
    if errs:
        raise SystemExit(f'{cid}: 內容檢查有 {len(errs)} 個問題，先修好：\n' + '\n'.join(errs))
    s = json.loads(src.read_text(encoding='utf-8-sig'))
    islands = []
    for i, x in enumerate(s['islands']):
        n = i + 1
        islands.append({
            'order': n, 'id': f'island-{n:02d}', 'name': x['name'], 'group': x['group'],
            'week': x.get('week', ''), 'icon': x['icon'], 'landmark': x['landmark'],
            'intro': x['intro'], 'points': x['points'], 'extra': x['goal'],
            'lessons': x['lessons'], 'worksheet': x['worksheet'],
            'quiz': [{'id': f'q{n}-{j + 1}', 'prompt': q['prompt'],
                      'options': [{'id': f'o{k}', 'text': t} for k, t in enumerate(q['options'])],
                      'answer': f'o{q["answer"]}', 'explanation': q['explanation']}
                     for j, q in enumerate(x['quiz'])],
            'npc': f'npc-{n}'})
    residents, trades = [], []
    for i, (x, isl) in enumerate(zip(s['islands'], islands)):
        n = i + 1
        intro = isl['intro'].rstrip('。！!？?') + '。'
        lines = [x['npc'].get('line') or intro, *[f'一起複習「{p}」。' for p in isl['points']]]
        story = [intro, *[f'{l["title"]}：{l["text"]}' for l in isl['lessons'][:2]]]
        hint = '挑戰重點：' + '；'.join(isl['points']) + '。'
        for rid, name, role in [(f'npc-{n}', x['npc']['name'], '課程導師'), (f'helper-{n}', x['helper']['name'], '島民')]:
            residents.append({'id': rid, 'island': isl['id'], 'name': name, 'role': role, 'lines': lines,
                              'story': story, 'hint': hint, 'fiction': True})
            k = i % (len(CHAIN) - 1)
            trades.append({'resident': rid, 'give': CHAIN[k], 'get': CHAIN[k + 1]})
    m = s['mascot']['name']
    for rid, name, role in [('center-guide', m, '總部導覽'), ('merchant', '市集商人', '交換商人'),
                            ('walker-1', '廣場居民', '島民'), ('walker-2', '廣場訪客', '島民'),
                            ('courier-1', '送貨員一號', '送貨員'), ('courier-2', '送貨員二號', '送貨員'),
                            ('courier-3', '送貨員三號', '送貨員')]:
        residents.append({'id': rid, 'island': 'center', 'name': name, 'role': role,
                          'lines': ['這裡會顯示每座島的複習進度。', '總複習的題目來自每一座島。',
                                    f'先收集 {math.ceil(len(islands) / 2)} 枚島章，再來挑戰最終關卡吧！'],
                          'story': [f'我是{name}，歡迎來到{s["center"]["name"]}。', '先到各島讀重點、答題，累積島章，再回來做跨島挑戰。'],
                          'hint': '先讀教材，再接受挑戰。', 'fiction': True})
        trades.append({'resident': rid, 'give': 'shell', 'get': 'apple'})
    d = {
        'course': cid,
        'site': {'title': s['title'], 'tagline': s['tagline'], 'audience': s['audience'], 'scope': s['scope'],
                 'author': f"{s['audience']} · 期中複習練習", 'mascot': s['mascot']},
        'centerIsland': {'name': s['center']['name'], 'role': '總複習島', 'description': s['center']['description']},
        'notice': NOTICE,
        'rpgRules': {'firstVisit': 5, 'firstCorrect': 10, 'repeatCorrect': 2, 'firstClear': 10, 'tradeFirst': 2,
                     'islandQuestions': 3, 'islandPass': 2, 'centerUnlockStamps': math.ceil(len(islands) / 2),
                     'levels': [0, 30, 80, 150, 250], 'levelStep': 120, 'finalQuestions': 5, 'finalPass': 4,
                     'reviewQuestions': 10},
        'islands': islands, 'residents': residents, 'trades': trades, 'items': ITEMS,
        'animals': [{'id': a, 'name': n, 'line': l} for a, n, l in ANIMALS],
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{cid}.json').write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf-8')
    return {'id': cid, 'title': s['title'], 'tagline': s['tagline'], 'audience': s['audience'],
            'scope': s['scope'], 'islands': len(islands), 'icon': islands[0]['icon']}


if __name__ == '__main__':
    want = sys.argv[1:] or [c for c in ORDER if (SRC / f'{c}.json').exists()]
    built = {c: build(c) for c in want}
    listed = []
    for c in ORDER:
        if c in built:
            listed.append(built[c])
        elif (OUT / f'{c}.json').exists():
            d = json.loads((OUT / f'{c}.json').read_text(encoding='utf-8'))
            listed.append({'id': c, 'title': d['site']['title'], 'tagline': d['site']['tagline'],
                           'audience': d['site']['audience'], 'scope': d['site']['scope'],
                           'islands': len(d['islands']), 'icon': d['islands'][0]['icon']})
    (OUT / 'courses.json').write_text(json.dumps(listed, ensure_ascii=False, indent=1), encoding='utf-8')
    for c in listed:
        print(f'{c["id"]}: {c["title"]}（{c["islands"]} 座島）')
