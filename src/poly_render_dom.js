'use strict';

const latex_sign = op=>tok_latex[op]

function latex_render(latex, action)
{
  let options = MathJax.getMetricsFor(gel('gamewin'))

  let html = MathJax.tex2svgPromise(
    latex,
    options).then(action)
  return html;
}
function poly_renderdom(poly, action)
{
  return latex_render(poly_render_latex(poly), action)
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
      //if(s.match(/[-+()]/))
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
      // If neither this nor the next element is surrounded
      // in parentheses, add cdot
      if(e[a].slice(0,6) != "\\left(" && e[a+1].slice(0,6) != "\\left(")
        e[a] += " \\cdot ";
    }
    return e.join('')
  }
  let frac   = make_fraction(poly['fac']);
  let result = '';
  if(frac[1] == 1)
  {
    result = frac[0] + '';
    let e = result.match(/[e]\+/)
    if(e)
      result = result.replace(/[e]\+/, "\\cdot 10^{") + "}"
    else if((e = result.match(/[e]/)))
      result = result.replace(/[e]/, "\\cdot 10^{") + "}"
    result = result.replace(/[.]/, "{,}")
  }
  else
  {
    if(frac[0] < 0) { result += '-'; frac[0] *= -1; }
    result += "\\frac{" + frac[0] + "}{" + frac[1] + "}";
  }
  
  let vars   = {}, p = poly['vars'];

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
    else if(vars[k] >= 10 || vars[k] < 0)
      result += k + '^{' + vars[k] + '}';
    else
      result += k + '^' + vars[k];
  return result;
}
