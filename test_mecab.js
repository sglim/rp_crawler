var mecab = require('mecab-ffi');
var paragraph = '마이크로소프트(MS)가 개발한 운영체제(OS) 최신 버전 ‘윈도우 10’의 무료 업그레이드가 29일부로 종료된다.';

// 형태소 분석
// mecab.parse(paragraph, function (err, result) {
//   console.log(result);
// });

// var result = mecab.parseSync(paragraph);
// console.log(result);

// 명사 추출
mecab.extractNounMap(paragraph, function (err, result) {
  console.log(result);
});