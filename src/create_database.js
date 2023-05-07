'use strict';

/* Random integer inclusive from this range */
function random2(min, max)
{
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

Object.defineProperty(Array.prototype, 'shuffle', {
    value: function() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
        return this;
    }
});
'use strict';

/* make_fraction:
 *   Use chain fraction method
 *   to represent the number as [nominator, denominator]
 *   Repeats until error < 1e-6 or until denominator > 20
 * If number is negative, returns [-nominator, denominator]
 * If number is integer, returns [number, 1]
 */
function make_fraction(number, limit=true)
{
  let sign = 1;
  if(number < 0) { sign = -sign; number = -number; }
  let result = [sign*Math.round(number), 1];
  for(let maxdepth = 1; maxdepth <= 30; ++maxdepth)
  {
    let cf = []
    let a  = number;
    for(let i=0; i<maxdepth; ++i)
    {
      cf.push( Math.trunc(a) );
      a = 1 / (a - cf[i]);
    }
    let u = cf[maxdepth-1], v = 1;
    for(let i=maxdepth-2; i>=0; --i)
    {
      let w = cf[i] * u + v;
      v = u;
      u = w;
    }
    if(maxdepth > 1 && limit && result[1] != 1 && u > 300 && v > 300) break;
    result = [sign*u, v];
    let error = Math.abs(number - u/v);
    if(error <= 1e-6)
      break;
  }
  return result;
}
/* Copyright (C) 1992,2007,2023 Joel Yliluoma ( https://iki.fi/bisqwit/ ) */
/* Various javascript utility functions - https://bisqwit.iki.fi/jsgames/ */

function cloneObject(what)
{
  let res = {}
  for (let i in what)
  {
    if (is_array(what[i]))
      res[i] = cloneArray(what[i])
    else if (typeof what[i] == 'object')
      res[i] = cloneObject(what[i])
    else
      res[i] = what[i]
  }
  return res
}
function cloneArray(what)
{
  let result = what.slice(0), a, b=result.length;
  for(a=0; a<b; ++a)
    if(!is_array(result[a]) && typeof result[a] == 'object')
      result[a] = cloneObject(result[a]);
  return result
}

Array.prototype.is_array=true;
const serialize = JSON.stringify
const displayObject = serialize
const displayArray = serialize
const unserialize = JSON.parse
const is_array = x=>x.is_array

function propObject(props)
{
  for(let i in props) this[i] = props[i];
  return this
}
function protoObj(func, props)
{
  propObject.call(func.prototype, props);
  return func
}

/* This function provides things required to construct a class
 * with member functions and properties. The functions are put
 * into the prototype and the members into the instance.
 *
 * Usage example:
 *   var Frobinator = declObj(
 *     'numfrobs',
 *     'this.frobs.length=numfrobs',
 *     {frobs:[], a:1, b:2},
 *     {frob:function(){}}
 *   );
 */
function declObj(params,constructorcode, elements, memberfunctions)
{
/* - MSIE cannot cope with eval() returning a function object
  return protoObj(
    eval('(function('+params+') { propObject.call(this, elements); '+constructorcode+' })'),
    memberfunctions)
*/
  let f;
  eval('f=function('+params+') { propObject.call(this, elements); '+constructorcode+'; }');
  return protoObj(f, memberfunctions)
}
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
'use strict';

const text_sign = op=>tok_text[op]

function poly_rendertext(poly)
{
  let result = '';
  for(let a=0; a<poly.length; ++a)
  {
    let p = poly[a];
    if(p.hasOwnProperty('neg'))
    {
      p = p['neg'];
      if(a == 0) result += '-';
      else       result += ' - ';
      let s = poly_renderterm(p);
      if(s.match(/[-+()]/))
        s = '(' + s + ')'
      result += s
    }
    else
    {
      if(a > 0)
      {
        if(p.hasOwnProperty('fac') && p['fac'] < 0)
        {
          result += ' - ';
          let temp = { 'fac': -p['fac'], 'vars': p['vars']}
          result += poly_renderterm(temp);
          continue;
        }
        else
          result += ' + ';
      }
      result += poly_renderterm(p);
    }
  }
  return result;
}

