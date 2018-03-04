'use strict';

// Usage:
// npm start
// or (to skip some page)
// SKIP={skipCount} npm start

// Sample
// No! https://www.rocketpunch.com/companies?page=1&q=
// Yes! https://www.rocketpunch.com/api/companies/template?page=1&q=

const _ = require('lodash');
const cheerio = require('cheerio');
const Crawler = require('crawler');
const csvWriter = require('csv-write-stream');
const fibrous = require('fibrous');
const fs = require('fs');
const winston = require('winston');

const outputFilename = 'out.csv';
const skipCount = process.env.SKIP ? parseInt(process.env.SKIP, 10) : 0;
const myFormat = winston.format.printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.label({ label: 'RP Crawler' }),
    winston.format.timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function parseTemplateBody(body) {
  const parsed = JSON.parse(body);
  const template = parsed.data.template;
  return cheerio.load(template);
}

function getProxies(cb) {
  // https://www.sslproxies.org/
  const c = new Crawler({
    maxConnections : 1,
    callback: function (error, res, done) {
      if (error) {
        cb(error);
      } else {
        const $ = res.$;
        const ipPortList = _.reduce($('#proxylisttable tr'), (result, tr) => {
          const ipPort = $(tr).find('td');
          const ip = $(ipPort[0]).text().trim();
          const port = $(ipPort[1]).text().trim();
          if (!_.isEmpty(ip) && !_.isEmpty(port)) {
            result.push(`http://${ip}:${port}`);
          }
          return result;
        }, []);
        cb(null, ipPortList);
      }
      done();
    }
  });
  c.queue('https://www.sslproxies.org/');
}

function getTotalPage(proxyList, cb) {
  const c = new Crawler({
    jquery: false,
    maxConnections : 1,
    callback: function (error, res, done) {
      if (error) {
        cb(error);
      } else {
        const $ = parseTemplateBody(res.body);
        const lastPageStr = $('.pagination .computer .item:last-child').text();
        const lastPage = parseInt(lastPageStr.replace(',', ''), 10);
        cb(null, lastPage);
      }
      done();
    }
  });
  c.on('schedule', options => options.proxy=proxyList[0]);
  c.queue('https://www.rocketpunch.com/api/companies/template');
}

function mainSync() {
  const proxyList = getProxies.sync();
  // const proxyList = getProxiesAlter.sync();
  logger.info(`${proxyList.length} proxies are found.`);
  const totalPage = getTotalPage.sync(proxyList);

  let doneCount = 0;
  logger.info(`Total: ${totalPage} pages`);

  const writer = csvWriter();
  writer.pipe(fs.createWriteStream(outputFilename));

  const c = new Crawler({
    jquery: false,
    // rateLimit: 100,
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
      if (error) {
        logger.error(error);
      } else {
        const $ = parseTemplateBody(res.body);
        $('#company-list .company').each((index, item) => {
          const name = $(item).find('.name strong').text().trim();
          const metadata = $(item).find('.meta').text().trim();
          const metadataList = metadata.split(' ∙ ');
          writer.write({
            'name': name,
            'metadata': metadataList.join(', '),
          });
        });
      }

      const curPercentage = parseInt((doneCount + 1) / totalPage * 100, 10);
      if (parseInt(doneCount / totalPage * 100, 10) !== curPercentage) {
        logger.info(`Progressing...${doneCount + 1} done (${curPercentage}%)`);
      }

      doneCount++;
      if (doneCount === totalPage) {
        // Finish iff all data received
        writer.end();
      }
      done();
    }
  });

  let skipped = 0;
  if (skipCount) {
    doneCount += skipCount;
    logger.info(`Skip ${skipCount} entries`);
  }
  c.on('schedule', options => options.proxy=proxyList[getRandomInt(0, proxyList.length)]);
  _.times(totalPage, (pageIdx) => {
    if (skipCount && skipped < skipCount) {
      skipped++;
      return;
    }
    c.queue(`https://www.rocketpunch.com/api/companies/template?page=${pageIdx + 1}`);
  });
}

if (require.main === module) {
  fibrous(mainSync)((err) => {
    if (err) {
      logger.error(err);
    }
  });
}
