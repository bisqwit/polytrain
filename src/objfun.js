/* Copyright (C) 1992,2007,2023 Joel Yliluoma ( https://iki.fi/bisqwit/ ) */
/* Various javascript utility functions - https://bisqwit.iki.fi/jsgames/ */

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

Array.prototype.is_array=true;
const serialize = JSON.stringify
const displayObject = serialize
const displayArray = serialize
const unserialize = JSON.parse
const is_array = x=>x.is_array

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