function poly_renderterm(poly)
{
  if(poly.hasOwnProperty('neg'))
    return '-(' + poly_renderterm(poly['neg']) + ')';
  if(poly.hasOwnProperty('mul'))
  {
    let e = poly['mul'].map(p => {
      let s = poly_rendertext(p);
      if(s.match(/[-+()]/)) return '(' + s + ')';
      else return s;
    });
    for(let a=0; a+1<e.length; ++a)
    {
      if(e[a][0] != '(' && e[a+1][0] != '(')
        e[a] += '·';
    }
    return e.join('')
  }
  
  let frac   = make_fraction(poly['fac']);
  let result = frac[0] + '';

  let vars = {}, p = poly['vars'];
  if(p.length)
  {
    if(result == '1') result = '';
    if(result == '-1') result = '-';
  }
  for(let a=0; a<p.length; ++a)
  {
    let c = p[a];
    if(vars[c]) vars[c] += 1;
    else        vars[c] = 1;
  }
  for(let k in vars)
    if(vars[k] == 1)
      result += k;
    else
      result += k + '^' + vars[k];
  if(frac[1] != 1)
    result += '/' + frac[1];
  return result;
}
'use strict';

/* For simplification tasks, we have the algorithm do the work.
 * For solving tasks, we cheat by deciding the answer in advance.
 */
function poly_simplify(poly, known=null)
{
  let result = []
  for(let a=0; a<poly.length; ++a)
  {
    let poly2 = poly_simplify_term_to_poly(poly[a], known);
    result = poly_add(result, poly2);
  }
  return poly_sort(result);
}

/* Adds two simplified polynomials */
/* Result is always a new object. */
function poly_add(poly1, poly2)
{
  //console.log('adding',poly1,poly2)
  /* Translate both poly into varlist:fac */
  let work = {};
  for(let a=0; a<poly1.length; ++a)
  {
    let k = poly1[a]['vars'].join('')
    if(work[k])
      work[k] += poly1[a]['fac'];
    else
      work[k]  = poly1[a]['fac'];
  }
  for(let a=0; a<poly2.length; ++a)
  {
    let k = poly2[a]['vars'].join('')
    if(work[k])
      work[k] += poly2[a]['fac'];
    else
      work[k]  = poly2[a]['fac'];
  }
  /* Translate to secondary form: [ factor, vars, max_exponent, prod_exponents ] */
  let result = [];
  for(let p in work)
    if(work[p] != 0) // Only include terms with nonzero factor
    {
      let vars = {}, max = 0, prod = 1;
      for(let a=0; a<p.length; ++a)
      {
        let c = p[a];
        if(vars[c]) vars[c] += 1;
        else        vars[c] = 1;
      }
      //console.log('vars',p,vars)
      for(let k in vars)
      {
        if(vars[k] > max) max = vars[k];
        prod *= vars[k];
      }
      result.push( [work[p], p.split(''), max, prod] )
    }
  /* Sort the result by a)highest exponent, b)product of exponents, c)variable names, d) factors */
  result.sort( (a,b)=>{
    if(a[2] != b[2]) return b[2] - a[2];
    if(b[3] != a[3]) return b[3] - a[3];
    if(a[1] != b[1]) return a[1] < b[1] ? -1 : 1;
    return b[0] - a[0];
  });
  /* Translate back */
  result = result.map(k => ({ 'fac': k[0], 'vars': k[1] }))
  //console.log('result',result)

  if(result.length == 0)
    result.push( {'fac':0, 'vars':[]} )
  return result;
}

/* Multiplies two simplified polynomials */
function poly_multiply(poly1, poly2)
{
  //console.log('multiplying',poly1,poly2)
  let result = []
  for(let a=0; a<poly1.length; ++a)
  {
    let term1 = poly1[a];
    for(let b=0; b<poly2.length; ++b)
    {
      let term2 = poly2[b];
      /* Multiply term1 by term2 */
      let product = { 'fac': (term1.fac * term2.fac),
                      'vars': term1['vars'].concat(term2['vars']) } // Creates a copy
      if(product['fac'] == 0) product['vars'] = []
      product.vars.sort();
      result = poly_add(result, [product]);
    }
  }
  //console.log('result',result)
  return result;
}

