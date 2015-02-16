/**
 * Description
 * @method eq
 * @param {} a
 * @param {} b
 * @return BinaryExpression
 */
exports.eq = function(a,b){
  return a === b;
}

/**
 * Description
 * @method gt
 * @param {} a
 * @param {} b
 * @return BinaryExpression
 */
exports.gt = function(a,b){
  return parseFloat(a) > parseFloat(b);
}

/**
 * Description
 * @method lt
 * @param {} a
 * @param {} b
 * @return BinaryExpression
 */
exports.lt = function(a,b){
  return parseFloat(a) < parseFloat(b);
}