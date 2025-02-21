// https://www.informatik.uni-leipzig.de/~duc/amlich/calrules.html

// Constants

const TOKEN = `YOUR-TELEGRAM-BOT-TOKEN`;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;
var chat_ID = 'DEFAULT-CHAT-ID';
const DEPLOYED_URL = 'YOUR-DEPLOYED-URL';

const IGNORE_CAPITAL = false;

const MONEY_BAG_EMOJI = '\uD83D\uDCB0';
const DOUBLE_EXCLAIMATION_EMOJI = '\u203C';
const EXCLAIMATION_EMOJI = '\u2757\uFE0F';

const METHODS = {
  SEND_MESSAGE: 'sendMessage',
  SEND_STICKER: 'sendSticker',
  SET_WEBHOOK: 'setWebhook',
  GET_UPDATES: 'getUpdates',
}
const MAX_DESCRIPTION_LEN = 25;
const COMMANDS = {
  HELP: {
    command: 'help',
    description: 'Provides command infors',
    full_des: "For more information on a specific command, type 'HELP [command]'",
    syntax: 'HELP [command]',
    param_des: 'command - displays help information on that command.'
  },
  LUNAR: {
    command: 'lunar',
    description: 'Convert to Lunar date',
    full_des: "Convert Gregorian date to Lunar date",
    syntax: 'lunar [date]',
    param_des: 'date - Gregorian date in DD/MM/YYYY'
  },
  SOLAR: {
    command: 'solar',
    description: 'Convert to Solar date',
    full_des: "Convert Lunar date to Gregorian date, default leap month is 0",
    syntax: 'solar [date]',
    param_des: 'date - Lunar date in DD/MM/YYYY'
  },
  TODAY: {
    command: 'today',
    description: 'Get current date',
    full_des: 'Get current date in specific timezone',
    syntax: 'today [timezone]',
    param_des: 'timezone (optional) - enter an integer presenting timezone, default value is 7, which means GMT+7'
  }
}

// Server -> Client only

const notificationKey = 2;
const notificationMessage = `
  UPDATE!

  Fix bug: No reply when a sticker is sent.
`;

function sendNotification() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NotificationLock");
  var cell = sheet.getRange("A1");
  
  if (parseInt(cell.getValue()) == notificationKey)
  {
    sendNotificationAll(notificationMessage);
    cell.setValue(notificationKey + 1);
    return;
  }

  Logger.log("NotificationKey is not equal to NotificationLock!");
}

function sendNotificationIds(ids, message) {
  for (var i = 0; i < ids.length; i++) {
    sendMessage(message, ids[i]);
  }
}

function sendNotificationAll(message) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) {
    Logger.log("Sheet not found: " + sheetName);
    return;
  }

  var lastRow = sheet.getLastRow(); // Get the last row with data
  if (lastRow < 2)
  {
    Logger.log("No users.");
    return;
  }
  
  var range = sheet.getRange(2, 2, lastRow - 1);
  var values = range.getValues().flat(); // Convert to a 1D array
  
  sendNotificationIds(values, message);
}

// Utils