/* Accepts term, returns sum */
function poly_simplify_term_to_poly(term, known=null)
{
  if(term.hasOwnProperty('neg'))
  {
    //console.log("Negated: ", term)
    let s = poly_simplify_term_to_poly(term['neg'], known);
    // result is always a poly consisting of terms.
    // All scenarios involve creating a new object.
    for(let a=0; a<s.length; ++a)
      s[a]['fac'] *= -1;
    //console.log("Becomes: ", s)
    return s;
  }
  if(term.hasOwnProperty('mul'))
  {
    let poly = term['mul'];
    if(poly.length == 0)
      return [{'fac':1, 'vars':[]}]
    let lhs = poly_simplify(poly[0], known);
    for(let a=1; a<poly.length; ++a)
    {
      let rhs = poly_simplify(poly[a], known);
      lhs = poly_multiply(lhs, rhs);
    }
    return lhs;
  }
  /* Polynomial is already simplified. */
  /* Make sure the list of variables is sorted. */
  /* And return a copy. */
  let v = [], f = term['fac']
  if(!known)
  {
    v = term['vars'].join('').split('')
  }
  else
  {
    for(let a=term['vars'], n=0; n<a.length; ++n)
      if(known[a[n]])
        f *= known[a[n]]
      else
        v.push(a[n])
  }
  if(f == 0) { v = [] }
  v.sort()
  return [ { 'fac': f, 'vars': v } ]
}

function poly_sort(poly)
{
  let poly_order_term = function(a,b)
  {
    let trans = poly=>{
      if('neg' in poly)
      {
        let r = trans(poly['neg']);
        r[0] *= -1;
        return r;
      }
      if('mul' in poly)
      {
        /*let m = poly['mul']
        for(let n=0; n<m.length; ++n)
            m[n] = poly_sort(m[n])*/
        let r = [0,0,0,0]
        return r
      }
      let vars = {}, max = 0, prod = 1, p = poly['vars'];
      for(let a=0; a<p.length; ++a)
      {
        let c = p[a];
        if(vars[c]) vars[c] += 1;
        else        vars[c] = 1;
      }
      //console.log('vars',p,vars)
      for(let k in vars)
      {
        if(vars[k] > max) max = vars[k];
        prod *= vars[k];
      }
      return [poly['fac'], p, max, prod];
    };
    a = trans(a);
    b = trans(b);
    if(a[2] != b[2]) return b[2] - a[2];
    if(b[3] != a[3]) return b[3] - a[3];
    if(a[1] != b[1]) return a[1] < b[1] ? -1 : 1;
    return b[0] - a[0];
  }
  let sort_vars = function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) sort_vars(p[a])
    }
    else if(p.hasOwnProperty('mul'))
    {
      sort_vars(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      sort_vars(p['neg']);
    }
    else p['vars'].sort()
  }
  let p = cloneArray(poly)
  sort_vars(p)
  //console.log(p)
  p.sort(poly_order_term);
  return p
}
'use strict';

/** Generate polynomial
Traits: {
   allow_vars : integer
       0 = no vars, 1 = x only, 2 = x and y, 3 = x,y,α,β etc.
       If max_degree = 0, has no effect

   allow_neg : integer
       0 = only positive numbers
       1 = allow negative factors
       2 = also allow negated polynomials

   allow_mul : integer
       0 = no multiplications
       1 = with scalar
       2 = with term
       3 = with binomial
       4 = no limits
   
   allow_frac : bool

   min_terms : integer
       at least n terms

   max_terms : integer
       at most n terms

   max_degree : integer
       0, 1, 2
}
*/

/** Format:
sum  =  [ term... ]
term =  { 'fac': number, 'vars':[list of vars] } -- simplified polynomial
        { 'neg': term }                          -- negated
        { 'mul': [ sum... ] }                    -- multiplication
*/

