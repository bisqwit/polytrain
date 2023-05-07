"use strict";const TOK_VAR_EXP=1,TOK_DECIMAL=2,TOK_INTEGER=3,TOK_FRACTION=4,TOK_ADD=5,TOK_SUB=6,TOK_EQ=7,TOK_NE=8,TOK_LT=9,TOK_GT=10,TOK_LE=11,TOK_GE=12,TOK_SLASH=13,tok_text=[,,,,,"+","-","=","≠","<",">","≤","≥","/"],tok_latex=[,,,,,"+","-","="," \\ne ","<",">"," \\le "," \\ge ","/"];function poly_parse(e,A=!0){const t={"⁰":0,"¹":1,"²":2,"³":3,"⁴":4,"⁵":5,"⁶":6,"⁷":7,"⁸":8,"⁹":9,"=":0,"==":0,"≠":1,"!=":1,"/=":1,"<>":1,"><":1,"<":2,">":3,"≤":4,"<=":4,"=<":4,"<<":4,"⇒":5,">=":5,"=>":5,">>":5,"+":6,"-":7,"+-":7,":":8,"/":8,_:[TOK_EQ,TOK_NE,TOK_LT,TOK_GT,TOK_LE,TOK_GE,TOK_ADD,TOK_SUB,TOK_SLASH]},n=e=>e.toString().slice(1,-1),r="("+n(/[a-z](?:[⁰¹²³⁴⁵⁶⁷⁸⁹]|\^ *[0-9]+|[1-9])?/)+")|("+n(/[-]?[.,][0-9]+|[-]?[0-9]+[.,][0-9]*/)+")|("+n(/[0-9]+/)+")|("+n(/[:/][0-9]+/)+")|("+n(/[<>=]{1,2}|[!/]=|[≤≥≠]/)+")|("+n(/[*·'×/:]/)+")|("+n(/\+-|[-+]/)+")|.",l=new RegExp(r,"g"),o=[...e.matchAll(l)];let a=[];for(let m in o){m=o[m];for(let e=1;e<=8;++e)if(m[e]!=undefined){let A=m[e];switch(e){case 1:{let e=A[0],n=A.length;n>1&&(n=A[1]in t?t[A[1]]:parseInt(A.slice("^"==A[1]?2:1))),a.push([TOK_VAR_EXP,e,n]);break}case 2:a.push([TOK_DECIMAL,parseFloat(A.replaceAll(",","."))]);break;case 3:a.push([TOK_INTEGER,parseInt(A)]);break;case 4:a.push([TOK_FRACTION,parseInt(A.slice(1))]);break;case 5:case 6:case 7:A in t&&a.push(t._[t[A]])}break}}let s={fac:1,vars:[]},i=!1,f=!1,g=!1,c=[],d=[],_=null,u=!1,h=function(){A&&s.vars.sort(),d.push(s),i=!1,f=!1,g=!1,s={fac:1,vars:[]}};var p=[];for(let m=0;m<a.length;++m)if("object"!=typeof a[m])switch(a[m]){case TOK_ADD:if(p.push(a[m]),!i)break;h();break;case TOK_SUB:if(p.push(a[m]),!i){s.fac=-s.fac;break}h(),s.fac=-s.fac;break;case TOK_SLASH:p.push(a[m]),u=!0;break;case TOK_EQ:case TOK_NE:case TOK_LT:case TOK_GT:case TOK_LE:case TOK_GE:if(!i){u=!0;break}if(_){u=!0,p.push(a[m]);break}h(),c=d,d=[],_=a[m]}else switch(p=[],a[m][0]){case TOK_VAR_EXP:for(let e=0;e<a[m][2];++e)s.vars.push(a[m][1]);i=!0;break;case TOK_DECIMAL:case TOK_INTEGER:if(f){u=!0;break}s.fac*=a[m][1],i=f=!0;break;case TOK_FRACTION:if(g){u=!0;break}if(0==a[m][1]){u=!0;break}s.fac/=a[m][1],i=f=g=!0}i?h():1!=s.fac&&(u=!0);let w=function(e,A){let t=e=>{let A={},t=0,n=1,r=e.vars;for(let l=0;l<r.length;++l){let e=r[l];A[e]?A[e]+=1:A[e]=1}for(let l in A)A[l]>t&&(t=A[l]),n*=A[l];return[e.fac,r,t,n]};return e=t(e),A=t(A),e[2]!=A[2]?A[2]-e[2]:A[3]!=e[3]?A[3]-e[3]:e[1]!=A[1]?e[1]<A[1]?-1:1:A[0]-e[0]};if(A&&(d.sort(w),c.sort(w)),_&&d.length){let e=e=>"x"==e,A=e=>e.reduce(((e,A)=>e+A)),t=A=>A.vars.filter(e).length,n=e=>e.vars.length,r=A(c.map(n)),l=A(d.map(n)),o=A(c.map(t)),a=A(d.map(t));if(a>o||a==o&&l>r){switch(_){case TOK_LT:_=TOK_GT;break;case TOK_GT:_=TOK_LT;break;case TOK_LE:_=TOK_GE;break;case TOK_GE:_=TOK_LE}let e=c;c=d,d=e}}return[c,_,d,u,p]}function random2(e,A){return e=Math.ceil(e),A=Math.floor(A),Math.floor(Math.random()*(A-e+1)+e)}function make_fraction(e,A=!0){let t=1;e<0&&(t=-t,e=-e);let n=[t*Math.round(e),1];for(let r=1;r<=30;++r){let l=[],o=e;for(let e=0;e<r;++e)l.push(Math.trunc(o)),o=1/(o-l[e]);let a=l[r-1],s=1;for(let e=r-2;e>=0;--e){let A=l[e]*a+s;s=a,a=A}if(r>1&&A&&1!=n[1]&&a>300&&s>300)break;if(n=[t*a,s],Math.abs(e-a/s)<=1e-6)break}return n}Object.defineProperty(Array.prototype,"shuffle",{value:function(){for(let e=this.length-1;e>0;e--){const A=Math.floor(Math.random()*(e+1));[this[e],this[A]]=[this[A],this[e]]}return this}});const RANK_NEGATION=4,RANK_FAC_NEG=1,RANK_FAC_FRAC=3,RANK_FAC_FRAC_WHOLE=50,RANK_FAC_SIMPLE=1,RANK_FAC_OTHER=3,RANK_VAR_COUNT=1,RANK_VAR_HIGHER=1,RANK_VAR_EXP=2,RANK_ADD=3;function poly_rank(e){return Math.max(poly_rank_do(e),poly_rank_do(poly_simplify(e)))}function poly_rank_do(e){let A=0;for(let t=0;t<e.length;++t)A+=RANK_ADD+poly_rank_do_term(e[t]);return A}function poly_rank_do_term(e){if(e.hasOwnProperty("mul"))return e.mul.map((e=>poly_rank_do(e))).reduce(((e,A)=>e*A));if(e.hasOwnProperty("neg"))return RANK_NEGATION*poly_rank_do_term(e.neg);return poly_rank_do_factor(e.fac)+poly_rank_do_vars(e.vars)}function poly_rank_do_factor(e){let A=make_fraction(e),t=0,n=Math.abs(A[0]);return t=n<=5||10==n||20==n?RANK_FAC_SIMPLE:RANK_FAC_OTHER*Math.max(1,Math.log10(n)),e<0&&(t+=RANK_FAC_NEG),1!=A[1]&&(t*=RANK_FAC_FRAC,A[1]<n&&(t*=RANK_FAC_FRAC_WHOLE)),t}function poly_rank_do_vars(e){let A={},t=0;for(let l=0;l<e.length;++l){let n=e[l];A[n]?A[n]+=1:A[n]=1,t=Math.max(t,A[n])}let n=0,r=0;for(let l in A)A[l]>1&&++r,++n;return RANK_VAR_EXP**t*(RANK_VAR_COUNT*(1+n))*(RANK_VAR_HIGHER*(1+r))}const latex_sign=e=>tok_latex[e];function latex_render(e,A){let t=MathJax.getMetricsFor(gel("gamewin"));return MathJax.tex2svgPromise(e,t).then(A)}function poly_renderdom(e,A){return latex_render(poly_render_latex(e),A)}function poly_render_latex(e){let A="";for(let t=0;t<e.length;++t){let n=e[t];if(n.hasOwnProperty("neg")){n=n.neg,A+="-";let e=poly_renderterm_latex(n);e="\\left("+e+"\\right)",A+=e}else{if(t>0){if(n.hasOwnProperty("fac")&&n.fac<0){A+="-",A+=poly_renderterm_latex({fac:-n.fac,vars:n.vars});continue}A+="+"}A+=poly_renderterm_latex(n)}}return A}function poly_renderterm_latex(e){if(e.hasOwnProperty("neg"))return"-\\left("+poly_renderterm_latex(e.neg)+"\\right)";if(e.hasOwnProperty("mul")){let A=e.mul.map((e=>{let A=poly_render_latex(e);return A.match(/[-+()]/)?"\\left("+A+"\\right)":A}));for(let e=0;e+1<A.length;++e)"\\"!=A[e][0]&&"\\"!=A[e+1][0]&&(A[e]+=" \\cdot ");return A.join("")}let A=make_fraction(e.fac),t="";if(1==A[1]){t=A[0]+"";let e=t.match(/[e]\+/);e?t=t.replace(/[e]\+/,"\\cdot 10^{")+"}":(e=t.match(/[e]/))&&(t=t.replace(/[e]/,"\\cdot 10^{")+"}"),t=t.replace(/[.]/,"{,}")}else A[0]<0&&(t+="-",A[0]*=-1),t+="\\frac{"+A[0]+"}{"+A[1]+"}";let n={},r=e.vars;r.length&&("1"==t&&(t=""),"-1"==t&&(t="-"));for(let l=0;l<r.length;++l){let e=r[l];n[e]?n[e]+=1:n[e]=1}for(let l in n)1==n[l]?t+=l:n[l]>=10||n[l]<0?t+=l+"^{"+n[l]+"}":t+=l+"^"+n[l];return t}const text_sign=e=>tok_text[e];function poly_rendertext(e){let A="";for(let t=0;t<e.length;++t){let n=e[t];if(n.hasOwnProperty("neg")){n=n.neg,A+=0==t?"-":" - ";let e=poly_renderterm(n);e.match(/[-+()]/)&&(e="("+e+")"),A+=e}else{if(t>0){if(n.hasOwnProperty("fac")&&n.fac<0){A+=" - ",A+=poly_renderterm({fac:-n.fac,vars:n.vars});continue}A+=" + "}A+=poly_renderterm(n)}}return A}function poly_renderterm(e){if(e.hasOwnProperty("neg"))return"-("+poly_renderterm(e.neg)+")";if(e.hasOwnProperty("mul")){let A=e.mul.map((e=>{let A=poly_rendertext(e);return A.match(/[-+()]/)?"("+A+")":A}));for(let e=0;e+1<A.length;++e)"("!=A[e][0]&&"("!=A[e+1][0]&&(A[e]+="·");return A.join("")}let A=make_fraction(e.fac),t=A[0]+"",n={},r=e.vars;r.length&&("1"==t&&(t=""),"-1"==t&&(t="-"));for(let l=0;l<r.length;++l){let e=r[l];n[e]?n[e]+=1:n[e]=1}for(let l in n)1==n[l]?t+=l:t+=l+"^"+n[l];return 1!=A[1]&&(t+="/"+A[1]),t}function poly_simplify(e,A=null){let t=[];for(let n=0;n<e.length;++n){t=poly_add(t,poly_simplify_term_to_poly(e[n],A))}return t}function poly_add(e,A){let t={};for(let r=0;r<e.length;++r){let A=e[r].vars.join("");t[A]?t[A]+=e[r].fac:t[A]=e[r].fac}for(let r=0;r<A.length;++r){let e=A[r].vars.join("");t[e]?t[e]+=A[r].fac:t[e]=A[r].fac}let n=[];for(let r in t)if(0!=t[r]){let e={},A=0,l=1;for(let t=0;t<r.length;++t){let A=r[t];e[A]?e[A]+=1:e[A]=1}for(let t in e)e[t]>A&&(A=e[t]),l*=e[t];n.push([t[r],r.split(""),A,l])}return n.sort(((e,A)=>e[2]!=A[2]?A[2]-e[2]:A[3]!=e[3]?A[3]-e[3]:e[1]!=A[1]?e[1]<A[1]?-1:1:A[0]-e[0])),n=n.map((e=>({fac:e[0],vars:e[1]}))),0==n.length&&n.push({fac:0,vars:[]}),n}function poly_multiply(e,A){let t=[];for(let n=0;n<e.length;++n){let r=e[n];for(let e=0;e<A.length;++e){let n=A[e],l={fac:r.fac*n.fac,vars:r.vars.concat(n.vars)};0==l.fac&&(l.vars=[]),l.vars.sort(),t=poly_add(t,[l])}}return t}function poly_simplify_term_to_poly(e,A=null){if(e.hasOwnProperty("neg")){let t=poly_simplify_term_to_poly(e.neg,A);for(let e=0;e<t.length;++e)t[e].fac*=-1;return t}if(e.hasOwnProperty("mul")){let t=e.mul;if(0==t.length)return[{fac:1,vars:[]}];let n=poly_simplify(t[0],A);for(let e=1;e<t.length;++e){n=poly_multiply(n,poly_simplify(t[e],A))}return n}let t=[],n=e.fac;if(A)for(let r=e.vars,l=0;l<r.length;++l)A[r[l]]?n*=A[r[l]]:t.push(r[l]);else t=e.vars.join("").split("");return 0==n&&(t=[]),t.sort(),[{fac:n,vars:t}]}function poly_sort(e){let A=cloneArray(e);return A.sort((function(e,A){let t=e=>{if("neg"in e){let A=t(e.neg);return A[0]*=-1,A}if("mul"in e){return[0,0,0,0]}let A={},n=0,r=1,l=e.vars;for(let t=0;t<l.length;++t){let e=l[t];A[e]?A[e]+=1:A[e]=1}for(let t in A)A[t]>n&&(n=A[t]),r*=A[t];return[e.fac,l,n,r]};return e=t(e),A=t(A),e[2]!=A[2]?A[2]-e[2]:A[3]!=e[3]?A[3]-e[3]:e[1]!=A[1]?e[1]<A[1]?-1:1:A[0]-e[0]})),A}function cloneObject(e){let A={};for(let t in e)is_array(e[t])?A[t]=cloneArray(e[t]):"object"==typeof e[t]?A[t]=cloneObject(e[t]):A[t]=e[t];return A}function cloneArray(e){let A,t=e.slice(0),n=t.length;for(A=0;A<n;++A)is_array(t[A])||"object"!=typeof t[A]||(t[A]=cloneObject(t[A]));return t}Array.prototype.is_array=!0;const serialize=JSON.stringify,displayObject=serialize,displayArray=serialize,unserialize=JSON.parse,is_array=e=>e.is_array;function propObject(e){for(let A in e)this[A]=e[A];return this}function protoObj(e,A){return propObject.call(e.prototype,A),e}function declObj(params,constructorcode,elements,memberfunctions){let f;return eval("f=function("+params+") { propObject.call(this, elements); "+constructorcode+"; }"),protoObj(f,memberfunctions)}const rgel=(e,A)=>e.getElementById(A),gel=e=>rgel(document,e),id=e=>gel(e).selectedIndex,ids=(e,A)=>gel(e).selectedIndex=A,ch=e=>gel(e).checked?1:0,chs=(e,A)=>gel(e).checked=A>0,tx=e=>gel(e).value,txs=(e,A)=>gel(e).value=A;function dom_wipe(e){let A,t=e.childNodes;for(A=t.length;A-- >0;)e.removeChild(t[A]);return e}const clearBlock=dom_wipe,dom_is_event_activator_name={onkeydown:1,onmouseover:1,onclick:1,onblur:1,onfocus:1,onmouseout:1,ondblclick:1,onmouseup:1,onmousedown:1,onkeypress:1,onkeyup:1,onchange:1,onload:1,onmousemove:1,onselect:1,onsubmit:1,onunload:1,onerror:1,className:1};function dom_tag_finish_with(e,A){for(let t in A)dom_is_event_activator_name[t]?e[t]=A[t]:e.setAttribute(t,A[t]);return e}const dom_add_children=(e,A)=>(A.map((A=>dom_append(e,A))),e),dom_tag=e=>document.createElement(e),dom_text=e=>document.createTextNode(e),dom_tag_with=(e,A)=>dom_tag_finish_with(dom_tag(e),A),dom_tag_class=(e,A)=>dom_tag_with(e,{className:A}),dom_tag_class_with=(e,A,t)=>dom_tag_finish_with(dom_tag_class(e,A),t),dom_tag_with_children=(e,A)=>dom_add_children(dom_tag(e),A),dom_tag_attr_with_children=(e,A,t)=>dom_add_children(dom_tag_with(e,A),t),dom_tag_class_with_children=(e,A,t)=>dom_add_children(dom_tag_class(e,A),t),dom_tag_text=(e,A)=>dom_tag_with_children(e,[dom_text(A)]),dom_tag_attr_text=(e,A,t)=>dom_finish_with(dom_tag_text(e,t),A),dom_append=(e,A)=>e.appendChild(A),dom_rtags=(e,A)=>e.getElementsByTagName(A);function dom_rtext(e){let A=e.childNodes;if(!A)throw"dom_rtext";return A.map((e=>e.nodeValue)).join("")}function dom_ftag(e,A){let t=dom_rtags(e,A);if(0==t.length)throw"tag "+A+" missing";if(t.length>1)throw"tag "+A+" is ambiguous";return t[0]}var magnification=1,magnif_offsx=0,magnif_offsy=0,imageCache={};function cacheImage(e){if(imageCache[e])return imageCache[e];let A=dom_tag("img");return A.src=e,imageCache[e]=A,A}function addImage(e,A,t,n){if(n=n*magnification-magnif_offsy,(t=t*magnification-magnif_offsx)<0||n<0)return 0;if(t>=e.offsetWidth||n>=e.offsetHeight)return 0;let r=cacheImage(A).cloneNode(0);return r.style.left=Math.floor(t+e.offsetLeft)+"px",r.style.top=Math.floor(n+e.offsetTop)+"px",1!=magnification&&(r.height=Math.floor(32*magnification),r.width=Math.floor(32*magnification)),dom_append(e,r),r}function moveImage(e,A,t,n){if(!A)return;let r=t*magnification-magnif_offsx,l=n*magnification-magnif_offsy;A.style.left=Math.floor(r+e.offsetLeft)+"px",A.style.top=Math.floor(l+e.offsetTop)+"px"}function removeImage(e,A){A&&e.removeChild(A)}function changeImage(e,A){e&&(e.src=A)}function imageSetZ(e,A){e&&(e.style.zIndex=A)}const game_speed_multiplier=1;var render_fps=20,game_enabled=!0,oldwidth=null,cursorcount=0;function render_tick(){render_schedule_next();var e=gel("statswin").offsetWidth;e!==oldwidth&&(resize(),oldwidth=e),game_tick();let A=render_fps/8;if(++cursorcount>=A){cursorcount-=A;var t=gel("cursor");t.style.marginLeft="-1ex",t.textContent="_"==t.textContent?" ":"_"}game_enabled&&stars_update()}function render_schedule_next(){setTimeout(render_tick,1e3*game_speed_multiplier/render_fps)}function render_input(){let e=poly_parse(curinput),A=(e[2],poly_render_latex(e[2]));if(e[1]){let t=latex_sign(e[1]);A=poly_render_latex(e[0])+t+A}for(let t=0;t<e[4].length;++t)A+=latex_sign(e[4][t]);latex_render(A,(e=>{let A=gel("input"),t=e;A.replaceChild(t,A.childNodes[1]),t.id="inputt"}))}function resize(){let e=gel("gamewin"),A=gel("statswin");e.style.width=window.innerWidth+"px",e.style.height=window.innerHeight+"px",A.style.top=e.offsetHeight-A.offsetHeight+"px",e.style.height=A.offsetTop+"px";for(let t=0;t<6;++t){let A=gel("stars"+t);A&&(A.style.width=e.style.width,A.style.height=e.style.height)}return!1}function main_load(){resize(),dom_wipe(gel("gamewin")),document.addEventListener("keydown",keydown,!1),window.addEventListener("resize",resize,!1),window.addEventListener("focus",(e=>setfocus(!0)),!1),window.addEventListener("blur",(e=>setfocus(!1)),!1),render_schedule_next()}var curinput="",focused=!0,score=0;function keydown(e){return e.MetaKey||(8==e.keyCode?curinput.length>0&&(curinput=curinput.slice(0,-1),render_input()):13==e.keyCode?(game_submit(poly_parse(curinput)),curinput="",render_input()):1==e.key.length?(curinput+=e.key,render_input()):e.key),!1}function setfocus(e){return focused=e,gel("statswin").style.backgroundColor=focused?"#00A":"#000",!1}const star_images=["","","","iVBORw0KGgo!ANSUhEUgAADw!AhwAQM!CqcFkx!ABlBMVEU!BYWFjQGshd!AAXRSTlMAQObYZgAABv5JREFUeNrt3YGGFHEAx/Hf7DibUhsikAIkFJCQ2kfoAXqIwwFO5lH2SbKPcIAQFhDgACtJQBKorrvb+d3n8wAL4+v3H3ZmAg%&&&&&!ABApfuh2qtclUW4Bie5KkfhGnzPVVlN4eqd5qo8CtUb/HYKzafoh6HavSk&!!!!AAh2sKzY7WodlyG5ot16HZaheaHW1Ds3EKAMBM3Z5Cs2WYL18o5vE2/HcKxgajY&&!!FhsQrOjbWg27kKz5To0u7MLzYZ1!!AA+CPjJjQb16HZaheaLbdhtvwBjSF0mwI&&!MG+LKTQ7CtVWU2i2XIdmq22YLR8mZpwC&AXLJxE5oN69BstQuz5Vlaxl1oNoRuUw&!AACAy/EsVHsfqr0J1U5CtY+h2oM!!!!AAMDvxik0W65Ds9UuNFtuw2y5wAyh25QE&AAIDbU2i2DNVWU2h2dxtmS8EchWqL&&&!AD1uhWrvQrV9qHYSqn0P1U5DtVcB&!C4GpvQbDgOzcZ9aDachblTsA3GKRo&&!!!B4EqqdhGrfQ7X3odqHMF82mKcB!AgL+wD9WOw3wpmE/h8igY&!B4E6q9DPOlYF6HP6Bg&&&!!!CehGrH4bp9ySXah2s2nF3uj3PNxn0uz2IfrtlwfP0/zmxnchOu27swO25VAQ&&&AYB2q7UOz4Tg0G/eh2XAWLsQGAw!!!AAPA0VHsfqn3NRW3CATvpfnaKb93PTnGaCxrOwwF7kgsaz0O1d6HaF&&!!!!AuBEWU2g2rEOz1S40W25Ds3EX5ssGMwU&!AB+tQjVHoRqj6fQ7HGo9nYKzR6GavcC&&AAwMWsptBsGeZLwdydwj9TM!!!!ADAYhOaDevQbNyFZsttUDA2mAM1BQ!!!AAIDDcjtUexiqvZ1Cs0dBwdRtME7R!AwGIXmg1nodl4HpoNx6HZ+CXcsNf4AXgRLF7lzJ1daLZch5mxwQ&&&!!AAsQrUhVFttQ7OjbWi22oVmy3VoNk4B&&!!AACAn26Fag9CtTeh2mlQMDaYA/U8&!AAwI20Cc2G49Bs3Idmw3n4vxSMglEwCsYFBg!!AACGUG01hWZH29BstQnNlutwDWww&AACw2odmwDs3GXWi23AYFY4M5UFMALs0iVHsQqj2eQrPHodrbKTR7GKrdCw&&&&&!!!!ABw40yh2bAOzcZdaLY8CxegYGwwTtE&!!AADAcB5mywVm3Idmw3FoNuxCtXU&!IAbahGqLUO11RSaPQrVXkyh2cNQ7XY&&!!!D+3D5U+xTmS8Ech8ulYOBJqPYu/B1T+jQcjs/5796H6oK/hurb2ZNwOL7kv/sWqp2Gq+LWGg&FiEakeh2moKze5uw2wpmGWodm8K&&!ACX7Wmo9j5U+xqqnYRq30K101DtSQ&&&&!!gIP0A1vFkXxne71B!AAElFTkSuQmCC","iVBORw0KGgo!ANSUhEUgAADw!AhwCAM!CnYDt!AAwFBMVEU!C%%%%%%%%%JtUYd!AP3RSTlMAHVZzyeaPOawOK57XYKK/upbj9vfx0oT+/fv0+WJX5IrQku76fPDzQ8btVc6jBtj4/LkRsK7Z6eh4S2FmUCKtkI/1!kiUlEQVR42uzdVZb0NhCA0bLUsmTZYWZmZs7sf1fp5Ew8eQ39UOfeXXyCqg@@@@@@@@@@@@@@@@@@@@@!!AgMyWUmtZAg!FIrl3Z1KQE!Dp+1cBAwAAkL9/sxcw!ALGs7rUs!BATn200+gB!A/yUBD!AAIY!A/AEG!AU6ABAADAHm!AAUsP4F!gv6XUWpY@@@@@&&AAD4v22z97kF!ApDbrPsZeZw!EBicz3a1bHO!AgNz9q4ABAABIbqtHu3XULQ!CCnubfTPgM!By6qOdRg8!C4VwQw!AeAIN!AhmABAACANUg!AoYP0LAABAfrPuY+x1Bg!KS2zd7nFg@@&!!!ADwIlt77Eg!JBbWccYawk!DIrFza7y4l!AIHf/Zi9g!AWC7tT5cl!AIKnS7pQ!CApGq7UwM!DuGQEM!AnkADAACAIVg!BgDRI!AKOH//AgAAQFnHGGsJ!AyG3pvS8B@@@@@&!AA8OLbZ+9wC!AUpt1H2OvMw!CCxuR7t6lhn!AQO7+TV7!AAsNWj3TrqFg!JDT3NtpnwE!A59dFOowc!DcKwIY!APIEG!AQ7!ADAGiQ!AUcP7+BQAAgFn3MfY6Aw!FLbZu9zCw@&&!AAIJVt9j63!AgNRm3cfY6ww!BIbK5HuzrWGQ!JC7f5MXM!AGz1aLeOugU!DkNPd22mc!BATn200+gB!AAhg!A8gQY!BDs!AMAaJ!ALhXBZy/fwEAAGDWfYy9zg!IDUttn73AI&&!AADgQbOUWssS!AkFq5tKtLCQ!EjfvwoYAACA/P2bvYABAABgWdtpXQI!By6qOdRg8!AQw!ACCAAQAAwB9g!AMAUa!A7AEGAACA/7KA9S8!D5LaXWsgQ@@&&&A87LbZ+9wC!AUpt1H2OvMw!CCxuR7t6lhn!AQO7+TV7!AAsNWj3TrqFg!JDT3NtpnwE!A59dFOowc!AIY!APAEGg!AzBAg!GuQ!A4F4VcP7+BQAAgFn3MfY6Aw!FLbZu9zCw@@@@@@@@@@@@&&&!!!!AAHjobbP3uQU!CkNus+xl5n!AQGJzPdrVsc4!CA3P2bvIABAABgq0e7ddQt!AIKe5t9M+Aw!HLqo51GDw!BD!AA4Ak0!AGIIF!A1iABAADAvSrg/P0L!As+5j7HUG!ApLbN3ucW@@@@&&&!!AAH/X0ntfAg!HJ75NHHHnv8iRI!CQWX3yqaeffuqZZ0s!BAXs898/zVCy++pIABAABI7LmXb/7w/LWAlw!ICcXnnp5tbzLz7zS!AEBKr752c3r+qdcD!AMlreePHmzstvBg!GRU3nrh5s7b7wQ!BkVN/9awC/934!BA+gB+/oMt!AIKPy4Ys3p5c+Cg!Ehp+fjp529uvfDJpwE!A5lc8+vy3gL778Kg!CBzAV8T+PnPv9a/!AZFa++fa7t75/4wf9CwAAQG7Ljz/9/MuvnwY@&&!!!P/G0ntfAg!HIr6xhjLQE!CZlUv73aUE!A5O7f7AUM!Ay6X96bIE!AJFXanRI!CQVG13ag!MA9I4ABAADAE2g!AwBAs!CsQQIAAEAB5+9f!AKOsYYy0B!AuS299yU@@@&&&!AO6fpdRalg!IDUyqVdXUo!BA+v5Vw!AOTv3+wFD!AMvaTusS!AkFMf7TR6!AwH9JAAMAAIAABg!H+AAQAAwBRo!AsAcY!ABax/AQAAyG8ptZYl@@@@@@&&+F9ts/e5BQ!KQ26z7GXmc!BAYnM92tWxzg!IDc/Zu8gAEAAGCrR7t11C0!Agp7m30z4D!AcuqjnUYP!AuFcEM!AHgCDQ!IZgAQAAgDVI!AKOD8/Qs!Cz7mPsdQY!Ckts3e5xY@@@@@@@&&&&!AwMPot/bu7EpyEIiiYEIWAqHy397ZVfM9a3d2hBPvXC0@@&&&&!AADAz1rP7C0!CgtP4Ynz16!AQPn+Vc!ADU79/qBQw!DtGLejBQ!NQ017itGQ!PAnCW!AAQw!AOAfY!AHAKN!ALgHG!AAWsfwEAAKiv9czeAg@@@@@&!!!ACA92dm5gw!CobY0vVg!ED5/q1fw!AOjf8gUM!Ac7zM!AgKJyvGQ!DAHyOAAQAAQAADAACAf4ABAADAKd!ADgHm!ABYH6J/AQAAYGbmD@@@@@@&!!AAD4K1rP7C0!CgtP4Ynz16!AQPn+Vc!ADU79/qBQw!DtGLejBQ!NQ017itGQ!PAnCW!AAQw!AOAfY!AHAKN!ALgHG!AAWsfwEAAKiv9czeAg@@@@@@@@@@@@@&&&!!!AAICftDlnCw!KitH2utowc!BU1h/ji0cP!AqN2/1QsY!A2mP88GgB!ARfXx0gM!CKyvGSAQ!P+MAAY!CfQAMAAIBDs!AMA1S!ACjg+v0L!A/VhrHT0!CgtjbnbAE@&&!!C8F+eec58B!Ape281rpyBw!BS2j+f47Hns!AgNr9W7yAAQAA4Mzn+O6ZZw!EBN+xq3awc!DUNNe4rRk!Dwrwhg!A8Ak0!AOAQL!AXIMEAACAAq7fvw!LDzWuvKHQ!FDauefcZw@@&&&!!!AAf9G559xn!AQGk7r7Wu3AE!CF7eM5PnseOw!KB2/xYvY!ADjzOb575hk!BQ077G7doB!ANc01bmsG!A/CsCG!AHwCDQ!A7BAg!NcgAQAAoIDr9y8!DsvNa6cgc!CUdu459xk@@@@@@@&!!!AAC/ambmDACg9o4DAGt8sQIAqL/jAGA3LScAlN9xALCb5ZcTAOw4ADDHywwAoOiOAwA5XjIAgD/GjgOA4QQA7DgAGE4AwI4DgH+H!7DgBOjwQAOw4AuD8QAOw4ALA+xG4CgB0HAGZmzgAA3gM7Dg@@@@@@@@@@&&&&!!!!APAJZd9g1ET9qG0!AASUVORK5CYII=","iVBORw0KGgo!ANSUhEUgAADw!AhwCAM!CnYDt!ABC1BMVEU!Dh4%%%%%%%%%%%%+Ph4+Ph4+Ph4+Ojjy4+!AWHRSTlMADitIVh2BnrrJ5o/XUnOGNs7q9Pb18t2/AQ1g+v790gMZZN77BDe+Qdbc7s/3/Oed8ej47WXrGJMityCtFX8KUSoUdB6Y5Zfwq3DF7/PDXThmiySMmuH5BQH3LQAAKmtJREFUeNrs3QV29DqXhtFjWZIt2ZcZ8t2fmeE2MzPD/EfSVCtrVdxEaTjZew6Bp0qvF@@@@@@@@!AC/ZUtZa17IE!A5NVq3/Yx9q3XFg!JBU6WPejF4C!AUirHOR+dRwk!DI2r/JCxg!BaP+eds7c!CAbOqYT4wa!AkMzS50VfAg!HIp27zYSg!EAu6z4v9jU!Ag9wT4+Uf!AAIIABAADAEWg!BwCRY!B4Bgk!DqeAETY!AGj9nHfO3gI!DSKcd5179HCQ!EhawPn7Fw!Eof82b0Eg!JBUq33bx9i3Xls!BAXktZa13LEg&&&&!!!AwIu1lLXWtSwB!AebXat32Mfeu1BQ!CRV+pg3o5c!CAlMpxzkfnUQI!Cy9m/yAgYAAIDWz3nn7C0!AgmzrmE6MG!AJLP0edGX!AgFzKNi+2Eg!JDLus+LfQ0!DIPgE2AgYAAOC5CW!ABwBBo!BcggU!CeQQIAAIA6XsAEG!AFo/552ztw!IB0ynHe9e9RAg!JIWcP7+BQAAgNLHvBm9B!ACTVat/2Mfat1xY!CQ11LWWteyB@&&&M9qKWuta1kC!A8mq1b/sY+9ZrCw!Eiq9DFvRi8B!AKZXjnI/OowQ!Bk7d/kBQw!Ctn/PO2Vs!BANnXMJ0YN!ASGbp86IvAQ!LmUbV5sJQ!CCXdZ8X+xo!CQewL8/CNg!AEM!ADgCDQ!C4BAs!A8gwQ!B1vIAJM!ALR+zjtnbwE!DplOO869+jB!ACQt4Pz9Cw!KWPeTN6CQ!Eiq1b7tY+xbry0!Agr6Wsta5lCQ@@@&!!AADg/6ClrLWuZQk!DIq9W+7WPsW68t!AIKnSx7wZvQQ!CkVI5zPjqPEg!JC1f5MXM!ALR+zjtnbwE!DZ1DGfGDU!AgmaXPi74E!A5FK2ebGV!AgFzWfV7saw!EDuCfDzj4ABAAB!MAAIAj0!AOASL!APAMEg!NTxAib!AA0Po575y9BQ!KRTjvOuf48S!AkLSA8/cv!AlD7mzegl!AIKlW+7aPsW+9tg!IC8lrLWupYl@@&&&&AA4J+3lNdef+ON118rSw!EBWbx5vvf3Ou++9//YHHx61BQ!OTz0cefnJ8+/O0/enj16fuf9RI!CQzBe++KUvv/rbRw+vvvLOl48S!AkMpXv/b1r/ztTdYCBgAAgK9+45v/2L/3Bfz+t3oL!ASNW/D397KeBPvz1q!AQBZf+Np3vvvwtxcP33v/+30J!ASOKLP/jhq38ugF+99/ZWAg!HL46Gs/euefD+Af/2RfAw!HL4+Keff/cWwHlHw!APAzP/vtTwUw!A6f3cz98COPsRa!AARw+kuw!A4Bd+8V/aAHsGCQAAgER+6Zd/9M73/rkANgEG!gk1/51fnD712/An743vvf6i0!Agi1/77PPvXgv4e+98+SgB!Aafz6b3zr25/eCjhv/wIAAMBv/talgL/y/me9B!AKQu4K/89odHbQE!DJ/Obv/MMO+HuvXj38vd/9vddfK0s!BAPr/++/sffPP7f/hHf/jbf/wnAQ!Hn9yp/+2Z//eX/tLwI@@@@@@@@@@@&&!!AICXZilrrWtZAg!PJqtW/7GPvWaws!BIqvQxb0YvAQ!CmV45yPzqME!AZO3f5AUM!ArZ/zztlb!AQDZ1zCdGDQ!Ehm6fOiLwE!C5lG1ebCU!Agl3WfF/sa!AkHsC/PwjY!ABD!AA4Ag0!AuAQL!APIME!AdbyACT!AC0fs47Z28B!A6ZTjvOvfowQ!AkLeD8/Qs!Clj3kzegk!BIqtW+7WPsW68t!AIK+lrLWuZQk@@@@@@&!!!ACAl2Apa61rWQI!DyarVv+xj71msL!ASKr0MW9GLwE!ApleOcj86jB!AGTt3+QFD!AK2f887ZWw!EA2dcwnRg0!BIZunzoi8B!AuZRtXmwl!AIJd1nxf7Gg!JB7Avz8I2!AAQw!AOAIN!ALgECw!DyDB!AHW8gAkw!AtH7OO2dvAQ!OmU47zr36ME!AJC3g/P0L!ApY95M3oJ!ASKrVvu1j7FuvLQ!CCvpay1rmUJ@@@@@@@@@&&!!!AgsaWsta5lCQ!Mir1b7tY+xbry0!AgqdLHvBm9B!AKRUjnM+Oo8S!AkLV/kxcw!AtH7OO2dvAQ!NnUMZ8YNQ!CCZpc+LvgQ!DkUrZ5sZU!CAXNZ9Xuxr!AQO4J8POPgAEAAE!wAAgCPQ!A4BIs!A8AwS!A1PECJs!ADQ+jnvnL0F!ApFOO865/jxI!CQtIDz9y8!CUPubN6CU!AgqVb7to+xb722!AgLyWsta6liU@@!!!!HhiKWuta1kC!A8mq1b/sY+9ZrCw!Eiq9DFvRi8B!AKZXjnI/OowQ!Bk7d/kBQw!Ctn/PO2Vs!BANnXMJ0YN!ASGbp86IvAQ!LmUbV5sJQ!CCXdZ8X+xo!CQewL8/CNg!AEM!ADgCDQ!C4BAs!A8gwQ!B1vIAJM!ALR+zjtnbwE!DplOO869+jB!ACQt4Pz9Cw!KWPeTN6CQ!Eiq1b7tY+xbry0!Agr6Wsta5lCQ@&&&&!!!!ACA/3lLWWtdyxI!CQV6t928fYt15b!AQFKlj3kzegk!BIqRznfHQeJQ!CBr/yYvY!AGj9nHfO3gI!CyqWM+MWo!BAMkufF30J!AyKVs82IrAQ!Lms+7zY1w!IDcE+DnHwEDAAC!Y!BHoAEAAMAlW!AOAZJ!AKjjBUyAAQAAoPVz3jl7Cw!EinHOdd/x4l!AIGkB5+9f!AKH3Mm9FL!AQFKt9m0fY996bQE!B5LWWtdS1L@@@@@@@@@!!!XC1lrXUtSw!EBerfZtH2Pfem0B!ASZU+5s3oJQ!CClcpzz0XmU!AgKz9m7yAAQAAoPVz3jl7Cw!MimjvnEqAE!DJLH1e9CU!Agl7LNi60E!A5LLu82JfAw!HJPgJ9/BAw!ACG!AByBBg!JdgAQAAgGeQ!AoI4XMAEGAACA1s955+wt!AIJ1ynHf9e5QAAODfYSlrrWtZAoD/PwX8H+1fAABa7ds+xr712gKA/x9KH/Nm9BIAAPy/+hcKAB9fAgA4RAeAAQsAgGtU!AwEMa!AUMd8YtQ!CAZJY+L/oS!AkEvZ5sVWAgAAyHUtIbDu82JfAwAAyPcwHZgA/+dHw!QOlj3oxeAsgcw!4F3R/K+KgiPQAACgf5MXMLgECwAAaP2cd87eAsj8DBIAANgUXheFgB9YAADwhRLgyAYAAJgUAkb7AADgUlnAte0AAOBZUcDD3QAAIICBVvu2j7FvvbY!DyHoEGlrLWupYl!Al2ABAACAZ5!AAwAs45AQYAAIDWz3nn7C0!Ag7aui+d8VBQAAQAHn718!Aofcyb0Us!BAUq32bR9j33ptAQ!HktZa11LUs@@@@!!!!AADy3pay1rmUJ!AyKvVvu1j7FuvLQ!CCp0se8Gb0E!ApFSOcz46jxI!CQtX+TFz!AC0fs47Z28B!A2dQxnxg1!AIJmlz4u+B!AORStnmxlQ!IBc1n1e7Gs!BA7gnw84+AAQAAQAADAACAI9!ADgEiw!DwDBI!DU8QImw!AND6Oe+cvQU!CkU47zrn+PEg!JC0gPP3Lw!JQ+5s3oJQ!CCpVvu2j7FvvbY!CAvJay1rqWJQ@@@@@&&&&ABy+jv27iBHYhMIwyguQ9lg7n/ebFoj9fQui45S894tPomfAg@@@@@@@@&&AACAbzni7P2MowEAAEBdo+d1z3lf2UcDAACAoiLnepkZDQ!EqKZ68f+4kG!AVfu3eAEDAADAyL3e7BwN!Aqulz/TJ7AwAAgGKOXB/ya!AFBLXOvDFQ0!BqOe/14T4b!A1JsAf3cED!AAIY!APIEG!An2ABAACAM0g!DQ5x+YAAMAAMDIvd7sHA0!DKiWe/9e8TDQ!IoWcP3+BQAAgMi5XmZGAwAAgKJGz+ue876yjwY!B1HXH2fsbR&&&!!!AA+N854uz9jKMBAABAXaPndc95X9lHAwAAgKIi53qZGQ0!BKimevH/uJBg!FX7t3gBAwAAwMi93uwcDQ!Krpc/0yewMAAIBijlwf8mg!BQS1zrwxUN!Aajnv9eE+Gw!NSbAH93BAw!ACG!ADyBBg!J9gAQAAgDNI!A0OcfmAADAADAyL3e7BwN!Ayolnv/XvEw0!CKFnD9/gUAAIDIuV5mRgMAAICiRs/rnvO+so8G!AdR1x9n7G0Q@@@@@@@@&&!!!AD4bx1x9n7G0Q!KCu0fO657yv7KMBAABAUZFzvcyMBg!CXFs9eP/UQDAACAqv1bvIABAABg5F5vdo4G!A1fS5fpm9AQAAQDFHrg95N!AKglrvXhigY!C1nPf6cJ8N!A6k2AvzsCBg!AEM!AnkADAACAT7!ADAGSQ!Do8w9MgAEAAGDkXm92jgY!DlxLPf+veJBg!EULuH7/AgAAQORcLzOjAQAAQFGj53XPeV/ZRwMAAIC6jjh7P+No@@@@@@@@@&&!!A/DtHnL2fcTQ!Coa/S87jnvK/to!AUFTkXC8zowEAAEBJ8ez1Yz/R!AoGr/Fi9g!AGLnXm52jAQAAQDV9rl9mbw!FDMketDHg0!BqiWt9uKIBAABALee9PtxnAwAAgHoT4O+OgAEAAE!wAAgCfQ!A4BMs!AcAYJ!A+vwDE2!AAYudebnaMBAABAOfHst/59ogEAAEDRAq7fvw!BA518vMa!AFDU6Hndc95X9tE!CgriPO3s84Gg&&AJTgYAc!CMntc9531lHw0!CKipzrZWY0!AKCmevX7sJxo!BU7d/iBQw!Aj93qzczQ!Cops/1y+wN!AijlyfcijAQAAQC1xrQ9XN!AKjlvNeH+2w!BQbwL83REw!ACG!ADwBBo!B8ggU!DOIAEAAECff2ACD!ACP3erNzN!ACgnnv3Wv080!AKFrA9fsX!AIud6mRkN!Aiho9r3vO+8o+Gg!NR1xNn7Ge4fAQ!!!AAP+0d0epCcRgGEUzcSZVBgUqDQKTCuiTBYuMS1F1/ytpkQKVvheanrOLC/+X@@@@@&&&&!!!AMBf08T54nQ+nxbz2AQ!CoU9f2q8thvF7Hw2XVt10!CACsW0zkMpt0+lDHmdYg!IDqxH6z3Jfbl7JfbvoY!AoOr+Vc!ADUqUu7vC23b8o271IX!AoCbt7G14fQzg1+Ft1gY!CoSJPe871/Hwo4v6cm!AQD3i0/PLzwB+eX6KAQ!OoxmR7HnwE8HqeT!AAPVNgH97BAw!ACG!AJxAAwAAgEew!AwDdI!AGAFXPgEGAACALu3y9jGAt3mXug!ABVif1muS/f+ne/3PQx!AQJUFXHv/AgAAQEzrPJRyz98y5HWKAQ!CrUtf3qchiv1/FwWfVtFw!KBOTZwvTufzaTGPTQ@@@@@@@@@@@@@@&&!!!!AA+Kc+AEtl2Lc5UjmS!AAElFTkSuQmCC"];function star_url(e){let A=star_images[e];return A=A.replaceAll("%",["","","","&","EhIS","+Ph4"][e].repeat(7)),A=A.replaceAll("@","&&&&&"),A=A.replaceAll("&","!!!!!"),A=A.replaceAll("!","AAA"),"data:image/png;base64,"+A}var sp=0;function stars_update(){let e=gel("stars");for(let A=0;A<6;++A){let t="stars"+A,n=gel(t);n||(n=addImage(e,star_url(A%3+3),0,0),n.id=t,n.style.width="100%",n.style.height="100%",imageSetZ(n,A+1)),moveImage(e,n,(sp*((A%3+1)/3)%100-(A<3?0:100))*e.clientWidth/100,0)}sp+=45/render_fps,sp%=1200}function stars_resize(){for(let e=0;e<stars.length;++e)stars[e].kill();stars=[]}const cool_values=[0,1,2,3,4,5,10,-1,-2,-3,-4,-5,-10];function find_challenge(e){let A=e[0],t=e[1],n=e[2],r=e[3],l=e[4],o=e[5],a=simplification_tasks[A][t][n][r][l][o],s=a[random2(0,a.length-1)];if("1"==t&&"n"==l){let e=function(A){if(is_array(A))for(let t=0;t<A.length;++t){let n=e(A[t]);if(n)return n}else if(0!=A.fac)for(let e=A.vars,t=0;t<e.length;++t)return e[t]},t=e(poly_simplify(s));if(t){let e=cool_values[random2(0,cool_values.length-1)],n={};n[t]=e;let r=poly_simplify(s,n);if(1==r.length&&"vars"in r[0]&&0==r[0].vars.length&&("a"==A||Math.abs(r[0].fac)<=20)){return[s,TOK_EQ,r,[t,TOK_EQ,[{fac:e,vars:[]}]]]}}}return[[],null,s,null]}function update_challenge(e,A,t){let n=e.style,r=A/t.offsetWidth;n.color=r<.63?"#5F5":r<.81?"#FF5":"#F55",n.left=A+"px"}var challenges={},gamespeed=4;function challenge(e,A){let t=gel("gamewin");e.style.position="absolute",e.style.color="#000",e.style.left="50%",e.style.top="50%",imageSetZ(e,8),dom_append(t,e),this.x0=-e.offsetWidth,this.x=0,this.y=random2(0,t.offsetHeight-2*e.offsetHeight),this.htmltag=e,this.dead=!0,this.rank=0;let n=()=>this.x*t.clientWidth/100+this.x0;for(let o in challenges){let A=challenges[o].htmltag,r=n();if(!(A.offsetTop>this.y+2*e.offsetHeight+20||A.offsetLeft>r+2*e.offsetWidth+20||A.offsetTop+2*A.offsetHeight+20<this.y||A.offsetLeft+2*A.offsetWidth+20<r))return void t.removeChild(e)}let r=()=>update_challenge(e,n(),t);e.style.position="absolute",e.style.top=this.y+"px",r(),this.dead=!1,this.kill=function(){t.removeChild(e),this.dead=!0},this.tick=function(){this.dead||(r(),this.x+=gamespeed/render_fps,n()>=t.clientWidth&&this.kill())};let l={};if(A[1]){let e=A[3],t=poly_rendertext(e[2]),n="string"==typeof e[0]?e[0]:poly_rendertext(e[0]);l[n+text_sign(e[1])+t]=!0}else{let e=poly_rendertext(poly_simplify(A[2]));l[e]=!0}this.test_solution=e=>e in l}function spawn(){var e=find_challenge("a1Alni");latex_render(e[1]?poly_render_latex(e[0])+latex_sign(e[1])+poly_render_latex(e[2]):poly_render_latex(e[2]),(A=>{let t=0;for(;t in challenges;)++t;challenges[t]=new challenge(A,e)}))}function game_submit(e){let A=null;A=e[1]?poly_rendertext(e[0])+text_sign(e[1])+poly_rendertext(e[2]):poly_rendertext(e[2]);for(let t in challenges){let e=challenges[t];!e.dead&&e.test_solution(A)&&(score+=poly_rank(e.rank),e.kill())}}var input_idle=0;function game_tick(){let e=0,A=challenges;for(let n in A)++e;e<40&&spawn(e);for(let n in A)if(A[n].dead){delete A[n];break}for(let n in A)A[n].dead||A[n].tick();""==curinput?++input_idle:input_idle=0;const t=30;if(input_idle<5*render_fps){gamespeed<4?gamespeed*=(4/.5)**(1/(4*render_fps)):gamespeed=4,render_fps<t?render_fps*=Math.pow(7.5,1/(2*render_fps)):render_fps=t}else{gel("gamewin");let e=0;for(let t in A)A[t].dead||(e=Math.max(e,A[t].x));const n=.2;if(e>10){gamespeed>n&&(gamespeed*=(n/4)**(1/(5*render_fps)));let e=60;focused||(e=1),render_fps*=Math.pow(2/t,1/(e*render_fps))}}render_fps>t?render_fps=t:render_fps<2&&(render_fps=2)}
'use strict';

/** Generate polynomial
Traits: {
   allow_vars : integer
       0 = no vars, 1 = x only, 2 = x and y, 3 = x,y,α,β etc.
       If max_degree = 0, has no effect

   allow_neg : integer
       0 = only positive numbers
       1 = allow negative factors
       2 = also allow negated polynomials

   allow_mul : integer
       0 = no multiplications
       1 = with scalar
       2 = with term
       3 = with binomial
       4 = no limits
   
   allow_frac : bool

   min_terms : integer
       at least n terms

   max_terms : integer
       at most n terms

   max_degree : integer
       0, 1, 2
}
*/

/** Format:
sum  =  [ term... ]
term =  { 'fac': number, 'vars':[list of vars] } -- simplified polynomial
        { 'neg': term }                          -- negated
        { 'mul': [ sum... ] }                    -- multiplication
*/

function poly_generate(traits)
{
  /*
  const sets_str =
  ''                             + ';' +
  '|x'                           + ';' +
  '|x-y|xy-yx'                   + ';' +
  '|x-y-a-b|xy-yx-xa-ya-ab|xab';
  const var_sets = sets_str.split(';').map(s=>s.split('|'))
  */
  const set0 = ['']
  const set1 = ['', 'x']
  const set2 = ['', 'x-y',     'xy-yx']
  const set3 = ['', 'x-y-a-b', 'xy-yx-xa-ya-ab', 'xab' ]
  const var_sets = [set0, set1, set2, set3]

  let factor2 = random2(1, 14);
  let make_term = function()
  {
    if(traits['allow_mul'] && random2(0,7) == 0)
    {
      let backup = Object.assign({}, traits)
      let result = { 'mul' : [] }
      let poly = null, scalar = null, poly1 = null, poly2 = null, term = null;
      // Create a mul expression
      switch(traits['allow_mul'])
      {
        case 1: // Scalar with polynomial
          traits['allow_mul'] = 0;
          traits['max_terms'] = 2;
          poly = poly_generate(traits);   // Make polynomial
          traits['max_degree'] = 0;
          scalar = [ make_term() ];       // Make scalar
          result['mul'].push(poly)
          result['mul'].push(scalar)
          break;
        case 2: // Term with polynomial
          traits['allow_mul'] = 0;
          traits['max_terms'] = 2;
          poly = poly_generate(traits);   // Make polynomial
          term = [ make_term() ];         // Make term
          result['mul'].push(poly)
          result['mul'].push(term)
          break;
        case 3: // Binomial with binomial
          traits['allow_mul'] = 0;
          traits['max_terms'] = 2;
          poly1 = poly_generate(traits);   // Make binomial
          poly2 = poly_generate(traits);   // Make binomial
          result['mul'].push(poly1)
          result['mul'].push(poly2)
          break;
        default: // No limits
          traits['allow_mul'] = 2;
          poly1 = poly_generate(traits);   // Make polynomial
          poly2 = poly_generate(traits);   // Make polynomial
          result['mul'].push(poly1)
          result['mul'].push(poly2)
          break;
      }
      // Done
      result['mul'].shuffle();
      Object.assign(traits, backup);
      if(traits['allow_neg'] >= 2 && random2(0,5)==0 && result['mul'].length > 1)
        return { 'neg': result }
      return result;
    }
    let vars   = []
    let factor = random2(1,10);
    if(random2(0, traits['allow_frac'] ? 3000 : 200) == 0) factor = 0;
    if(traits['allow_frac'] && random2(0,1) == 0)
    {
      factor /= factor2;
    }
    if(traits['allow_neg'] >= 1 && random2(0,3)==0) factor = -factor;
    if(traits['allow_vars'] && traits['max_degree'])
    {
      // >= 1:   x
      // >= 2:   x and possibly y
      // >= 3:   all sorts of letters
      let s = var_sets[traits['allow_vars']]        // list of variable options
      let m = Math.min(3, random2(0, s.length-1));  // choose a set
      s = s[m].split('-')
      s = s[random2(0, s.length-1)]
      for(let a=0; a<m; ++a)
        for(let e=random2(1, (a==0 || s[a]>="x") ? traits['max_degree'] : 1); e > 0; --e)
          vars.push(s[a])
      /* Do exponents only for "x" and "y", or the first variable in the list. */
    }
    let result = { 'fac':factor, 'vars':vars };
    if(traits['allow_neg'] >= 2)
    {
      if(result['fac'] < 0)
        { if(random2(0, 5) == 0) return { 'neg': result } }
      else
        { if(random2(0,6000) == 0) return { 'neg': result } }
    }
    return result;
  };

  let result = [];
  let nterms = random2(traits['min_terms'] || 1, traits['max_terms'] || 3);
  for(let n=0; n<nterms; ++n) result.push(make_term());
  return result;
}

/*
console.log(poly_rendertext(poly_simplify( [
  {'neg':
     {'mul': [ [ {'fac':4, 'vars':['x']}, {'fac':6, 'vars':['y']} ],
               [ {'fac':4, 'vars':['x','x']}, {'fac':-6, 'vars':['y']} ]
             ]},
  },
     {'neg': {'fac':3, 'vars':['x','y']}}
  ])
))
*/

'use strict';

//console.log(poly_rendertext( poly_parse('5ax^2b+5-2')[2] ))

let t = {
  'min_terms'  : 1,
  'max_terms'  : 4,
  'max_degree' : 2,
  'allow_vars' : 1,
  'allow_neg'  : 2,
  'allow_mul'  : 2,
  'allow_frac' : true,
}

function number_of_terms(poly)
{
  return poly.length
}
function number_of_distinct_variables(poly)
{
  let vars={}
  let count_in=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) count_in(p[a])
    }
    else if(p.hasOwnProperty('mul'))
    {
      count_in(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      count_in(p['neg']);
    }
    else for(let v=p['vars'], n=0; n<v.length; ++n)
      vars[v[n]] = 1
  }
  count_in(poly);
  let res=0;
  for(let k in vars) ++res;
  /*
  if(vars['x']) res|=1;
  if(vars['y']) res|=2;
  if(vars['a']) res|=4;
  if(vars['b']) res|=8;
  */
  return res;
}
function type_of_multiplication(poly)
{
  let scalar_by_poly=false;
  let term_by_poly=false;
  let binom_by_binom=false;
  let poly_by_poly=false;
  let find_mul=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_mul(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      /* Identify each component in the multiplication */
      let q = p['mul'];
      let scalars=0, terms=0, binoms=0, polys=0;
      for(let a=0; a<q.length; ++a)
      {
        let r = q[a];
        // r is also an array: a polynomial.
        switch(r.length)
        {
          case 1:
          {
            // One element. Find which category it belongs to.
            let s = r[0];
            if(s.hasOwnProperty('mul')
            || s.hasOwnProperty('neg'))
              polys += 1; // Complex object
            else if(s.vars.length == 0)
              scalars += 1; // No variables
            else
              terms += 1;
            break;
          }
          case 2:
          {
            // Binomial
            ++binoms;
            break;
          }
          default:
          {
            // Other
            ++polys;
            break;
          }
        }
      }
      // binom by neg = 
      if(polys >= 2 || (polys >= 1 && binoms))
        poly_by_poly = true;
      else if(binoms >= 2)
        binom_by_binom = true;
      else if(terms)
        term_by_poly = true;
      else if(scalars)
        scalar_by_poly = true;
      find_mul(q);
    }
    else if(p.hasOwnProperty('neg'))
    {
      find_mul(p['neg']);
    }
  }
  find_mul(poly);
  return Math.max(poly_by_poly*8, binom_by_binom*4, term_by_poly*2, scalar_by_poly*1);
}
function has_negation(poly)
{
  let res=false, find_neg=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_neg(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      find_neg(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      res = true;
    }
  }
  find_neg(poly);
  return res;
}
function max_power(poly)
{
  let res=0, find_power=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_power(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      find_power(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      find_power(p['neg']);
    }
    else
    {
      let vars={}
      for(let v=p['vars'], n=0; n<v.length; ++n)
      {
        let s = v[n];
        if(vars[s]) vars[s] += 1;
        else        vars[s] = 1;
        res = Math.max(res, vars[s]);
      }
    }
  }
  find_power(poly);
  find_power(poly_simplify(poly));
  return res;
}
function has_fract(poly)
{
  let res=0, find_fract=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_fract(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      find_fract(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      find_fract(p['neg']);
    }
    else
    {
      let m = make_fraction(p['fac'], false);
      if(m[1] != 1)
      {
        res |= 1;
        if(Math.abs(p['fac']) >= 1.0)
        {
          // Fraction that evaluates to whole numbers is bad
          res |= 2;
        }
      }
    }
  }
  find_fract(poly);
  find_fract(poly_simplify(poly));
  return res;
}
function largest_factor(poly)
{
  let res=0, find_fac=function(p)
  {
    if(is_array(p))
    {
      for(let a=0; a<p.length; ++a) find_fac(p[a]);
    }
    else if(p.hasOwnProperty('mul'))
    {
      find_fac(p['mul']);
    }
    else if(p.hasOwnProperty('neg'))
    {
      find_fac(p['neg']);
    }
    else
    {
      let m = make_fraction(p['fac'], false);
      res = Math.max(res, Math.abs(p['fac']))
      res = Math.max(res, Math.abs(m[0]))
      res = Math.max(res, Math.abs(m[1]))
    }
  }
  find_fac(poly);
  return res;
}


