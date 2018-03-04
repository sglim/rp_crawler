'use strict';

const _ = require('lodash');
const cheerio = require('cheerio');
const csvWriter = require('csv-write-stream');
const fibrous = require('fibrous');
const fs = require('fs');
const mecab = require('mecab-ffi');
const request = require('request');
const winston = require('winston');

const outputFilename = `out_dd_${_.now()}.csv`;
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

function getCategories(cb) {
  const url = 'http://www.demoday.co.kr/companies';
  request({
    url: url,
  }, function (error, response, body) {
    if (error) {
      return cb(error);
    }

    var $ = cheerio.load(body);

    return cb(null, _.chain($('.startup-category li'))
      .map($)
      .map(li => ({
        title: _
          .chain(li.find('a').text())
          .replace(/[ /]/g, '-')
          .toLower()
          .value(),
        count: _
          .chain(li.find('.count').text())
          .replace(/[(,)]/g, '')
          .toInteger()
          .value(),
      }))
      .map(obj => _.assign({
        // TODO(sglim): Use it instead of 1
        // totalPage: _.ceil(obj.count / entryCountPerPage),
        totalPage: 1,
      }, obj))
      .value());
  });
}

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
      .map(li => ({
        title: li.find('.title').text().trim(),
        desc: li.find('.desc').text().replace(/\n/g, '. '),
      }))
      .value();
    return cb(null, companies);
  });
}

function getCompany(title, cb) {
  // e.g., http://www.demoday.co.kr/company/StudioMotif
  const url = `http://www.demoday.co.kr/company/${encodeURI(title)}`;
  logger.info(`Retrieve detail info for ${title}...`);
  request({
    url: url,
  }, function (error, response, body) {
    if (error) {
      return cb(error);
    }

    var $ = cheerio.load(body);
    return cb(null, $('meta[property="og:description"]').attr('content'));
  });
}

function mainSync() {
  const categories = getCategories.sync();
  logger.info(JSON.stringify(categories));

  const writer = csvWriter();
  writer.pipe(fs.createWriteStream(outputFilename));
  const totalPageCount = _.sumBy(categories, 'totalPage');
  logger.info(`Total page count: ${totalPageCount}`);
  let donePageCount = 0;

  _.forEach(categories, category => {
    _.times(category.totalPage, pageIdx => {
      const page = pageIdx + 1;
      const companies = getCompanies.sync(category.title, page);
      _.forEach(companies, company => {
        if (_.endsWith(company.desc, '...')) {
          company.desc = getCompany.sync(company.title);
        }
        writer.write(_.assign({
          page: page,
          category: category.title,
          keyword: _.keys(mecab.sync.extractNounMap(company.desc)).join(','),
        }, company));

      });
      donePageCount++;
      const curPercentage = parseInt(donePageCount / totalPageCount * 100, 10);
      if (parseInt((donePageCount - 1) / totalPageCount * 100, 10) !== curPercentage) {
        logger.info(`Progressing...${donePageCount} done (${curPercentage}%)`);
      }
    });
  });
  writer.end();
}
const main = fibrous(mainSync);

if (require.main === module) {
  main((err) => {
    if (err) {
      logger.error(err);
    }
  });
}