function poly_generate(traits)
{
  /*
  const sets_str =
  ''                             + ';' +
  '|x'                           + ';' +
  '|x-y|xy-yx'                   + ';' +
  '|x-y-a-b|xy-yx-xa-ya-ab|xab';
  const var_sets = sets_str.split(';').map(s=>s.split('|'))
  */
  const set0 = ['']
  const set1 = ['', 'x']
  const set2 = ['', 'x-y',     'xy-yx']
  const set3 = ['', 'x-y-a-b', 'xy-yx-xa-ya-ab', 'xab' ]
  const var_sets = [set0, set1, set2, set3]

  let factor2 = random2(1, 14);
  let make_term = function()
  {
    if(traits['allow_mul'] && random2(0,7) == 0)
    {
      let backup = Object.assign({}, traits)
      let result = { 'mul' : [] }
      let poly = null, scalar = null, poly1 = null, poly2 = null, term = null;
      // Create a mul expression
      switch(traits['allow_mul'])
      {
        case 1: // Scalar with polynomial
          traits['allow_mul'] = 0;
          traits['max_terms'] = 2;
          poly = poly_generate(traits);   // Make polynomial
          traits['max_degree'] = 0;
          scalar = [ make_term() ];       // Make scalar
          result['mul'].push(poly)
          result['mul'].push(scalar)
          break;
        case 2: // Term with polynomial
          traits['allow_mul'] = 0;
          traits['max_terms'] = 2;
          poly = poly_generate(traits);   // Make polynomial
          term = [ make_term() ];         // Make term
          result['mul'].push(poly)
          result['mul'].push(term)
          break;
        case 3: // Binomial with binomial
          traits['allow_mul'] = 0;
          traits['max_terms'] = 2;
          poly1 = poly_generate(traits);   // Make binomial
          poly2 = poly_generate(traits);   // Make binomial
          result['mul'].push(poly1)
          result['mul'].push(poly2)
          break;
        default: // No limits
          traits['allow_mul'] = 2;
          poly1 = poly_generate(traits);   // Make polynomial
          poly2 = poly_generate(traits);   // Make polynomial
          result['mul'].push(poly1)
          result['mul'].push(poly2)
          break;
      }
      // Done
      result['mul'].shuffle();
      Object.assign(traits, backup);
      if(traits['allow_neg'] >= 2 && random2(0,5)==0 && result['mul'].length > 1)
        return { 'neg': result }
      return result;
    }
    let vars   = []
    let factor = random2(1,10);
    if(random2(0, traits['allow_frac'] ? 3000 : 200) == 0) factor = 0;
    if(traits['allow_frac'] && random2(0,1) == 0)
    {
      factor /= factor2;
    }
    if(traits['allow_neg'] >= 1 && random2(0,3)==0) factor = -factor;
    if(traits['allow_vars'] && traits['max_degree'])
    {
      // >= 1:   x
      // >= 2:   x and possibly y
      // >= 3:   all sorts of letters
      let s = var_sets[traits['allow_vars']]        // list of variable options
      let m = Math.min(3, random2(0, s.length-1));  // choose a set
      s = s[m].split('-')
      s = s[random2(0, s.length-1)]
      for(let a=0; a<m; ++a)
        for(let e=random2(1, (a==0 || s[a]>="x") ? traits['max_degree'] : 1); e > 0; --e)
          vars.push(s[a])
      /* Do exponents only for "x" and "y", or the first variable in the list. */
    }
    let result = { 'fac':factor, 'vars':vars };
    if(traits['allow_neg'] >= 2)
    {
      if(result['fac'] < 0)
        { if(random2(0, 5) == 0) return { 'neg': result } }
      else
        { if(random2(0,6000) == 0) return { 'neg': result } }
    }
    return result;
  };

  let result = [];
  let nterms = random2(traits['min_terms'] || 1, traits['max_terms'] || 3);
  for(let n=0; n<nterms; ++n) result.push(make_term());
  return result;
}

/*
console.log(poly_rendertext(poly_simplify( [
  {'neg':
     {'mul': [ [ {'fac':4, 'vars':['x']}, {'fac':6, 'vars':['y']} ],
               [ {'fac':4, 'vars':['x','x']}, {'fac':-6, 'vars':['y']} ]
             ]},
  },
     {'neg': {'fac':3, 'vars':['x','y']}}
  ])
))
*/
'use strict';

//console.log(poly_rendertext( poly_parse('5ax^2b+5-2')[2] ))

let t = {
  'min_terms'  : 1,
  'max_terms'  : 4,
  'max_degree' : 2,
  'allow_vars' : 1,
  'allow_neg'  : 2,
  'allow_mul'  : 2,
  'allow_frac' : true,
}

