# 期中複習島（115-1 五科期中複習 RPG）

學生先在選科頁選科目，再進入 3D 群島。每座島是一週（或半週）的重點，玩法是：
1. 讀重點。
2. 和導師對話，接受挑戰。每次從該島 6 題裡隨機抽 3 題，答對 2 題就能蓋島章。
3. 集滿一半的島章，就能挑戰中央島的最終關卡：從已過關的島抽 5 題，答對 4 題可以領證書。

不接 AI API，也不蒐集資料。進度只存在學生自己的瀏覽器（localStorage，每科各存一份），換裝置時用接關碼。

引擎改自 `D:\course\AI_teaching\AI_island\u08\U08_範例網站`（造島工坊 U08 範例）。

## 檔案
| 路徑 | 用途 |
|---|---|
| `content_src/<科目>.json` | 各科題目與重點（人工編輯這裡）。格式與出題規則見 `content_src/SCHEMA.md` |
| `content_src/check.py` | 檢查內容格式：題數、字數、重複題幹、依賴位置的選項、正解過長 |
| `build.py` | 把 `content_src` 轉成 `docs/data/<科目>.json` 和 `courses.json`（會先跑 check） |
| `docs/index.html` | 選科頁 |
| `docs/play.html?c=<科目>` | 遊戲頁 |
| `docs/js/scene.js` | 3D 場景。依島數排成一圈（4–8 座）；`labLandmark()` 有 15 種實驗室／閱讀地標 |
| `docs/js/app.js` | 介面、題目、存檔、證書 |

科目代號：`gchem` 普化、`biochem` 生化、`foodsci` 食科國合班、`chinese` 華語寫作 I、`foodlab` 五專食品分析。

## 修改題目
1. 編輯 `content_src/<科目>.json`。
2. 執行 `python build.py <科目>`（不加參數就建全部）。
3. 在本機測試：`python -m http.server 8765 --directory docs`，打開 http://localhost:8765/。

改了 `styles.css` 或 `js/` 時，把 `play.html` 和 `js/app.js` 裡的 `?v=` 版本號一起改掉（例如 `v=20261030f` → `v=20261101a`），學生的瀏覽器才會抓到新版。

## 手機版面
- 直式手機（≤ 600px）：上方一條旅程卡，下方是工具列＋島嶼清單／背包，中間留給 3D 群島。季節天氣按「🌦 天氣」才展開。島嶼面板是底部抽屜，點上方橫條可展開到全螢幕。
- 橫放手機（高度 ≤ 500px）：介紹卡收起，面板在右側占全高。
- 平板（601–900px）：工具列橫排，開面板時收起右下工具。
- 2026-10-30 用 375×667、390×844、812×375、768×1024、1440×900 測過：沒有重疊、沒有橫向捲動，五科都能在手機上闖關到最終挑戰。

## 出題規則（重要）
- 網站公開後，題目和答案都看得到。**不能放期中考題、`題庫.csv`、L4 題目**，也不能洩漏期中考的答案。
- 各科內容都比對過期中考卷：用 difflib 算相似度，≥ 0.6 的題目已改寫。
- 島數 n 決定解鎖門檻（ceil(n/2)），規則寫在 `build.py` 的 `rpgRules`。

## 部署
已部署到 GitHub Pages（2026-10-30），由 `main` 分支的 `/docs` 發布：

- 選科頁：https://tai-shengyeh.github.io/midterm-review-islands/
- 單科直連：`https://tai-shengyeh.github.io/midterm-review-islands/play.html?c=<科目>`

更新方式：改題目 → `python build.py` → commit → push，約 1 分鐘後上線。
