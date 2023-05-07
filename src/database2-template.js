const simp_ratings = function(){
  let res = [], s = simp_challenge_data
  for(let code in s)
    res.push([s[code][1], code])
  res.sort( (a,b)=>{
    if(a[0] != b[0]) return a[0] < b[0] ? -1 : 1
    return a[1] < b[1] ? -1 : 1
  })
  return res
}()
