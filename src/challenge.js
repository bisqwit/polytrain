
const simp_challenge_codes = (function(){
  let s=simplification_tasks, res={}
  for(a in s)
    for(b in s[a])
      for(c in s[a][b])
        for(d in s[a][b][c])
          for(e in s[a][b][c][d])
            for(f in s[a][b][c][d][e])
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
  this.y    = random2(0, room.offsetHeight - tag.offsetHeight) - tag.offsetHeight
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
  var code = 'a1Bkni';
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
