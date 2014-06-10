exports.eq = function(a,b){
  return a === b;
}

exports.gt = function(a,b){
  return parseFloat(a) > parseFloat(b);
}

exports.lt = function(a,b){
  return parseFloat(a) < parseFloat(b);
}