function number_of_terms(poly)
{
  return poly.length
}
function number_of_distinct_variables(poly)
{
  let vars={}
  let count_in=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) count_in(p[a])
    }
    else if(p.hasOwnProperty('mul'))
    {
      count_in(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      count_in(p['neg']);
    }
    else for(let v=p['vars'], n=0; n<v.length; ++n)
      vars[v[n]] = 1
  }
  count_in(poly);
  let res=0;
  for(let k in vars) ++res;
  /*
  if(vars['x']) res|=1;
  if(vars['y']) res|=2;
  if(vars['a']) res|=4;
  if(vars['b']) res|=8;
  */
  return res;
}
function type_of_multiplication(poly)
{
  let scalar_by_poly=false;
  let term_by_poly=false;
  let binom_by_binom=false;
  let poly_by_poly=false;
  let find_mul=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_mul(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      /* Identify each component in the multiplication */
      let q = p['mul'];
      let scalars=0, terms=0, binoms=0, polys=0;
      for(let a=0; a<q.length; ++a)
      {
        let r = q[a];
        // r is also an array: a polynomial.
        switch(r.length)
        {
          case 1:
          {
            // One element. Find which category it belongs to.
            let s = r[0];
            if(s.hasOwnProperty('mul')
            || s.hasOwnProperty('neg'))
              polys += 1; // Complex object
            else if(s.vars.length == 0)
              scalars += 1; // No variables
            else
              terms += 1;
            break;
          }
          case 2:
          {
            // Binomial
            ++binoms;
            break;
          }
          default:
          {
            // Other
            ++polys;
            break;
          }
        }
      }
      // binom by neg = 
      if(polys >= 2 || (polys >= 1 && binoms))
        poly_by_poly = true;
      else if(binoms >= 2)
        binom_by_binom = true;
      else if(terms)
        term_by_poly = true;
      else if(scalars)
        scalar_by_poly = true;
      find_mul(q);
    }
    else if(p.hasOwnProperty('neg'))
    {
      find_mul(p['neg']);
    }
  }
  find_mul(poly);
  return Math.max(poly_by_poly*8, binom_by_binom*4, term_by_poly*2, scalar_by_poly*1);
}
function has_negation(poly)
{
  let res=false, find_neg=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_neg(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      find_neg(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      res = true;
    }
  }
  find_neg(poly);
  return res;
}
function max_power(poly)
{
  let res=0, find_power=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_power(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      find_power(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      find_power(p['neg']);
    }
    else
    {
      let vars={}
      for(let v=p['vars'], n=0; n<v.length; ++n)
      {
        let s = v[n];
        if(vars[s]) vars[s] += 1;
        else        vars[s] = 1;
        res = Math.max(res, vars[s]);
      }
    }
  }
  find_power(poly);
  find_power(poly_simplify(poly));
  return res;
}
function has_fract(poly)
{
  let res=0, find_fract=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_fract(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      find_fract(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      find_fract(p['neg']);
    }
    else
    {
      let m = make_fraction(p['fac'], false);
      if(m[1] != 1)
      {
        res |= 1;
        if(Math.abs(p['fac']) >= 1.0)
        {
          // Fraction that evaluates to whole numbers is bad
          res |= 2;
        }
      }
    }
  }
  find_fract(poly);
  find_fract(poly_simplify(poly));
  return res;
}
function largest_factor(poly)
{
  let res=0, find_fac=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_fac(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      find_fac(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      find_fac(p['neg']);
    }
    else
    {
      let m = make_fraction(p['fac'], false);
      res = Math.max(res, Math.abs(p['fac']))
      res = Math.max(res, Math.abs(m[0]))
      res = Math.max(res, Math.abs(m[1]))
    }
  }
  find_fac(poly);
  return res;
}


let num_for_code={}

function stringify(q)
{
  if(is_array(q))
    return '[' + q.map(stringify).join(',') + ']'
  else if(typeof(q) == 'object')
  {
    let res = []
    if(q.hasOwnProperty('fac'))
    {
      let v = q['fac']
      let s='', f = make_fraction(v, false);
      if(f[1] == 1)
      {
        s = v;
      }
      else
      {
        s = f[0]+'/'+f[1]
      }
      if(q['vars'].length==0) return 'K('+s+')'
      return 'K('+s+','+stringify(q['vars'])+')'
    }
    if(q.hasOwnProperty('neg')) return 'N('+stringify(q['neg'])+')'
    if(q.hasOwnProperty('mul')) return 'M('+stringify(q['mul'])+')'
    for(let k in q)
    {
      let v = q[k], s = ''
      if(k == 'fac')
      {
        let f = make_fraction(v, false);
        if(f[1]==1) s = f[0]; else s = f[0]+'/'+f[1]
      }
      else
        s = stringify(v)
      res.push(k+':'+s)
    }
    return '{' + res.join(',') + '}'
  }
  else if(typeof(q) == 'string')
    return JSON.stringify(q)
  else
    return q
}

