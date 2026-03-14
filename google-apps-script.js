// ==========================================
// Google Apps Script - 도쿄 여행 정산 API
// ==========================================
// 이 코드를 Google Sheets > 확장 프로그램 > Apps Script에 붙여넣으세요.

const SHEET_NAME = '정산';

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'desc', 'amount', 'payer', 'split', 'date', 'settled']);
  }
  return sheet;
}

function doGet(e) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const expenses = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    expenses.push({
      id: row[0],
      desc: row[1],
      amount: Number(row[2]),
      payer: row[3],
      split: row[4] ? row[4].split(',') : [],
      date: row[5],
      settled: row[6] === true || row[6] === 'TRUE'
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ expenses }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  const sheet = getSheet();

  if (action === 'add') {
    const exp = body.expense;
    sheet.appendRow([
      exp.id,
      exp.desc,
      exp.amount,
      exp.payer,
      exp.split.join(','),
      exp.date,
      false
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'delete') {
    const id = body.id;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'settle') {
    const id = body.id;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        const current = data[i][6] === true || data[i][6] === 'TRUE';
        sheet.getRange(i + 1, 7).setValue(!current);
        break;
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: 'unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}
