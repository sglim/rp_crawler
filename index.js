'use strict';

// Sample
// No! https://www.rocketpunch.com/companies?page=1&q=
// Yes! https://www.rocketpunch.com/api/companies/template?page=1&q=


const _ = require('lodash');
const cheerio = require('cheerio')
const Crawler = require("crawler");
const csvWriter = require('csv-write-stream');
const fibrous = require('fibrous');
const fs = require('fs');

const outputFilename = 'out.csv';

function parseTemplateBody(body) {
  const parsed = JSON.parse(body);
  const template = parsed.data.template;
  return cheerio.load(template)
}

function getTotalPage(cb) {
  const c = new Crawler({
    jquery: false,
    maxConnections : 10,
    callback: function (error, res, done) {
      if (error) {
        cb(error);
      } else {
        const $ = parseTemplateBody(res.body);
        const lastPageStr = $('.pagination .computer .item:last-child').text();
        const lastPage = parseInt(lastPageStr.replace(',', ''), 10);
        cb(null, lastPage);
      }
    }
  });
  c.queue('https://www.rocketpunch.com/api/companies/template');
}

function mainSync() {
  const totalPage = getTotalPage.sync();

  let doneCount = 0;
  console.log(`Total: ${totalPage} pages`);

  const writer = csvWriter();
  writer.pipe(fs.createWriteStream(outputFilename))

  const c = new Crawler({
    jquery: false,
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
      if (error) {
        console.log(error);
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
        console.log(`Progressing...${curPercentage}%`);
      }

      doneCount++;
      if (doneCount === totalPage) {
        // Finish iff all data received
        writer.end();
      }
      done();
    }
  });

  _.times(totalPage, (pageIdx) => {
    c.queue(`https://www.rocketpunch.com/api/companies/template?page=${pageIdx + 1}`);
  });

}

if (require.main === module) {
  fibrous(mainSync)((err, res) => {
    if (err) {
      console.error(err);
    }
  });
}

