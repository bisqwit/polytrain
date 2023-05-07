/* Copyright (C) 1992,2007,2023 Joel Yliluoma ( https://iki.fi/bisqwit/ ) */
/* Various javascript utility functions - https://bisqwit.iki.fi/jsgames/ */

// A very handy shorthand.
//function rgel(root,id) { return root.getElementById(id) }
//function gel(id)       { return rgel(document,id) }
const rgel = (root,id) => root.getElementById(id)
const gel  = (id)      => rgel(document,id)
// Utilities for common form input properties
//  selectboxes
//function id(id)    { return gel(id).selectedIndex }
//function ids(id,v) { gel(id).selectedIndex=v }
const id   = (id)     => gel(id).selectedIndex
const ids  = (id,v)   => (gel(id).selectedIndex=v)
//  checkboxes
//function ch(id)    { return gel(id).checked?1:0 }
//function chs(id,v) { gel(id).checked = v>0 }
const ch   = (id)     => gel(id).checked?1:0
const chs  = (id,v)   => (gel(id).checked = v>0)
//  textlines
//function tx(id)    { return gel(id).value }
//function txs(id,v) { gel(id).value = v }
const tx    = (id)    => gel(id).value
const txs   = (id,v)  => (gel(id).value = v)

/* Now the actual DOM functions */

function dom_wipe(block)
{
  let a, k=block.childNodes, b = k.length;
  for(a=b; a-- > 0; ) block.removeChild(k[a])
  return block
}
const clearBlock=dom_wipe;

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
/*function dom_add_children(t, children)
{
  let a, b=children.length;
  for(a=0; a<b; ++a) dom_append(t, children[a])
  return t
}*/
const dom_add_children = (t,children) => (children.map(c => dom_append(t,c)), t)

/*function dom_tag(t)
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
}*/

const dom_tag  = t=>document.createElement(t)
const dom_text = t=>document.createTextNode(t)
const dom_tag_with = (t,params) => dom_tag_finish_with(dom_tag(t), params)
const dom_tag_class = (t,cls)   => dom_tag_with(t, {className:cls})
const dom_tag_class_with = (t,cls,params)  => dom_tag_finish_with(dom_tag_class(t,cls), params)
const dom_tag_with_children = (t,children) => dom_add_children(dom_tag(t), children)
const dom_tag_attr_with_children  = (t,params,children) => dom_add_children(dom_tag_with(t,params), children)
const dom_tag_class_with_children = (t,cls,children)    => dom_add_children(dom_tag_class(t,cls), children)
const dom_tag_text      = (t,text)        => dom_tag_with_children(t, [dom_text(text)])
const dom_tag_attr_text = (t,params,text) => dom_tag_finish_with(dom_tag_text(t, text), params)
const dom_append        = (root,t)        => root.appendChild(t)

const dom_rtags = (root,t) => root.getElementsByTagName(t) 
/*function dom_rtags(root,t)
{
  // Loads an array of matching tags
  return root.getElementsByTagName(t) 
}*/

function dom_rtext(t)
{ 
  /* Loads the text content from this tag. Assuming it has text content */
  let c = t.childNodes;
  if(!c) throw 'dom_rtext';
  return c.map(n=>n.nodeValue).join('')
  /*
  let result='',a,b=c.length;
  for(a=0;a<b;++a) result += c[a].nodeValue;
  return result*/
}
function dom_ftag(root,t)
{
  /* Loads the matching tag, throws exception if not found */
  let l = dom_rtags(root,t);
  if(l.length==0) throw 'tag '+t+' missing';
  if(l.length>1) throw 'tag '+t+' is ambiguous';
  return l[0]
}
