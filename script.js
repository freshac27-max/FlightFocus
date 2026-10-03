const AIRPORTS = [
["YYZ","Toronto",43.68,-79.63],["YUL","Montreal",45.47,-73.74],["YOW","Ottawa",45.32,-75.67],["YQB","Quebec City",46.79,-71.39],
["YHZ","Halifax",44.88,-63.51],["YYT","St. John's",47.62,-52.75],["YWG","Winnipeg",49.91,-97.24],["YYC","Calgary",51.13,-114.01],
["YVR","Vancouver",49.19,-123.18],["YQT","Thunder Bay",48.37,-89.32],["YSB","Sudbury",46.63,-80.8],["BUF","Buffalo",42.94,-78.73],
["CLE","Cleveland",41.41,-81.85],["PIT","Pittsburgh",40.49,-80.23],["DTW","Detroit",42.21,-83.35],["CMH","Columbus",40.0,-82.89],
["JFK","New York",40.64,-73.78],["BOS","Boston",42.36,-71.01],["PHL","Philadelphia",39.87,-75.24],["DCA","Washington",38.85,-77.04],
["ORD","Chicago",41.98,-87.9],["MSP","Minneapolis",44.88,-93.22],["CLT","Charlotte",35.21,-80.94],["ATL","Atlanta",33.64,-84.43],
["MCO","Orlando",28.43,-81.31],["MIA","Miami",25.79,-80.29],["DFW","Dallas",32.9,-97.04],["DEN","Denver",39.86,-104.67],
["SEA","Seattle",47.45,-122.31],["SFO","San Francisco",37.62,-122.38],["LAX","Los Angeles",33.94,-118.41],["HNL","Honolulu",21.32,-157.92],
["ANC","Anchorage",61.17,-149.99],["CUN","Cancún",21.04,-86.87],["MEX","Mexico City",19.44,-99.07],["BOG","Bogotá",4.7,-74.14],
["LIM","Lima",-12.02,-77.11],["GRU","São Paulo",-23.43,-46.47],["EZE","Buenos Aires",-34.82,-58.54],["KEF","Reykjavík",63.98,-22.61],
["DUB","Dublin",53.42,-6.27],["EDI","Edinburgh",55.95,-3.36],["LHR","London",51.47,-0.45],["AMS","Amsterdam",52.31,4.76],
["CDG","Paris",49.01,2.55],["FRA","Frankfurt",50.03,8.56],["MUC","Munich",48.35,11.79],["ZRH","Zurich",47.46,8.55],
["CPH","Copenhagen",55.62,12.65],["PRG","Prague",50.1,14.26],["VIE","Vienna",48.11,16.57],["MAD","Madrid",40.47,-3.56],
["BCN","Barcelona",41.3,2.08],["LIS","Lisbon",38.77,-9.13],["FCO","Rome",41.8,12.25],["ATH","Athens",37.94,23.94],
["IST","Istanbul",41.26,28.74],["CAI","Cairo",30.12,31.41],["DOH","Doha",25.27,51.61],["DXB","Dubai",25.25,55.36],
["NBO","Nairobi",-1.32,36.93],["JNB","Johannesburg",-26.14,28.24],["DEL","Delhi",28.57,77.1],["BOM","Mumbai",19.09,72.87],
["BKK","Bangkok",13.69,100.75],["SIN","Singapore",1.36,103.99],["HKG","Hong Kong",22.31,113.91],["MNL","Manila",14.51,121.02],
["PEK","Beijing",40.08,116.58],["ICN","Seoul",37.46,126.44],["HND","Tokyo",35.55,139.78],["SYD","Sydney",-33.94,151.18],
["AKL","Auckland",-37.01,174.79]
];
const HUBS = ["YYZ","YUL","YVR","JFK","ORD","LAX","LHR","CDG","DXB","HND","SIN","SYD","GRU"];
const AP = Object.fromEntries(AIRPORTS.map(a=>[a[0],{code:a[0],city:a[1],lat:a[2],lon:a[3]}]));
const PRESETS = [25,45,60,90,120,180];
const $ = id => document.getElementById(id);