const toQueryParamsString = (obj) => {
  return Object.keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

function checkCommandExist(cmd) {
  for (var key in COMMANDS)
  {
    if (COMMANDS.hasOwnProperty(key)) {
      if (COMMANDS[key].command === cmd) return true;
    }
  }

  return false;
}

// Telegram APIs

const makeRequest = async (method, queryParams = {}) => {
  const url = `${BASE_URL}/${method}?${toQueryParamsString(queryParams)}`
  const response = await UrlFetchApp.fetch(url);
  return response.getContentText();
}

const sendMessage = (_text, _chatId = chat_ID) => {
  makeRequest(METHODS.SEND_MESSAGE, {
    chat_id: _chatId,
    text: _text,
    parse_mode: 'Markdown'
  })
}

const sendSticker = (_stickerId, _chatId = chat_ID) => {
  makeRequest(METHODS.SEND_STICKER, {
    chat_id: _chatId,
    sticker: _stickerId
  })
}

const setWebhook = () => {
  makeRequest(METHODS.SET_WEBHOOK, {
    url: DEPLOYED_URL
  })
}

const deleteWebhook = () => {
  var url = "https://api.telegram.org/bot" + TOKEN + "/deleteWebhook";

  var response = UrlFetchApp.fetch(url);
  var responseData = JSON.parse(response.getContentText());

  if (responseData.ok) {
    Logger.log("Webhook deleted successfully.");
  } else {
    Logger.log("Error deleting webhook: " + responseData.error_code + " - " + responseData.description);
  }
}

const getChatId = async () => {
  const res = await makeRequest(METHODS.GET_UPDATES);
  console.log("ChatId: ", JSON.parse(res)?.result[0]?.message?.chat?.id);
}

// Google Sheet

function saveUserId(id, name, lastTime) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) {
    Logger.log("Sheet not found: " + "Users");
    return;
  }

  var lastRow = sheet.getLastRow(); // Get the last row with data

  if (lastRow < 2)
  {
    var newRowData = [lastRow, "'" + id, name, lastTime, lastTime];
    sheet.appendRow(newRowData);
    return;
  }
  
  var range = sheet.getRange(2, 2, lastRow - 1);
  var values = range.getValues().flat(); // Convert to a 1D array

  var targetValue = id;
  var exists = false;
  var targetRow = 0;
  for (var i = 0; i < values.length; i++)
  {
    if (values[i] === targetValue)
    {
      targetRow = i;
      exists = true;
      break;
    }
  }

  if (!exists) 
  {
    var newRowData = [lastRow, "'" + id, name, lastTime, lastTime];
    sheet.appendRow(newRowData);
    return;
  }

  sheet.getRange(targetRow + 2, 5).setValue(lastTime); // Update last time this user sent message
}

function saveUserIdTest() {
  saveUserId("1022070024", "norman", new Date());
}

// Algorithms

function jdFromDate(dd, mm, yy) {
  var a, y, m, jd;
  a = Math.floor((14 - mm) / 12);
  y = yy+4800-a;
  m = mm+12*a-3;
  jd = dd + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - 32083;
  }
  return jd;
}

