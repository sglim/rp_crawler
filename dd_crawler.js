'use strict';

const _ = require('lodash');
const cheerio = require('cheerio');
const fibrous = require('fibrous');
const request = require('request');
const winston = require('winston');

// http://www.demoday.co.kr/companies/category/commerce/1

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.label({ label: 'DD' }),
    winston.format.timestamp(),
    winston.format.printf(info => {
      return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'dd_crawler.log' })
  ]
});

function getCompanies(category, page, cb) {
  const url = `http://www.demoday.co.kr/companies/category/${category}/${page}`;
  request({
    url: url,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    }
  }, function (error, response, body) {
    if (error) {
      return cb(error);
    }
    if (_.isEmpty(body.trim())) {
      // empty!
      return cb(null, []);
    }

    var $ = cheerio.load(body);

    const companies = _.chain($('li'))
      .map($)
      .map(li => ({ title: li.find('.title').text(), desc: li.find('.desc').text() }))
      .value();
    return cb(null, companies);
  });
}

const main = fibrous(function mainSync() {
  const compagePage1 = getCompanies.sync('commerce', 1);
  logger.info(JSON.stringify(compagePage1));
  // Crawl a page
  // Until there is a data
});

if (require.main === module) {
  main((err) => {
    if (err) {
      logger.error(err);
    }
  });
}
