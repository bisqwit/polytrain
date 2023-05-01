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
