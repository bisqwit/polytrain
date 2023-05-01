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
  return poly_by_poly*8 + binom_by_binom*4 + term_by_poly*2 + scalar_by_poly*1;
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

for(let n=0; n<500000; ++n)
{
  t.allow_vars = random2(0,3)==0 ? 2 : 1;
  t.max_degree = random2(1,3);
  t.allow_mul  = random2(0,3);
  t.allow_frac = random2(0,3)==0;
  let poly = poly_generate(t)
  let simp = poly_simplify(poly);

  let text0 = poly_rendertext(poly);
  let text1 = poly_rendertext(poly_sort(poly));
  let text2 = poly_rendertext(simp);
  if(text1 == text2) continue;
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
   * Mul types (0-15): ABCDEFGHIJKLMNOP
   * Negat (0-1):      kl
   * Power (0-9):      mnopqrstuvwxyz
   * Fract (0-1):      ij
   */
  
  let code = String.fromCharCode(97+n_terms-1) +
             String.fromCharCode(48+n_vars) +
             String.fromCharCode(65+mul_types) +
             String.fromCharCode(107+has_negat) +
             String.fromCharCode(109+has_power) +
             String.fromCharCode(105+fract);
  /*
  if(code != 'a1Akoi') continue;
  console.log(text0, "\n", text1, "\n", text2);
  */
  
  if(num_for_code[code])
  {
    if(++num_for_code[code] >= 50)
      continue;
  }
  else
    num_for_code[code] = 1;
  
  let stringify = q=>{
    if(is_array(q))
      return '[' + q.map(stringify).join(',') + ']'
    else if(typeof(q) == 'object')
    {
      let res = []
      if(q.hasOwnProperty('fac'))
      {
        let v = q['fac']
        let s='', f = make_fraction(v, false);
        if(f[1]==1) s = f[0]; else s = f[0]+'/'+f[1]
        if(q['vars'].length==0) return 'K('+s+')'
        return 'K('+s+','+stringify(q['vars'])+')'
      }
      if(q.hasOwnProperty('neg'))
        return 'N('+stringify(q['neg'])+')'
      if(q.hasOwnProperty('mul'))
        return 'M('+stringify(q['mul'])+')'
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
  let s = stringify([code, /*poly_rank(poly), */poly]);
  //s = s[0] + ' ' + s.slice(1);
  
  //s = s.replaceAll('"fac"', 'fac')
  //s = s.replaceAll('"vars"', 'vars')
  //s = s.replaceAll('"neg"', 'neg')
  //s = s.replaceAll('"mul"', 'mul')
  /*s = s.replaceAll('["x"]',          'x')
  s = s.replaceAll('["y"]',          'y')
  s = s.replaceAll('["x","x"]',      'x2')
  s = s.replaceAll('["y","y"]',      'y2')
  s = s.replaceAll('["x","y"]',      'xy')
  s = s.replaceAll('["x","x","x"]',  'x3')
  s = s.replaceAll('["y","y","y"]',  'y3')*/
  for(let x=0; x<=3; ++x)
  for(let y=0; y<=3; ++y)
  for(let a=0; a<=3; ++a)
  for(let b=0; b<=3; ++b)
  {
    let f = '';
    if(x) { f += 'x'; if(x>1) f += x }
    if(y) { f += 'y'; if(y>1) f += y }
    if(a) { f += 'a'; if(a>1) f += a }
    if(b) { f += 'b'; if(b>1) f += b }
    if(f=='')continue
    let r = poly_parse(f)[2]
    let p = stringify(r[0]['vars'])
    s = s.replaceAll(p, f)
  }
  for(let n=0; n<=10; ++n) s = s.replaceAll('K('+n+',x)',  'X'+n)
  for(let n=0; n<=10; ++n) s = s.replaceAll('K('+n+',x2)', 'XX'+n)
  for(let n=1; n<=10; ++n) s = s.replaceAll('K(-'+n+',x)', 'Xm'+n)
  for(let n=1; n<=10; ++n) s = s.replaceAll('K(-'+n+',x2)','XXm'+n)
  for(let n=0; n<=10; ++n) s = s.replaceAll('K('+n+',y)',  'Y'+n)
  for(let n=0; n<=10; ++n) s = s.replaceAll('K('+n+',y2)', 'YY'+n)
  for(let n=1; n<=10; ++n) s = s.replaceAll('K(-'+n+',y)', 'Ym'+n)
  for(let n=1; n<=10; ++n) s = s.replaceAll('K(-'+n+',y2)','YYm'+n)
  for(let n=0; n<=10; ++n) s = s.replaceAll('K('+n+')',    'v'+n)
  for(let n=1; n<=10; ++n) s = s.replaceAll('K(-'+n+')',   'vm'+n)
  console.log(s)
}
