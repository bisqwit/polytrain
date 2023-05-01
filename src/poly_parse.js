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
