// Diwali Dash UI / 3D runner bridge
const BEST_KEY = 'diwaliDashBest';
const state = { character: null, score: 0, best: Number(localStorage.getItem(BEST_KEY)) || 0 };
const $ = s => document.querySelector(s);
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('is-active',s.id===id)); }
function drawCharacter(svg, character, face) { svg.innerHTML = `<use href="#${character}-body"></use><use href="#face-${face || character}"></use>`; }
function fitStage() { $('#stage').style.setProperty('--scale', Math.min(innerWidth/1280,innerHeight/720)); }
addEventListener('resize',fitStage); fitStage();
function buildToran(el) { for(let i=0;i<31;i++) {if(i%2){const leaf=document.createElement('div');leaf.className='toran__leaf';el.append(leaf);continue;}const strand=document.createElement('div');strand.className='toran__strand';for(let j=0;j<3+((i/2)%3);j++){const bead=document.createElement('div');bead.className='toran__bead';strand.append(bead);}const stem=document.createElement('div');stem.className='toran__stem';strand.append(stem);el.append(strand);}}
document.querySelectorAll('.toran').forEach(buildToran);
(function(){const group=$('#fairy-lights');if(!group)return;[{x:44,y:275},{x:113,y:275,flip:true},{x:210,y:195},{x:299,y:195,flip:true},{x:392,y:195}].forEach(({x,y,flip})=>{let k=0;for(let cy=y;cy<=520;cy+=40,k++){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',x);c.setAttribute('cy',cy);c.setAttribute('r',4);c.setAttribute('fill',(k%2===0)!==!!flip?'#FFE27A':'#FF8A5B');group.append(c);}})})();
document.querySelectorAll('.card[data-char]').forEach(card=>card.addEventListener('click',()=>{state.character=card.dataset.char;document.querySelectorAll('.card[data-char]').forEach(c=>{c.classList.toggle('is-selected',c===card);c.setAttribute('aria-pressed',String(c===card));});$('#go-hint').hidden=true;$('#btn-go').hidden=false;}));
$('#btn-go').addEventListener('click',()=>{if(!state.character)return;drawCharacter($('#start-player'),state.character);const familyLine=state.character==='laxmi'?'Beti, how much did you score on your exam?':'Beta, how much did you score on your exam?';document.querySelector('.bubble--relative').textContent=familyLine;$('#family-dialogue').textContent=familyLine;$('#hud-score').textContent='0';$('#hud-best').textContent=state.best;showScreen('screen-start');});
$('#btn-back').addEventListener('click',()=>showScreen('screen-select'));
$('#btn-start').addEventListener('click',()=>window.DiwaliRunner?.start(state.character));
function updateScore(n){state.score=n;$('#hud-score').textContent=n;$('#game-score').textContent=n;}
function gameOver(finalScore){state.score=finalScore;const previousBest=state.best;const isRecord=finalScore>previousBest;if(isRecord){state.best=finalScore;try{localStorage.setItem(BEST_KEY,String(finalScore));}catch{}}drawCharacter($('#over-player'),state.character||'ram','dizzy');$('#over-score').textContent=finalScore;$('#over-best').textContent=state.best;$('#over-need-pts').textContent=Math.max(previousBest-finalScore,0);$('#over-need').hidden=isRecord;$('#over-record').hidden=!isRecord;showScreen('screen-over');}
$('#btn-retry').addEventListener('click',()=>{updateScore(0);$('#hud-best').textContent=state.best;showScreen('screen-start');});
window.DiwaliDash={gameOver,updateScore,showScreen,state};
