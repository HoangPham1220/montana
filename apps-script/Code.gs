/**
 * Montana - Google Apps Script backend (container-bound to a Google Sheet).
 *
 * API contract (see src/lib/types.ts):
 *   POST body (text/plain JSON): { token, action: 'ping' | 'pull' | 'push', changes? }
 *   Response: { ok: true, serverTime, data? } | { ok: false, error }
 *
 * Setup: run setupToken() once, then Deploy > Web app (Execute as: Me, Access: Anyone).
 */

// Keep in sync with SHEET_COLUMNS in src/lib/types.ts
var SHEET_COLUMNS = {
  accounts: ['id', 'name', 'kind', 'openingBalance', 'currentBalance', 'color', 'icon', 'archived', 'updatedAt', 'deleted'],
  categories: ['id', 'name', 'type', 'parentId', 'color', 'icon', 'budget', 'updatedAt', 'deleted'],
  transactions: ['id', 'date', 'type', 'amount', 'categoryId', 'accountId', 'toAccountId', 'note', 'updatedAt', 'deleted'],
  assetCategories: ['id', 'name', 'color', 'targetPercent', 'updatedAt', 'deleted'],
  assets: ['id', 'name', 'categoryId', 'quantity', 'unit', 'costBasis', 'currentPrice', 'currentValue', 'note', 'updatedAt', 'deleted'],
  assetSnapshots: ['id', 'assetId', 'date', 'value', 'updatedAt', 'deleted'],
  appSettings: ['id', 'autoSync', 'moneyInputMultiplier', 'moneyInputCurrencyCode', 'updatedAt', 'deleted']
};
var TABLE_NAMES = ['accounts', 'categories', 'transactions', 'assetCategories', 'assets', 'assetSnapshots', 'appSettings'];
var NUMBER_FIELDS = ['amount', 'budget', 'targetPercent', 'quantity', 'costBasis', 'currentPrice', 'currentValue', 'value', 'openingBalance', 'currentBalance', 'moneyInputMultiplier'];
var BOOLEAN_FIELDS = ['deleted', 'archived', 'autoSync'];
var DATE_FIELDS = ['date']; // yyyy-MM-dd text; other text fields that hold Dates become ISO strings

// ---------------------------------------------------------------- web app

function doGet(e) {
  return json_({ ok: true, service: 'montana', serverTime: new Date().toISOString() });
}

function doPost(e) {
  var resp;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    resp = handle_(req);
  } catch (err) {
    resp = { ok: false, error: 'Bad request: ' + (err && err.message ? err.message : err) };
  }
  return json_(resp);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function authorized_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (!expected || typeof token !== 'string' || token.length !== expected.length) return false;
  var diff = 0;
  for (var i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

function handle_(req) {
  if (!req || !authorized_(req.token)) return { ok: false, error: 'Unauthorized' };
  var serverTime = new Date().toISOString();
  switch (req.action) {
    case 'ping':
      return { ok: true, serverTime: serverTime };
    case 'pull':
      ensureSheets_();
      return { ok: true, serverTime: serverTime, data: readAll_() };
    case 'push':
      var lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
        ensureSheets_();
        applyChanges_(req.changes || {});
        return { ok: true, serverTime: new Date().toISOString(), data: readAll_() };
      } finally {
        lock.releaseLock();
      }
    default:
      return { ok: false, error: 'Unknown action' };
  }
}

// ---------------------------------------------------------------- sheets setup

function isTextField_(name) {
  return NUMBER_FIELDS.indexOf(name) < 0 && BOOLEAN_FIELDS.indexOf(name) < 0;
}

/** Create missing tabs/headers, append missing columns, force text format on text columns. */
function ensureSheets_(force) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  TABLE_NAMES.forEach(function (table) {
    var wanted = SHEET_COLUMNS[table];
    var sheet = ss.getSheetByName(table);
    var changed = !!force;
    if (!sheet) {
      sheet = ss.insertSheet(table);
      changed = true;
    }
    var lastCol = sheet.getLastColumn();
    var header = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
    if (header.every(function (h) { return h === ''; })) header = [];
    var added = false;
    wanted.forEach(function (col) {
      if (header.indexOf(col) < 0) {
        header.push(col);
        added = true;
      }
    });
    if (added || changed) {
      sheet.getRange(1, 1, 1, header.length).setNumberFormat('@').setValues([header]);
      sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      var maxRows = sheet.getMaxRows();
      header.forEach(function (h, i) {
        if (wanted.indexOf(h) >= 0 && isTextField_(h)) {
          sheet.getRange(2, i + 1, Math.max(maxRows - 1, 1), 1).setNumberFormat('@');
        }
      });
    }
  });
}

