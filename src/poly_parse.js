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
const TOK_SLASH    = 13;
const tok_text = [/**/,
                  /*var_exp*/,
                  /*decimal*/,
                  /*integer*/,
                  /*fraction*/,
                  '+',
                  '-',
                  '=',
                  '≠',
                  '<',
                  '>',
                  '≤',
                  '≥',
                  '/']
const tok_latex = [/**/,
                   /*var_exp*/,
                   /*decimal*/,
                   /*integer*/,
                   /*fraction*/,
                   '+',
                   '-',
                   '=',
                   " \\ne ",
                   '<',
                   '>',
                   " \\le ",
                   " \\ge ",
                   '/']

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
function poly_parse(text, do_sort = true)
{
  //const r_var_repeated = RegExp([...Array(26).keys()].map(x=>String.fromCharCode(97+x)).map(c=>c+c+'+').join('|'))
  //const r_var_repeated = /[a]{2,}|b{2,}|c{2,}|d{2,}|e{2,}|f{2,}|g{2,}|h{2,}|i{2,}|j{2,}|k{2,}|l{2,}|m{2,}|n{2,}|o{2,}|p{2,}|q{2,}|r{2,}|s{2,}|t{2,}|u{2,}|v{2,}|w{2,}|x{2,}|y{2,}|z{2,}/
  const r_var_with_exp = /[a-z](?:[⁰¹²³⁴⁵⁶⁷⁸⁹]|\^ *[0-9]+|[1-9])?/
  const r_integer      = /[0-9]+/
  const r_decimal      = /[-]?[.,][0-9]+|[-]?[0-9]+[.,][0-9]*/
  const r_comparison   = /[<>=]{1,2}|[!/]=|[≤≥≠]/
  // Comparisons:
  //   All combinations of = < > are valid, and those marks in singular too:
  //     == =< =>
  //     <= << <>
  //     >= >< >>
  //  Also
  //     != /= ≤ ≥ ≠
  const r_fraction     = /[:/][0-9]+/
  const r_mult         = /[*·'×/:]/ /* Note: /: is included here only so that we can catch trailing /: signs. */
  const r_sum          = /\+-|[-+]/
  const tab = {'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8,'⁹':9,
               '=':0,'==':0,
               '≠':1,'!=':1,'/=':1,'<>':1,'><':1,
               '<':2, '>':3,
               '≤':4, '<=':4, '=<':4, '<<':4,
               '⇒':5, '>=':5, '=>':5, '>>':5,
               '+':6, '-':7, '+-':7, ':':8, '/':8,
               '_':[TOK_EQ,TOK_NE,TOK_LT,TOK_GT,TOK_LE,TOK_GE, TOK_ADD,TOK_SUB, TOK_SLASH]}
  const rsub = r => r.toString().slice(1,-1)
  const patn = '('+rsub(r_var_with_exp)+  // 1
               ')|('+rsub(r_decimal)+       // 2
               ')|('+rsub(r_integer)+       // 3
               ')|('+rsub(r_fraction)+      // 4
               ')|('+rsub(r_comparison)+    // 5
               ')|('+rsub(r_mult)+          // 6
               ')|('+rsub(r_sum)+           // 7
               ')|.';
  const compiled = new RegExp(patn, 'g');
  const results = [...text.matchAll(compiled)];
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
          //case 1: // variable repeated
          case 1: // variable with optional exponent
          {
            let varname = s[0], exponent = s.length;
            if(exponent > 1)//i == 2 && s.length > 1)
            {
              if(s[1] in tab)
                exponent = tab[s[1]]
              else
                exponent = parseInt(s.slice(s[1] == '^' ? 2 : 1));
            }
            tokens.push([TOK_VAR_EXP, varname, exponent])
            break;
          }
          case 2: // decimal number
          {
            tokens.push([TOK_DECIMAL, parseFloat(s.replaceAll(',', '.'))])
            break;
          }
          case 3: // integer
          {
            tokens.push([TOK_INTEGER, parseInt(s)])
            break;
          }
          case 4: // fraction
          {
            tokens.push([TOK_FRACTION, parseInt(s.slice(1))])
            break;
          }
          case 5: // comparison operator
          case 6: // multiplication sign
          case 7: // plus or minus sign
          {
            if(s in tab) tokens.push(tab._[tab[s]])
            // other multiplication signs are ignored
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
  let lhs=[], rhs=[], comp_op = null, errors = false;
  let append = function()
  {
    if(do_sort)
    {
      term.vars.sort();
    }
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
        case TOK_SLASH:
          trail.push(tokens[a]);
          errors = true;
          break;
        case TOK_EQ:
        case TOK_NE:
        case TOK_LT:
        case TOK_GT:
        case TOK_LE:
        case TOK_GE:
          if(!have_term) { errors = true; break; } // ignore when term is missing
          if(comp_op) { errors = true; trail.push(tokens[a]); break; } // it is an error when multiple comparisons are done
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
  
  if(do_sort)
  {
    rhs.sort(poly_order_term)
    lhs.sort(poly_order_term)
  }

  if(comp_op && rhs.length)
  {
    /* Find out if RHS has more 'x' than LHS does
     * If they are equal, then if RHS has more vars than LHS does */
    let find_x = v=>v=='x', sum = a => a.reduce((a,b)=>a+b);
    let n_x    = f=>f['vars'].filter(find_x).length
    let n_vars = f=>f['vars'].length
    
    let n_lhs = sum(lhs.map(n_vars))
    let n_rhs = sum(rhs.map(n_vars))
    let x_lhs = sum(lhs.map(n_x))
    let x_rhs = sum(rhs.map(n_x))
    if(x_rhs > x_lhs || (x_rhs == x_lhs && n_rhs > n_lhs))
    {
      // Swap the sides, and reverse the comparison sign
      switch(comp_op)
      {
        case TOK_LT: comp_op=TOK_GT; break;
        case TOK_GT: comp_op=TOK_LT; break;
        case TOK_LE: comp_op=TOK_GE; break;
        case TOK_GE: comp_op=TOK_LE; break;
      }
      let t=lhs
      lhs=rhs
      rhs=t
    }
  }
  return [lhs, comp_op, rhs, errors, trail];
}

//console.log(poly_parse('-2/5x+4'))
