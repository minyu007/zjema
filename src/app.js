const puppeteer = require('puppeteer');
const Excel = require('exceljs');
const db = require('./db');

const sewageModel = require('./sewage');
const cron = require('node-cron');
// const flightsArr = require('./mock-data');
const moment = require('moment');
const service = require('./service');

const wait = 1000 * 60 * 5;

const sleep = (ms) => {
  return new Promise(function (resolve) {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

const getRandom = function (from, to) {
  return Math.floor(from + Math.random() * (to - from));
};

const log = function () {
  let args = arguments;
  let str = '';
  for (let i = 0, l = args.length; i < l; i++) {
    if (i == 0) {
      str = args[i];
    } else {
      str = str + ', ' + args[i];
    }
  }
  let date = new Date();
  date = date + '';
  date = date.substring(0, date.length - 15);
  return console.log(date + ' : ', str);
};

const getToday = function () {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let yyyy = today.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  today = yyyy + '' + mm + '' + dd;
  return today;
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

const scrape = async () => {
  const today = `${getToday()}`;
  const scrapeDate = moment().format('YYYY-MM-DD');
  let browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  let page = await browser.newPage();
  page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
  );
  page.setViewport({
    width: 1920,
    height: 768,
  });

  page.goto(
    'http://223.4.64.201:8080/eap/hb/cxfx/jcsjcx/dtcx/qyxx.jsp?id=247112131330254&sheng=330000&model=1',
    {
      timeout: wait,
    }
  );
  log('you have 30s to prepare...');
  await sleep(30 * 1000);
  log('step 1: sleep 30s');

  await page.waitForSelector('#mainFrame');
  const elementHandle = await page.$('#mainFrame');
  const frame = await elementHandle.contentFrame();

  await frame.waitForFunction(() => {
    const yzmcode = document.querySelector('#yzmcode').value;
    return yzmcode.length === 4;
  });
  log('step 2: input yzmcode');

  await sleep(10 * 1000);
  log('step 3: sleep 10s');
  // const totalPageNo = totalPageNoSpan;

  const totalPageNo = await frame.evaluate(() => {
    const elem = document.querySelector('#totalPageNoSpan');
    if (elem && elem.innerText) {
      return parseInt(elem.innerText);
    } else {
      return 0;
    }
  });

  const year = await frame.evaluate(() => {
    const elem = document.querySelector('#jcsjnf');
    if (elem && elem.value) {
      return parseInt(elem.value);
    } else {
      return 0;
    }
  });
  const quarterly = await frame.evaluate(() => {
    const elem = document.querySelector('#jcsjgdsj');
    if (elem && elem.value) {
      return elem.value;
    } else {
      return 0;
    }
  });
  log(`---- ${totalPageNo} ${year} ${quarterly} start----`);
  for (let i = 118; i <= totalPageNo; i++) {
    const yzmcode = await frame.evaluate(() => {
      const elem = document.querySelector('#yzmcode');
      if (elem && elem.value && elem.value.length == 4) {
        return true;
      } else {
        return false;
      }
    });
    if (!yzmcode) {
      log('------ yzmcode is changed!!!!!!!!  -----');
      await frame.waitForFunction(() => {
        const yzmcode = document.querySelector('#yzmcode').value;
        return yzmcode.length === 4;
      });
      log('yzmcode is ok now!!! continue!!!');
    }

    const pageData = await frame.evaluate(() => {
      return Array.from(document.querySelectorAll('#bgjl tr')).map((v) =>
        Array.from(v.querySelectorAll('td')).map((vv) => vv.innerText)
      );
    });
    for (let ii = 0, ll = pageData.length; ii < ll; ii++) {
      const item = pageData[ii];
      const t = item[4];
      let date = '';
      let time = '';
      if (t && t.split(' ').length == 2) {
        date = t.split(' ')[0];
        time = t.split(' ')[1];
      }
      await sewageModel.sewage.createData({
        day: today,
        companyName: item[1],
        monitorWay: item[2],
        monitorName: item[3],
        samplingTime: item[4],
        category: item[5],
        frequency: item[6],
        flow: item[7],
        realTimeConcentration: item[8],
        convertedConcentration: item[9],
        interval: item[10],
        flag1: item[11],
        flag2: item[12],
        flag3: item[13],
        year: year,
        quarterly: quarterly,
        pageNo: i,
        totalPage: totalPageNo,
        scrapeDate: scrapeDate,
        date: date,
        time: time,
      });
      log(
        `${item[1]} - ${item[2]} - ${item[3]} - ${item[4]} - ${item[5]} - ${item[6]} - ${item[7]}`
      );
    }
    await frame.click('#page3');
    let timer = getRandom(1000 * 15, 20 * 1000);
    log(`page ${i} scraped, sleep ${timer / 1000} seconds!`);
    log(`go to page ${i + 1}`);
    await sleep(timer);
  }

  browser.close();
  log(`---- ${year} ${quarterly} done----`);
};

// scrape();

// dataTransfer();

// ┌────────────── second (optional)
// │ ┌──────────── minute
// │ │ ┌────────── hour
// │ │ │ ┌──────── day of month
// │ │ │ │ ┌────── month
// │ │ │ │ │ ┌──── day of week
// │ │ │ │ │ │
// │ │ │ │ │ │
// * * * * * *
// let num = 1;

// cron.schedule('0 01 00 * * 4', async () => {
//   const scrapeDate = moment().format('YYYY-MM-DD');
//   await scrape();
//   await generateExcelFile(scrapeDate);
//   log(`${scrapeDate}'s data scraped！`);
// });

const exportExcel = async () => {
  const workbook = new Excel.Workbook();
  const ws = workbook.addWorksheet('all');

  ws.columns = [
    'weekly',
    'airline',
    'airlineCN',
    'distance',
    '_20210409Price',
    '_20210416Price',
    '_20210423Price',
    '_20210514Price',
    '_20210409PriceDivideByKM',
    '_20210416PriceDivideByKM',
    '_20210423PriceDivideByKM',
    '_20210514PriceDivideByKM',
    '_20210409Discount',
    '_20210416Discount',
    '_20210423Discount',
    '_20210514Discount',
    '_20210409ASK',
    '_20210416ASK',
    '_20210423ASK',
    '_20210514ASK',
    'ASK',
    'carrier',
    'carrierCN',
    'order',
    'sheet',
    'scrapeDate',
    '_20210409',
    '_20210416',
    '_20210423',
    '_20210514',
  ].map((v) => {
    return {
      header: v,
      key: v,
      width: 20,
    };
  });
  const list = await airlinereport3Model.airlinereport3.getData({});
  ws.addRows(
    list.map((payload) => ({
      weekly: payload.weekly,
      airline: payload.airline,
      airlineCN: payload.airlineCN,
      distance: payload.distance,
      _20210409Price: payload._20210409Price,
      _20210416Price: payload._20210416Price,
      _20210423Price: payload._20210423Price,
      _20210514Price: payload._20210514Price,

      _20210409PriceDivideByKM: payload._20210409PriceDivideByKM,
      _20210416PriceDivideByKM: payload._20210416PriceDivideByKM,
      _20210423PriceDivideByKM: payload._20210423PriceDivideByKM,
      _20210514PriceDivideByKM: payload._20210514PriceDivideByKM,

      _20210409Discount: payload._20210409Discount,
      _20210416Discount: payload._20210416Discount,
      _20210423Discount: payload._20210423Discount,
      _20210514Discount: payload._20210514Discount,

      _20210409ASK: payload._20210409ASK,
      _20210416ASK: payload._20210416ASK,
      _20210423ASK: payload._20210423ASK,
      _20210514ASK: payload._20210514ASK,

      ASK: payload.ASK,
      carrier: payload.carrier,
      carrierCN: payload.carrierCN,
      order: payload.order,
      sheet: payload.sheet,
      scrapeDate: payload.scrapeDate,
      _20210409: payload._20210409,
      _20210416: payload._20210416,
      _20210423: payload._20210423,
      _20210514: payload._20210514,
    }))
  );
  await workbook.xlsx.writeFile(`Price-Tracker3.xlsx`);
};

(async () => {
  const scrapeDate = moment().format('YYYY-MM-DD');
  await scrape();

  log(`${scrapeDate}'s data scraped！`);
})();
