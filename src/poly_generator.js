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
  const var_sets = [ [], ['x'], ['x','y'], ['x','b','a'] ]
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
      let s = var_sets[traits['allow_vars']].shuffle();
      let m = Math.min(3, random2(0, s.length));
      for(let a=0; a<m; ++a)
        for(let e=random2(1, traits['max_degree']); e > 0; --e)
          vars.push(s[a])
    }
    let result = { 'fac':factor, 'vars':vars };
    if(traits['allow_neg'] >= 2 && random2(0,30)==0)
      return { 'neg': result }
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