var replaces=[]
for(let x=0; x<=3; ++x)
for(let y=0; y<=3; ++y)
for(let a=0; a<=3; ++a)
for(let b=0; b<=3; ++b)
{
  let f = '', v = [];
  if(x) { f += 'x'; if(x>1) f += x; for(let n=0; n<x; ++n) v.push('x') }
  if(y) { f += 'y'; if(y>1) f += y; for(let n=0; n<y; ++n) v.push('y') }
  if(a) { f += 'a'; if(a>1) f += a; for(let n=0; n<a; ++n) v.push('a') }
  if(b) { f += 'b'; if(b>1) f += b; for(let n=0; n<b; ++n) v.push('b') }
  if(f=='')continue
  let p = stringify(v)
  replaces.push( [p,f] )
  if(x&&y)
  {
    let f = '', v = [];
    if(y) { f += 'y'; if(y>1) f += y; for(let n=0; n<y; ++n) v.push('y') }
    if(x) { f += 'x'; if(x>1) f += x; for(let n=0; n<x; ++n) v.push('x') }
    if(a) { f += 'a'; if(a>1) f += a; for(let n=0; n<a; ++n) v.push('a') }
    if(b) { f += 'b'; if(b>1) f += b; for(let n=0; n<b; ++n) v.push('b') }
    if(f=='')continue
    let p = stringify(v)
    replaces.push( [p,f] )
  }
}
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+',x)',  'X'+n] )
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+',x2)', 'XX'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+',x)', 'Xm'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+',x2)','XXm'+n] )
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+',y)',  'Y'+n] )
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+',y2)', 'YY'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+',y)', 'Ym'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+',y2)','YYm'+n] )
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+')',    'v'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+')',   'vm'+n] )

let attempts = 0, done = {};
while(attempts < 100000)
{
  ++attempts;

  t.allow_vars = random2(0,3)==0 ? (random2(0,3)==0?3:2) : 1;
  t.max_degree = random2(1,3);
  t.allow_mul  = random2(0,3);
  t.allow_frac = random2(0,3)==0;
  t.allow_neg  = random2(0,2);
  let poly = poly_generate(t)

  //poly = [{'fac':5,'vars':['x']}, {'fac':10,'vars':['x']}]
  let simp = poly_simplify(poly);
  
  let text0 = poly_rendertext(poly);
  let text1 = poly_rendertext(poly_sort(poly));
  let text2 = poly_rendertext(simp);

  /*
  TODO: If the task only involves sorting,
  such as with 3x^2ab + 10yx^2 + 6x^2,
  or 5 + 10yx,
  or there is nothing to simplify,
  don't include this task  */
  let solve_only = false
  if(text1 == text2
  || text0 == text2)
  {
    solve_only = true
  }

  //if(text2 == '0') continue;
  //console.log(poly_rendertext(poly_sort(poly)), "\n", poly_rendertext(poly_simplify(poly)));

  let fac = largest_factor(simp);
  if(fac > 19 && fac != 20 && fac != 30 && fac != 40 && fac != 50 && fac != 100)
  {
    continue;
  }

  /*
  console.log(poly_rendertext( poly))
  console.log(poly_render_latex( poly))
  console.log(poly_rendertext(poly_simplify( poly)) )
  console.log(poly_render_latex(poly_simplify( poly)) )
  console.log(poly_rank(poly))
  */

  let n_terms   = number_of_terms(poly);
  let n_vars    = number_of_distinct_variables(poly);
  let mul_types = type_of_multiplication(poly);
  let has_negat = has_negation(poly);
  let has_power = max_power(poly);
  let fract     = has_fract(poly);
  
  if(has_power > 5) continue;
  if(fract & 2) continue; // Too complex fractions

  /* Terms (1-8):      abcdefgh
   * Vars (0-3):       0123
   * Mul types (0-15): ABCDEFGHIJKLMNOP of these, only ABCEI are used.
   * Negat (0-1):      kl
   * Power (0-9):      mnopqrstuvwxyz
   * Fract (0-1):      ij
   */
  
  let code = String.fromCharCode(97+n_terms-1 + (solve_only ? -32 : 0)) +
             String.fromCharCode(48+n_vars) +
             String.fromCharCode(65+mul_types) +
             String.fromCharCode(107+has_negat) +
             String.fromCharCode(109+has_power) +
             String.fromCharCode(105+fract);
  /*
  if(code != 'b1Alni') continue;
  */
  //console.log("orig:"+text0,"\n", "sorted:"+text1, "\n", "simplified:"+text2, "\n", poly, "\n", simp);
  
  let s = stringify([code, /*poly_rank(poly), */poly]);
  if(s in done)
    continue;

  if(num_for_code[code])
  {
    if(++num_for_code[code] >= 3)
      continue;
  }
  else
  {
    num_for_code[code] = 1;
  }
  
  done[s] = true;
  attempts = 0;
  
  for(let n=0; n<replaces.length; ++n)
    s = s.replaceAll(replaces[n][0], replaces[n][1]);

  console.log(s + " // " + text0)
}
