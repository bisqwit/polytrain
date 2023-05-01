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
