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