/* storage helpers */
const store = {
  get(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};

/* geo */
const R2D=180/Math.PI, D2R=Math.PI/180;
function distKm(a,b){
  const dLat=(b.lat-a.lat)*D2R, dLon=(b.lon-a.lon)*D2R;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*D2R)*Math.cos(b.lat*D2R)*Math.sin(dLon/2)**2;
  return 2*6371*Math.asin(Math.sqrt(h));
}
const estMin = km => Math.round(25 + km/14); // taxi/climb overhead + ~840 km/h cruise
function gcRoute(a,b,n=160){
  const p1=a.lat*D2R,l1=a.lon*D2R,p2=b.lat*D2R,l2=b.lon*D2R;
  const d=distKm(a,b)/6371, pts=[];
  for(let i=0;i<=n;i++){
    const f=i/n;
    if(d<1e-6){pts.push([a.lat,a.lon]);continue}
    const A=Math.sin((1-f)*d)/Math.sin(d), B=Math.sin(f*d)/Math.sin(d);
    const x=A*Math.cos(p1)*Math.cos(l1)+B*Math.cos(p2)*Math.cos(l2);
    const y=A*Math.cos(p1)*Math.sin(l1)+B*Math.cos(p2)*Math.sin(l2);
    const z=A*Math.sin(p1)+B*Math.sin(p2);
    let lat=Math.atan2(z,Math.hypot(x,y))*R2D, lon=Math.atan2(y,x)*R2D;
    if(pts.length){const pl=pts[pts.length-1][1]; while(lon-pl>180)lon-=360; while(lon-pl<-180)lon+=360;}
    pts.push([lat,lon]);
  }
  return pts;
}

