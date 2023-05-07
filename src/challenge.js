'use strict';
const cool_values    = [0,1,2,3,4,5,10,-1,-2,-3,-4,-5,-10]
var cur_challenges      = {}
var gamespeed           = 4
var target_challenge    = 10;
var cur_challenge_total = 0 // Total amount of points of tasks on screen right now
var skill_multiplier    = 1;
var completed           = 0;
var game_timer          = 0;
var misses              = 0;

/* After this time (5 min), challenge will begin ramping up */
const ramp_up_time = 300, ramp_speed = 1.01;
/* After another 5 minutes (10 min total), skill multiplier reaches 1.01^300 = about 20 */

const challenges = [0,
  // Baseline: terms=2, vars=0, mul=0, negat=0, power=1, fract=0
  //
  // vars=1
  // negat=1
  'b0Akmi',
  'a0Bkmi',
  'a0Almi',
  'A1Akni',
//'C1Akni', // No challenges matching this criteria
//'C1Akoi', // No challenges matching this criteria either, probably
  'b1Alni',
  'b0Akmj',
  'a1Cknj',
  'a0Bkmj',
  'B1Akni',
  'c1Akni',
//'A1Ckni', // No challenges matching this criteria
  'a1Ckni',
  'c1Akoi',
  'b1Bkni',
  'c0Akmi',
  'b1Alni',
  'b2Akni',
  'a1Alnj',
  'b0Almj',
  'd0Akmi',
  'c2Akni',
  'a3Akoi',
]

function find_challenge_code()
{
  let index = Math.floor(completed / 5) + 1;
  let code = challenges[index];
  if(code)
  {
    try{
      // Challenge codes are six letters long.
      let terms=code[0],n_vars=code[1],mult=code[2],neg=code[3],power=code[4],fract=code[5]
      let list = simplification_tasks[terms][n_vars][mult][neg][power][fract]
      if(list.length)
        return code;
    }catch(err)
    {
      console.log("No challenges for code " + code)
      // Continue
    }
  }

  /* Terms (1-8):      abcdefgh
   * Vars (0-3):       0123
   * Mul types (0-15): ABCDEFGHIJKLMNOP of these, only ABCEI are used.
   * Negat (0-1):      kl
   * Power (0-9):      mnopqrstuvwxyz
   * Fract (0-1):      ij
   */
  let aim = Math.max(12, target_challenge - cur_challenge_total)
  //console.log("Aiming ", aim)
  /* Using binary search, find a challenge code that has at most this much challenge */
  let start = 0, end = simp_ratings.length, len = end-start
  while(len > 0)
  {
    let half = len >> 1, middle = start+half
    let r = simp_ratings[middle][0]
    if(r < aim) { start = middle+1; len -= half-1 }
    else len = half
  }
  let choice = random2(0, start);
  //console.log(choice, simp_ratings[choice][1])
  return simp_ratings[choice][1]
}

function find_challenge(code)
{
  try{
  // Challenge codes are six letters long.
  let terms=code[0],n_vars=code[1],mult=code[2],neg=code[3],power=code[4],fract=code[5]
  let list = simplification_tasks[terms][n_vars][mult][neg][power][fract]
  let poly = list[random2(0, list.length-1)]
  //console.log("Generating for " + code + ", length = " + list.length + ", got " + JSON.stringify(poly) + " which is " + poly_rendertext(poly))
  
  let simplify_only = (terms >= 'A' && terms <= 'Z')
  
  // Now find if this challenge depends only on a single variable,
  // and what that variable is.
  if(n_vars == '1' && power == 'n')
  {
    // Note: Simplified formula does not have 'mul' or 'neg'.
    let find_var = function(p)
    {
      if(is_array(p))
        for(let a=0; a<p.length; ++a)
        {
          let f = find_var(p[a]);
          if(f) return f;
        }
      else if(p['fac'] != 0)
        for(let v=p['vars'], n=0; n<v.length; ++n)
          return v[n];
      // Note: we can't ask the user to solve "0x = 0".
      // This is why we check for zero factor.
    }
    let v = find_var(poly_simplify(poly));
    if(v)
    {
      // Decide a simple value for this variable
      let value = cool_values[random2(0,cool_values.length-1)];
      // Evaluate the expression using this value
      let dict = {}; dict[v] = value
      let rhs = poly_simplify(poly, dict)
      let res = make_fraction(rhs[0]['fac'])
      // If the rhs is still a simple formula, we are good
      if(rhs.length == 1 && ('vars' in rhs[0]) && rhs[0]['vars'].length == 0
       && (terms == 'a' || Math.abs(rhs[0]['fac']) <= 20)
       && (res[1] == 1 || Math.abs(res[0]) < res[1]))
      {
        // Create the challenge
        let solution = [v, TOK_EQ, [{'fac':value, 'vars':[]}]]
        return [poly, TOK_EQ, rhs, solution]
      }
    }
  }

  // If this challenge is specifically designed
  // for equation use,/ cancel it.
  if(simplify_only)
  {
    return null
  }
  
  // Create just a simplification challenge.
  return [[], null, poly, null]
  }catch(err)
  {
    console.log("Could not find tasks for " + code)
    return null
  } 
}

function update_challenge(tag, xpos, room)
{
  let s = tag.style
  let p = (xpos + tag.offsetWidth/2) / room.offsetWidth
  if(p < .63)
    s.color = '#5F5'
  else if(p < .81)
    s.color = '#FF5'
  else
    s.color = '#F55'
  s.left = xpos+'px'
}

