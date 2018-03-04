const OpenKoreanText = require('open-korean-text-node').default;

// Normalize
OpenKoreanText.normalize('힘들겟씀다 그래욬ㅋㅋㅋ').then((result) => {
  console.log(result);
});

console.log(OpenKoreanText.normalizeSync('힘들겟씀다 그래욬ㅋㅋㅋ'));