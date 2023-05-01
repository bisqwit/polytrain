'use strict';

const TOK_VAR_EXP  = 1;
const TOK_DECIMAL  = 2;
const TOK_INTEGER  = 3;
const TOK_FRACTION = 4;
const TOK_ADD      = 5;
const TOK_SUB      = 6;
const TOK_EQ       = 7;
const TOK_NE       = 8;
const TOK_LT       = 9;
const TOK_GT       = 10;
const TOK_LE       = 11;
const TOK_GE       = 12;

/* Supported syntax:
    Decimal numbers:      0.6   0,6  .6   ,6
    Exponents:            ^3    ³    3          And repeated variable
    Supported variables:  x                     Repeated = exponent
    Factors:              decimal numbers
    Equality:             =
    Inequality:           <
                          >
                          <=   =<   ≤   <<
                          >=   =>   ≥   >>
                          <>   ><   ≠   !=   /=
    Multiplication:       *    ·    '   ×       And implied
    Sum:                  +
                          -    +-
    Fractions:            3/5x 3x/5 3:5x 3x:5
 
    All other symbols are ignored, including parentheses
 
    variable_with_exponent = [a-z] exponent?
    exponent               = ^?[1-9]+ | [⁰¹²³⁴⁵⁶⁷⁸⁹]+
    integer                = [1-9] [0-9]*
    decimal                = [.,] 0* integer | integer [.,] 0* integer
    multiplication         = [*·'×]
    sum                    = :+- | [+-]
    comparison             = <= | =< | >= | => | <> | >< | != | /= | << | >> | [=<>≤≥≠]
    fraction               = [:/] integer
    fraction_var_before    = integer [:/] integer variable_with_exponent
    fraction_var_after     = integer variable_with_exponent [:/] integer
    term                   = (DECIMAL | INTEGER | VAR_EXP | FRACTION)+
    poly                   = term ((TOK_ADD | TOK_SUB) term)*

  Return value:
    [ lhs_expression,
      comparison_operator,    if undefined, only rhs_expression matters
      rhs_expression,
      errors                  false or true
    ]
    expression is an array of {'fac':number, 'vars':[list of vars]}
    each expression is an additive term.
*/
function poly_parse(text)
{
  const r_var_repeated = /[a]{2,}b{2,}c{2,}d{2,}e{2,}f{2,}g{2,}h{2,}i{2,}j{2,}k{2,}l{2,}m{2,}n{2,}o{2,}p{2,}q{2,}r{2,}s{2,}t{2,}u{2,}v{2,}w{2,}x{2,}y{2,}z{2,}/
  const r_var_with_exp = /[a-z](?:[⁰¹²³⁴⁵⁶⁷⁸⁹]|\^ *[0-9]+|[1-9])?/
  const r_integer      = /[0-9][0-9]*/
  const r_decimal      = /[-]?[.,][0-9]+|[-]?[0-9]+[.,][0-9]*/
  const r_mult         = /[*·'×]/
  const r_comparison   = /[=]=|<=|=<|>=|=>|<>|><|!=|\/=|<<|>>|[=<>≤≥≠]/
  const r_fraction     = /[:/][0-9][0-9]*/
  const r_sum          = /\+-?|\+|-/
  let rsub = r => r.toString().slice(1,-1)
  let compiled = '('+rsub(r_var_repeated)+  // 1
               ')|('+rsub(r_var_with_exp)+  // 2
               ')|('+rsub(r_decimal)+       // 3
               ')|('+rsub(r_integer)+       // 4
               ')|('+rsub(r_fraction)+      // 5
               ')|('+rsub(r_comparison)+    // 6
               ')|('+rsub(r_mult)+          // 7
               ')|('+rsub(r_sum)+           // 8
               ')|.';
  compiled = new RegExp(compiled, 'g');
  let results = [...text.matchAll(compiled)];
  let tokens  = []
  for(let k in results)
  {
    k = results[k]
    for(let i=1; i<=8; ++i)
      if(k[i] != undefined)
      {
        let s = k[i];
        switch(i)
        {
          case 1: // variable repeated
          case 2: // variable with optional exponent
          {
            let varname = s[0], exponent = s.length;
            if(i == 2 && s.length > 1)
              switch(s[1])
              {
                case '⁰': exponent = 0; break;
                case '¹': exponent = 1; break;
                case '²': exponent = 2; break;
                case '³': exponent = 3; break;
                case '⁴': exponent = 4; break;
                case '⁵': exponent = 5; break;
                case '⁶': exponent = 6; break;
                case '⁷': exponent = 7; break;
                case '⁸': exponent = 8; break;
                case '⁹': exponent = 9; break;
                default: exponent = parseInt(s.slice(s[1] == '^' ? 2 : 1));
              }
            tokens.push([TOK_VAR_EXP, varname, exponent])
            break;
          }
          case 3: // decimal number
          {
            tokens.push([TOK_DECIMAL, parseFloat(s.replaceAll(',', '.'))])
            break;
          }
          case 4: // integer
          {
            tokens.push([TOK_INTEGER, parseInt(s)])
            break;
          }
          case 5: // fraction
          {
            tokens.push([TOK_FRACTION, parseInt(s.slice(1))])
            break;
          }
          case 6: // comparison operator
          {
            switch(s)
            {
              case '=': case '==': tokens.push(TOK_EQ); break;
              case '≠': case '!=': case '/=': case '<>': case '><': tokens.push(TOK_NE); break;
              case '<': tokens.push(TOK_LT); break;
              case '>': tokens.push(TOK_GT); break;
              case '≤': case '<=': case '=<': case '<<': tokens.push(TOK_LE); break;
              case '≥': case '>=': case '=>': case '>>': tokens.push(TOK_GE); break;
            }
            break;
          }
          case 7: // multiplication sign
          {
            // ignored
            break;
          }
          case 8: // plus or minus sign
          {
            tokens.push(s == '+' ? TOK_ADD : TOK_SUB)
            break;
          }
        }//switch
        break;
      }
  }
  /* Special rules:
   *   If at a moment where we expect a decimal/integer we get ADD, ignore ADD
   *   If at a moment where we expect a decimal/integer we get SUB + DECIMAL|INTEGER,
   *   ignore SUB and negate the decimal/integer
   */
  let term = { fac:1, vars:[] }, have_term = false, have_fac = false, have_frac = false;
  let lhs=[], rhs=[], comp_op, errors = false;
  let append = function()
  {
    term.vars.sort();
    rhs.push(term);
    have_term = false;
    have_fac  = false;
    have_frac = false;
    term = { fac:1, vars:[] };
  };
  var trail = []
  for(let a = 0; a < tokens.length; ++a)
  {
    if(typeof(tokens[a]) != 'object')
    {
      switch(tokens[a])
      {
        case TOK_ADD:
          trail.push(tokens[a]);
          if(!have_term) break; // nothing to do when expecting a term
          append();
          break;
        case TOK_SUB:
          trail.push(tokens[a]);
          if(!have_term) { term.fac = -term.fac; break; }
          append();
          term.fac = -term.fac;
          break;
        case TOK_EQ:
        case TOK_NE:
        case TOK_LT:
        case TOK_GT:
        case TOK_LE:
        case TOK_GE:
          if(!have_term) { errors = true; break; }      // ignore when term is missing
          if(comp_op != 'undefined') { errors = true; } // mark error when multiple comparisons are done
          append();
          lhs     = rhs;
          rhs     = [];
          comp_op = tokens[a];
          break;
      }
    }
    else
    {
      trail = [];
      switch(tokens[a][0])
      {
        case TOK_VAR_EXP:
          for(let e = 0; e < tokens[a][2]; ++e)
            term.vars.push(tokens[a][1]);
          have_term = true;
          break;
        case TOK_DECIMAL:
        case TOK_INTEGER:
          if(have_fac) { errors = true; break; } // Ignore repeated factor in one term
          term.fac *= tokens[a][1];
          have_term = have_fac = true;
          break;
        case TOK_FRACTION:
          if(have_frac) { errors = true; break; } // Ignore repeated fraction in one term
          if(tokens[a][1] == 0) { errors = true; break; }
          term.fac /= tokens[a][1];
          have_term = have_fac = have_frac = true;
          break;
      }
    }
  }
  if(have_term)          { append(); }
  else if(term.fac != 1) { errors = true; }

  let poly_order_term = function(a,b)
  {
    let trans = poly=>{
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
  
  rhs.sort(poly_order_term)
  lhs.sort(poly_order_term)
  return [lhs, comp_op, rhs, errors, trail];
}

//console.log(poly_parse('-2/5x+4'))

const simplification_tasks = (function(){
const K=(f,v=[])=>({fac:f,vars:v})
const M=f=>({mul:f})
const N=f=>({neg:f})
const F=(s)=>poly_parse(s)[2][0]['vars']
,b=F('b'),b2=F('b2'),b3=F('b3'),a=F('a'),ab=F('ab'),ab2=F('ab2'),ab3=F('ab3'),a2=F('a2'),a2b=F('a2b'),a2b2=F('a2b2'),a2b3=F('a2b3'),a3=F('a3'),a3b=F('a3b'),a3b2=F('a3b2'),a3b3=F('a3b3'),y=F('y'),yb=F('yb'),yb2=F('yb2'),yb3=F('yb3'),ya=F('ya'),yab=F('yab'),yab2=F('yab2'),yab3=F('yab3'),ya2=F('ya2'),ya2b=F('ya2b'),ya2b2=F('ya2b2'),ya2b3=F('ya2b3'),ya3=F('ya3'),ya3b=F('ya3b'),ya3b2=F('ya3b2'),ya3b3=F('ya3b3'),y2=F('y2'),y2b=F('y2b'),y2b2=F('y2b2'),y2b3=F('y2b3'),y2a=F('y2a'),y2ab=F('y2ab'),y2ab2=F('y2ab2'),y2ab3=F('y2ab3'),y2a2=F('y2a2'),y2a2b=F('y2a2b'),y2a2b2=F('y2a2b2'),y2a2b3=F('y2a2b3'),y2a3=F('y2a3'),y2a3b=F('y2a3b'),y2a3b2=F('y2a3b2'),y2a3b3=F('y2a3b3'),y3=F('y3'),y3b=F('y3b'),y3b2=F('y3b2'),y3b3=F('y3b3'),y3a=F('y3a'),y3ab=F('y3ab'),y3ab2=F('y3ab2'),y3ab3=F('y3ab3'),y3a2=F('y3a2'),y3a2b=F('y3a2b'),y3a2b2=F('y3a2b2'),y3a2b3=F('y3a2b3'),y3a3=F('y3a3'),y3a3b=F('y3a3b'),y3a3b2=F('y3a3b2'),y3a3b3=F('y3a3b3'),x=F('x'),xb=F('xb'),xb2=F('xb2'),xb3=F('xb3'),xa=F('xa'),xab=F('xab'),xab2=F('xab2'),xab3=F('xab3'),xa2=F('xa2'),xa2b=F('xa2b'),xa2b2=F('xa2b2'),xa2b3=F('xa2b3'),xa3=F('xa3'),xa3b=F('xa3b'),xa3b2=F('xa3b2'),xa3b3=F('xa3b3'),xy=F('xy'),xyb=F('xyb'),xyb2=F('xyb2'),xyb3=F('xyb3'),xya=F('xya'),xyab=F('xyab'),xyab2=F('xyab2'),xyab3=F('xyab3'),xya2=F('xya2'),xya2b=F('xya2b'),xya2b2=F('xya2b2'),xya2b3=F('xya2b3'),xya3=F('xya3'),xya3b=F('xya3b'),xya3b2=F('xya3b2'),xya3b3=F('xya3b3'),xy2=F('xy2'),xy2b=F('xy2b'),xy2b2=F('xy2b2'),xy2b3=F('xy2b3'),xy2a=F('xy2a'),xy2ab=F('xy2ab'),xy2ab2=F('xy2ab2'),xy2ab3=F('xy2ab3'),xy2a2=F('xy2a2'),xy2a2b=F('xy2a2b'),xy2a2b2=F('xy2a2b2'),xy2a2b3=F('xy2a2b3'),xy2a3=F('xy2a3'),xy2a3b=F('xy2a3b'),xy2a3b2=F('xy2a3b2'),xy2a3b3=F('xy2a3b3'),xy3=F('xy3'),xy3b=F('xy3b'),xy3b2=F('xy3b2'),xy3b3=F('xy3b3'),xy3a=F('xy3a'),xy3ab=F('xy3ab'),xy3ab2=F('xy3ab2'),xy3ab3=F('xy3ab3'),xy3a2=F('xy3a2'),xy3a2b=F('xy3a2b'),xy3a2b2=F('xy3a2b2'),xy3a2b3=F('xy3a2b3'),xy3a3=F('xy3a3'),xy3a3b=F('xy3a3b'),xy3a3b2=F('xy3a3b2'),xy3a3b3=F('xy3a3b3'),x2=F('x2'),x2b=F('x2b'),x2b2=F('x2b2'),x2b3=F('x2b3'),x2a=F('x2a'),x2ab=F('x2ab'),x2ab2=F('x2ab2'),x2ab3=F('x2ab3'),x2a2=F('x2a2'),x2a2b=F('x2a2b'),x2a2b2=F('x2a2b2'),x2a2b3=F('x2a2b3'),x2a3=F('x2a3'),x2a3b=F('x2a3b'),x2a3b2=F('x2a3b2'),x2a3b3=F('x2a3b3'),x2y=F('x2y'),x2yb=F('x2yb'),x2yb2=F('x2yb2'),x2yb3=F('x2yb3'),x2ya=F('x2ya'),x2yab=F('x2yab'),x2yab2=F('x2yab2'),x2yab3=F('x2yab3'),x2ya2=F('x2ya2'),x2ya2b=F('x2ya2b'),x2ya2b2=F('x2ya2b2'),x2ya2b3=F('x2ya2b3'),x2ya3=F('x2ya3'),x2ya3b=F('x2ya3b'),x2ya3b2=F('x2ya3b2'),x2ya3b3=F('x2ya3b3'),x2y2=F('x2y2'),x2y2b=F('x2y2b'),x2y2b2=F('x2y2b2'),x2y2b3=F('x2y2b3'),x2y2a=F('x2y2a'),x2y2ab=F('x2y2ab'),x2y2ab2=F('x2y2ab2'),x2y2ab3=F('x2y2ab3'),x2y2a2=F('x2y2a2'),x2y2a2b=F('x2y2a2b'),x2y2a2b2=F('x2y2a2b2'),x2y2a2b3=F('x2y2a2b3'),x2y2a3=F('x2y2a3'),x2y2a3b=F('x2y2a3b'),x2y2a3b2=F('x2y2a3b2'),x2y2a3b3=F('x2y2a3b3'),x2y3=F('x2y3'),x2y3b=F('x2y3b'),x2y3b2=F('x2y3b2'),x2y3b3=F('x2y3b3'),x2y3a=F('x2y3a'),x2y3ab=F('x2y3ab'),x2y3ab2=F('x2y3ab2'),x2y3ab3=F('x2y3ab3'),x2y3a2=F('x2y3a2'),x2y3a2b=F('x2y3a2b'),x2y3a2b2=F('x2y3a2b2'),x2y3a2b3=F('x2y3a2b3'),x2y3a3=F('x2y3a3'),x2y3a3b=F('x2y3a3b'),x2y3a3b2=F('x2y3a3b2'),x2y3a3b3=F('x2y3a3b3'),x3=F('x3'),x3b=F('x3b'),x3b2=F('x3b2'),x3b3=F('x3b3'),x3a=F('x3a'),x3ab=F('x3ab'),x3ab2=F('x3ab2'),x3ab3=F('x3ab3'),x3a2=F('x3a2'),x3a2b=F('x3a2b'),x3a2b2=F('x3a2b2'),x3a2b3=F('x3a2b3'),x3a3=F('x3a3'),x3a3b=F('x3a3b'),x3a3b2=F('x3a3b2'),x3a3b3=F('x3a3b3'),x3y=F('x3y'),x3yb=F('x3yb'),x3yb2=F('x3yb2'),x3yb3=F('x3yb3'),x3ya=F('x3ya'),x3yab=F('x3yab'),x3yab2=F('x3yab2'),x3yab3=F('x3yab3'),x3ya2=F('x3ya2'),x3ya2b=F('x3ya2b'),x3ya2b2=F('x3ya2b2'),x3ya2b3=F('x3ya2b3'),x3ya3=F('x3ya3'),x3ya3b=F('x3ya3b'),x3ya3b2=F('x3ya3b2'),x3ya3b3=F('x3ya3b3'),x3y2=F('x3y2'),x3y2b=F('x3y2b'),x3y2b2=F('x3y2b2'),x3y2b3=F('x3y2b3'),x3y2a=F('x3y2a'),x3y2ab=F('x3y2ab'),x3y2ab2=F('x3y2ab2'),x3y2ab3=F('x3y2ab3'),x3y2a2=F('x3y2a2'),x3y2a2b=F('x3y2a2b'),x3y2a2b2=F('x3y2a2b2'),x3y2a2b3=F('x3y2a2b3'),x3y2a3=F('x3y2a3'),x3y2a3b=F('x3y2a3b'),x3y2a3b2=F('x3y2a3b2'),x3y2a3b3=F('x3y2a3b3'),x3y3=F('x3y3'),x3y3b=F('x3y3b'),x3y3b2=F('x3y3b2'),x3y3b3=F('x3y3b3'),x3y3a=F('x3y3a'),x3y3ab=F('x3y3ab'),x3y3ab2=F('x3y3ab2'),x3y3ab3=F('x3y3ab3'),x3y3a2=F('x3y3a2'),x3y3a2b=F('x3y3a2b'),x3y3a2b2=F('x3y3a2b2'),x3y3a2b3=F('x3y3a2b3'),x3y3a3=F('x3y3a3'),x3y3a3b=F('x3y3a3b'),x3y3a3b2=F('x3y3a3b2'),x3y3a3b3=F('x3y3a3b3'),X0=K(0,x),XX0=K(0,x2),Y0=K(0,y),YY0=K(0,y2),v0=K(0),X1=K(1,x),XX1=K(1,x2),Y1=K(1,y),YY1=K(1,y2),v1=K(1),Xm1=K(-1,x),XXm1=K(-1,x2),Ym1=K(-1,y),YYm1=K(-1,y2),vm1=K(-1),X2=K(2,x),XX2=K(2,x2),Y2=K(2,y),YY2=K(2,y2),v2=K(2),Xm2=K(-2,x),XXm2=K(-2,x2),Ym2=K(-2,y),YYm2=K(-2,y2),vm2=K(-2),X3=K(3,x),XX3=K(3,x2),Y3=K(3,y),YY3=K(3,y2),v3=K(3),Xm3=K(-3,x),XXm3=K(-3,x2),Ym3=K(-3,y),YYm3=K(-3,y2),vm3=K(-3),X4=K(4,x),XX4=K(4,x2),Y4=K(4,y),YY4=K(4,y2),v4=K(4),Xm4=K(-4,x),XXm4=K(-4,x2),Ym4=K(-4,y),YYm4=K(-4,y2),vm4=K(-4),X5=K(5,x),XX5=K(5,x2),Y5=K(5,y),YY5=K(5,y2),v5=K(5),Xm5=K(-5,x),XXm5=K(-5,x2),Ym5=K(-5,y),YYm5=K(-5,y2),vm5=K(-5),X6=K(6,x),XX6=K(6,x2),Y6=K(6,y),YY6=K(6,y2),v6=K(6),Xm6=K(-6,x),XXm6=K(-6,x2),Ym6=K(-6,y),YYm6=K(-6,y2),vm6=K(-6),X7=K(7,x),XX7=K(7,x2),Y7=K(7,y),YY7=K(7,y2),v7=K(7),Xm7=K(-7,x),XXm7=K(-7,x2),Ym7=K(-7,y),YYm7=K(-7,y2),vm7=K(-7),X8=K(8,x),XX8=K(8,x2),Y8=K(8,y),YY8=K(8,y2),v8=K(8),Xm8=K(-8,x),XXm8=K(-8,x2),Ym8=K(-8,y),YYm8=K(-8,y2),vm8=K(-8),X9=K(9,x),XX9=K(9,x2),Y9=K(9,y),YY9=K(9,y2),v9=K(9),Xm9=K(-9,x),XXm9=K(-9,x2),Ym9=K(-9,y),YYm9=K(-9,y2),vm9=K(-9),X10=K(10,x),XX10=K(10,x2),Y10=K(10,y),YY10=K(10,y2),v10=K(10),Xm10=K(-10,x),XXm10=K(-10,x2),Ym10=K(-10,y),YYm10=K(-10,y2),vm10=K(-10),
res = {}

    return res;
})();
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
const RANK_NEGATION    = 4;
const RANK_FAC_NEG     = 1;
const RANK_FAC_FRAC    = 3;
const RANK_FAC_FRAC_WHOLE = 50;
const RANK_FAC_SIMPLE  = 1;
const RANK_FAC_OTHER   = 3;
const RANK_VAR_COUNT   = 1;
const RANK_VAR_HIGHER  = 1;
const RANK_VAR_EXP     = 2;
const RANK_ADD         = 3;

function poly_rank(poly)
{
  return Math.max(poly_rank_do(poly),
                  poly_rank_do(poly_simplify(poly)))
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

function latex_sign(op)
{
  switch(op)
  {
    case TOK_EQ: return ' = ';
    case TOK_NE: return " \\ne ";
    case TOK_LT: return ' < ';
    case TOK_GT: return ' > ';
    case TOK_LE: return " \\le ";
    case TOK_GE: return " \\ge ";
    case TOK_ADD: return '+';
    case TOK_SUB: return '-';
  }
  return '?';
}
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
'use strict';

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
/* Copyright (C) 1992,2007,2023 Joel Yliluoma ( https://iki.fi/bisqwit/ ) */
/* Various javascript utility functions - https://bisqwit.iki.fi/jsgames/ */

Array.prototype.is_array=true;
function is_array(obj) { return obj.is_array }
/* needed because IE doesn't support "typeof obj == 'array'" */

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

/* serialize() is actually an implementation of toJSONString(),
 * which is expected to become part of the Javascript standard
 * according to http://www.json.org/json.js .
 * This is a simple and naive implementation.
 */
function serialize(what)
{
  if(what.is_array) return serializeArray(what)
  if(typeof what == 'object') return serializeObject(what)
  if(typeof what == 'string') return serializeString(what)
  return what
}
function _serzA(c1,c2,func) /* serialization helper */
{
  return c1+(func().join(','))+c2
}
function serializeObject(what)
{
  return _serzA('{','}',
    function()
    {
      let res=[],i;
      for(i in what)res.push(serialize(i) + ':' + serialize(what[i]));
      return res
    })
}
function serializeArray(what)
{
  return _serzA('[',']',
    function()
    {
      let res=[],b=what.length,a;
      for(a=0;a<b;++a) res.push(serialize(what[a]));
      return res
    })
}
function serializeString(s)
{
  let m = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f',
            '\r': '\\r', '"' : '\\"', '\\': '\\\\' };
  return '"' +
    s.replace(/([^ !#-[\]-~])/g, function(a, b) {
      let c = m[b], h = '000' + b.charCodeAt().toString(16);
      return c ? c : ('\\u' + h.slice(h.length-4,4))
    }) + '"'
}

function unserialize(what) { return eval('('+what+')') }
var displayObject = serialize, displayArray = serialize;

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
/* Copyright (C) 1992,2007,2023 Joel Yliluoma ( https://iki.fi/bisqwit/ ) */
/* Various javascript utility functions - https://bisqwit.iki.fi/jsgames/ */

// A very handy shorthand.
function rgel(root,id) { return root.getElementById(id) }
function gel(id)       { return rgel(document,id) }
// Utilities for common form input properties
//  selectboxes
function id(id)    { return gel(id).selectedIndex }
function ids(id,v) { gel(id).selectedIndex=v }
//  checkboxes
function ch(id)    { return gel(id).checked?1:0 }
function chs(id,v) { gel(id).checked = v>0 }
//  textlines
function tx(id)    { return gel(id).value }
function txs(id,v) { gel(id).value = v }

/* Now the actual DOM functions */

function dom_wipe(block)
{
  let a, k=block.childNodes, b = k.length;
  for(a=b; a-- > 0; ) block.removeChild(k[a])
  return block
}
var clearBlock=dom_wipe;

const dom_is_event_activator_name= /* Note: IE does not support "const" */
{onkeydown:1,onmouseover:1,onclick:1,onblur:1,onfocus:1,onmouseout:1,
 ondblclick:1,onmouseup:1,onmousedown:1,onkeypress:1,onkeyup:1,onchange:1,
 onload:1,onmousemove:1,onselect:1,onsubmit:1,onunload:1,onerror:1,className:1}
function dom_tag_finish_with(t, params)
{
  for(let i in params)
    if(dom_is_event_activator_name[i])
      t[i] = params[i];
    else
      t.setAttribute(i,params[i]);
  return t
}
function dom_add_children(t, children)
{
  let a, b=children.length;
  for(a=0; a<b; ++a) dom_append(t, children[a])
  return t
}

function dom_tag(t)
{
  return document.createElement(t)
}
function dom_text(content)
{
  return document.createTextNode(content)
}
function dom_tag_with(t,params)
{
  return dom_tag_finish_with(dom_tag(t), params)
}
function dom_tag_class(t,cls)
{
  return dom_tag_with(t, {className:cls})
}
function dom_tag_class_with(t,cls,params)
{
  return dom_tag_finish_with(dom_tag_class(t,cls), params)
}
function dom_tag_with_children(t,children)
{
  return dom_add_children(dom_tag(t), children)
}
function dom_tag_attr_with_children(t,params,children)
{
  return dom_add_children(dom_tag_with(t,params), children)
}
function dom_tag_class_with_children(t,cls,children)
{
  return dom_add_children(dom_tag_class(t,cls), children)
}
function dom_tag_text(t, text)
{
  return dom_tag_with_children(t, [dom_text(text)])
}
function dom_tag_attr_text(t, params, text)
{
  return dom_finish_with(dom_tag_text(t, text), params)
}
function dom_append(root,t)
{
  return root.appendChild(t)
}
function dom_rtext(t)
{ 
  /* Loads the text content from this tag. Assuming it has text content */
  let c = t.childNodes;
  if(!c) throw 'dom_rtext';
  let result='',a,b=c.length;
  for(a=0;a<b;++a) result += c[a].nodeValue;
  return result
}
function dom_rtags(root,t)
{
  /* Loads an array of matching tags */
  return root.getElementsByTagName(t) 
}
function dom_ftag(root,t)
{
  /* Loads the matching tag, throws exception if not found */
  let l = dom_rtags(root,t);
  if(l.length==0) throw 'tag '+t+' missing';
  if(l.length>1) throw 'tag '+t+' is ambiguous';
  return l[0]
}
/* Copyright (C) 1992,2005,2023 Joel Yliluoma ( https://iki.fi/bisqwit/ ) */
/* Image handling functions - https://bisqwit.iki.fi/jsgames/ */

var magnification = 1.0
var magnif_offsx  = 0
var magnif_offsy  = 0

var imageCache = {}
function cacheImage(src)
{
  if(imageCache[src]) { return imageCache[src]; }
  let img = dom_tag('img')
  img.src         = src
  imageCache[src] = img
  return img
}

function addImage(div, src, xpos, ypos)
{
  xpos = (xpos * magnification - magnif_offsx)
  ypos = (ypos * magnification - magnif_offsy)
  
  if(xpos < 0 || ypos < 0 ) return 0
  if(xpos >= div.offsetWidth || ypos >= div.offsetHeight) return 0
  
  let imgref = cacheImage(src).cloneNode(0)
  imgref.style.left = Math.floor(xpos+div.offsetLeft) + "px"
  imgref.style.top  = Math.floor(ypos+div.offsetTop) + "px"
  if(magnification != 1.0)
  {
    imgref.height = Math.floor(32 * magnification)
    imgref.width  = Math.floor(32 * magnification)
  }

  dom_append(div, imgref)
  return imgref
}
function moveImage(div, imgref, newx, newy)
{
  if(!imgref)return
  let xpos = (newx * magnification - magnif_offsx)
  let ypos = (newy * magnification - magnif_offsy)
  imgref.style.left = Math.floor(xpos+div.offsetLeft) + "px"
  imgref.style.top  = Math.floor(ypos+div.offsetTop) + "px"
  /*if(magnification != 1.0)
  {
    imgref.height = Math.floor(32 * magnification)
    imgref.width  = Math.floor(32 * magnification)
  }*/
}

function removeImage(div, imgref)
{
  if(!imgref)return;
  div.removeChild(imgref)
}
function changeImage(imgref, newsrc)
{
  if(!imgref)return;
  imgref.src = newsrc
}
function imageSetZ(imgref, zindex)
{
  if(!imgref)return;
  imgref.style.zIndex = zindex
}
const game_speed_multiplier = 1.0
var   render_fps            = 20

var game_enabled = true;

var oldwidth=null;
var cursorcount=0;
function render_tick()
{
  render_schedule_next();
  var w = gel('statswin').offsetWidth;
  if(w !== oldwidth)
  {
    resize();
    oldwidth=w;
  }
  game_tick()

  let cursor_interval = render_fps/8;
  if(++cursorcount >= cursor_interval)
  {
    cursorcount -= cursor_interval;
    var f = gel('cursor');
    f.style.marginLeft='-1ex';
    f.textContent = (f.textContent == '_' ? ' ' : '_');
  }

  if(game_enabled)
  {
    stars_update();
  }
}
function render_schedule_next()
{
  setTimeout(render_tick, game_speed_multiplier * 1000.0/render_fps)
}
function render_input()
{
  let equation = poly_parse(curinput);
  /* lhs, comp_op, rhs, errors, trailing signs */
  let poly = equation[2]
  let tex = poly_render_latex(equation[2]);
  if(equation[1])
  {
    let sign = latex_sign(equation[1]);
    tex = poly_render_latex(equation[0]) + sign + tex;
  }
  for(let n=0; n<equation[4].length; ++n)
    tex += latex_sign(equation[4][n]);
  
  latex_render(tex, h=>{
    let i = gel('input'), b=h//.firstChild
    i.replaceChild(b, i.childNodes[1]);
    b.style.color='#CCBBC2'
    b.style.display='inline-block'
    b.style.margin='initial'
    b.style.textAlign='initial'
  })
}

function resize()
{
  let room = gel('gamewin')
  let stat = gel('statswin')
  //console.log(window.innerWidth, window.innerHeight)
  room.style.width = window.innerWidth+'px'
  room.style.height = window.innerHeight+'px'
  stat.style.top    = (room.offsetHeight-stat.offsetHeight)+'px'
  room.style.height = stat.offsetTop+'px'
  
  for(let n=0; n<6; ++n)
  {
    let s=gel('stars'+n);
    if(s){
      s.style.width = room.style.width
      s.style.height = room.style.height
    }
  }
  return false
}
function main_load()
{
  resize()
  let room = gel('gamewin')
  dom_wipe(room)
  document.addEventListener('keydown', keydown, false)
  document.addEventListener('keyup',   keyup,   false)
  window.addEventListener('resize', resize, false)
  window.addEventListener('focus', (ev)=>setfocus(true), false)
  window.addEventListener('blur',  (ev)=>setfocus(false), false)
  room.addEventListener('mousedown', mouseclick, false)
  render_schedule_next()
}

var curinput='', focused=true, score=0;
function keydown(ev)
{
  /* https://www.toptal.com/developers/keycode */
  if(ev.MetaKey) //ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey)
    { /* ignore */ }
  else if(ev.keyCode == 8) /* backspace */
  {
    if(curinput.length > 0)
    {
      curinput = curinput.slice(0,-1);
      render_input();
    }
  }
  else if(ev.keyCode == 13)
  {
    game_submit(poly_parse(curinput));
    curinput = ''
    render_input();
  }
  else if(ev.key.length == 1) 
  {
    /* input key */
    curinput += ev.key;
    render_input();
  }
  else if(ev.key == 'Pause')
  {
    
  }
  return false
}
function keyup(ev)
{
  return false
}
function mouseclick(ev)
{
  return false
}
function setfocus(state)
{
  focused=state;
  gel('statswin').style.backgroundColor=(focused ? '#00A' : '#000');
  return false
}
//const n_stars = 40
const star_images = [
  // dark star
  '',//'iVBORw0KGgo!ANSUhEUg!e!AHgCAM!BKCk6n!AG1BMVEUfIR4vMS48PjtKTElZW1hmaGV1d3QnKCaChIH7MYw5!GfUlEQVR42u3dXa7jOAyE0Vg/lPa/4uk2MC9B98CD64SKcr4tFFgskorz&&&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&&!!!!AACAn/EPNZLYg7+CQn0!AASUVORK5CYII=',
  // grey star
  '',//'iVBORw0KGgo!ANSUhEUg!e!AHgBAM!CP+qOm!AKlBMVEUnKCYfIR4vMS5KTElZW1hmaGV1d3SChIGSlZKho6Cvsa48Pju+wL3P0c4s8QSO!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!AABJRU5ErkJggg==',
  // white star
  '',//'iVBORw0KGgo!ANSUhEUg!e!AHgBAM!CP+qOm!AMFBMVEUvMS4nKCYfIR48PjtZW1hmaGV1d3SChIGSlZKho6Cvsa6+wL3P0c5KTEnj5uL///8rSnj9!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!ABJRU5ErkJggg==',
  // all stars
  'iVBORw0KGgo!ANSUhEUgAADw!AhwAQM!CqcFkx!ABlBMVEU!BYWFjQGshd!AAXRSTlMAQObYZgAABv5JREFUeNrt3YGGFHEAx/Hf7DibUhsikAIkFJCQ2kfoAXqIwwFO5lH2SbKPcIAQFhDgACtJQBKorrvb+d3n8wAL4+v3H3ZmAg%&&&&&!ABApfuh2qtclUW4Bie5KkfhGnzPVVlN4eqd5qo8CtUb/HYKzafoh6HavSk&!!!!AAh2sKzY7WodlyG5ot16HZaheaHW1Ds3EKAMBM3Z5Cs2WYL18o5vE2/HcKxgajY&&!!FhsQrOjbWg27kKz5To0u7MLzYZ1!!AA+CPjJjQb16HZaheaLbdhtvwBjSF0mwI&&!MG+LKTQ7CtVWU2i2XIdmq22YLR8mZpwC&AXLJxE5oN69BstQuz5Vlaxl1oNoRuUw&!AACAy/EsVHsfqr0J1U5CtY+h2oM!!!!AAMDvxik0W65Ds9UuNFtuw2y5wAyh25QE&AAIDbU2i2DNVWU2h2dxtmS8EchWqL&&&!AD1uhWrvQrV9qHYSqn0P1U5DtVcB&!C4GpvQbDgOzcZ9aDachblTsA3GKRo&&!!!B4EqqdhGrfQ7X3odqHMF82mKcB!AgL+wD9WOw3wpmE/h8igY&!B4E6q9DPOlYF6HP6Bg&&&!!!CehGrH4bp9ySXah2s2nF3uj3PNxn0uz2IfrtlwfP0/zmxnchOu27swO25VAQ&&&AYB2q7UOz4Tg0G/eh2XAWLsQGAw!!!AAPA0VHsfqn3NRW3CATvpfnaKb93PTnGaCxrOwwF7kgsaz0O1d6HaF&&!!!!AuBEWU2g2rEOz1S40W25Ds3EX5ssGMwU&!AB+tQjVHoRqj6fQ7HGo9nYKzR6GavcC&&AAwMWsptBsGeZLwdydwj9TM!!!!ADAYhOaDevQbNyFZsttUDA2mAM1BQ!!!AAIDDcjtUexiqvZ1Cs0dBwdRtME7R!AwGIXmg1nodl4HpoNx6HZ+CXcsNf4AXgRLF7lzJ1daLZch5mxwQ&&&!!AAsQrUhVFttQ7OjbWi22oVmy3VoNk4B&&!!AACAn26Fag9CtTeh2mlQMDaYA/U8&!AAwI20Cc2G49Bs3Idmw3n4vxSMglEwCsYFBg!!AACGUG01hWZH29BstQnNlutwDWww&AACw2odmwDs3GXWi23AYFY4M5UFMALs0iVHsQqj2eQrPHodrbKTR7GKrdCw&&&&&!!!!ABw40yh2bAOzcZdaLY8CxegYGwwTtE&!!AADAcB5mywVm3Idmw3FoNuxCtXU&!IAbahGqLUO11RSaPQrVXkyh2cNQ7XY&&!!!D+3D5U+xTmS8Ech8ulYOBJqPYu/B1T+jQcjs/5796H6oK/hurb2ZNwOL7kv/sWqp2Gq+LWGg&FiEakeh2moKze5uw2wpmGWodm8K&&!ACX7Wmo9j5U+xqqnYRq30K101DtSQ&&&&!!gIP0A1vFkXxne71B!AAElFTkSuQmCC',
  'iVBORw0KGgo!ANSUhEUgAADw!AhwCAM!CnYDt!AAwFBMVEU!C%%%%%%%%%JtUYd!AP3RSTlMAHVZzyeaPOawOK57XYKK/upbj9vfx0oT+/fv0+WJX5IrQku76fPDzQ8btVc6jBtj4/LkRsK7Z6eh4S2FmUCKtkI/1!kiUlEQVR42uzdVZb0NhCA0bLUsmTZYWZmZs7sf1fp5Ew8eQ39UOfeXXyCqg@@@@@@@@@@@@@@@@@@@@@!!AgMyWUmtZAg!FIrl3Z1KQE!Dp+1cBAwAAkL9/sxcw!ALGs7rUs!BATn200+gB!A/yUBD!AAIY!A/AEG!AU6ABAADAHm!AAUsP4F!gv6XUWpY@@@@@&&AAD4v22z97kF!ApDbrPsZeZw!EBicz3a1bHO!AgNz9q4ABAABIbqtHu3XULQ!CCnubfTPgM!By6qOdRg8!C4VwQw!AeAIN!AhmABAACANUg!AoYP0LAABAfrPuY+x1Bg!KS2zd7nFg@@&!!!ADwIlt77Eg!JBbWccYawk!DIrFza7y4l!AIHf/Zi9g!AWC7tT5cl!AIKnS7pQ!CApGq7UwM!DuGQEM!AnkADAACAIVg!BgDRI!AKOH//AgAAQFnHGGsJ!AyG3pvS8B@@@@@&!AA8OLbZ+9wC!AUpt1H2OvMw!CCxuR7t6lhn!AQO7+TV7!AAsNWj3TrqFg!JDT3NtpnwE!A59dFOowc!DcKwIY!APIEG!AQ7!ADAGiQ!AUcP7+BQAAgFn3MfY6Aw!FLbZu9zCw@&&!AAIJVt9j63!AgNRm3cfY6ww!BIbK5HuzrWGQ!JC7f5MXM!AGz1aLeOugU!DkNPd22mc!BATn200+gB!AAhg!A8gQY!BDs!AMAaJ!ALhXBZy/fwEAAGDWfYy9zg!IDUttn73AI&&!AADgQbOUWssS!AkFq5tKtLCQ!EjfvwoYAACA/P2bvYABAABgWdtpXQI!By6qOdRg8!AQw!ACCAAQAAwB9g!AMAUa!A7AEGAACA/7KA9S8!D5LaXWsgQ@@&&&A87LbZ+9wC!AUpt1H2OvMw!CCxuR7t6lhn!AQO7+TV7!AAsNWj3TrqFg!JDT3NtpnwE!A59dFOowc!AIY!APAEGg!AzBAg!GuQ!A4F4VcP7+BQAAgFn3MfY6Aw!FLbZu9zCw@@@@@@@@@@@@&&&!!!!AAHjobbP3uQU!CkNus+xl5n!AQGJzPdrVsc4!CA3P2bvIABAABgq0e7ddQt!AIKe5t9M+Aw!HLqo51GDw!BD!AA4Ak0!AGIIF!A1iABAADAvSrg/P0L!As+5j7HUG!ApLbN3ucW@@@@&&&!!AAH/X0ntfAg!HJ75NHHHnv8iRI!CQWX3yqaeffuqZZ0s!BAXs898/zVCy++pIABAABI7LmXb/7w/LWAlw!ICcXnnp5tbzLz7zS!AEBKr752c3r+qdcD!AMlreePHmzstvBg!GRU3nrh5s7b7wQ!BkVN/9awC/934!BA+gB+/oMt!AIKPy4Ys3p5c+Cg!Ehp+fjp529uvfDJpwE!A5lc8+vy3gL778Kg!CBzAV8T+PnPv9a/!AZFa++fa7t75/4wf9CwAAQG7Ljz/9/MuvnwY@&&!!!P/G0ntfAg!HIr6xhjLQE!CZlUv73aUE!A5O7f7AUM!Ay6X96bIE!AJFXanRI!CQVG13ag!MA9I4ABAADAE2g!AwBAs!CsQQIAAEAB5+9f!AKOsYYy0B!AuS299yU@@@&&&!AO6fpdRalg!IDUyqVdXUo!BA+v5Vw!AOTv3+wFD!AMvaTusS!AkFMf7TR6!AwH9JAAMAAIAABg!H+AAQAAwBRo!AsAcY!ABax/AQAAyG8ptZYl@@@@@@&&+F9ts/e5BQ!KQ26z7GXmc!BAYnM92tWxzg!IDc/Zu8gAEAAGCrR7t11C0!Agp7m30z4D!AcuqjnUYP!AuFcEM!AHgCDQ!IZgAQAAgDVI!AKOD8/Qs!Cz7mPsdQY!Ckts3e5xY@@@@@@@&&&&!AwMPot/bu7EpyEIiiYEIWAqHy397ZVfM9a3d2hBPvXC0@@&&&&!AADAz1rP7C0!CgtP4Ynz16!AQPn+Vc!ADU79/qBQw!DtGLejBQ!NQ017itGQ!PAnCW!AAQw!AOAfY!AHAKN!ALgHG!AAWsfwEAAKiv9czeAg@@@@@&!!!ACA92dm5gw!CobY0vVg!ED5/q1fw!AOjf8gUM!Ac7zM!AgKJyvGQ!DAHyOAAQAAQAADAACAf4ABAADAKd!ADgHm!ABYH6J/AQAAYGbmD@@@@@@&!!AAD4K1rP7C0!CgtP4Ynz16!AQPn+Vc!ADU79/qBQw!DtGLejBQ!NQ017itGQ!PAnCW!AAQw!AOAfY!AHAKN!ALgHG!AAWsfwEAAKiv9czeAg@@@@@@@@@@@@@&&&!!!AAICftDlnCw!KitH2utowc!BU1h/ji0cP!AqN2/1QsY!A2mP88GgB!ARfXx0gM!CKyvGSAQ!P+MAAY!CfQAMAAIBDs!AMA1S!ACjg+v0L!A/VhrHT0!CgtjbnbAE@&&!!C8F+eec58B!Ape281rpyBw!BS2j+f47Hns!AgNr9W7yAAQAA4Mzn+O6ZZw!EBN+xq3awc!DUNNe4rRk!Dwrwhg!A8Ak0!AOAQL!AXIMEAACAAq7fvw!LDzWuvKHQ!FDauefcZw@@&&&!!!AAf9G559xn!AQGk7r7Wu3AE!CF7eM5PnseOw!KB2/xYvY!ADjzOb575hk!BQ077G7doB!ANc01bmsG!A/CsCG!AHwCDQ!A7BAg!NcgAQAAoIDr9y8!DsvNa6cgc!CUdu459xk@@@@@@@&!!!AAC/ambmDACg9o4DAGt8sQIAqL/jAGA3LScAlN9xALCb5ZcTAOw4ADDHywwAoOiOAwA5XjIAgD/GjgOA4QQA7DgAGE4AwI4DgH+H!7DgBOjwQAOw4AuD8QAOw4ALA+xG4CgB0HAGZmzgAA3gM7Dg@@@@@@@@@@&&&&!!!!APAJZd9g1ET9qG0!AASUVORK5CYII=',
  'iVBORw0KGgo!ANSUhEUgAADw!AhwCAM!CnYDt!ABC1BMVEU!Dh4%%%%%%%%%%%%+Ph4+Ph4+Ph4+Ojjy4+!AWHRSTlMADitIVh2BnrrJ5o/XUnOGNs7q9Pb18t2/AQ1g+v790gMZZN77BDe+Qdbc7s/3/Oed8ej47WXrGJMityCtFX8KUSoUdB6Y5Zfwq3DF7/PDXThmiySMmuH5BQH3LQAAKmtJREFUeNrs3QV29DqXhtFjWZIt2ZcZ8t2fmeE2MzPD/EfSVCtrVdxEaTjZew6Bp0qvF@@@@@@@@!AC/ZUtZa17IE!A5NVq3/Yx9q3XFg!JBU6WPejF4C!AUirHOR+dRwk!DI2r/JCxg!BaP+eds7c!CAbOqYT4wa!AkMzS50VfAg!HIp27zYSg!EAu6z4v9jU!Ag9wT4+Uf!AAIIABAADAEWg!BwCRY!B4Bgk!DqeAETY!AGj9nHfO3gI!DSKcd5179HCQ!EhawPn7Fw!Eof82b0Eg!JBUq33bx9i3Xls!BAXktZa13LEg&&&&!!!AwIu1lLXWtSwB!AebXat32Mfeu1BQ!CRV+pg3o5c!CAlMpxzkfnUQI!Cy9m/yAgYAAIDWz3nn7C0!AgmzrmE6MG!AJLP0edGX!AgFzKNi+2Eg!JDLus+LfQ0!DIPgE2AgYAAOC5CW!ABwBBo!BcggU!CeQQIAAIA6XsAEG!AFo/552ztw!IB0ynHe9e9RAg!JIWcP7+BQAAgNLHvBm9B!ACTVat/2Mfat1xY!CQ11LWWteyB@&&&M9qKWuta1kC!A8mq1b/sY+9ZrCw!Eiq9DFvRi8B!AKZXjnI/OowQ!Bk7d/kBQw!Ctn/PO2Vs!BANnXMJ0YN!ASGbp86IvAQ!LmUbV5sJQ!CCXdZ8X+xo!CQewL8/CNg!AEM!ADgCDQ!C4BAs!A8gwQ!B1vIAJM!ALR+zjtnbwE!DplOO869+jB!ACQt4Pz9Cw!KWPeTN6CQ!Eiq1b7tY+xbry0!Agr6Wsta5lCQ@@@&!!AADg/6ClrLWuZQk!DIq9W+7WPsW68t!AIKnSx7wZvQQ!CkVI5zPjqPEg!JC1f5MXM!ALR+zjtnbwE!DZ1DGfGDU!AgmaXPi74E!A5FK2ebGV!AgFzWfV7saw!EDuCfDzj4ABAAB!MAAIAj0!AOASL!APAMEg!NTxAib!AA0Po575y9BQ!KRTjvOuf48S!AkLSA8/cv!AlD7mzegl!AIKlW+7aPsW+9tg!IC8lrLWupYl@@&&&&AA4J+3lNdef+ON118rSw!EBWbx5vvf3Ou++9//YHHx61BQ!OTz0cefnJ8+/O0/enj16fuf9RI!CQzBe++KUvv/rbRw+vvvLOl48S!AkMpXv/b1r/ztTdYCBgAAgK9+45v/2L/3Bfz+t3oL!ASNW/D397KeBPvz1q!AQBZf+Np3vvvwtxcP33v/+30J!ASOKLP/jhq38ugF+99/ZWAg!HL46Gs/euefD+Af/2RfAw!HL4+Keff/cWwHlHw!APAzP/vtTwUw!A6f3cz98COPsRa!AARw+kuw!A4Bd+8V/aAHsGCQAAgER+6Zd/9M73/rkANgEG!gk1/51fnD712/An743vvf6i0!Agi1/77PPvXgv4e+98+SgB!Aafz6b3zr25/eCjhv/wIAAMBv/talgL/y/me9B!AKQu4K/89odHbQE!DJ/Obv/MMO+HuvXj38vd/9vddfK0s!BAPr/++/sffPP7f/hHf/jbf/wnAQ!Hn9yp/+2Z//eX/tLwI@@@@@@@@@@@&&!!AICXZilrrWtZAg!PJqtW/7GPvWaws!BIqvQxb0YvAQ!CmV45yPzqME!AZO3f5AUM!ArZ/zztlb!AQDZ1zCdGDQ!Ehm6fOiLwE!C5lG1ebCU!Agl3WfF/sa!AkHsC/PwjY!ABD!AA4Ag0!AuAQL!APIME!AdbyACT!AC0fs47Z28B!A6ZTjvOvfowQ!AkLeD8/Qs!Clj3kzegk!BIqtW+7WPsW68t!AIK+lrLWuZQk@@@@@@&!!!ACAl2Apa61rWQI!DyarVv+xj71msL!ASKr0MW9GLwE!ApleOcj86jB!AGTt3+QFD!AK2f887ZWw!EA2dcwnRg0!BIZunzoi8B!AuZRtXmwl!AIJd1nxf7Gg!JB7Avz8I2!AAQw!AOAIN!ALgECw!DyDB!AHW8gAkw!AtH7OO2dvAQ!OmU47zr36ME!AJC3g/P0L!ApY95M3oJ!ASKrVvu1j7FuvLQ!CCvpay1rmUJ@@@@@@@@@&&!!!AgsaWsta5lCQ!Mir1b7tY+xbry0!AgqdLHvBm9B!AKRUjnM+Oo8S!AkLV/kxcw!AtH7OO2dvAQ!NnUMZ8YNQ!CCZpc+LvgQ!DkUrZ5sZU!CAXNZ9Xuxr!AQO4J8POPgAEAAE!wAAgCPQ!A4BIs!A8AwS!A1PECJs!ADQ+jnvnL0F!ApFOO865/jxI!CQtIDz9y8!CUPubN6CU!AgqVb7to+xb722!AgLyWsta6liU@@!!!!HhiKWuta1kC!A8mq1b/sY+9ZrCw!Eiq9DFvRi8B!AKZXjnI/OowQ!Bk7d/kBQw!Ctn/PO2Vs!BANnXMJ0YN!ASGbp86IvAQ!LmUbV5sJQ!CCXdZ8X+xo!CQewL8/CNg!AEM!ADgCDQ!C4BAs!A8gwQ!B1vIAJM!ALR+zjtnbwE!DplOO869+jB!ACQt4Pz9Cw!KWPeTN6CQ!Eiq1b7tY+xbry0!Agr6Wsta5lCQ@&&&&!!!!ACA/3lLWWtdyxI!CQV6t928fYt15b!AQFKlj3kzegk!BIqRznfHQeJQ!CBr/yYvY!AGj9nHfO3gI!CyqWM+MWo!BAMkufF30J!AyKVs82IrAQ!Lms+7zY1w!IDcE+DnHwEDAAC!Y!BHoAEAAMAlW!AOAZJ!AKjjBUyAAQAAoPVz3jl7Cw!EinHOdd/x4l!AIGkB5+9f!AKH3Mm9FL!AQFKt9m0fY996bQE!B5LWWtdS1L@@@@@@@@@!!!XC1lrXUtSw!EBerfZtH2Pfem0B!ASZU+5s3oJQ!CClcpzz0XmU!AgKz9m7yAAQAAoPVz3jl7Cw!MimjvnEqAE!DJLH1e9CU!Agl7LNi60E!A5LLu82JfAw!HJPgJ9/BAw!ACG!AByBBg!JdgAQAAgGeQ!AoI4XMAEGAACA1s955+wt!AIJ1ynHf9e5QAAODfYSlrrWtZAoD/PwX8H+1fAABa7ds+xr712gKA/x9KH/Nm9BIAAPy/+hcKAB9fAgA4RAeAAQsAgGtU!AwEMa!AUMd8YtQ!CAZJY+L/oS!AkEvZ5sVWAgAAyHUtIbDu82JfAwAAyPcwHZgA/+dHw!QOlj3oxeAsgcw!4F3R/K+KgiPQAACgf5MXMLgECwAAaP2cd87eAsj8DBIAANgUXheFgB9YAADwhRLgyAYAAJgUAkb7AADgUlnAte0AAOBZUcDD3QAAIICBVvu2j7FvvbY!DyHoEGlrLWupYl!Al2ABAACAZ5!AAwAs45AQYAAIDWz3nn7C0!Ag7aui+d8VBQAAQAHn718!Aofcyb0Us!BAUq32bR9j33ptAQ!HktZa11LUs@@@@!!!!AADy3pay1rmUJ!AyKvVvu1j7FuvLQ!CCp0se8Gb0E!ApFSOcz46jxI!CQtX+TFz!AC0fs47Z28B!A2dQxnxg1!AIJmlz4u+B!AORStnmxlQ!IBc1n1e7Gs!BA7gnw84+AAQAAQAADAACAI9!ADgEiw!DwDBI!DU8QImw!AND6Oe+cvQU!CkU47zrn+PEg!JC0gPP3Lw!JQ+5s3oJQ!CCpVvu2j7FvvbY!CAvJay1rqWJQ@@@@@&&&&ABy+jv27iBHYhMIwyguQ9lg7n/ebFoj9fQui45S894tPomfAg@@@@@@@@&&AACAbzni7P2MowEAAEBdo+d1z3lf2UcDAACAoiLnepkZDQ!EqKZ68f+4kG!AVfu3eAEDAADAyL3e7BwN!Aqulz/TJ7AwAAgGKOXB/ya!AFBLXOvDFQ0!BqOe/14T4b!A1JsAf3cED!AAIY!APIEG!An2ABAACAM0g!DQ5x+YAAMAAMDIvd7sHA0!DKiWe/9e8TDQ!IoWcP3+BQAAgMi5XmZGAwAAgKJGz+ue876yjwY!B1HXH2fsbR&&&!!!AA+N854uz9jKMBAABAXaPndc95X9lHAwAAgKIi53qZGQ0!BKimevH/uJBg!FX7t3gBAwAAwMi93uwcDQ!Krpc/0yewMAAIBijlwf8mg!BQS1zrwxUN!Aajnv9eE+Gw!NSbAH93BAw!ACG!ADyBBg!J9gAQAAgDNI!A0OcfmAADAADAyL3e7BwN!Ayolnv/XvEw0!CKFnD9/gUAAIDIuV5mRgMAAICiRs/rnvO+so8G!AdR1x9n7G0Q@@@@@@@@&&!!!AD4bx1x9n7G0Q!KCu0fO657yv7KMBAABAUZFzvcyMBg!CXFs9eP/UQDAACAqv1bvIABAABg5F5vdo4G!A1fS5fpm9AQAAQDFHrg95N!AKglrvXhigY!C1nPf6cJ8N!A6k2AvzsCBg!AEM!AnkADAACAT7!ADAGSQ!Do8w9MgAEAAGDkXm92jgY!DlxLPf+veJBg!EULuH7/AgAAQORcLzOjAQAAQFGj53XPeV/ZRwMAAIC6jjh7P+No@@@@@@@@@&&!!A/DtHnL2fcTQ!Coa/S87jnvK/to!AUFTkXC8zowEAAEBJ8ez1Yz/R!AoGr/Fi9g!AGLnXm52jAQAAQDV9rl9mbw!FDMketDHg0!BqiWt9uKIBAABALee9PtxnAwAAgHoT4O+OgAEAAE!wAAgCfQ!A4BMs!AcAYJ!A+vwDE2!AAYudebnaMBAABAOfHst/59ogEAAEDRAq7fvw!BA518vMa!AFDU6Hndc95X9tE!CgriPO3s84Gg&&AJTgYAc!CMntc9531lHw0!CKipzrZWY0!AKCmevX7sJxo!BU7d/iBQw!Aj93qzczQ!Cops/1y+wN!AijlyfcijAQAAQC1xrQ9XN!AKjlvNeH+2w!BQbwL83REw!ACG!ADwBBo!B8ggU!DOIAEAAECff2ACD!ACP3erNzN!ACgnnv3Wv080!AKFrA9fsX!AIud6mRkN!Aiho9r3vO+8o+Gg!NR1xNn7Ge4fAQ!!!AAP+0d0epCcRgGEUzcSZVBgUqDQKTCuiTBYuMS1F1/ytpkQKVvheanrOLC/+X@@@@@&&&&!!!AMBf08T54nQ+nxbz2AQ!CoU9f2q8thvF7Hw2XVt10!CACsW0zkMpt0+lDHmdYg!IDqxH6z3Jfbl7JfbvoY!AoOr+Vc!ADUqUu7vC23b8o271IX!AoCbt7G14fQzg1+Ft1gY!CoSJPe871/Hwo4v6cm!AQD3i0/PLzwB+eX6KAQ!OoxmR7HnwE8HqeT!AAPVNgH97BAw!ACG!AJxAAwAAgEew!AwDdI!AGAFXPgEGAACALu3y9jGAt3mXug!ABVif1muS/f+ne/3PQx!AQJUFXHv/AgAAQEzrPJRyz98y5HWKAQ!CrUtf3qchiv1/FwWfVtFw!KBOTZwvTufzaTGPTQ@@@@@@@@@@@@@@&&!!!!AA+Kc+AEtl2Lc5UjmS!AAElFTkSuQmCC'
]
function star_url(n)
{
  let s = star_images[n]
  //s = 'iVBORw0KGgo!ANSUhEUg!e!AHg'+s
  s = s.replaceAll('%', ['','','','&','EhIS','+Ph4'][n].repeat(7))
  s = s.replaceAll('@', '&&&&&')
  s = s.replaceAll('&', '!!!!!')
  s = s.replaceAll('!', 'AAA')
  return 'data:image/png;base64,'+s
}

/*function star()
{
  this.n = random2(0,2)
  let w = gel('gamewin');
  let i = this.img = addImage(w, star_url(this.n), 0,0)
  imageSetZ(i, 0)
  i.width  = (2+(this.n+1))
  i.height = (2+(this.n+1))
  moveImage(w, i, (this.x = random2(0,100))*w.clientWidth/100,
                  (this.y = random2(0,100))*w.clientHeight/100)
  this.move = function()
  {
    this.x = (this.x + (this.n+1)*15/render_fps + 2) % 104 - 2;
    moveImage(w, i, this.x*w.clientWidth/100, this.y*w.clientHeight/100)
  }
  this.kill = function()
  {
    removeImage(w, i)
  }
}
*/
//var stars = []
var sp=0;
function stars_update()
{
  /*while(stars.length < n_stars) stars.push(new star())
  for(let a=0; a<stars.length; ++a)
    stars[a].move();
  */
  let w = gel('stars');
  for(let n=0; n<6; ++n)
  {
    let s = 'stars'+n, i = gel(s)
    if(!i)
    {
      i = addImage(w, star_url(n%3+3), 0,0)
      i.id=s
      i.style.width='100%'
      i.style.height='100%'
      imageSetZ(i, n+1)
    }
    /*if(sp===null)
    {
      w.style.backgroundImage = 'url("'+star_url(3)+'")'
      w.style.backgroundSize   = '100% 100%'
      w.style.backgroundRepeat = 'repeat'
      sp=0
    }*/
    //w.style.backgroundPositionX = (((sp*((n+1)/3))%100)*w.clientWidth/100)+'px';//+'%'
    moveImage(w, i, ((sp*((n%3+1)/3))%100-(n<3?0:100))*w.clientWidth/100, 0)
  }
  sp += 3*15/render_fps;
  sp %= 1200;
}
function stars_resize()
{
  for(let a=0; a<stars.length; ++a) stars[a].kill();
  stars = [];
}

const simp_challenge_codes = (function(){
  let s=simplification_tasks, res={}
  for(let a in s)
    for(let b in s[a])
      for(let c in s[a][b])
        for(let d in s[a][b][c])
          for(let e in s[a][b][c][d])
            for(let f in s[a][b][c][d][e])
              res[a+b+c+d+e+f] = s[a][b][c][d][e][f].length
  return res;
})();

function find_challenge(code)
{
  // Challenge codes are six letters long.
  let a=code[0],b=code[1],c=code[2],d=code[3],e=code[4],f=code[5]
  let list = simplification_tasks[a][b][c][d][e][f]
  return list[random2(0, list.length-1)]
}

function update_challenge(tag, xpos, room)
{
  let s = tag.style
  let p = xpos / room.offsetWidth
  if(p < .63)
    s.color = '#5F5'
  else if(p < .81)
    s.color = '#FF5'
  else
    s.color = '#F55'
  s.left = xpos+'px'
}

var challenges = {}
var gamespeed  = 4
function challenge(tag, poly)
{
  let room = gel('gamewin')

  /* Place the word invisibly on the board so that we can get its metrics */
  tag.style.position = 'absolute'
  tag.style.color = '#000'
  tag.style.left = '50%';
  tag.style.top = '50%';
  imageSetZ(tag, 8)
  dom_append(room, tag)

  /* Now analyze the positioning. */
  //console.log(tag.offsetWidth, tag.offsetHeight)

  this.x0   = -tag.offsetWidth
  this.x    = 0
  this.y    = random2(0, room.offsetHeight - tag.offsetHeight*2)
  this.tag  = tag
  this.poly = poly
  this.dead = true
  let calcx = () => (this.x * room.clientWidth / 100 + this.x0);

  /* Verify that the word does not overlap any existing word */
  for(let k in challenges)
  {
    let t = challenges[k].tag, myx = calcx();
    if(t.offsetTop  > this.y + tag.offsetHeight*2 + 20
    || t.offsetLeft > myx    + tag.offsetWidth*2 + 20
    || t.offsetTop+t.offsetHeight*2 + 20 < this.y
    || t.offsetLeft+t.offsetWidth*2 + 20 < myx)
      continue;
    
    /* Overlaps, cancel the sapwn */
    room.removeChild(tag)
    return;
  }
  
  let up = () => update_challenge(tag, calcx(), room)
  tag.style.position = 'absolute'
  tag.style.top      = this.y + 'px'
  up();
  this.dead = false
  this.solution = poly_rendertext(poly_simplify(this.poly))
  
  this.kill = function()
  {
    room.removeChild(tag)
    this.dead = true;
  }
  this.tick = function()
  {
    if(this.dead) return;

    up();

    this.x += gamespeed/render_fps;

    /* Kill the word if it is no longer visible */
    if(calcx() >= room.clientWidth)
      this.kill()
  }
}

function spawn()
{
  /*
  let t = {
    'min_terms'  : 2,
    'max_terms'  : 4,
    'max_degree' : 1,
    'allow_vars' : 1,
    'allow_neg'  : 2,
    'allow_mul'  : 0,
    'allow_frac' : true,
  }
  var p = poly_generate(t)
  */
  var code = 'b2Aknj';
  /* Terms (1-8):      abcdefgh
   * Vars (0-3):       0123
   * Mul types (0-15): ABCDEFGHIJKLMNOP
   * Negat (0-1):      kl
   * Power (0-9):      mnopqrstuvwxyz
   * Fract (0-1):      ij
   */
  
  var p = find_challenge(code);
  poly_renderdom(p, h=>{
    let n=0;
    while(n in challenges) ++n;
    challenges[n] = new challenge(h, p)
  })
}

function game_submit(poly)
{
  let t = poly_rendertext(poly[2])
  
  for(let k in challenges)
  {
    let q = challenges[k]
    if(!q.dead && t == q.solution)
    {
      score += poly_rank(q.poly)
      q.kill()
    }
  }
}

var input_idle = 0;
function game_tick()
{
  let n=0, c = challenges;
  for(let k in c) ++n;
  if(n < 40)
  {
    spawn(n)
  }
  
  for(let k in c)
    if(c[k].dead)
    {
      delete c[k];
      break;
    }

  for(let k in c)
    if(!c[k].dead)
      c[k].tick();

  /* If input has been idle for more than 5 seconds, slow down the game */
  if(curinput == '')
  {
    ++input_idle;
  }
  else
  {
    input_idle = 0;
  }

  const goal_fps   = 30;
  const goal_speed = 4; /* 4 % per second, 25s to go through screen width */
  if(input_idle < render_fps*5)
  {
    /* It should grow from 0.5 back to 4 in 1 second */
    const slow_speed = 0.5;
    const change_time = 4;
    if(gamespeed < goal_speed)
      gamespeed *= (goal_speed/slow_speed) ** (1/(change_time*render_fps));
    else
      gamespeed = goal_speed;

    if(render_fps < goal_fps)
      render_fps *= Math.pow(goal_fps/4, 1 / (2*render_fps));
    else
      render_fps = goal_fps;
  }
  else
  {
    let room = gel('gamewin'), maxx = 0;
    for(let k in c)
      if(!c[k].dead)
        maxx = Math.max(maxx, c[k].x);

    const change_time = 5;
    const slow_speed = 0.2;
    if(maxx > 10)
    {
      /* It should shrink from 4 to 0.5 in 5 seconds
       * solve( 4*x^(4*render_fps) = 0.5, x)
       *   we get
       * x = 8 ** -(1 / (4*render_fps))
       */
      if(gamespeed > slow_speed)
        gamespeed  *= (slow_speed/goal_speed) ** (1 / (change_time*render_fps));
      
      let change = 60;
      if(!focused) change=1;
      render_fps *= Math.pow(2/goal_fps, 1 / (change*render_fps));
    }
  }
  if(render_fps > goal_fps) render_fps = goal_fps; else if(render_fps < 2) render_fps = 2;
}

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
