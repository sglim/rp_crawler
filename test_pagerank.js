'use strict';

const Pagerank = require('pagerank-js');

const nodes = [[1,2],[],[0,1,4],[4,5],[3,5],[3]];
const linkProb = 0.85; //high numbers are more stable
const tolerance = 0.0001; //sensitivity for accuracy of convergence.

Pagerank(nodes, linkProb, tolerance, function (err, res) {
  if (err) throw new Error(err);

  //otherwise use the result (res)
  console.log(res);
});