// ---------------------------------------------------------------- reading

function readAll_() {
  var out = {};
  TABLE_NAMES.forEach(function (t) { out[t] = readTable_(t); });
  return out;
}

function getSheet_(table) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
}

function readTable_(table) {
  var sheet = getSheet_(table);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var header = values[0].map(String);
  var cols = SHEET_COLUMNS[table];
  var idx = cols.map(function (c) { return header.indexOf(c); });
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = {};
    for (var k = 0; k < cols.length; k++) {
      row[cols[k]] = fromCell_(cols[k], idx[k] >= 0 ? values[r][idx[k]] : '');
    }
    if (row.id === '') continue;
    rows.push(row);
  }
  return rows;
}

function fromCell_(field, v) {
  if (NUMBER_FIELDS.indexOf(field) >= 0) {
    if (field === 'currentBalance' && (v == null || v === '')) return '';
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }
  if (BOOLEAN_FIELDS.indexOf(field) >= 0) {
    return v === true || String(v).toLowerCase() === 'true';
  }
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    return DATE_FIELDS.indexOf(field) >= 0
      ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : v.toISOString();
  }
  return v == null ? '' : String(v);
}

function toCell_(field, v) {
  if (NUMBER_FIELDS.indexOf(field) >= 0) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }
  if (BOOLEAN_FIELDS.indexOf(field) >= 0) return v === true || v === 'true' || v === 'TRUE';
  return v == null ? '' : String(v);
}

// ---------------------------------------------------------------- writing

function applyChanges_(changes) {
  TABLE_NAMES.forEach(function (table) {
    var incoming = changes[table];
    if (!incoming || !incoming.length) return;
    upsertRows_(table, incoming);
  });
}

function upsertRows_(table, incoming) {
  var sheet = getSheet_(table);
  var cols = SHEET_COLUMNS[table];
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var idIdx = header.indexOf('id');
  var updIdx = header.indexOf('updatedAt');
  var colIdx = cols.map(function (c) { return header.indexOf(c); });

  var existing = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var byId = {};
  existing.forEach(function (row, i) {
    var id = fromCell_('id', row[idIdx]);
    if (id !== '') byId[id] = i;
  });

  var dirtyExisting = false;
  var appended = [];
  incoming.forEach(function (rec) {
    if (!rec || rec.id == null || String(rec.id) === '') return;
    var id = String(rec.id);
    var incomingUpd = toCell_('updatedAt', rec.updatedAt);
    if (byId.hasOwnProperty(id)) {
      var pos = byId[id];
      var storedUpd = fromCell_('updatedAt', existing[pos][updIdx]);
      if (incomingUpd < storedUpd) return; // stale write loses
      cols.forEach(function (c, k) { existing[pos][colIdx[k]] = toCell_(c, rec[c]); });
      dirtyExisting = true;
    } else {
      var row = new Array(lastCol);
      for (var j = 0; j < lastCol; j++) row[j] = '';
      cols.forEach(function (c, k) { row[colIdx[k]] = toCell_(c, rec[c]); });
      byId[id] = existing.length; // addressable if the same id repeats in one push
      appended.push(row);
      existing.push(row);
    }
  });

  if (dirtyExisting || appended.length) {
    // `existing` now holds updated rows plus appended ones (same array refs).
    var total = existing.length;
    if (sheet.getMaxRows() < total + 1) sheet.insertRowsAfter(sheet.getMaxRows(), total + 1 - sheet.getMaxRows());
    var range = sheet.getRange(2, 1, total, lastCol);
    // Ensure text columns stay text (new rows / added columns).
    header.forEach(function (h, i) {
      if (cols.indexOf(h) >= 0 && isTextField_(h)) sheet.getRange(2, i + 1, total, 1).setNumberFormat('@');
    });
    range.setValues(existing);
  }
}

// ---------------------------------------------------------------- helpers for the owner

function setupToken() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('API_TOKEN');
  if (!token) {
    token = Utilities.getUuid();
    props.setProperty('API_TOKEN', token);
    Logger.log('Đã tạo token mới.');
  } else {
    Logger.log('Token đã tồn tại (giữ nguyên).');
  }
  Logger.log('API_TOKEN = ' + token);
  ensureSheets_(true);
  return token;
}

function showToken() {
  var token = setupToken();
  SpreadsheetApp.getUi().alert('Token của bạn (dán vào Cài đặt trong app):\n\n' + token);
}

function initSheets() {
  ensureSheets_(true);
  SpreadsheetApp.getUi().alert('Đã khởi tạo các tab của Montana.');
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Montana')
    .addItem('Khởi tạo sheet', 'initSheets')
    .addItem('Tạo/hiện token', 'showToken')
    .addToUi();
}
