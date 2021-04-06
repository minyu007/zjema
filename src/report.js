const Excel = require('exceljs');
const db = require('./db');
const sewageModel = require('./sewage');
const moment = require('moment');

const generateExcel = async () => {
  const workbook = new Excel.Workbook();
  const ws = workbook.addWorksheet('all');
  ws.columns = [
    { header: 'Corporation', key: 'companyName', width: 40 },
    { header: 'Sampling Time', key: 'samplingTime', width: 30 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Time', key: 'time', width: 20 },
    { header: `Emissions`, key: 'flow', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Frequency', key: 'frequency', width: 15 },
    { header: 'Monitor', key: 'monitorName', width: 15 },
    { header: 'Maximum', key: 'interval', width: 15 },
    // { header: 'Overcapacity', key: 'flag1', width: 15 },
    // { header: 'Overcapacity', key: 'flag1', width: 15 },
    // { header: 'Caused By', key: 'flag3', width: 15 },
  ];
  const list = await sewageModel.sewage.getData({});
  let arr = list.map((v) => ({
    companyName: v.companyName,
    date: v.date,
    time: v.time,
    flow: v.flow,
    category: v.category,
    frequency: v.frequency,
    monitorName: v.monitorName,
    interval: v.interval,
    samplingTime: v.samplingTime,
  }));
  arr = arr.sort((v1, v2) => {
    return new Date(v1.samplingTime).getTime() - new Date(v2.samplingTime).getTime();
  });

  arr = arr.filter((v) => {
    return v.category == '氨氮（NH3-N）';
  });

  ws.addRows(arr);
  await workbook.xlsx.writeFile(`绍兴市上虞金冠化工有限公司2.xlsx`);
};

generateExcel();
