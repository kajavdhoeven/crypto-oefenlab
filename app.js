(() => {
const $ = id => document.getElementById(id);
const START = 300, FEE = 0.002, STORAGE = "crypto-oefenlab-v1";
const coins = [
 {id:"BTC",name:"Bitcoin",symbol:"₿",base:62000,vol:.045,color:"#f2a93b"},
 {id:"ETH",name:"Ethereum",symbol:"Ξ",base:3200,vol:.065,color:"#8295ef"},
 {id:"SOL",name:"Solana",symbol:"◎",base:145,vol:.095,color:"#9c83ef"},
 {id:"ADA",name:"Cardano",symbol:"₳",base:.48,vol:.085,color:"#3985ed"},
 {id:"SUI",name:"Sui",symbol:"S",base:1.65,vol:.13,color:"#6fc9ed"}
];
let state, side="buy", selected="BTC", tick=0, toastTimer;
const euro = n => new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}).format(n);
const qty = n => Number(n).toLocaleString("nl-NL",{maximumFractionDigits:8});
const pct = n => (n>0?"+":"")+n.toFixed(2).replace(".",",")+"%";
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=seed>>>0;return()=>{x=(x+0x6D2B79F5)|0;let t=Math.imul(x^(x>>>15),1|x);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296}}
function dayPrices(day){
 return Object.fromEntries(coins.map(c=>{
  let r=rng(hash(c.id+":"+day)), drift=(r()-.48)*c.vol*1.7, wave=Math.sin(day/5+hash(c.id)%9)*c.vol*.22;
  let p=c.base*Math.exp(drift*day/1.8+wave);
  return[c.id,Math.max(c.base*.12,p)];
 }));
}
function load(){
 try{let saved=JSON.parse(localStorage.getItem(STORAGE));if(saved&&saved.version===1)return saved}catch(e){}
 return {version:1,day:1,cash:START,holdings:{},costs:{},prices:dayPrices(1),history:[{day:1,value:START}],trades:[],start:START};
}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function price(id){return state.prices[id]*(1+Math.sin(tick/3+hash(id)%8)*.0015)}
function holdingValue(id){return (state.holdings[id]||0)*price(id)}
function total(){return state.cash+coins.reduce((s,c)=>s+holdingValue(c.id),0)}
function showToast(msg){let t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2500)}
function renderStats(){
 let val=total(), pnl=val-START, p=pnl/START*100;
 $("totalValue").textContent=euro(val);$("cashValue").textContent=euro(state.cash);$("profitValue").textContent=(pnl>=0?"+":"")+euro(pnl);
 $("totalChange").textContent=(pnl>=0?"+":"")+euro(pnl)+" ("+pct(p)+") sinds start";
 $("totalChange").className="stat-change "+(pnl>0?"positive":pnl<0?"negative":"neutral");
 $("profitValue").className="mid-number "+(pnl>0?"positive":pnl<0?"negative":"");
 $("dayValue").textContent=`Dag ${state.day} / 30`;$("dateValue").textContent=state.day>=30?"30-daagse oefenperiode voltooid":`${30-state.day} dagen te gaan`;
 $("timeNotice").textContent=state.day>=30?"Je hebt dag 30 bereikt.":`Je staat op dag ${state.day}.`;
}
function renderCoins(){
 $("coinList").innerHTML=coins.map(c=>{
  let p=price(c.id), prev=state.prices[c.id], change=(p/prev-1)*100;
  return `<div class="coin-row" data-coin="${c.id}"><div class="coin-info"><div class="coin-icon" style="color:${c.color}">${c.symbol}</div><div><b>${c.name}</b><small>${c.id}</small></div></div><div class="coin-price">${euro(p)}</div><div class="coin-change ${change>=0?"positive":"negative"}">${pct(change)}</div></div>`;
 }).join("");
 document.querySelectorAll(".coin-row").forEach(el=>el.addEventListener("click",()=>selectCoin(el.dataset.coin)));
}
function selectCoin(id){
 selected=id;$("coinSelect").value=id;let c=coins.find(x=>x.id===id),p=price(id);
 $("selectedSymbol").textContent=c.symbol;$("selectedSymbol").style.color=c.color;$("selectedName").textContent=c.name;$("selectedPrice").textContent=euro(p);
 let change=(p/state.prices[id]-1)*100;$("selectedMove").textContent=pct(change);$("selectedMove").className="move "+(change>=0?"positive":"negative");updateEstimate();
}
function renderHoldings(){
 let rows=coins.filter(c=>(state.holdings[c.id]||0)>1e-10);
 $("holdingCount").textContent=rows.length+" "+(rows.length===1?"munt":"munten");
 if(!rows.length){$("holdingsBody").innerHTML='<tr><td colspan="5" class="empty">Je hebt nog geen fictieve crypto. Kies hierboven een munt om te oefenen.</td></tr>';return}
 $("holdingsBody").innerHTML=rows.map(c=>{
  let q=state.holdings[c.id],v=q*price(c.id),cost=state.costs[c.id]||0,pnl=v-cost;
  return `<tr><td><div class="asset-cell"><div class="coin-icon">${c.symbol}</div>${c.name} <span style="color:#8294ad">(${c.id})</span></div></td><td>${qty(q)}</td><td>${euro(v)}</td><td class="${pnl>=0?"positive":"negative"}">${pnl>=0?"+":""}${euro(pnl)}</td><td><button class="sell-link" data-sell="${c.id}">Verkoop</button></td></tr>`;
 }).join("");
 document.querySelectorAll("[data-sell]").forEach(b=>b.addEventListener("click",()=>{setSide("sell");selectCoin(b.dataset.sell);$("amountInput").value=holdingValue(b.dataset.sell).toFixed(2);updateEstimate();}));
}
function renderActivity(){
 if(!state.trades.length){$("activityList").innerHTML='<p class="empty">Je eerste oefentransactie verschijnt hier.</p>';return}
 $("activityList").innerHTML=state.trades.slice(0,8).map(t=>`<div class="activity-item"><div><b class="${t.side==="buy"?"":"positive"}">${t.side==="buy"?"Koop":"Verkoop"} ${t.id}</b><small>Dag ${t.day} · ${qty(t.qty)} ${t.id} · koers ${euro(t.price)}</small></div><div class="activity-amount">${euro(t.amount)}<small>incl. kosten ${euro(t.fee)}</small></div></div>`).join("");
}
function renderGoals(){
 let v=total(),goals=[350,600,1000,10000,15000,100000];
 $("goalList").innerHTML=goals.map(g=>`<div class="goal ${v>=g?"done":""}"><b>${euro(g)}</b><small>${v>=g?"✓ Behaald in simulatie":"Doel"}</small></div>`).join("");
}
function drawChart(){
 let canvas=$("portfolioChart"),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 canvas.width=Math.max(1,rect.width*dpr);canvas.height=Math.max(1,rect.height*dpr);
 let ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);let w=rect.width,h=rect.height,pad={l:48,r:12,t:12,b:22};
 let hist=state.history.slice();if(hist[hist.length-1].day!==state.day)hist.push({day:state.day,value:total()});
 if(hist.length===1)hist.push({day:30,value:START});
 let vals=hist.map(x=>x.value),min=Math.min(START,...vals)*.94,max=Math.max(START,...vals)*1.06;if(max-min<1){max=min+10}
 const x=i=>pad.l+i/(hist.length-1)*(w-pad.l-pad.r),y=v=>pad.t+(max-v)/(max-min)*(h-pad.t-pad.b);
 ctx.font="10px DM Sans";ctx.fillStyle="#788ba6";ctx.strokeStyle="#24344c";ctx.lineWidth=1;
 for(let i=0;i<4;i++){let v=min+(max-min)*i/3,yy=y(v);ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();ctx.fillText("€"+Math.round(v),2,yy+3)}
 ctx.setLineDash([4,4]);ctx.strokeStyle="#d4aa5a";ctx.beginPath();ctx.moveTo(pad.l,y(START));ctx.lineTo(w-pad.r,y(START));ctx.stroke();ctx.setLineDash([]);
 let points=hist.map((a,i)=>[x(i),y(a.value)]);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle="#78a9ff";ctx.lineWidth=2.5;ctx.stroke();
 if(points.length>1){let grad=ctx.createLinearGradient(0,pad.t,0,h);grad.addColorStop(0,"rgba(120,169,255,.22)");grad.addColorStop(1,"rgba(120,169,255,0)");ctx.lineTo(points[points.length-1][0],h-pad.b);ctx.lineTo(points[0][0],h-pad.b);ctx.closePath();ctx.fillStyle=grad;ctx.fill()}
 $("chartStart").textContent="Dag "+hist[0].day;$("chartEnd").textContent="Dag "+state.day;
}
function setSide(s){side=s;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.side===s));$("tradeBtn").textContent=s==="buy"?"Koop fictief":"Verkoop fictief";$("tradeBtn").classList.toggle("sell",s==="sell");updateEstimate()}
function updateEstimate(){
 let amount=Math.max(0,Number($("amountInput").value)||0),p=price(selected),fee=amount*FEE;
 if(side==="buy"&&amount>state.cash)fee=amount*FEE;
 let q=amount/(p*(1+FEE));
 if(side==="sell")q=Math.min(amount/p,state.holdings[selected]||0);
 $("estimatedQty").textContent=q>0?qty(q)+" "+selected:"—";$("feeValue").textContent=euro(fee);
}
function trade(){
 let amount=Number($("amountInput").value),p=price(selected),c=coins.find(x=>x.id===selected);
 if(!Number.isFinite(amount)||amount<=0){$("tradeMessage").textContent="Vul eerst een bedrag groter dan €0 in.";return}
 if(side==="buy"){
  let cost=amount*(1+FEE);if(cost>state.cash+1e-8){$("tradeMessage").textContent="Onvoldoende fictief saldo. Kies een lager bedrag.";return}
  let q=amount/p;state.cash-=cost;state.holdings[selected]=(state.holdings[selected]||0)+q;state.costs[selected]=(state.costs[selected]||0)+cost;
  state.trades.unshift({side:"buy",id:selected,qty:q,price:p,amount,fee:amount*FEE,day:state.day});
  $("tradeMessage").textContent=`Gelukt: ${qty(q)} ${selected} fictief gekocht.`;
 }else{
  let q=Math.min(amount/p,state.holdings[selected]||0);if(q<=0){$("tradeMessage").textContent="Je hebt deze munt niet in je portefeuille.";return}
  let gross=q*p,fee=gross*FEE,proceeds=gross-fee,oldQ=state.holdings[selected],costPart=(state.costs[selected]||0)*(q/oldQ);
  state.cash+=proceeds;state.holdings[selected]-=q;state.costs[selected]=Math.max(0,(state.costs[selected]||0)-costPart);
  if(state.holdings[selected]<1e-10){delete state.holdings[selected];delete state.costs[selected]}
  state.trades.unshift({side:"sell",id:selected,qty:q,price:p,amount:gross,fee,day:state.day});
  $("tradeMessage").textContent=`Gelukt: ${qty(q)} ${selected} fictief verkocht.`;
 }
 $("amountInput").value="";save();renderAll();showToast("Fictieve transactie verwerkt");
}
function advance(days){
 let target=Math.min(30,state.day+days);if(target===state.day){showToast("Je hebt dag 30 al bereikt.");return}
 while(state.day<target){state.day++;state.prices=dayPrices(state.day);state.history.push({day:state.day,value:total()})}
 save();renderAll();showToast(`Simulatie doorgeschoven naar dag ${state.day}`);
}
function renderAll(){renderStats();renderCoins();selectCoin(selected);renderHoldings();renderActivity();renderGoals();drawChart()}
function init(){
 state=load();
 $("coinSelect").innerHTML=coins.map(c=>`<option value="${c.id}">${c.name} (${c.id})</option>`).join("");
 $("coinSelect").addEventListener("change",e=>selectCoin(e.target.value));
 $("amountInput").addEventListener("input",updateEstimate);
 $("tradeBtn").addEventListener("click",trade);
 document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setSide(b.dataset.side)));
 document.querySelectorAll(".quick-amounts button").forEach(b=>b.addEventListener("click",()=>{
  if(b.dataset.amount==="max")$("amountInput").value=side==="buy"?(state.cash/(1+FEE)).toFixed(2):holdingValue(selected).toFixed(2);
  else $("amountInput").value=b.dataset.amount;updateEstimate();
 }));
 document.querySelectorAll(".time-btn").forEach(b=>b.addEventListener("click",()=>advance(Number(b.dataset.days))));
 $("resetBtn").addEventListener("click",()=>{if(confirm("Weet je zeker dat je alle oefengegevens wilt wissen en opnieuw wilt beginnen?")){localStorage.removeItem(STORAGE);state=load();renderAll();showToast("Oefenaccount gereset") }});
 window.addEventListener("resize",drawChart);renderAll();
 setInterval(()=>{tick++;renderStats();renderCoins();selectCoin(selected);renderHoldings();renderGoals();drawChart()},8000);
}
init();
})();