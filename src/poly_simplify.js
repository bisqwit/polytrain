'use strict';

/* For simplification tasks, we have the algorithm do the work.
 * For solving tasks, we cheat by deciding the answer in advance.
 */
function poly_simplify(poly)
{
  let result = []
  for(let a=0; a<poly.length; ++a)
  {
    let poly2 = poly_simplify_term(poly[a]);
    result = poly_add(result, poly2);
  }
  return result;
}

/* Adds two simplified polynomials */
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
                      'vars': term1['vars'].concat(term2['vars']) }
      product.vars.sort();
      result = poly_add(result, [product]);
    }
  }
  //console.log('result',result)
  return result;
}

/* Accepts term, returns sum */
function poly_simplify_term(term)
{
  if(term.hasOwnProperty('neg'))
  {
    let s = poly_simplify_term(term['neg']);
    for(let a=0; a<s.length; ++a)
      s[a]['fac'] *= -1;
    return s;
  }
  if(term.hasOwnProperty('mul'))
  {
    let poly = term['mul'];
    if(poly.length == 0)
      return [{'fac':1, 'vars':[]}]
    let lhs = poly_simplify(poly[0]);
    for(let a=1; a<poly.length; ++a)
    {
      let rhs = poly_simplify(poly[a]);
      lhs = poly_multiply(lhs, rhs);
    }
    return lhs;
  }
  /* Polynomial is already simplified. */
  /* Make sure the list of variables is sorted. */
  term.vars.sort();
  return [term];
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
    a=trans(a);
    b=trans(b);
    if(a[2] != b[2]) return b[2] - a[2];
    if(b[3] != a[3]) return b[3] - a[3];
    if(a[1] != b[1]) return a[1] < b[1] ? -1 : 1;
    return b[0] - a[0];
  }
  let p = cloneArray(poly)
  //console.log(p)
  p.sort(poly_order_term);
  return p
}
