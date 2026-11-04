/**
 * 建立「期中複習島｜冒險成果繳交」Google 表單，回覆自動進試算表。
 *
 * 用法：
 * 1. 用要收成果的 Google 帳號（建議學校帳號）打開 https://script.google.com → 新專案。
 * 2. 把這整份貼上，按「執行」createSubmitForm，第一次要按「審查權限 → 允許」。
 * 3. 執行完看「執行記錄」：複製「預填網址」那一行，貼到 docs/data/submit.json 的 formUrl。
 *    （或直接把那一行貼給 Claude，由它更新網站。）
 * 4. 在 Google Classroom 出一份作業，說明寫：
 *    「到期中複習島 → 打開冒險護照 → 交成果給老師 → 用學校帳號登入表單後按提交」。
 *
 * 五科共用一份表單；「科目」欄會寫科目名稱與代號，試算表可以用篩選分科。
 */
function createSubmitForm() {
  const form = FormApp.create('期中複習島｜冒險成果繳交');
  form.setDescription(
    '請從期中複習島的「冒險護照 → 交成果給老師」開啟這份表單，欄位會自動填好。\n' +
    '確認後按最下面的「提交」。進度變多可以再交一次，老師以最後一次為準。\n' +
    '這是複習參與紀錄，不是期中考成績。');

  // 收集 email：新版 API 用「已驗證」（要登入 Google 帳號），舊版退回 setCollectEmail。
  if (typeof form.setEmailCollectionType === 'function') {
    form.setEmailCollectionType(FormApp.EmailCollectionType.VERIFIED);
  } else {
    form.setCollectEmail(true);
  }
  // 學校（Workspace）帳號建立時，只限同網域的人填；個人 Gmail 帳號不支援，就略過。
  try { form.setRequireLogin(true); } catch (e) { Logger.log('略過「限同網域」：' + e.message); }
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage('已收到！記得回到 Classroom，把作業標示為「完成」。');

  const fields = [
    ['科目', 'COURSE', false],
    ['冒險者代號', 'NAME', false],
    ['等級與 EXP', 'LEVEL', false],
    ['島章', 'STAMPS', false],
    ['最終挑戰', 'FINAL', false],
    ['各島最佳成績', 'SCORES', true],
    ['送出時間', 'TIME', false],
  ];
  const response = form.createResponse();
  fields.forEach(([title, key, long]) => {
    const item = long ? form.addParagraphTextItem() : form.addTextItem();
    item.setTitle(title).setRequired(true);
    response.withItemResponse(item.createResponse('__' + key + '__'));
  });

  const sheet = SpreadsheetApp.create('期中複習島｜冒險成果回覆');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('預填網址（貼到 docs/data/submit.json 的 formUrl）：\n' + response.toPrefilledUrl());
  Logger.log('表單編輯：' + form.getEditUrl());
  Logger.log('回覆試算表：' + sheet.getUrl());
}