function challenge(tag, task)
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

  this.x0      = -tag.offsetWidth
  this.x       = 0
  this.y       = random2(0, room.offsetHeight - tag.offsetHeight*3)
  this.htmltag = tag
  this.dead    = true
  this.points  = 0
  let calcx = () => (this.x * room.clientWidth / 100 + this.x0);

  /* Verify that the word does not overlap any existing word */
  for(let k in cur_challenges)
  {
    let t = cur_challenges[k].htmltag, myx = calcx();
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
  this.dead          = false
  
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
    {
      this.kill()
      ++misses;
      if(misses >= 10)
      {
        game_over();
      }
    }
  }

  /* Now, create list of accepted solutions. */
  let solutions = {}
  if(!task[1])
  {
    // A simplification task has just one solution.
    let s = poly_rendertext(poly_simplify(task[2]))
    solutions[s] = true
    this.points = poly_rank(task[2])
    console.log(poly_rendertext(task[2]), " is worth ", this.points, " pts")
  }
  else
  {
    let a = poly_rank(task[2]), b = poly_rank(task[0])
    console.log(poly_rendertext(task[2]), " is worth ", a, " pts")
    console.log(poly_rendertext(task[0]), " is worth ", b, " pts")
    this.points = a+b

    // An equals-task has two solutions,
    // a non-equality has just one.
    let solution = task[3]
    let t = poly_rendertext(solution[2])
    let s = (typeof(solution[0])=='string') ? solution[0] : poly_rendertext(solution[0])
    solutions[s + text_sign(solution[1]) + t] = true
    /*if(solution[1] == TOK_EQ)
    {
      solutions[t] = true
    }*/
  }
  this.test_solution = input => (input in solutions)
}

function spawn()
{
  var code = find_challenge_code()
  let task = find_challenge(code);
  if(!task)
  {
    return;
  }
  // [0] = lhs, [1] = operator, [2] = rhs, [3] = solution
  let latex_formula = null;
  if(task[1])
  {
    // Evaluation task
    latex_formula = poly_render_latex(task[0]) + latex_sign(task[1]) + poly_render_latex(task[2]);
  }
  else
  {
    // Simplification task
    latex_formula = poly_render_latex(task[2]);
  }
  latex_render(latex_formula, htmltag=>{
    // Find a free slot in the cur_challenges array
    let n = 0;
    while(n in cur_challenges) ++n;
    cur_challenges[n] = new challenge(htmltag, task)
    //console.log("Adding challenge of ", cur_challenges[n].points, " pts")
    cur_challenge_total += cur_challenges[n].points
  })
}

function game_submit(poly)
{
  let t = null
  if(!poly[1]) // No sign?
  {
    t = poly_rendertext(poly[2])
  }
  else // Have a sign
  {
    t = poly_rendertext(poly[0]) + text_sign(poly[1]) + poly_rendertext(poly[2]);
  }

  for(let k in cur_challenges)
  {
    let q = cur_challenges[k]
    if(!q.dead && q.test_solution(t))
    {
      create_score_object(q.points, q.htmltag)
      decorations_tick()
      score += q.points;
      ++completed;
      q.kill()
      render_score()
    }
  }
}

var scorelog = [], last_scorelog=0;
function game_check_performance()
{
  const scorelog_maxlength = 60;
  /* Check how much progress has been made so far */
  /* Every 1s, record the current score */
  let delta = game_timer - last_scorelog, tick = false;
  while(delta > 1)
  {
    scorelog.push(score);
    last_scorelog += 1;
    delta = game_timer - last_scorelog;
    tick = true;
  }
  while(scorelog.length > scorelog_maxlength)
    scorelog.shift();

  /* Now analyze how much progress the player makes by average in 25 seconds */
  if(tick)
  {
    let totalweight=0, totalprogress=0;
    for(let weight=1, n=1; n<scorelog.length; ++n)
    {
      totalprogress += (scorelog[n] - scorelog[n-1]) * weight;
      totalweight   += weight;
      weight *= 1.03; // note: 1.03^60 = about 5.89
    }
    if(totalweight)
    {
      let progress_in_second = totalprogress / totalweight;
      let progress_in_25s = progress_in_second * 25;
      target_challenge = ((target_challenge/skill_multiplier)*0.95 + progress_in_25s*0.05) * skill_multiplier;
      if(target_challenge < 10) target_challenge = 10;

      /* If game has been going on for more than 5 minutes, ramp up the challenge */
      if(game_timer >= ramp_up_time)
      {
        skill_multiplier *= ramp_speed;
      }
      render_score()
    }
  }
}

var input_idle = 0, input_idle_timeout = 5;
function game_tick()
{
  let c = cur_challenges
  if(cur_challenge_total < target_challenge)
  {
    spawn()
  }
  
  for(let k in c)
    if(c[k].dead)
    {
      //console.log("Removing challenge of ", c[k].points, " pts")
      cur_challenge_total -= c[k].points
      delete c[k];
      break;
    }

  for(let k in c)
    if(!c[k].dead)
      c[k].tick();

  game_check_performance();
  game_timer += 1 / render_fps;

  /* If input has been idle for more than 5 seconds, slow down the game */
  if(curinput == '')
  {
    ++input_idle;
  }
  else
  {
    input_idle = 0;
    input_idle_timeout = 60;
  }

  const goal_fps   = 30;
  const goal_speed = 4; /* 4 % per second, 25s to go through screen width */
  if(input_idle < render_fps*input_idle_timeout)
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
