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
