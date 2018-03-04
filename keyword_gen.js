'use strict';

const _ = require('lodash');
const csvWriter = require('csv-write-stream');
const fs = require('fs');
const OpenKoreanText = require('open-korean-text-node').default;
const parse = require('csv-parse/lib/sync');
const winston = require('winston');

const ddResultFilename = 'out_dd.csv';
const outputFilename = 'out_keyword_dd.csv';
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.label({ label: 'KW Gen' }),
    winston.format.timestamp(),
    winston.format.printf(info => {
      return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'keyword_gen.log' })
  ],
});

function main() {
  // OpenKoreanText doesn't work with fibrous
  const csvFileText = fs.readFileSync(ddResultFilename, 'utf8');
  const records = parse(csvFileText, { columns: true });

  const writer = csvWriter();
  writer.pipe(fs.createWriteStream(outputFilename));
  logger.info(`Add keyword to ${ddResultFilename}`);

  _.forEach(records, record => {
    const normalized = OpenKoreanText.normalizeSync(record.desc);
    const tokenized = OpenKoreanText.tokenizeSync(normalized);
    const keywords = _
      .chain(tokenized.toJSON())
      .filter(token => token.pos === 'Noun')
      .map(token => token.text)
      .value();
    writer.write(_.assign({
      keywords: keywords,
    }, record));
  });

  writer.end();
  logger.info(`${outputFilename} saved.`);
}

if (require.main === module) {
  main();
}
