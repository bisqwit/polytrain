'use strict';

function poly_renderdom(poly)
{
  let html = MathJax.tex2svg(
    poly_render_latex(poly),
    {
      'display':true,
      'em':12,
      'ex':6
    })
  return html;
}

function poly_render_latex(poly)
{
  let result = '';
  for(let a=0; a<poly.length; ++a)
  {
    let p = poly[a];
    if(p.hasOwnProperty('neg'))
    {
      p = p['neg'];
      result += '-';
      let s = poly_renderterm_latex(p);
      if(s.match(/[-+()]/))
        s = "\\left(" + s + "\\right)";
      result += s
    }
    else
    {
      if(a > 0)
      {
        if(p.hasOwnProperty('fac') && p['fac'] < 0)
        {
          result += '-';
          let temp = { 'fac': -p['fac'], 'vars': p['vars']}
          result += poly_renderterm_latex(temp);
          continue;
        }
        else
          result += '+';
      }
      result += poly_renderterm_latex(p);
    }
  }
  return result;
}

function poly_renderterm_latex(poly)
{
  if(poly.hasOwnProperty('neg'))
    return "-\\left(" + poly_renderterm_latex(poly['neg']) + "\\right)";
  if(poly.hasOwnProperty('mul'))
  {
    let e = poly['mul'].map(p => {
      let s = poly_render_latex(p);
      if(s.match(/[-+()]/)) return "\\left(" + s + "\\right)";
      else return s;
    });
    for(let a=0; a+1<e.length; ++a)
    {
      if(e[a][0] != '\\' && e[a+1][0] != '\\')
        e[a] += " \\cdot ";
    }
    return e.join('')
  }
  let frac   = make_fraction(poly['fac']);
  let result = '';
  if(frac[1] == 1)
  {
    result = frac[0] + '';
  }
  else
  {
    if(frac[0] < 0) { result += '-'; frac[0] *= -1; }
    result = "\\frac{" + frac[0] + "}{" + frac[1] + "}";
  }
  let vars   = {}, p = poly['vars'];
  for(let a=0; a<p.length; ++a)
  {
    let c = p[a];
    if(vars[c]) vars[c] += 1;
    else        vars[c] = 1;
  }
  for(let k in vars)
    if(vars[k] == 1)
      result += k;
    else if(vars[k] >= 10 || vars[k] < 0)
      result += k + '^{' + vars[k] + '}';
    else
      result += k + '^' + vars[k];
  return result;
}
