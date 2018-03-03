'use strict';

// Sample
// No! https://www.rocketpunch.com/companies?page=1&q=
// Yes! https://www.rocketpunch.com/api/companies/template?page=1&q=


const _ = require('lodash');
const cheerio = require('cheerio')
const Crawler = require("crawler");
const csvWriter = require('csv-write-stream');
const fs = require('fs');

function parseTemplateBody(body) {
  const parsed = JSON.parse(body);
  const template = parsed.data.template;
  return cheerio.load(template)
}

function getPage() {
  const c = new Crawler({
    jquery: false,
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
      if(error) {
        console.log(error);
      } else {
        const $ = parseTemplateBody(res.body);
        const lastPage = $('.pagination .computer .item:last-child').text();
        console.log(parseInt(lastPage.replace(',', ''), 10));
        // TODO(sglim): Crawl page here.
      }
    }
  });
  c.queue('https://www.rocketpunch.com/api/companies/template');
}

function main() {
  getPage();
}

function crawl(page) {
  const writer = csvWriter();
  writer.pipe(fs.createWriteStream('out.csv'))

  const c = new Crawler({
    jquery: false,
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
      if(error) {
        console.log(error);
      } else {
        const parsed = JSON.parse(res.body);
        const template = parsed.data.template;
        const $ = cheerio.load(template)
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
      // TODO(sglim): Finish iff all data received
      writer.end()
      done();
    }
  });

  c.queue(`https://www.rocketpunch.com/api/companies/template?page=${page}&q=`);
}

if (require.main === module) {
  main();
}

