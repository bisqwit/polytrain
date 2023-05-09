var curlang='en'
function setlanguage(l)
{
  curlang=l
  const langdata = {
    '$title':{
      'fi':'Polynomipeli',
      'en':'Polynomial game'
    },
    '$loading':{
      'fi':'Peliä ladataan, odota hetki…',
      'en':'Loading the game, please wait…',
    },
    '$score':{
      'fi':'Pisteet',
      'en':'Score'
    },
    '$level':{
      'fi':'Haaste',
      'en':'Level'
    },
    '$timer':{
      'fi':'Aika',
      'en':'Time'
    },
    '$miss':{
      'fi':'Ohi',
      'en':'Miss'
    },
    '$answer':{
      'fi':'Vastaus',
      'en':'Answer'
    },
    '$gameover':{
      'fi':'Peli päättyi.',
      'en':'Game over'
    },
    '$score1':{
      'fi':'Pisteesi',
      'en':'Your score'
    },
    '$timer1':{
      'fi':'Peliaika',
      'en':'Game time',
    },
    '$timer1b':{
      'fi':' sekuntia',
      'en':' seconds'
    },
    '$feedback':{
      'fi':'Annathan palautetta pelistä (klikkaa tätä):',
      'en':'Give feedback on the game (click here):'
    },
    '$feedback1':{
      'fi':'Anna palautetta',
      'en':'Give feedback'
    },
    '$newgame':{
      'fi':'Aloita uusi peli klikkaamalla tästä',
      'en':'Start a new game by clicking here'
    },
    '$fblink':{
      'fi':'https://docs.google.com/forms/d/e/1FAIpQLSe5lJ6-hvOFhjd6GM1X_w3ucrwQEAtVgF5KyBtd0EI_06KmSA/viewform',
      'en':'https://docs.google.com/forms/d/1gwiKaRwbL3UqaczyA-ie8uGaFmWmISs6n_zVZkMwgx8/'
    }
  }
  let d=document, t=d.getElementsByTagName('span'), q, n, k, c, w
  for(n=0; n<t.length; ++n)
    if('langkey' in (q = t[n].attributes) && (k = q.langkey.nodeValue) in langdata)
    {
      w = langdata[k][l]
      if(k == '$title') d.title = w
      t[n].replaceChild(d.createTextNode(w), t[n].childNodes[0])
    }
  d.getElementById('fblink').href = langdata['$fblink'][l]
}
(()=>{ const N=window.navigator, p = N.userLanguage || N.language, l = (p.match(/fi/) ? 'fi' : 'en'); setlanguage(l) })()