let num_for_code={}

function stringify(q)
{
  if(is_array(q))
    return '[' + q.map(stringify).join(',') + ']'
  else if(typeof(q) == 'object')
  {
    let res = []
    if(q.hasOwnProperty('fac'))
    {
      let v = q['fac']
      let s='', f = make_fraction(v, false);
      if(f[1] == 1)
      {
        s = v;
      }
      else
      {
        s = f[0]+'/'+f[1]
      }
      if(q['vars'].length==0) return 'K('+s+')'
      return 'K('+s+','+stringify(q['vars'])+')'
    }
    if(q.hasOwnProperty('neg')) return 'N('+stringify(q['neg'])+')'
    if(q.hasOwnProperty('mul')) return 'M('+stringify(q['mul'])+')'
    for(let k in q)
    {
      let v = q[k], s = ''
      if(k == 'fac')
      {
        let f = make_fraction(v, false);
        if(f[1]==1) s = f[0]; else s = f[0]+'/'+f[1]
      }
      else
        s = stringify(v)
      res.push(k+':'+s)
    }
    return '{' + res.join(',') + '}'
  }
  else if(typeof(q) == 'string')
    return JSON.stringify(q)
  else
    return q
}

var replaces=[]
for(let x=0; x<=3; ++x)
for(let y=0; y<=3; ++y)
for(let a=0; a<=3; ++a)
for(let b=0; b<=3; ++b)
{
  let f = '', v = [];
  if(x) { f += 'x'; if(x>1) f += x; for(let n=0; n<x; ++n) v.push('x') }
  if(y) { f += 'y'; if(y>1) f += y; for(let n=0; n<y; ++n) v.push('y') }
  if(a) { f += 'a'; if(a>1) f += a; for(let n=0; n<a; ++n) v.push('a') }
  if(b) { f += 'b'; if(b>1) f += b; for(let n=0; n<b; ++n) v.push('b') }
  if(f=='')continue
  let p = stringify(v)
  replaces.push( [p,f] )
  if(x&&y)
  {
    let f = '', v = [];
    if(y) { f += 'y'; if(y>1) f += y; for(let n=0; n<y; ++n) v.push('y') }
    if(x) { f += 'x'; if(x>1) f += x; for(let n=0; n<x; ++n) v.push('x') }
    if(a) { f += 'a'; if(a>1) f += a; for(let n=0; n<a; ++n) v.push('a') }
    if(b) { f += 'b'; if(b>1) f += b; for(let n=0; n<b; ++n) v.push('b') }
    if(f=='')continue
    let p = stringify(v)
    replaces.push( [p,f] )
  }
}
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+',x)',  'X'+n] )
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+',x2)', 'XX'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+',x)', 'Xm'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+',x2)','XXm'+n] )
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+',y)',  'Y'+n] )
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+',y2)', 'YY'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+',y)', 'Ym'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+',y2)','YYm'+n] )
for(let n=0; n<=10; ++n) replaces.push( ['K('+n+')',    'v'+n] )
for(let n=1; n<=10; ++n) replaces.push( ['K(-'+n+')',   'vm'+n] )



