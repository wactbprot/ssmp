/**
 * Compares also Strings
 * @method eq
 * @param {} a
 * @param {} b
 * @return BinaryExpression
 */
exports.eq = function(a,b){
  return a === b;
}
/**
 * Compares also Strings
 * @method eq
 * @param {} a
 * @param {} b
 * @return BinaryExpression
 */
exports.ne = function(a,b){
  return a != b;
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
 * greater or equal
 * @method ge
 * @param {} a
 * @param {} b
 * @return BinaryExpression
 */
exports.ge = function(a,b){
  return parseFloat(a) >= parseFloat(b);
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

/**
 * less or equal
 * @method le
 * @param {} a
 * @param {} b
 * @return BinaryExpression
 */
exports.le = function(a,b){
  return parseFloat(a) <= parseFloat(b);
}