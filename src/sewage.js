const mongoose = require('mongoose');
const uuid = require('node-uuid');
const model = {};

const sewageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuid.v4,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
  day: String,
  companyName: String,
  monitorWay: String,
  monitorName: String,
  samplingTime: String,
  category: String,
  frequency: String,
  flow: String,
  realTimeConcentration: String,
  convertedConcentration: String,
  interval: String,
  flag1: String,
  flag2: String,
  flag3: String,
  year: String,
  quarterly: String,
  pageNo: String,
  totalPage: String,
  scrapeDate: String,
  date: String,
  time: String,
});

sewageSchema.statics.createData = function (payload) {
  return this.create({
    day: payload.day,
    companyName: payload.companyName,
    monitorWay: payload.monitorWay,
    monitorName: payload.monitorName,
    samplingTime: payload.samplingTime,
    category: payload.category,
    frequency: payload.frequency,
    flow: payload.flow,
    realTimeConcentration: payload.realTimeConcentration,
    convertedConcentration: payload.convertedConcentration,
    interval: payload.interval,
    flag1: payload.flag1,
    flag2: payload.flag2,
    flag3: payload.flag3,
    year: payload.year,
    quarterly: payload.quarterly,
    pageNo: payload.pageNo,
    totalPage: payload.totalPage,
    scrapeDate: payload.scrapeDate,
    date: payload.date,
    time: payload.time,
  });
};

sewageSchema.statics.getData = function (payload) {
  return this.find(payload)
    .sort({
      day: 1,
    })
    .exec();
};

model.sewage = mongoose.model('sewage', sewageSchema);
module.exports = model;