for(let n=0; n<500000; ++n)
{
  t.allow_vars = random2(0,3)==0 ? (random2(0,3)==0?3:2) : 1;
  t.max_degree = random2(1,3);
  t.allow_mul  = random2(0,3);
  t.allow_frac = random2(0,3)==0;
  t.allow_neg  = random2(0,2);
  let poly = poly_generate(t)
  let simp = poly_simplify(poly);

  //let text0 = poly_rendertext(poly);
  let text1 = poly_rendertext(poly_sort(poly));
  let text2 = poly_rendertext(simp);
  if(text1 == text2) continue;
  //if(text2 == '0') continue;
  //console.log(poly_rendertext(poly_sort(poly)), "\n", poly_rendertext(poly_simplify(poly)));

  let fac = largest_factor(simp);
  if(fac > 19 && fac != 20 && fac != 30 && fac != 40 && fac != 50 && fac != 100)
  {
    continue;
  }

  /*
  console.log(poly_rendertext( poly))
  console.log(poly_render_latex( poly))

  console.log(poly_rendertext(poly_simplify( poly)) )
  console.log(poly_render_latex(poly_simplify( poly)) )

  console.log(poly_rank(poly))
  */

  let n_terms   = number_of_terms(poly);
  let n_vars    = number_of_distinct_variables(poly);
  let mul_types = type_of_multiplication(poly);
  let has_negat = has_negation(poly);
  let has_power = max_power(poly);
  let fract     = has_fract(poly);
  
  if(has_power > 5) continue;
  if(fract & 2) continue; // Too complex fractions

  /* Terms (1-8):      abcdefgh
   * Vars (0-3):       0123
   * Mul types (0-15): ABCDEFGHIJKLMNOP of these, only ABCEI are used.
   * Negat (0-1):      kl
   * Power (0-9):      mnopqrstuvwxyz
   * Fract (0-1):      ij
   */
  
  let code = String.fromCharCode(97+n_terms-1) +
             String.fromCharCode(48+n_vars) +
             String.fromCharCode(65+mul_types) +
             String.fromCharCode(107+has_negat) +
             String.fromCharCode(109+has_power) +
             String.fromCharCode(105+fract);
  /*
  if(code != 'b1Alni') continue;
  console.log(text0,"\n",poly_rendertext(poly), "\n", text1, "\n", text2, "\n", poly, "\n", simp);
  */
  
  if(num_for_code[code])
  {
    if(++num_for_code[code] >= 50)
      continue;
  }
  else
    num_for_code[code] = 1;
  
  let s = stringify([code, /*poly_rank(poly), */poly]);
  
  for(let n=0; n<replaces.length; ++n)
    s = s.replaceAll(replaces[n][0], replaces[n][1]);

  console.log(s)
}