function jdToDate(jd) {
  var a, b, c, d, e, m, day, month, year;
  if (jd > 2299160) { // After 5/10/1582, Gregorian calendar
    a = jd + 32044;
    b = Math.floor((4*a+3)/146097);
    c = a - Math.floor((b*146097)/4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  d = Math.floor((4*c+3)/1461);
  e = c - Math.floor((1461*d)/4);
  m = Math.floor((5*e+2)/153);
  day = e - Math.floor((153*m+2)/5) + 1;
  month = m + 3 - 12*Math.floor(m/10);
  year = b*100 + d - 4800 + Math.floor(m/10);
  return day + "-" + month + "-" + year;
}

function getNewMoonDay(k, timeZone = 7) {
  var T, T2, T3, dr, Jd1, M, Mpr, F, C1, deltat, JdNew;
  T = k/1236.85; // Time in Julian centuries from 1900 January 0.5
  T2 = T * T;
  T3 = T2 * T;
  dr = Math.PI/180;
  Jd1 = 2415020.75933 + 29.53058868*k + 0.0001178*T2 - 0.000000155*T3;
  Jd1 = Jd1 + 0.00033*Math.sin((166.56 + 132.87*T - 0.009173*T2)*dr); // Mean new moon
  M = 359.2242 + 29.10535608*k - 0.0000333*T2 - 0.00000347*T3; // Sun's mean anomaly
  Mpr = 306.0253 + 385.81691806*k + 0.0107306*T2 + 0.00001236*T3; // Moon's mean anomaly
  F = 21.2964 + 390.67050646*k - 0.0016528*T2 - 0.00000239*T3; // Moon's argument of latitude
  C1=(0.1734 - 0.000393*T)*Math.sin(M*dr) + 0.0021*Math.sin(2*dr*M);
  C1 = C1 - 0.4068*Math.sin(Mpr*dr) + 0.0161*Math.sin(dr*2*Mpr);
  C1 = C1 - 0.0004*Math.sin(dr*3*Mpr);
  C1 = C1 + 0.0104*Math.sin(dr*2*F) - 0.0051*Math.sin(dr*(M+Mpr));
  C1 = C1 - 0.0074*Math.sin(dr*(M-Mpr)) + 0.0004*Math.sin(dr*(2*F+M));
  C1 = C1 - 0.0004*Math.sin(dr*(2*F-M)) - 0.0006*Math.sin(dr*(2*F+Mpr));
  C1 = C1 + 0.0010*Math.sin(dr*(2*F-Mpr)) + 0.0005*Math.sin(dr*(2*Mpr+M));
  if (T < -11) {
    deltat= 0.001 + 0.000839*T + 0.0002261*T2 - 0.00000845*T3 - 0.000000081*T*T3;
  } else {
    deltat= -0.000278 + 0.000265*T + 0.000262*T2;
  };
  JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone/24);
}

function getSunLongitude(jdn, timeZone = 7) {
  var T, T2, dr, M, L0, DL, L;
  T = (jdn - 2451545.5 - timeZone/24) / 36525; // Time in Julian centuries from 2000-01-01 12:00:00 GMT
  T2 = T*T;
  dr = Math.PI/180; // degree to radian
  M = 357.52910 + 35999.05030*T - 0.0001559*T2 - 0.00000048*T*T2; // mean anomaly, degree
  L0 = 280.46645 + 36000.76983*T + 0.0003032*T2; // mean longitude, degree
  DL = (1.914600 - 0.004817*T - 0.000014*T2)*Math.sin(dr*M);
  DL = DL + (0.019993 - 0.000101*T)*Math.sin(dr*2*M) + 0.000290*Math.sin(dr*3*M);
  L = L0 + DL; // true longitude, degree
  L = L*dr;
  L = L - Math.PI*2*(Math.floor(L/(Math.PI*2))); // Normalize to (0, 2*PI)
  return Math.floor(L / Math.PI * 6);
}

function getLunarMonth11(yy, timeZone = 7) {
  var k, off, nm, sunLong;
  off = jdFromDate(31, 12, yy) - 2415021;
  k = Math.floor(off / 29.530588853);
  nm = getNewMoonDay(k, timeZone);
  sunLong = getSunLongitude(nm, timeZone); // sun longitude at local midnight
  if (sunLong >= 9) {
    nm = getNewMoonDay(k-1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11, timeZone = 7) {
  var k, last, arc, i;
  k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  last = 0;
  i = 1; // We start with the month following lunar month 11
  arc = getSunLongitude(getNewMoonDay(k+i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k+i, timeZone), timeZone);
  } while (arc != last && i < 14);
  return i-1;
}

function convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
  var k, dayNumber, monthStart, a11, b11, lunarDay, lunarMonth, lunarYear, lunarLeap;
  dayNumber = jdFromDate(dd, mm, yy);
  k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  monthStart = getNewMoonDay(k+1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  a11 = getLunarMonth11(yy, timeZone);
  b11 = a11;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy-1, timeZone);
  } else {
    lunarYear = yy+1;
    b11 = getLunarMonth11(yy+1, timeZone);
  }
  lunarDay = dayNumber-monthStart+1;
  diff = Math.floor((monthStart - a11)/29);
  lunarLeap = 0;
  lunarMonth = diff+11;
  if (b11 - a11 > 365) {
    leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff == leapMonthDiff) {
        lunarLeap = 1;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }

  return lunarDay + "-" + lunarMonth + "-" + lunarYear;
}

function convertLunar2Solar(lunarDay, lunarMonth, lunarYear, lunarLeap, timeZone = 7) {
  var k, a11, b11, off, leapOff, leapMonth, monthStart;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear-1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear+1, timeZone);
  }
  off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }
  if (b11 - a11 > 365) {
    leapOff = getLeapMonthOffset(a11, timeZone);
    leapMonth = leapOff - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }
    if (lunarLeap != 0 && lunarMonth != leapMonth) {
      return '0000-00-00';
    } else if (lunarLeap != 0 || off >= leapOff) {
      off += 1;
    }
  }
  k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  monthStart = getNewMoonDay(k+off, timeZone);
  return jdToDate(monthStart+lunarDay-1);
}

