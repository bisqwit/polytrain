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
