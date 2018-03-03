// Sample
// https://www.rocketpunch.com/companies?page=1&q=

var Crawler = require("crawler");

function main() {
  var c = new Crawler({
      maxConnections : 10,
      // This will be called for each crawled page
      callback : function (error, res, done) {
          if(error) {
              console.log(error);
          } else {
              var $ = res.$;
              // $ is Cheerio by default
              //a lean implementation of core jQuery designed specifically for the server
              console.log($("title").text());
          }
          done();
      }
  });

  c.queue('https://www.rocketpunch.com/companies?page=1&q=');
}

if (require.main === module) {
    main();
}

