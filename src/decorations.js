function create_score_object(points, source_tag)
{
  let room       = gel('gamewin')
  let target_tag = gel('score')
  let st = gel('statswin')
  //if(!target_tag) return
  
  let sourcex = source_tag.offsetLeft
  let sourcey = source_tag.offsetTop
  let targetx = target_tag.offsetLeft + st.offsetLeft
  let targety = target_tag.offsetTop  + st.offsetTop
  
  let decotag = dom_tag_attr_text('deco', {className:'deco'}, "+" + Math.round(points, 1))
  dom_append(room, decotag)
  
  decotag.spawned_at = game_timer;
  decotag.srcpos = [sourcex,sourcey]
  decotag.tgtpos = [targetx,targety]
  //console.log("Created decotag ",decotag, " src=",decotag.srcpos," tgt=",decotag.tgtpos)

  let s = decotag.style
  let x = decotag.srcpos[0]
  let y = decotag.srcpos[1]
  s.left = x + 'px'
  s.top  = y + 'px'
}

function decorations_tick()
{
  let room = gel('gamewin')
  let t = dom_rtags(document, 'deco')
  for(let n=0; n<t.length; ++n)
  {
    let decotag = t[n]
    let age     = game_timer - decotag.spawned_at
    age *= 3
    if(age >= 1)
    {
      room.removeChild(decotag)
    }
    else
    {
      let s = decotag.style
      let x = decotag.srcpos[0] + (decotag.tgtpos[0] - decotag.srcpos[0])*age
      let y = decotag.srcpos[1] + (decotag.tgtpos[1] - decotag.srcpos[1])*age
      s.left = x + 'px'
      s.top  = y + 'px'
    }
  }
}
