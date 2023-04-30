'use strict';

//console.log(poly_rendertext( poly_parse('5ax^2b+5-2')[2] ))

let t = {
  'min_terms'  : 2,
  'max_terms'  : 4,
  'max_degree' : 2,
  'allow_vars' : 1,
  'allow_neg'  : 2,
  'allow_mul'  : 2,
  'allow_frac' : true,
}
for(let n=0; n<5; ++n)
{
  let poly = poly_generate(t)

  /*
  console.log(poly_rendertext( poly))
  console.log(poly_render_latex( poly))

  console.log(poly_rendertext(poly_simplify( poly)) )
  console.log(poly_render_latex(poly_simplify( poly)) )

  console.log(poly_rank(poly))
  */

  let s = JSON.stringify([poly_rank(poly), poly]);
  s = s[0] + ' ' + s.slice(1);
  console.log(s)
}