function getDayInWeek(jd) {
  var r = jd % 7;
  switch (r) {
    case 0:
      return "Thứ Hai";
    case 1:
      return "Thứ Ba";
    case 2:
      return "Thứ Tư";
    case 3:
      return "Thứ Năm";
    case 4:
      return "Thứ Sáu";
    case 5:
      return "Thứ Bảy";
    case 6:
      return "Chủ Nhật";
  }
}

function getDayInWeek2(dd, mm, yy) {
  var jd = jdFromDate(dd, mm, yy);
  return getDayInWeek(jd);
}

function getCan(yy) {
  var c = (yy + 6) % 10;
  switch (c) {
    case 0:
      return "Giáp";
    case 1:
      return "Ất";
    case 2:
      return "Bính";
    case 3:
      return "Đinh";
    case 4:
      return "Mậu";
    case 5:
      return "Kỷ";
    case 6:
      return "Canh";
    case 7:
      return "Tân";
    case 8:
      return "Nhâm";
    case 9:
      return "Quý";
  }
}

function getChi(yy) {
  var c = (yy + 8) % 12;
  switch (c) {
    case 0:
      return "Tý";
    case 1:
      return "Sửu";
    case 2:
      return "Dần";
    case 3:
      return "Mão";
    case 4:
      return "Thìn";
    case 5:
      return "Tỵ";
    case 6:
      return "Ngọ";
    case 7:
      return "Mùi";
    case 8:
      return "Thân";
    case 9:
      return "Dậu";
    case 10:
      return "Tuất";
    case 11:
      return "Hợi";
  }
}

function getMonthCanChi(mm, yy) {
  var chi = getChi(mm + 5);
  var can = getCan(yy * 12 + mm - 3);

  return can + " " + chi;
}

// command

const help = (input = null) => {
  var content = '';
  if (input === null) {
    content = content + COMMANDS.HELP.full_des + '\n';
    for (var key in COMMANDS) {
      var showDes = COMMANDS[key].description;
      if (showDes.length > MAX_DESCRIPTION_LEN) showDes = showDes.slice(0, MAX_DESCRIPTION_LEN);

      content = content + (COMMANDS[key].command.toUpperCase() + ': ').padStart(8) + showDes.padEnd(MAX_DESCRIPTION_LEN) + '\n';
    }
  }
  else {
    for (var key in COMMANDS) {
      var command = COMMANDS[key];
      if (command.command.toLowerCase() === input) {
        content = content + command.syntax + '\n' + '      ' + command.param_des + '\n\n';
        content = content + command.full_des;
      }
    }
  }

  sendMessage(monoText(content));
}

function lunar(gregorianDate) {
  var nums = gregorianDate.split('/');
  var day = parseInt(nums[0]);
  var month = parseInt(nums[1]);
  var year = parseInt(nums[2]);
  var lunarDate = convertSolar2Lunar(day, month, year);
  var message = "Ngày âm lịch: " + lunarDate + ", " + getDayInWeek2(day, month, year) + "\n";
  
  var lunarNums = lunarDate.split('-');
  var lunarMonth = parseInt(lunarNums[1]);
  var lunarYear = parseInt(lunarNums[2]);
  message = message + "Tháng " + getMonthCanChi(lunarMonth, lunarYear) + "\n";
  message = message + "Năm " + getCan(lunarYear) + " " + getChi(lunarYear);
  return sendMessage(monoText(message));
}

