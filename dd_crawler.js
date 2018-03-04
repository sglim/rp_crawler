'use strict';

const fibrous = require('fibrous');
const winston = require('winston');

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

const main = fibrous(function mainSync() {
  logger.info('hello!');
});

if (require.main === module) {
  main((err) => {
    if (err) {
      logger.error(err);
    }
  });
}
