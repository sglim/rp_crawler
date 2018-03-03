'use strict';

// Sample
// No! https://www.rocketpunch.com/companies?page=1&q=
// Yes! https://www.rocketpunch.com/api/companies/template?page=1&q=


const _ = require('lodash');
const cheerio = require('cheerio')
const Crawler = require("crawler");

function main() {
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
                  console.log(_.chain(metadata).split(' ∙ ').value());
                  const metadataList = metadata.split(' ∙ ');
                  // console.log(name);
                  // console.log(metadata);
              });
          }
          done();
      }
  });

  c.queue('https://www.rocketpunch.com/api/companies/template?page=1&q=');
}

if (require.main === module) {
    main();
}