function solar(lunarDate) {
  var lunarNums = lunarDate.split('/');
  var lunarDay = parseInt(lunarNums[0]);
  var lunarMonth = parseInt(lunarNums[1]);
  var lunarYear = parseInt(lunarNums[2]);
  var solarDate = convertLunar2Solar(lunarDay, lunarMonth, lunarYear, 0);
  
  var nums = solarDate.split('-');
  var day = parseInt(nums[0]);
  var month = parseInt(nums[1]);
  var year = parseInt(nums[2]);

  var message = "Ngày dương lịch: " + solarDate + ", " + getDayInWeek2(day, month, year) + "\n";
  return sendMessage(monoText(message));
}

function today(timeZoneOffset = 7) {
  var timezone = "GMT" + (timeZoneOffset >= 0 ? "+" : "") + timeZoneOffset;
  var now = Utilities.formatDate(new Date(), timezone, 'dd-MM-yyyy');
  
  var nums = now.split('-');
  var day = parseInt(nums[0]);
  var month = parseInt(nums[1]);
  var year = parseInt(nums[2]);
  var lunarDate = convertSolar2Lunar(day, month, year);
  
  var message = "Ngày dương lịch: " + now + ", " + getDayInWeek2(day, month, year) + "\n";
  var message = message + "Ngày âm lịch: " + lunarDate + "\n";
  
  var lunarNums = lunarDate.split('-');
  var lunarMonth = parseInt(lunarNums[1]);
  var lunarYear = parseInt(lunarNums[2]);

  message = message + "Tháng " + getMonthCanChi(lunarMonth, lunarYear) + "\n";
  message = message + "Năm " + getCan(lunarYear) + " " + getChi(lunarYear);

  return sendMessage(monoText(message));
}

function test() {
  var offset = 14;
  var timezone = "GMT" + (offset >= 0 ? "+" : "") + offset;
  var now = Utilities.formatDate(new Date(), timezone, "dd-MM-yyyy");
  Logger.log(now);
}

// Extract label & price

const monoText = (text) => {
  return '`' + text + '`';
}

const boldText = (text) => {
  return '**' + text + '**';
}

const italicText = (text) => {
  return '*' + text + '*';
}

const formatMoney = (value) => {
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

// Webhooks

const doPost = (request) => {
  const contents = JSON.parse(request.postData.contents);
  const message = contents.message;

  chat_ID = '1022070024';
  chat_ID = message?.chat?.id;

  var sender = message.from;
  saveUserId(chat_ID.toString(), sender.username ? sender.username : "", new Date());

  if (message && message.sticker)
  {
    var stickerId = message.sticker.file_id;
    sendSticker(stickerId, chat_ID);
  }

  const text = message.text;
  if (!text) return;

  const type = text.split(' ');
  var command = '';

  if (text === `/start`) 
    return sendMessage(monoText('Welcome! This is your Lunar calendar. Type HELP to see available commands.'), chat_ID);

  if (type === null || type.length === 0) return sendMessage(monoText(EXCLAIMATION_EMOJI + 'Error: Syntax error!'), chat_ID);
  command = type[0].toLowerCase();
  
  if (checkCommandExist(command, COMMANDS) === false) return sendMessage(monoText('Command not found!'), chat_ID);


  if (command === COMMANDS.HELP.command)
  {
    if (type.length < 2) return help();
    return help(text.slice(command.length + 1).toLowerCase());
  }

  if (command === COMMANDS.LUNAR.command)
  {
    if (type.length < 2 || type.length > 2) return sendMessage(monoText(EXCLAIMATION_EMOJI + 'Error: Syntax error!'));
    var gregorianDate = type[1];
    return lunar(gregorianDate);
  }

  if (command === COMMANDS.SOLAR.command)
  {
    if (type.length < 2 || type.length > 2) return sendMessage(monoText(EXCLAIMATION_EMOJI + 'Error: Syntax error!'));
    var lunarDate = type[1];
    return solar(lunarDate);
  }

  if (command === COMMANDS.TODAY.command)
  {
    if (type.length > 2) return sendMessage(monoText(EXCLAIMATION_EMOJI + 'Error: Syntax error!'));
    if (type.length == 1) return today();
    var tz = parseInt(type[1]);
    return isNaN(tz) ? today() : today(tz);
  }
}