/* formatting */
function clock(ms){
  const s=Math.max(0,Math.ceil(ms/1000)), h=Math.floor(s/3600), m=Math.floor(s%3600/60), sec=s%60;
  return h?`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function words(min){
  min=Math.round(min); const h=Math.floor(min/60), m=min%60;
  return h?(m?`${h}h ${m}m`:`${h}h`):`${m}m`;
}
const km = n => `${Math.round(n).toLocaleString()} km`;

/* ---------- setup state ---------- */
let focusMin = 60, originCode = store.get("ff-origin","YYZ"), choices=[], chosen=0, ticket=newTicket();
function newTicket(){
  const r=n=>Math.floor(Math.random()*n);
  return {flight:`FF ${100+r(900)}`, gate:"ABCDE"[r(5)]+(1+r(40)), seat:(3+r(30))+"ACDF"[r(4)]};
}

function renderChips(){
  $("chips").innerHTML = PRESETS.map(m=>`<button class="chip" data-m="${m}" aria-pressed="${m===focusMin}">${words(m)}</button>`).join("");
}
$("chips").addEventListener("click",e=>{
  const b=e.target.closest(".chip"); if(!b)return;
  focusMin=+b.dataset.m; $("cH").value=Math.floor(focusMin/60); $("cM").value=focusMin%60;
  chosen=0; renderChips(); renderOptions();
});
function onCustom(){
  const h=Math.min(20,Math.max(0,+$("cH").value||0)), m=Math.min(59,Math.max(0,+$("cM").value||0));
  focusMin=Math.max(1,h*60+m); chosen=0; renderChips(); renderOptions();
}
$("cH").addEventListener("input",onCustom); $("cM").addEventListener("input",onCustom);

$("origin").innerHTML = HUBS.map(c=>`<option value="${c}">${AP[c].city} (${c})</option>`).join("");
$("origin").value = HUBS.includes(originCode)?originCode:"YYZ";
$("origin").addEventListener("change",e=>{originCode=e.target.value;store.set("ff-origin",originCode);chosen=0;renderOptions()});

function renderOptions(){
  const o=AP[originCode];
  choices = AIRPORTS.filter(a=>a[0]!==originCode).map(a=>{
    const d=AP[a[0]], k=distKm(o,d); return {d,k,est:estMin(k)};
  }).sort((x,y)=>Math.abs(x.est-focusMin)-Math.abs(y.est-focusMin)).slice(0,4);
  $("options").innerHTML = choices.map((c,i)=>`
    <button class="opt" role="radio" aria-checked="${i===chosen}" data-i="${i}">
      <span class="code">${c.d.code}</span>
      <span><span class="city">${c.d.city}</span><br><span class="meta">${km(c.k)}</span></span>
      <span class="est">${words(c.est)}<br><span class="meta">real flight</span></span>
    </button>`).join("");
  renderPass();
}
$("options").addEventListener("click",e=>{
  const b=e.target.closest(".opt"); if(!b)return; chosen=+b.dataset.i; renderOptions();
});
function renderPass(){
  const o=AP[originCode], c=choices[chosen];
  $("pFlight").textContent=`Flight ${ticket.flight}`;
  $("pFrom").textContent=o.code; $("pFromCity").textContent=o.city;
  $("pTo").textContent=c.d.code; $("pToCity").textContent=c.d.city;
  $("pTime").textContent=words(focusMin); $("pDist").textContent=Math.round(c.k).toLocaleString();
  $("pGate").textContent=ticket.gate; $("pSeat").textContent=ticket.seat;
}

/* ---------- flight ---------- */
let active=null, route=null, proj=null, raf=0, audioCtx=null;
const NS="http://www.w3.org/2000/svg";
const PLANE="M14 0 L4 -2 L-2 -12 L-6 -12 L-3 -2 L-10 -1.6 L-13 -6 L-15.5 -6 L-13.5 0 L-15.5 6 L-13 6 L-10 1.6 L-3 2 L-6 12 L-2 12 L4 2 Z";
const W=1000,H=520;

function buildMap(){
  const o=AP[active.from], d=AP[active.to];
  route=gcRoute(o,d);
  let minLat=90,maxLat=-90,minLon=1e9,maxLon=-1e9;
  route.forEach(([la,lo])=>{minLat=Math.min(minLat,la);maxLat=Math.max(maxLat,la);minLon=Math.min(minLon,lo);maxLon=Math.max(maxLon,lo)});
  const midLat=(minLat+maxLat)/2, midLon=(minLon+maxLon)/2;
  const k=Math.max(.25,Math.cos(midLat*D2R));
  const spanLon=Math.max(maxLon-minLon,3)*1.35, spanLat=Math.max(maxLat-minLat,2)*1.6;
  const s=Math.min(W/(spanLon*k), H/spanLat);
  const P=(la,lo)=>[W/2+(lo-midLon)*k*s, H/2-(la-midLat)*s];
  const visLon=W/2/(k*s), visLat=H/2/s;
  proj={P};

  const span=Math.max(visLon,visLat)*2, step=span>80?20:span>30?10:span>12?5:span>5?2:1;
  let g="";
  for(let lo=Math.ceil((midLon-visLon)/step)*step; lo<=midLon+visLon; lo+=step){const [x]=P(0,lo);g+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`}
  for(let la=Math.ceil((midLat-visLat)/step)*step; la<=midLat+visLat; la+=step){const [,y]=P(la,0);g+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`}

  let dots="";
  AIRPORTS.forEach(a=>{
    if(a[0]===o.code||a[0]===d.code)return;
    let lo=a[3]; lo+=360*Math.round((midLon-lo)/360);
    if(Math.abs(lo-midLon)>visLon*.95||Math.abs(a[2]-midLat)>visLat*.92)return;
    const [x,y]=P(a[2],lo);
    dots+=`<circle cx="${x}" cy="${y}" r="3" fill="var(--route)"/><text x="${x+7}" y="${y+4}" font-size="13" fill="var(--muted)">${a[1]}</text>`;
  });

  const pts=route.map(([la,lo])=>P(la,lo).map(n=>n.toFixed(1)).join(",")).join(" ");
  const [ox,oy]=P(route[0][0],route[0][1]), [dx,dy]=P(route.at(-1)[0],route.at(-1)[1]);
  const lbl=(x,y,code,city,anchorRight)=>{
    const ax=anchorRight?x-12:x+12, ta=anchorRight?"end":"start";
    return `<circle cx="${x}" cy="${y}" r="7" fill="var(--map)" stroke="var(--ink)" stroke-width="3"/>
      <text x="${ax}" y="${y-12}" text-anchor="${ta}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="26" fill="var(--ink)">${code}</text>
      <text x="${ax}" y="${y+22}" text-anchor="${ta}" font-size="14" fill="var(--muted)">${city}</text>`;
  };
  const oRight = ox>dx;
  $("map").innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Flight path from ${o.city} to ${d.city}">
    <g stroke="var(--grat)" stroke-width="1">${g}</g>
    ${dots}
    <polyline points="${pts}" fill="none" stroke="var(--route)" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round"/>
    <polyline id="flown" points="" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${lbl(ox,oy,o.code,o.city,oRight)}${lbl(dx,dy,d.code,d.city,!oRight)}
    <g id="shadow" opacity=".22"><path d="${PLANE}" fill="var(--ink)" transform="scale(1.6)"/></g>
    <g id="plane"><path d="${PLANE}" fill="var(--accent)" stroke="var(--map)" stroke-width="1.2" stroke-linejoin="round" transform="scale(1.6)"/></g>
  </svg>`;
  $("profile").innerHTML=`<path d="M0 64 C40 64 50 12 90 12 L890 12 C940 12 950 64 1000 64" fill="none" stroke="var(--line)" stroke-width="3" vector-effect="non-scaling-stroke"/>
    <path id="profFlown" d="" fill="none" stroke="var(--accent)" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
  $("fRoute").innerHTML=`${o.code} → ${d.code} <small>${o.city} to ${d.city}</small>`;
}

function altFrac(p){
  const e=t=>1-(1-t)*(1-t);
  if(p<=0||p>=1)return 0; if(p<.08)return e(p/.08); if(p>.9)return e((1-p)/.1); return 1;
}
function routeAt(p){
  const f=Math.min(1,Math.max(0,p))*(route.length-1), i=Math.min(route.length-2,Math.floor(f)), t=f-i;
  const a=proj.P(...route[i]), b=proj.P(...route[i+1]);
  return {x:a[0]+(b[0]-a[0])*t, y:a[1]+(b[1]-a[1])*t, i, ang:Math.atan2(b[1]-a[1],b[0]-a[0])*R2D};
}
function elapsed(){
  const now=active.pausedAt||Date.now();
  return Math.min(active.durMs, now-active.start-active.pausedTotal);
}
function phaseName(p){
  if(active.pausedAt)return "Holding pattern (paused)";
  if(p<.08)return "Climbing"; if(p<.9)return "Cruising"; return "Descending";
}

function tick(){
  if(!active)return;
  const el=elapsed(), p=el/active.durMs;
  if(p>=1){land(false);return}
  const pos=routeAt(p), alt=altFrac(p);
  const pts=[];
  for(let j=0;j<=pos.i;j++)pts.push(proj.P(...route[j]).map(n=>n.toFixed(1)).join(","));
  pts.push(`${pos.x.toFixed(1)},${pos.y.toFixed(1)}`);
  $("flown").setAttribute("points",pts.join(" "));
  const sc=.85+alt*.35, off=4+alt*14;
  $("plane").setAttribute("transform",`translate(${pos.x},${pos.y}) rotate(${pos.ang}) scale(${sc})`);
  $("shadow").setAttribute("transform",`translate(${pos.x+off},${pos.y+off}) rotate(${pos.ang}) scale(${sc*.9})`);

  const remain=active.durMs-el;
  $("fRemain").textContent=clock(remain);
  $("fElapsed").textContent=clock(el);
  $("fAlt").textContent=`${(Math.round(alt*37000/100)*100).toLocaleString()} ft`;
  $("fLeft").textContent=km(active.km*(1-p));
  const ph=$("fPhase"); ph.textContent=phaseName(p); ph.classList.toggle("paused",!!active.pausedAt);
  // altitude profile progress
  const x=p*1000, y=64-alt*52;
  $("profFlown").setAttribute("d",p<.09?`M0 64 L${x} ${y}`:p<=.9?`M0 64 C40 64 50 12 90 12 L${x} 12`:`M0 64 C40 64 50 12 90 12 L890 12 L${x} ${y}`);
  document.title=`${clock(remain)} to ${active.to} | FlightFocus`;
  if(!active.pausedAt)raf=requestAnimationFrame(tick);
}
setInterval(()=>{if(active&&!active.pausedAt&&document.hidden)tick()},1000);
document.addEventListener("visibilitychange",()=>{if(active&&!document.hidden){cancelAnimationFrame(raf);tick()}});

function show(id){["setup","flight","landed"].forEach(s=>$(s).hidden=s!==id);window.scrollTo(0,0)}

$("takeoff").addEventListener("click",()=>{
  try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
  const c=choices[chosen];
  active={from:originCode,to:c.d.code,km:c.k,durMs:focusMin*60000,start:Date.now(),pausedAt:0,pausedTotal:0,flight:ticket.flight};
  store.set("ff-active",active);
  startFlight();
});
function startFlight(){
  buildMap(); show("flight"); $("pauseBtn").textContent=active.pausedAt?"Resume":"Pause";
  cancelAnimationFrame(raf); tick();
}
$("pauseBtn").addEventListener("click",()=>{
  if(active.pausedAt){active.pausedTotal+=Date.now()-active.pausedAt;active.pausedAt=0;$("pauseBtn").textContent="Pause"}
  else{active.pausedAt=Date.now();$("pauseBtn").textContent="Resume"}
  store.set("ff-active",active); cancelAnimationFrame(raf); tick();
});
function setEndConfirm(open){
  $("endConfirm").hidden=!open; $("flightControls").hidden=open;
  if(open)$("keepFlying").focus();
}
$("endBtn").addEventListener("click",()=>setEndConfirm(true));
$("keepFlying").addEventListener("click",()=>{setEndConfirm(false);$("endBtn").focus()});
$("endYes").addEventListener("click",()=>{setEndConfirm(false);if(active)land(true)});

function chime(){
  if(!audioCtx)return;
  try{
    audioCtx.resume();
    [[880,0],[660,.45]].forEach(([f,t])=>{
      const o=audioCtx.createOscillator(), g=audioCtx.createGain(), at=audioCtx.currentTime+t;
      o.type="sine"; o.frequency.value=f; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.3,at+.02); g.gain.exponentialRampToValueAtTime(.001,at+1.6);
      o.start(at); o.stop(at+1.7);
    });
  }catch(e){}
}

function land(diverted){
  cancelAnimationFrame(raf);
  const el=elapsed(), frac=el/active.durMs, d=AP[active.to];
  const entry={from:active.from,to:active.to,city:d.city,min:el/60000,km:active.km*Math.min(1,frac),date:Date.now(),status:diverted?"Diverted":"Landed"};
  const log=store.get("ff-log",[]); log.unshift(entry); store.set("ff-log",log.slice(0,200));
  store.del("ff-active");
  if(diverted){
    $("lTitle").textContent="Flight diverted";
    $("lText").textContent=`You ended your flight to ${d.city} early. That still counts: every minute of focus goes in the logbook.`;
  }else{
    chime();
    $("lTitle").textContent=`Welcome to ${d.city}`;
    $("lText").textContent=`Flight ${active.flight} from ${AP[active.from].city} has landed. Stretch, grab some water, then book your next one.`;
  }
  $("lTime").textContent=words(entry.min); $("lDist").textContent=km(entry.km); $("lCount").textContent=log.length;
  document.title="Landed | FlightFocus";
  active=null; show("landed");
}
$("again").addEventListener("click",()=>{ticket=newTicket();renderOptions();show("setup");document.title="FlightFocus"});

/* logbook */
function renderLog(){
  const log=store.get("ff-log",[]);
  $("tFlights").textContent=log.length;
  $("tTime").textContent=words(log.reduce((s,e)=>s+e.min,0));
  $("tDist").textContent=km(log.reduce((s,e)=>s+e.km,0));
  $("logList").innerHTML = log.length ? log.slice(0,30).map(e=>`<li>
      <span><b>${e.from} → ${e.to}</b><br><span class="muted">${new Date(e.date).toLocaleDateString(undefined,{month:"short",day:"numeric"})}, ${e.status.toLowerCase()} in ${e.city}</span></span>
      <span style="text-align:right"><b>${words(e.min)}</b><br><span class="muted">${km(e.km)}</span></span></li>`).join("")
    : `<li><span class="muted">No flights yet. Pick a focus time and take off to log your first one.</span></li>`;
}
$("openLog").addEventListener("click",()=>{renderLog();$("logDlg").showModal()});
$("closeLog").addEventListener("click",()=>$("logDlg").close());
let clearArmed=false;
function resetClear(){clearArmed=false;$("clearLog").textContent="Clear logbook"}
$("clearLog").addEventListener("click",()=>{
  if(!clearArmed){clearArmed=true;$("clearLog").textContent="Tap again to clear all";return}
  store.del("ff-log");resetClear();renderLog();
});
$("logDlg").addEventListener("close",resetClear);

/* init */
renderChips(); renderOptions();
const saved=store.get("ff-active",null);
if(saved&&AP[saved.from]&&AP[saved.to]){active=saved;startFlight()}