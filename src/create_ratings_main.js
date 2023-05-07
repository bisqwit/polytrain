/* poly_rank, database */

const simp_challenge_codes = (function(){
  let s=simplification_tasks, res={}
  for(let a in s)
    for(let b in s[a])
      for(let c in s[a][b])
        for(let d in s[a][b][c])
          for(let e in s[a][b][c][d])
            for(let f in s[a][b][c][d][e])
              res[a+b+c+d+e+f] = s[a][b][c][d][e][f].length
  return res;
})();

const simp_challenge_ratings = (function(){
  let s=simplification_tasks, res={}
  for(let code in simp_challenge_codes)
  {
    let a=code[0]
    let b=code[1]
    let c=code[2]
    let d=code[3]
    let e=code[4]
    let f=code[5]
    let list = s[a][b][c][d][e][f]
    let rank = 0
    if(list.length)
    {
      for(let n=0; n<list.length; ++n)
        rank += poly_rank(list[n])
      rank /= list.length
    }
    res[code] = rank
  }
  return res
})();

let data = {}
for(let code in simp_challenge_codes)
  data[code] = [simp_challenge_codes[code], simp_challenge_ratings[code]]

console.log("const simp_challenge_data= " + JSON.stringify(data))
