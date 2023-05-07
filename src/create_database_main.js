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
