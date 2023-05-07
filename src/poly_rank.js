const RANK_NEGATION    = 4;
const RANK_FAC_NEG     = 8;
const RANK_FAC_FRAC    = 7;
const RANK_FAC_FRAC_WHOLE = 50;
const RANK_FAC_SIMPLE  = 1;
const RANK_FAC_OTHER   = 3;
const RANK_VAR_COUNT   = 1;
const RANK_VAR_HIGHER  = 1;
const RANK_VAR_EXP     = 2;
const RANK_ADD         = 3;

function poly_rank(poly)
{
  return Math.round(Math.max(poly_rank_do(poly),
                             poly_rank_do(poly_simplify(poly))))
}

/* Give a numeric score on the complexity of the given polynomial. */
function poly_rank_do(poly)
{
  /* Score for adds: */
  let result = 0;
  for(let a = 0; a < poly.length; ++a)
    result += RANK_ADD + poly_rank_do_term(poly[a]);
  return result;
}
function poly_rank_do_term(term)
{
  /* Score for vars:
   *      Number of distinct variables
   *      Number of variables that have an exponent other than 1
   *      Highest exponent
   *
   * Score for factor:
   *      Negative?
   *      Fraction?
   *      Absolute value:
   *        1,2,3,4,5,10,20
   *      Other absolute value: number of digits
   *
   * Multiplication:
   *      Product of scores of individual sums
   *
   * Negation:
   *      4*score
   */
  if(term.hasOwnProperty('mul'))
    return term['mul'].map(x=>poly_rank_do(x)).reduce( (x,y)=>x*y )
  if(term.hasOwnProperty('neg'))
    return RANK_NEGATION * poly_rank_do_term(term['neg'])  
  
  let fac_score = poly_rank_do_factor(term['fac']);
  let vars_score = poly_rank_do_vars(term['vars']);
  return fac_score + vars_score;
}

function poly_rank_do_factor(factor)
{
  let frac   = make_fraction(factor);
  let result = 0;
  let v = Math.abs(frac[0]);
  if(v <= 5 || v == 10 || v == 20)
    result = RANK_FAC_SIMPLE;
  else
    result = RANK_FAC_OTHER * Math.max(1, Math.log10(v));
  if(factor < 0)
  {
    result += RANK_FAC_NEG;
  }
  if(frac[1] != 1)
  {
    result *= RANK_FAC_FRAC;
    if(frac[1] < v) result *= RANK_FAC_FRAC_WHOLE;
  }
  return result;
}

function poly_rank_do_vars(vars)
{
  /* Convert into {varname: exponent} format */
  let work = {}, max_exp = 0;
  for(let a=0; a<vars.length; ++a)
  {
    let s = vars[a];
    if(work[s]) work[s] += 1;
    else        work[s] = 1;
    max_exp = Math.max(max_exp, work[s]);
  }
  let n_distinct = 0;
  let n_higher   = 0;
  for(let k in work)
  {
    if(work[k] > 1)
      ++n_higher;
    ++n_distinct;
  }
  return (RANK_VAR_EXP ** max_exp) * (RANK_VAR_COUNT * (1+n_distinct)) * (RANK_VAR_HIGHER * (1+n_higher));
}
