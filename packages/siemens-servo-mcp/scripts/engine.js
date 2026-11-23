/* 引擎：摘自「西门子伺服电机在线选型工具」网页版的主内联脚本（选型 / 驱动器 / 电缆 / 订货号 / 取价逻辑原样复用，
   仅剥离访问口令门，并对内部采购记录的客户名、来源文件名做脱敏）。由 选型工具/共享/build_skill_pkg.py 自动生成，
   请勿手改——机型库更新后重跑该脚本即可。 */

/*
*/
const GATE={enabled:false}; let GATE_OK=true;
function gateKey(){return "";} function gateUnlocked(){return true;}
function gateApply(){} function gateFill(){} function gateTry(){} function gateLock(){}

/**/
const $=id=>document.getElementById(id);
const fnum=v=>(v==null||v==='')?'—':v;
function ln(a,b){return Math.abs(Math.log(a/b));}
/*
*/
function overloadOf(m){
  if(typeof m.overload==='number'&&m.overload>1)return m.overload;
  if(typeof m.mn==='number'&&typeof m.mmax==='number'&&m.mn)return Math.round(m.mmax/m.mn*10)/10;
  return null;
}
function overloadTxt(m){
  if(typeof m.overload==='number'&&m.overload>1)
    return fnum(m.overload,1)+' × MN（样本标称）';
  const o=overloadOf(m);
  return o?fnum(o,1)+' × MN（按 Mmax/MN 折算）':'—';
}
/*
*/
function nmaxEff(m){
  const a=m.nmax,b=m.nmax_inv;
  if(a!=null&&b!=null)return Math.min(a,b);
  return b!=null?b:a;
}
function nmaxTxt(m){
  const e=nmaxEff(m);
  if(e==null)return '—';
  if(m.nmax_mech!=null&&m.nmax_inv!=null){
    return m.nmax_inv<m.nmax_mech
      ? fnum(e)+' rpm（受变频器限制；机械极限 '+fnum(m.nmax_mech)+' rpm）'
      : fnum(e)+' rpm（机械极限；变频器可到 '+fnum(m.nmax_inv)+' rpm）';
  }
  return fnum(e)+' rpm';
}
/*




*/
function srcTxt(m){
  if(m.verified==='official')
    return '<span class="pill g">官方数据表 · 已逐项核对</span> <span class="srcn">每个参数都与西门子商城官方数据表逐项对过，可直接下单'
      +(m.verified_doc?('<br>'+m.verified_doc):'')+'</span>';
  if(m.verified==='official-base')
    return '<span class="pill b">同基型号官方表 · 主参数已核对</span> <span class="srcn">功率/扭矩/转速等主参数已核对；'
      +'编码器、抱闸、防护按本型号自己的订货码确定</span>';
  if(m.verified==='official-sample')
    return '<span class="pill b">西门子官方样本</span> <span class="srcn">参数取自西门子官方样本/手册（非二手资料），主参数可靠；'
      +'个别选件细节数据表未列，下单前西门子渠道可再确认</span>';
  return '<span class="pill a">第三方资料 · 待核对</span> <span class="srcn">'
    +'来自维修商网站 / 报价单等二手资料，尚未与西门子官方数据表逐项对照 —— 下单前请人工复核</span>';
}
/**/
const SRCLEGEND='<b>「参数来源」是什么？</b>本机型的额定功率、扭矩、转速、电流、编码器等数字是从哪儿来的，'
  +'以及有没有跟西门子官方资料逐条核对过：<span class="pill g">官方数据表 · 已逐项核对</span>＝每个参数都与西门子商城官方数据表对过，'
  +'可直接下单；<span class="pill b">同基型号官方表 · 主参数已核对</span>＝主参数用同基型号官方表核对过，'
  +'编码器/抱闸/防护按本型号订货码确定；<span class="pill b">西门子官方样本</span>＝参数取自西门子官方样本/手册，主参数可靠；'
  +'<span class="pill a">第三方资料 · 待核对</span>＝来自维修商网站或报价单等二手资料，下单前请人工复核。';

const SYSNAME={V90:'V90 + 1FL6',S200:'S200 + 1FL2',S210:'S210 + 1FK2',S120:'S120 + 1FK7/1FT7'};
/*
*/
const PRICE_KEYS=(typeof PRICES!=='undefined'&&PRICES)?Object.keys(PRICES):[];   /**/
/*



*/
const PURCH=(function(){try{return (DATA&&DATA.purchased&&DATA.purchased.items)||{};}catch(e){return {};}})();
/**/
const PURMETA=(function(){
  try{
    const m=(DATA.purchased&&DATA.purchased.meta)||{}, c=m.by_cat_orders||{};
    if(!m.unique_orders)return '';
    return '（采购记录库现收录 <b>'+m.unique_orders+'</b> 个实际采购/报价过的订货号：电机 '+m.motor_bases
      +' 个基本型号、驱动器 '+(c.drive||0)+'、电缆 '+(c.cable||0)+'）';
  }catch(e){return '';}
})();
function purchOf(key){
  if(!key)return null;
  return PURCH[String(key).toUpperCase()]||null;
}
/**/
function purchInfo(m){return purchOf(m&&(m.base||m.model))||purchOf(m&&m.model)||null;}
/**/
function purchOfCable(no){
  const p=purchOfNo(no);
  if(p)return p;
  const segs=String(no||'').split('-');
  return segs.length>=2?purchOf(String(segs[0]+'-'+segs[1]).toUpperCase()):null;
}
/**/
function purchOfNo(no){
  if(!no)return null;
  const k=String(no).toUpperCase().replace(/[（(].*$/,'').trim().replace(/-+$/,'');
  if(purchOf(k))return purchOf(k);
  const m=k.match(/(?:1F[KLTP]\d{4}|6SL\d{4}|6FX\d{4}|6EP\d{4}|6ES\d{4}|6GK\d{4}|6AV\d{4})[0-9A-Z\-]*/);
  return m?purchOf(m[0]):null;
}
/**/
function purchTip(p){
  if(!p)return '';
  const L=p.last||{};
  let t='采购记录库实际采购/报价过 '+p.n+' 次';
  if(p.qty&&p.qty>1)t+='，累计 '+p.qty+' 件';
  if(L.p!=null)t+='；最近 '+cur(L.p)+(L.date?('（'+L.date+(L.cust?'，'+L.cust:'')+'）'):'');
  if(p.lo!=null&&p.hi!=null&&p.lo!==p.hi)t+='；价格区间 '+cur(p.lo)+'–'+money(p.hi);
  if(L.src)t+='｜来源：'+L.src;
  return t.replace(/"/g,'');
}
/**/
function buyPill(p){
  /**/
  return p?('<span class="pill g" title="'+purchTip(p)+'">✓ 已购 · 优先推荐</span>'):'';
}
/**/
function prioRank(m){return purchInfo(m)?0:1;}
/*









*/
const PN_SWITCH=7;                    /**/
function demandKW(q){
  /*

*/
  try{
    if(q&&q.pn&&q.pn.has){
      const v=(q.pn.hi!=null?q.pn.hi:(q.pn.mid!=null?q.pn.mid:q.pn.lo));
      if(v!=null)return v;
    }
    const t=(q&&q.tq&&q.tq.has)?(q.tq.hi!=null?q.tq.hi:(q.tq.mid!=null?q.tq.mid:q.tq.lo)):null;
    const n=(q&&q.nn&&q.nn.has)?(q.nn.mid!=null?q.nn.mid:(q.nn.hi!=null?q.nn.hi:q.nn.lo)):null;
    if(t!=null&&n!=null)return t*n*Math.PI/30/1000;   /* P(W)=T·ω=T·2πn/60=T·πn/30 */
  }catch(e){}
  return null;
}
/**/
function seriesRank(m,big){
  const md=m.model||'';
  if(/^1PH/.test(md))return 4;        /**/
  if(big)return (m.system==='S120')?3:9;   /**/
  if(m.system==='S200')return 0;      /* ① S200 + 1FL2 */
  if(m.system==='V90')return 1;       /* ② V90 + 1FL6 */
  if(m.system==='S210')return 2;      /* ③ S210 + 1FK2 */
  return 3;                           /**/
}
const SERIES_ORDER_TXT_SMALL='S200 → V90 → S210 → 1FK7 / 1FT7 → 1PH8';
const SERIES_ORDER_TXT_BIG='1FK7 / 1FT7 → 1PH8';
function seriesOrderTxt(big){return big?SERIES_ORDER_TXT_BIG:SERIES_ORDER_TXT_SMALL;}
const SERIES_ORDER_TXT=SERIES_ORDER_TXT_SMALL;   /**/
/*





*/
function candSort(a,b){
  if(a._fit!==b._fit)return a._fit-b._fit;
  if(!a._fit)return (a._sr-b._sr)||(a._pur-b._pur)||(a._s-b._s);   /**/
  return (a._sr-b._sr)||(a._s-b._s)||(a._pur-b._pur);              /**/
}
/*
*/
function preferBought(fit){
  for(let i=0;i<Math.min(2,fit.length);i++){
    const no=fit[i].pn_no||fit[i].order||fit[i].order_no;
    if(no&&purchOf(no))return fit[i];
  }
  return null;
}
function baseBought(m){return !!purchInfo(m);}

/**/
const ENCKW={rel:['增量','TTL','sin/cos','2500'],mt_abs:['多圈'],bat_abs:['电池'],resolver:['旋变']};
function encMatch(m,enc){
  if(enc==='any')return{ok:true,exact:true,note:''};
  const kws=ENCKW[enc];
  let exact=false;
  for(const e of (m.encoders||[])){
    for(const k of kws){ if(e.indexOf(k)>=0) exact=true; }
  }
  if(exact)return{ok:true,exact:true,note:''};
  if(enc==='bat_abs'){
    //
    if(m.system==='S200')return{ok:true,exact:false,note:'1FL2 为机械绝对值编码器（免电池），可满足绝对值需求；严格电池方案选 S200C。'};
    if(m.system==='V90')return{ok:true,exact:false,note:'1FL6 提供 20位+12位多圈绝对值（机械式，免电池）。'};
    if(m.system==='S210')return{ok:true,exact:false,note:'1FK2 的 AM22DQC 为机械式多圈绝对值（22 位+12 位，免电池），可满足绝对值需求。'};
  }
  if(enc==='resolver'){
    return{ok:true,exact:false,note:'该系列样本内无旋变选项，推荐 24 位绝对值编码器（精度与可靠性更优）替代。'};
  }
  if(enc==='rel'){
    if((m.encoders||[]).some(e=>e.indexOf('绝对')>=0))return{ok:true,exact:false,note:'该系列以绝对值编码器为主，兼容增量需求时请按订货后缀选择。'};
  }
  if(enc==='mt_abs'){
    if((m.encoders||[]).some(e=>e.indexOf('绝对')>=0))return{ok:true,exact:false,note:'该系列提供单圈绝对值，多圈版本见相邻档位或订货后缀 M/L。'};
  }
  return{ok:true,exact:false,note:'编码器不完全匹配，请核对。'};
}

function shaftMatch(m,shaft){
  if(shaft==='any')return true;
  if(shaft==='key')return (m.shaft||[]).some(s=>s.indexOf('键')>=0);
  return (m.shaft||[]).some(s=>s==='光轴');
}

/**/
function collect(){
  const R=(a,b)=>{const lo=parseFloat(a),hi=parseFloat(b);
    return{lo:isNaN(lo)?null:lo,hi:isNaN(hi)?null:hi,
      has:!(isNaN(lo)&&isNaN(hi)),mid:(isNaN(lo)||isNaN(hi))?null:(lo+hi)/2};};
  const pick=(id,def)=>{const v=$(id).value;return v||def;};
  return{sys:pick('sys','auto'),pn:R($('pnMin').value,$('pnMax').value),
    tq:R($('tqMin').value,$('tqMax').value),nn:R($('nnMin').value,$('nnMax').value),
    nx:R($('nxMin').value,$('nxMax').value),brake:pick('brake','any'),enc:pick('enc','any'),
    shaft:pick('shaft','any'),env:pick('env','any'),volt:pick('volt','any'),ctrl:pick('ctrl','any'),
    clen:pick('clen','10'),axes:pick('axes','single')};
}

function sysOK(m,q){
  if(q.axes==='multi')return m.system==='S120';
  if(q.sys==='auto')return true;
  if(q.sys==='V90')return m.system==='V90';
  if(q.sys==='S120')return m.system==='S120';
  if(q.sys==='S210')return m.system==='S210';
  /*
*/
  if(q.sys==='S200CC')return m.family==='1FL1';
  if(m.system!=='S200')return false;
  if(m.family==='1FL1')return false;
  if(q.sys==='S200')return true;
  if(q.sys==='S200C')return m.pn<=0.75;
  if(q.sys==='S200B')return m.pn<=1.0;
  return true;
}

function score(m,q){
  let s=0;
  if(q.tq.has&&q.tq.mid!=null)s+=0.5*ln(m.mn,q.tq.mid);
  else if(q.tq.has){ //
    if(q.tq.lo!=null&&m.mn>=q.tq.lo)s+=0;
    else if(q.tq.lo!=null)s+=0.5*ln(q.tq.lo,m.mn);
    if(q.tq.hi!=null&&m.mn<=q.tq.hi)s+=0;
    else if(q.tq.hi!=null)s+=0.5*ln(m.mn,q.tq.hi);
  }
  if(q.nn.has&&q.nn.mid!=null)s+=ln(m.nn,q.nn.mid);
  else if(q.nn.has){
    if(q.nn.lo!=null&&m.nn>=q.nn.lo)s+=0;else if(q.nn.lo!=null)s+=ln(q.nn.lo,m.nn);
    if(q.nn.hi!=null&&m.nn<=q.nn.hi)s+=0;else if(q.nn.hi!=null)s+=ln(m.nn,q.nn.hi);
  }
  if(q.nx.has){const nxeff=nmaxEff(m);
    const t=q.nx.mid!=null?q.nx.mid:(q.nx.lo!=null?q.nx.lo:nxeff);
    if(nxeff!=null&&nxeff<t)s+=0.4*ln(nxeff,t);}
  if(q.pn.has){
    if(q.pn.lo!=null&&m.pn<q.pn.lo)s+=0.5*ln(q.pn.lo,m.pn);
    if(q.pn.hi!=null&&m.pn>q.pn.hi)s+=0.5*ln(m.pn,q.pn.hi);
  }
  return s;
}
function inRange(v,r){if(!r.has)return true;if(r.lo!=null&&v<r.lo)return false;if(r.hi!=null&&v>r.hi)return false;return true;}

function run(){
  const q=collect();
  const notes=[];
  if(q.axes==='multi'){
    if(q.sys==='V90'||q.sys==='S200'||q.sys==='S200C'||q.sys==='S200B'||q.sys==='S210')notes.push('已自动切换为 S120 多轴方案（V90 / S200 / S210 均为单轴驱动器）。');
    if(q.ctrl==='pulse')notes.push('S120 多轴为总线控制（PN/DP），不支持脉冲控制——已按 PN 处理。');
  }
  if(q.sys==='S210'&&q.ctrl==='pulse')notes.push('S210 只有 PROFINET 总线版本，没有脉冲（PTI）版本——如需脉冲控制请选 V90 或 S200。');
  /**/
  const dkw=demandKW(q);
  const big=(dkw!=null)&&(dkw>PN_SWITCH);
  const em=[];
  let list=DATA.motors.filter(m=>{
    if(!sysOK(m,q))return false;
    if(q.brake==='yes'&&!(m.brake&&m.brake.avail))return false;
    if(q.brake==='no'){/**/ }
    if(q.volt!=='any'&&!(m.voltage||[]).includes(q.volt))return false;
    if(!shaftMatch(m,q.shaft))return false;
    if(q.ctrl==='pulse'&&m.system==='S120'&&q.axes==='single')return false; //
    if(q.ctrl==='pulse'&&m.system==='S210')return false;                   //
    if(q.pn.has&&!inRange(m.pn,q.pn))return false;
    const e=encMatch(m,q.enc); m._enc=e;
    if(!e.ok)return false;
    if(e.note&&!em.includes(e.note))em.push(e.note);
    return true;
  });
  list.forEach(m=>{m._s=score(m,q);
    if(q.brake==='no'&&m.brake&&m.brake.avail)m._s+=0.15;
    /**/
    m._pur=prioRank(m);
    /**/
    m._fit=(inRange(m.mn,q.tq)&&inRange(m.nn,q.nn))?0:1;
    /*




*/
    m._sr=(!m._fit||big)?seriesRank(m,big):0;
    m._quota=0;});   /**/
  list.sort(candSort);
  /**/
  const seenBase={},dedup=[];
  list.forEach(m=>{
    const k=m.system+'|'+(m.base||m.model);
    if(seenBase[k]){ (seenBase[k]._alt=seenBase[k]._alt||[]).push(m.order_no||m.model); return; }
    seenBase[k]=m; dedup.push(m);
  });
  if(dedup.length)dedup[0]._dupRemoved=list.length-dedup.length;
  let final=dedup.slice(0,5);
  /*






*/
  if(q.sys==='auto'&&q.axes!=='multi'&&!big){
    const sel=dedup.slice(0,5);
    const quota=[];
    ['S200','V90'].forEach(sys=>{
      if(sel.some(x=>x.system===sys))return;      //
      if(sel.length<5)return;                     //
      const fit=dedup.filter(x=>x.system===sys&&inRange(x.mn,q.tq)&&inRange(x.nn,q.nn));
      if(!fit.length)return;                      //
      const best=fit.slice().sort((a,b)=>(a._pur-b._pur)||(a._s-b._s))[0];
      sel[sel.length-1]=best;                     //
      if(quota.indexOf(best)<0)quota.push(best);
    });
    /**/
    sel.sort(candSort);
    final=sel;
    quota.forEach(m=>{m._quota=1;});
    if(quota.length)notes.push('未指定驱动系统：候选表按系列顺序（'+seriesOrderTxt(big)+'）排列；'
      +'表格里原本没有 '+quota.map(m=>SYSNAME[m.system]).join('、')+' 的合适型号，'
      +'已用该系列最合适的一台替换末行（标「跨系列名额」），便于跨系列比较参数与价格；'
      +'在「驱动系统」下拉里指定后只出该系列。');
  }
  /**/
  if(big&&dkw!=null)notes.push('需求功率约 '+Math.round(dkw*100)/100+' kW，超过 7 kW —— '
    +'S200 / V90（1FL2 / 1FL6 最大 7.0 kW）覆盖不到，候选表按 1FK7 / 1FT7 → 1PH8 排列（1PH8 最后）。');
  list=final;
  renderCands(list,q,big);
  const notesEl=[];
  if(notes.length)notesEl.push(notes.map(n=>'⚠ '+n).join('<br>'));
  if(list.length===0)notesEl.push('没有符合硬性条件的型号，请放宽系统/电压/编码器条件。');
  /**/
  if(list.length&&q.tq.has){
    const maxMn=Math.max(...list.map(m=>m.mn||0));
    const anyIn=list.some(m=>inRange(m.mn,q.tq));
    if(!anyIn){
      if(maxMn<q.tq.lo){
        notesEl.push('<div class="alert">⚠ <b>需求扭矩 '+q.tq.lo+'–'+(q.tq.hi||'')+' N·m 超出当前候选覆盖</b>：库内最接近的额定扭矩为 '+maxMn+' N·m。'+
          '70 N·m 以上需选 <b>SINAMICS S120 + 1FT7108（额定最高 95 N·m）/ 1FT7132（最高 126 N·m）/ 1FT7134（145 N·m）</b> 大机型——请确认电压为 380V、控制方式为 PN 总线（1FT7 仅支持 S120 总线控制，不支持脉冲）。'+
          '若脉冲控制是硬性要求，可考虑齿轮减速方案（用小电机+减速机放大扭矩）。</div>');
      }else{
        notesEl.push('<div class="alert">⚠ 需求扭矩 '+q.tq.lo+'–'+(q.tq.hi||'')+' N·m：以下候选均为最接近档位（标 ✗ 的不在范围内），请核对峰值扭矩与过载能力是否满足工况。</div>');
      }
    }
  }
  if(em.length)notesEl.push('编码器说明：'+em.join('；'));
  $('candsNote').innerHTML=notesEl.join('<br>');
}

/**/
function renderCands(list,q,big){
  if(!list.length){$('cands').innerHTML='<div id="empty">没有符合硬性条件的型号，请放宽条件。</div>';return;}
  let h='<table><tr><th>匹配度</th><th>系统</th><th>电机型号</th><th>额定扭矩<br>(N·m)</th><th>峰值扭矩<br>(N·m)</th><th>额定转速<br>(rpm)</th><th>最高转速<br>(rpm)</th><th>功率<br>(kW)</th><th>电机价格</th><th>惯量 J<br>(kg·cm²)</th><th>额定电流<br>(A)</th><th>抱闸</th><th>编码器</th><th>轴端</th><th>电压</th></tr>';
  const inT=v=>inRange(v,q.tq),inN=v=>inRange(v,q.nn);
  const TOL=0.10;   //
  list.forEach((m,i)=>{
    const pct=Math.max(5,Math.round(100*Math.exp(-m._s)));
    let tag;
    const r=q.tq;
    const over=(r.has&&r.hi!=null&&m.mn>r.hi)?(m.mn/r.hi-1):0;
    const under=(r.has&&r.lo!=null&&m.mn<r.lo)?(1-m.mn/r.lo):0;
    if(inT(m.mn))tag='<span class="pill g" title="额定扭矩（和额定转速）完全落在你输入的扭矩需求区间内，是匹配度最高的档位">✓ 匹配度</span>';
    else if(over>0&&over<=TOL)tag='<span class="pill a" title="额定扭矩比需求上限高 '+ (over*100).toFixed(1)+'%，但伺服电机有短时过载能力（一般 3 倍），轻度过高可降额使用">≈ 高 '+(over*100).toFixed(1)+'%<br>（可降额用）</span>';
    else if(under>0&&under<=TOL)tag='<span class="pill a" title="额定扭矩比需求下限低 '+(under*100).toFixed(1)+'%，差距很小，可通过加大负载裕量或换相邻档覆盖">≈ 低 '+(under*100).toFixed(1)+'%<br>（可放大用）</span>';
    else if(over>0)tag='<span class="pill r" title="额定扭矩明显高出需求上限 '+(over*100).toFixed(0)+'%，选它会偏大、成本浪费，除非无更合适档位否则不建议">✗ 高于需求<br>+'+(over*100).toFixed(0)+'%</span>';
    else if(under>0)tag='<span class="pill r" title="额定扭矩比需求下限低 '+(under*100).toFixed(0)+'%，带不动负载，不建议选">✗ 低于需求<br>−'+(under*100).toFixed(0)+'%</span>';
    else tag='<span class="pill a" title="扭矩不在需求范围内，但已是库里最接近的档位">≈ 邻近</span>';
    const enc=(m.encoders||[])[(m.encoders||[]).length-1];
    const alt=(m._alt&&m._alt.length)?'<br><span class="pill b" title="同基型号别名">+'+m._alt.length+' 变体</span>':'';
    /**/
    const variant=(m.dkey&&m.dkey!==m.model)?'<br><span class="pill a" title="'+m.base+'">'+m.inertia+' '+((m.voltage||[]).join('/'))+'V</span>':'';
    /**/
    const inc=(m.missing_fields&&m.missing_fields.length)
      ?('<br><span class="pill '+(m.incomplete_level==='severe'?'r':'a')+'" title="缺：'+m.missing_fields.join('、')+'">'
        +(m.incomplete_level==='severe'?'资料不全':'部分待补')+'</span>'):'';
    /**/
    const vsrc=(m.verified==='official')?''
      :(m.verified==='official-base'
        ?'<br><span class="pill b" title="主参数已用同基型号官方数据表核对；编码器/抱闸/防护按本型号订货码确定">主参数已核对</span>'
        :(m.verified==='official-sample'
        ?'<br><span class="pill b" title="参数取自西门子官方样本/手册，主参数可靠">官方样本</span>'
        :'<br><span class="pill a" title="参数来自维修商网站或报价单等二手资料，尚未与西门子官方数据表逐项核对；下单前请人工复核">⚠ 参数待核对</span>'));
    /*
*/
    const specTxt=(variant?'':((m.voltage||[]).map(v=>v+'V').join('/')
      +(m.inertia?(' · '+m.inertia):'')));
    const pur=purchInfo(m);
    const bought=' '+buyPill(pur);
    /*
*/
    const cross=(m._quota?'<br><span class="pill b" title="未指定驱动系统时，候选表 5 行被同一系列占满，本机作为另一系列的「完全合适」型号替换进末行，便于横向比较参数与价格；在「驱动系统」下拉指定后只出该系列">跨系列名额</span>':'');
    /*
*/
    let priceHTML='<span class="srcn" title="采购记录库无该电机的采购/报价记录，也没有同基本型号（'+(m.model||'')+'）的记录，请询价">未采购过</span>';
    if(pur&&pur.last&&pur.last.p!=null){
      priceHTML='<b style="white-space:nowrap" title="'+purchTip(pur)+'">'+cur(pur.last.p)
        +((pur.lo!=null&&pur.hi!=null&&pur.lo!==pur.hi)?('<span class="srcn">…'+cur(pur.hi)+'</span>'):'')+'</b>';
    }else{
      const rc=(function(){try{return baseRefPrice(m.base||m.model);}catch(e){return null;}})();
      if(rc&&rc.price!=null){
        priceHTML='<b style="white-space:nowrap" title="同基本型号参考价：来自 '+rc.refNo
          +'（与本机订货号不同，报价前请按本机型号核实）">'+cur(rc.price)
          +'</b><br><span class="srcn">参考 '+rc.refNo+'</span>';
      }
    }
    h+=`<tr class="cand" onclick="pick(${i})" id="cand${i}">
      <td class="score">${pct}%<br>${tag}</td>
      <td>${SYSNAME[m.system]}</td>
      <td><b>${m.model}</b>${variant}<br><span class="srcn">${specTxt}</span>${bought}${vsrc}${inc}${cross}${alt}</td>
      <td>${m.mn}</td><td>${fnum(m.mmax)}</td><td>${m.nn}</td><td>${fnum(nmaxEff(m))}</td>
      <td>${m.pn}</td>
      <td>${priceHTML}</td>
      <td>${m.J!=null?('<span class="dim-ico">'+m.J+'</span>'):'—'}</td>
      <td>${fnum(m.inn)}</td>
      <td>${m.brake&&m.brake.avail?'<span class="pill b">可选抱闸</span>':'无'}</td>
      <td style="max-width:150px">${enc}${m._enc&&!m._enc.exact?'<br><span class="pill a">替代方案</span>':''}</td>
      <td>${(m.shaft||[]).join('/')}</td>
      <td>${(m.voltage||[]).join('/')}V</td></tr>`;
  });
  h+='</table><div id="candsNote" style="margin-top:8px"></div>';
  /**/
  h+='<div class="note" style="display:none"><b>候选排序：</b>① <b>系列显示顺序</b>＝<b>'+seriesOrderTxt(big)+'</b>'
    +(big
      ?'（本次需求功率 &gt; 7 kW：S200 / V90 的 1FL2 / 1FL6 最大只有 7.0 kW，覆盖不到，'
        +'所以先显示 S120 的 1FK7 / 1FT7，1PH8 永远排最后）'
      :'（本次需求功率 ≤ 7 kW：先看 S200 / V90，选不出来才往 S120 的 1FK7 / 1FT7 走；1PH8 永远排最后）')
    +'——'
    +'这一步优先于「已购」标签；② <b>同一系列内</b>，<span class="pill g">✓ 已购 · 优先推荐</span>＝采购记录库历史采购/报价记录'
    +'里<b>实际采购/报价过</b>的型号往前排（悬停标签可看采购次数、最近成交价与价格区间），'
    +'<b>无「已购」标签</b>＝采购记录库里没有记录、按西门子样本推荐的型号；③ 再按第一列<b>匹配度</b>由高到低。'
    +'额定扭矩或额定转速明显不落在需求区间的型号（标 <span class="pill r">✗</span>）一律排在合适型号之后。'
    +'「电机价格」列口径：订货号完全相同→直接价；仅同基本型号（如 1FL6096-… 的其他选件段）有记录→标「参考 ××××」的参考价；两者都无→「未采购过」。'
    +PURMETA+'<br>'
    +'第一列「匹配度」：<b>百分比</b>＝综合额定扭矩、额定转速与你的需求的接近度（<b>100% 为正好命中</b>）；'
    +'<span class="pill g">✓ 匹配度</span>＝额定扭矩完全落在你输入的扭矩区间内，是匹配度最高的档位；'
    +'<span class="pill a">≈ 高/低 x%</span>＝略超出 ±10%（「高」靠电机短时过载可覆盖，「低」差距很小可放大使用）；'
    +'<span class="pill r">✗</span>＝明显超出需求区间，除非确认过载能力满足工况，否则不建议选。'
    +'鼠标悬停每个标签可看详细解释。<br>'
    +'型号下面一行小字是<b>电压 · 惯量级别</b>。参数核对状态：'
    +'<span class="pill g">官方数据表 · 已逐项核对</span>（无标签）每个参数都与西门子商城官方数据表对过，可直接下单；'
    +'<span class="pill b">主参数已核对 / 官方样本</span> 主参数已用官方表核对，或参数取自西门子官方样本；'
    +'<span class="pill a">⚠ 参数待核对</span> 参数来自维修商网站 / 报价单等二手资料，下单前请人工复核。</div>';
  $('cands').innerHTML=h;
  window._last=list;
}

/**/
function driveV90(m,q){
  const vs=(m.voltage||[])[0];
  const pool=DATA.drives.V90.filter(d=>d.volt===vs&&d.pn>=m.pn-1e-9);
  if(!pool.length)return null;
  /**/
  const d=preferBought(pool)||pool[0];
  return{frame:d.frame,pn:d.pn,volt:d.volt,order_pulse:d.pti,order_pn:d.pn_no};
}
function driveS200(m,q){
  const vs=(m.voltage||[])[0];
  /**/
  const grp=(m.family==='1FL1')?'S200CC':'S200';
  const pool=(DATA.drives[grp]||[]).filter(d=>d.volt===vs||d.volt===(vs==='220'?'220':'400V'));
  const fit=pool.filter(d=>d.pn>=m.pn-1e-9).sort((a,b)=>a.pn-b.pn);
  if(!fit.length)return null;
  const d=preferBought(fit)||fit[0];   /**/
  return{frame:d.frame,pn:d.pn,volt:vs,order_pulse:d.pti,order_pn:d.pn_no};
}
function driveS210(m,q){
  /*

*/
  const pool=(DATA.drives.S210||[]).filter(d=>d.volt===((m.voltage||[])[0]||'380'));
  const need=(m.imax!=null?m.imax:null);
  let pick=null;
  if(need!=null){
    const fit=pool.filter(d=>d.i_max>=need-1e-9).sort((a,b)=>a.i_max-b.i_max);
    pick=preferBought(fit)||fit[0]||null;   /**/
  }
  if(!pick)pick=pool.filter(d=>d.pn>=m.pn-1e-9).sort((a,b)=>a.pn-b.pn)[0]||null;
  if(!pick)return null;
  return{frame:pick.frame,pn:pick.pn,i_rated:pick.i_rated,i_max:pick.i_max,
    order:pick.order,legacy:pick.legacy,size:pick.size};
}
function pickCurrent(list,c){
  const ok=list.filter(x=>x.current_a>=c-1e-9);
  return ok.length?ok[0]:null;
}
function s120Bom(m,q){
  const s=DATA.s120;
  const axisN=q.axes==='multi'?Math.max(2,2):1;
  const bom=[];
  const needA=Math.max(m.inn||0,(m.imax||0));
  //
  if(q.axes==='multi'){
    const cu=s.control_units.find(c=>c.type==='CU320-2 PN');
    bom.push({item:'控制单元 CU320-2 PN（多轴）',no:cu.order_no,dim:cu.width_mm+'×'+cu.height_mm+'×'+cu.depth_mm+'mm / '+cu.weight_kg+'kg'});
    const cf=s.cf_cards[0];
    bom.push({item:'CF 卡（V5.2 SP3，参考工程案例实际用 6SL3054-0FC30-1BA0）',no:cf.order_no.replace('□','3')});
  }else{
    const cu=s.control_units.find(c=>c.type==='CU310-2 PN');
    bom.push({item:'控制单元 CU310-2 PN（单轴，参考案例同款）',no:cu.order_no,dim:cu.width_mm+'×'+cu.height_mm+'×'+cu.depth_mm+'mm / '+cu.weight_kg+'kg'});
    bom.push({item:'CF 卡',no:'6SL3054-0FC30-1BA0（V5.2 SP3）'});
  }
  const bop=s.accessories.find(a=>a.type.indexOf('BOP20')>=0);
  bom.push({item:'基本操作面板 BOP20',no:bop.order_no});
  bom.push({item:'24V 辅助电源 SITOP PSU200M（参考案例）',no:'6EP1333-3BA10'});
  //
  if(q.axes==='multi'){
    const total=m.pn*axisN*1.3;
    const lm=s.line_modules.booksize.filter(x=>x.type==='基本型电源模块'&&x.cooling==='内部风冷').sort((a,b)=>a.power_kw-b.power_kw);
    const lmv=s.line_modules.booksize.filter(x=>x.type==='回馈型电源模块'&&x.cooling==='内部风冷').sort((a,b)=>a.power_kw-b.power_kw);
    const basic=lm.find(x=>x.power_kw>=total),regen=lmv.find(x=>x.power_kw>=total);
    if(basic)bom.push({item:'电源模块（基本型，内部风冷，'+basic.power_kw+'kW）',no:basic.order_no,dim:sz(basic)});
    if(regen)bom.push({item:'替代：回馈型电源模块 '+regen.power_kw+'kW（能量可回馈电网）',no:regen.order_no});
  }
  //
  const mmPool=s.motor_modules.single_axis_booksize.filter(x=>x.cooling==='内部风冷');
  const mmFit=mmPool.filter(x=>x.current_a>=needA-1e-9);
  const mm=preferBought(mmFit)||pickCurrent(mmPool,needA);   /**/
  if(mm)bom.push({item:'电机模块（单轴书本型 '+mm.current_a+'A / '+mm.power_kw+'kW'+(axisN>1?'，共 '+axisN+' 台':'')+'）',no:mm.order_no,dim:sz(mm)});
  //
  bom.push({item:'制动电阻（参考案例：G120C 30–37kW 配套）',no:'JJY.023424020001（或按功率选制动模块 6SL3101-…）'});
  //
  bom.push({item:'编码器连接（DRIVE-CLiQ 直接连接电机编码器；外编码器时用 SMC20）',no:'SMC20: 6SL3055-0AA00-5AA2'});
  return bom;
}
function sz(x){return x.width_mm?(x.width_mm+'×'+x.height_mm+'×'+x.depth_mm+'mm / '+x.weight_kg+'kg'):'';}

/**/
/**/
/*




*/
const MC_TENS='ABCDEF', MC_ONES='ABCDEFGHJK';
function lenBlock(m){
  const n=parseInt(m,10);
  if(!isFinite(n)||n<1||n>59)return null;
  return '1'+MC_TENS[Math.floor(n/10)]+MC_ONES[n%10]+'0';
}
/**/
function cableNo(prefix,products,meters){
  const lb=lenBlock(meters); if(!lb||!products||!products.length)return null;
  const P=(typeof PRICES!=='undefined')?PRICES:{};
  for(const p of products){ const no=prefix+p+'-'+lb; if(P[no])return no; }
  return prefix+products[0]+'-'+lb;
}
function hasPrice(no){ const P=(typeof PRICES!=='undefined')?PRICES:{}; return !!(no&&P[no]); }
/*
*/
function v90PowerProducts(m){
  if((m.inertia||'').indexOf('高')>=0)return['5CL12','5CL02'];
  return (m.sh>=50)?['5CL02','5CL12']:['5CK01','5CK31','5CK32'];
}
function v90EncProducts(m){
  return (m.encoders||[]).some(e=>e.indexOf('绝对')>=0)
    ?['2DB10','2DB12','2DB20']:['2CT12','2CT20','2CT10'];
}
function V90PW(m,q){return cableNo('6FX3002-',v90PowerProducts(m),q.clen);}
function V90ENC(m,q){return cableNo('6FX3002-',v90EncProducts(m),q.clen);}
function V90BK(m,q){return cableNo('6FX3002-',['5BL03','5BK02'],q.clen);}
const LEN_NOTE='长度码（官方）：3m=1AD0，5m=1AF0，7m=1AH0，10m=1BA0，15m=1BF0，20m=1CA0，25m=1CF0。';

function v90Cables(m,q){
  const lb=lenBlock(q.clen);
  if(!lb)return{rows:[{c:'提示',t:'V90 标准电缆长度 3/5/7/10/15/20 米，'+q.clen+' 米请与西门子确认。'}],note:''};
  const abs=(m.encoders||[]).some(e=>e.indexOf('绝对')>=0);
  const pwNo=V90PW(m,q), encNo=V90ENC(m,q), bkNo=V90BK(m,q);
  const mk=no=>{const pc=priceCell(no),pp=purchOfCable(no);
    return '<span class="order">'+no+'</span> '+(pp
      ?('<span class="pill g" title="'+purchTip(pp)+'">✓ 已购 · 优先推荐</span>')
      :priceTag(pc));};
  const rows=[
    {c:'电源电缆（MOTION-CONNECT 300）',t:mk(pwNo)+'　'+q.clen+'m，带电机侧插头'},
    {c:'编码器电缆（'+(abs?'绝对值 BiSS':'增量 TTL 2500ppr')+'）',t:mk(encNo)+'　'+q.clen+'m'},
  ];
  if(m.brake&&m.brake.avail&&q.brake!=='no')rows.push({c:'抱闸电缆',t:mk(bkNo)+'　'+q.clen+'m'+'（'+(q.brake==='yes'?'必配':'带抱闸时选配')+'）'});
  else rows.push({c:'抱闸电缆',t:'无（按无抱闸配置）'});
  return{rows,note:LEN_NOTE+' 动力电缆产品位按官方手册分档：低惯量 ≤1kW 用 5CK01、低惯量 1.5–2kW 用 5CL02、高惯量 0.4–7kW 用 5CL12；'+
    '页面已优先选用采购记录库中真实采购过的产品位，标注「采购记录库有价」的可直接对应历史价格。'};
}
function s200Cables(m,q){
  const lb=lenBlock(q.clen);
  if(!lb)return{rows:[{c:'提示',t:'S200 标准电缆长度 3/5/7/10/15/20/30 米，'+q.clen+' 米请与西门子确认。'}],note:''};
  /*
*/
  if(m.family==='1FL1'){
    const T=DATA.cables.S200CC_tpl||{},P=(typeof PRICES!=='undefined')?PRICES:{};
    const fill=tpl=>{const product=tpl.replace(/-1\{\}0$/,'');const c=product+'-'+lb;return P[c]?c:c;};
    const bat=(m.encoders||[]).some(e=>e.indexOf('多圈')>=0)&&((q.enc==='mt_abs')||(q.enc==='bat_abs')||(q.enc==='any'));
    const pw=fill(T['动力电缆(含抱闸线)']||'6FX1002-5DN32-1{}0');
    const ec=fill((bat?(T['编码器电缆(带电池)']||'6FX1002-2XB14-1{}0'):(T['编码器电缆']||'6FX1002-2XB12-1{}0')));
    const mark=no=>{const pc=priceCell(no),pp=purchOfCable(no);
      return '<span class="order">'+no+'</span> '+(pp
        ?('<span class="pill g" title="'+purchTip(pp)+'">✓ 已购 · 优先推荐</span>')
        :priceTag(pc));};
    const rows=[
      {c:'动力电缆（含抱闸芯线）',t:mark(pw)+'　'+q.clen+'m，非驱动端出线'},
      {c:'编码器电缆'+(bat?'（带电池）':''),t:mark(ec)+'　'+q.clen+'m'}
    ];
    if(m.brake&&m.brake.avail&&q.brake!=='no')rows.push({c:'抱闸电缆',t:'已含在动力电缆内 —— 无需另订'});
    else rows.push({c:'抱闸电缆',t:'按无抱闸配置（动力电缆抱闸芯线不接）'});
    return{rows,note:'S200 Compact（1FL1）用 MOTION-CONNECT 100 系列 <b>6FX1002</b>：动力电缆 5DN32 已含抱闸芯线，'
      +'编码器电缆按「是否带电池」选 2XB12 / 2XB14。'+LEN_NOTE};
  }
  const T=DATA.cables.S200_tpl;            //
  const P=(typeof PRICES!=='undefined')?PRICES:{};
  const fill=tpl=>{
    const product=tpl.replace(/-1\{\}D0$/,'').replace(/-1\{\}0$/,'');
    const cands=[product+'-'+lb];
    if(product.indexOf('7C')>=0)cands.push('6FX3502-7DD01-'+lb,'6FX3502-7DN01-'+lb);
    for(const c of cands){ if(P[c])return c; }
    return cands[0];
  };
  const two=fill(T['双重电缆(动力+编码器)']), pw=fill(T['动力电缆']),
        ec=fill(T['编码器电缆']), bk=fill(T['抱闸电缆']);
  const mark=no=>{const pc=priceCell(no),pp=purchOfCable(no);
    return '<span class="order">'+no+'</span> '+(pp
      ?('<span class="pill g" title="'+purchTip(pp)+'">✓ 已购 · 优先推荐</span>')
      :priceTag(pc));};
  const rows=[
    {c:'动力+编码器双重电缆（推荐一体式）',t:mark(two)+'　'+q.clen+'m'},
    {c:'或分开：动力电缆',t:mark(pw)+'　'+q.clen+'m'},
    {c:'编码器电缆',t:mark(ec)+'　'+q.clen+'m'}
  ];
  if(m.brake&&m.brake.avail&&q.brake!=='no')rows.push({c:'抱闸电缆',t:mark(bk)+'　'+q.clen+'m'});
  else rows.push({c:'抱闸电缆',t:'无（按无抱闸配置）'});
  return{rows,note:'MOTION-CONNECT 350 双重电缆（动力+编码器一体，一根搞定）。'+LEN_NOTE};
}
/*



*/
function s210Cables(m,q){
  const lb=lenBlock(q.clen);
  const O=((DATA.cables||{}).S210_occ)||{};
  const key=((m.sh||0)>=63)?'M23':(((m.sh||0)<=20)?'M12':'M17');
  const o=O[key]||{};
  if(!lb)return{rows:[{c:'提示',t:'OCC 单电缆订货长度 1–50 米，'+q.clen+' 米超出长度码可表达的范围，请与西门子确认。'}],note:''};
  const mk=no=>{const pc=priceCell(no),pp=purchOfCable(no);
    return '<span class="order">'+no+'</span> '+(pp
      ?('<span class="pill g" title="'+purchTip(pp)+'">✓ 已购 · 优先推荐</span>')
      :priceTag(pc));};
  const no=(o.product500||'6FX5002-8QN11')+'-'+lb;
  const rows=[{c:'OCC 单电缆（动力+编码器+抱闸一根）',
    t:mk(no)+'　'+q.clen+'m，'+key+' 接头，'+fnum(o.cross)}];
  if(o.alt500)rows.push({c:'可选加粗规格（长距离 / 高温降容）',t:mk(o.alt500+'-'+lb)+'　'+q.clen+'m，'+fnum(o.alt_cross)});
  if(m.brake&&m.brake.avail&&q.brake!=='no')rows.push({c:'抱闸回路',t:'已含在 OCC 单电缆内 —— 无需另订抱闸电缆'});
  else rows.push({c:'抱闸回路',t:'按无抱闸配置（OCC 电缆抱闸芯线不接）'});
  return{rows,note:'1FK2 + S210 用 <b>OCC 单电缆</b>：一根线并走动力＋编码器＋抱闸，替代「动力线＋编码器线＋抱闸线」三根，现场只需一根拖线。'
    +'接头按轴高分档：'+(O.M17?('SH30/40/48/52 → M17（'+O.M17.product500+'，'+O.M17.cross+'）'):'')
    +'；'+(O.M23?('SH63/80/100 → M23（'+O.M23.product500+'，'+O.M23.cross+'）'):'')
    +'。拖链 / 高柔性场合用 6FX8002 系列。'+LEN_NOTE
    +' <b>OCC 电缆最长 50 米</b>；S210 内置滤波器仅保证 C3 到 25 米电机线长，25 米以上需另核 EMC 措施。'};
}
function s120Cables(m,q){
  const mk=no=>{const pc=priceCell(no),pp=purchOfCable(no);
    return '<span class="order">'+no+'</span> '+(pp
      ?('<span class="pill g" title="'+purchTip(pp)+'">✓ 已购 · 优先推荐</span>')
      :priceTag(pc));};
  const rows=[
    {c:'动力电缆（预装配）',t:mk('6FX5002-5DG23-2AA0')+'　（MOTION-CONNECT 500，长度按后缀订制：工程案例 50m）'},
    {c:'DRIVE-CLiQ 信号电缆',t:mk('6FX5002-2DC10-2AA0')+'　（24V MOTION-CONNECT 500，工程案例 50m；常规 3/5/10/20m 选 6FX2002-1DC… 系列）'}
  ];
  return{rows,note:'参考工程案例 REF-01：S120 长距离（50m）配 6FX5002 系列；短距离用 6FX2002-1DC 系列 DRIVE-CLiQ 电缆。'};
}

/**/
function orderNo(m,q){
  if(m.system==='V90'){
    /*



*/
    const sb=(q.shaft==='plain'?'光轴':'滑键')+(q.brake==='yes'?'带抱闸':'无抱闸');
    const sm=m.suffix_map['轴/抱闸']||{};
    const codeSB=sm[sb]||'A';
    const EM=m.suffix_map['编码器']||{};
    let encKey;
    if(q.enc==='rel')encKey='增量 TTL 2500 ppr';
    else if(q.enc==='mt_abs')encKey='20 位 + 12 位多圈绝对值';
    else encKey=['20 位 + 12 位多圈绝对值','21 位单圈绝对值','增量 TTL 2500 ppr'].find(k=>EM[k])||Object.keys(EM)[0];
    const codeE=EM[encKey]||'A';
    const tail=m.order_suffix.replace('{编码器}',codeE).replace('{轴}',codeSB);
    const lead=tail.charAt(1);
    const CONN={'0':'固定插口方向直型连接器','1':'电缆型连接器','2':'可调插口方向直角连接器'};
    return{full:m.base+tail,
      explain:'按官方规则逐位拼装：'+m.base+' + 【'+CONN[lead]+'('+lead+')】【编码器 '+encKey+'='+codeE
        +'】【轴端·抱闸 '+sb+'='+codeSB+'】【IP65 带轴油封(1)】。采购记录库实际采购同款为 '+m.ordered_typical
        +'；连接方式位（0/1/2）可按现场接线需要调整。'};
  }
  if(m.system==='S200'){
    /*


*/
    const oc=m.option_code;
    const b=q.brake==='yes'?'1':'0';
    /*
*/
    const is1FL1=(m.family==='1FL1');
    let ip=(String(m.ip||'').indexOf('IP65')>=0)?'1':'0',ipTxt=ip==='1'?'IP65（带轴密封圈）':'IP54';
    if(is1FL1){ip='1';ipTxt='IP65（带轴密封圈）';}
    else if(q.env==='ip65'){ip='1';ipTxt='IP65（带轴密封圈）';}
    else if(q.env==='ip64'){ip='0';ipTxt='IP54';}
    const sh=q.shaft==='plain'?'0':'1';
    const shTxt=sh==='0'?'光轴':'带平键（半键平衡）';
    let eKey;
    if(q.enc==='mt_abs')eKey='绝对值编码器 21 位单圈 + 12 位多圈';
    else if(q.enc==='rel')eKey='绝对值编码器 17 位单圈';
    else eKey='绝对值编码器 21 位单圈';
    const e=oc['编码器'][eKey]||(is1FL1?'S':'S');
    const conn=is1FL1?'D':'B',connTxt=is1FL1?'金属圆形连接器（1FL1 固定 D）':'金属圆形连接器';
    const tail=b+ip+'-'+sh+e+conn+'0';
    if(is1FL1){
      return{full:m.base+tail,
        explain:'按《SINAMICS S200 Compact 操作说明》1.1 系统组合表逐位拼装：'+m.base+'（已含轴高／长度／绕组）＋【抱闸 '
          +(b==='1'?'带':'无')+' '+b+'】【IP65（带轴密封圈） '+ip+'】【'+shTxt+' '+sh+'】【'+eKey+'='+e
          +'】【'+connTxt+' '+conn+'】【版本 0】。'
          +'1FL1 尾段规则与 1FL2 相同（抱闸+防护 + 连字符 + 轴伸+编码器+连接+版本），但编码器位用 '
          +'H=17 位单圈 / S=21 位单圈 / A=21 位单圈+12 位多圈（带电池），连接位固定 D；'
          +'采购记录库真实报价号 1FL1102-4AG11-1AD0 即「带抱闸+IP65+带平键+21 位多圈」这一组。'};
    }
    return{full:m.base+tail,
      explain:'按样本 D 37.1 数据位逐位拼装：'+m.base+'（已含惯量／轴高／长度／绕组）＋【抱闸 '
        +(b==='1'?'带':'无')+' '+b+'】【'+ipTxt+' '+ip+'】【'+shTxt+' '+sh+'】【'+eKey+'='+e
        +'】【'+connTxt+' '+conn+'】【版本 0】。'
        +'注意 1FL2 尾段是「抱闸+防护 + 连字符 + 轴伸+编码器+连接+版本」共 7 位——采购记录库真实采购号 '
        +'1FL2203-2AG11-1MC0、1FL2102-4AF10-1HC0 就是这个格式。'};
  }
  if(m.system==='S210'){
    /*



*/
    const b=q.brake==='yes'?'1':'0';
    const bTxt=(b==='1')?'带抱闸':'无抱闸';
    let ipv='0',ipTxt='IP64';
    if(q.env==='ip65'){ipv='1';ipTxt='IP65（带径向轴密封圈）';}
    const sh=(q.shaft==='plain')?'0':'1';
    const shTxt=(sh==='0')?'光轴（无键槽）':'轴带平键';
    let e='M',eTxt='AM22DQC（22 位 + 12 位多圈绝对值）';
    if(q.enc==='mt_abs'){e='M';eTxt='AM22DQC（22 位 + 12 位多圈绝对值）';}
    else if(q.enc==='rel'||q.enc==='resolver'){e='S';eTxt='AS22DQC（22 位单圈绝对值）';}
    const conn='A',connTxt='OCC 单电缆（配 S210）';
    const tail=b+ipv+'-'+sh+e+conn+'0';
    const extra=[];
    if(m.sh<=40&&ipv==='1')extra.push('SH30/SH40 选 IP65 后，径向轴密封圈会缩短可用轴伸长度（SH30 由 14×30 变 14×21.5），带轮/联轴器需按缩短后的轴伸复核');
    extra.push('订货号尾段 '+tail.replace('-','－')+' 的字符含义：'+bTxt+'('+b+') · '+ipTxt+'('+ipv+') · '+shTxt+'('+sh+') · '+eTxt+'('+e+') · '+connTxt+'('+conn+') · 版本 0');
    extra.push('若要 S120 双电缆（2CC）方案，把连接位 A 改成 B 即可（同一台电机两种接线都能用）');
    return{full:m.base+tail,
      explain:'按官方 2.5 数据位逐位拼装：'+m.base+'（已含惯量／轴高／结构长度／绕组）＋【'+bTxt+' '+b
        +'】【'+ipTxt+' '+ipv+'】【'+shTxt+' '+sh+'】【'+eTxt+' '+e+'】【'+connTxt+' '+conn+'】【版本 0】。'
        +'<br>'+extra.join('；')+'。'};
  }
  // S120
  let full=m.order_no||m.base;
  const alter=[];
  if(q.brake==='yes')alter.push('带抱闸版本：订货号第 9/10 位选 C（1FK7）/对应抱闸码（1FT7）');
  return{full:full,explain:'完整订货号（样本典型值）'+(alter.length?'。'+alter.join('；'):'')};
}

/**/
/**/
function mallLink(order,did){
  /*

*/
  var lg='zh', rg='CN';
  try{
    if(window.LANG_I18N&&LANG_I18N.lang==='de'){lg='de';rg='DE';}
    else if(window.LANG_I18N&&LANG_I18N.lang==='en'){lg='en';}
  }catch(e){}
  const u='https://mall.industry.siemens.com/spice/docuservice/rest/document.spring?articleNumber='
    +order+'++&language='+lg+'&region='+rg+'&documentGroup=MallDetailPage&documentId='+did;
  return 'https://mall.industry.siemens.com/mall/Document/GetDocumentBasedOnCode?code='+btoa(u);
}

/**/
/**/
function copyOrd(txt,btn){
  const old=btn?btn.textContent:'';
  const ok=function(){
    if(!btn)return;
    btn.textContent='✔ 已复制';
    setTimeout(function(){btn.textContent=old;},1500);
  };
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(ok,function(){fallbackCopy(txt,btn,ok);});
    }else fallbackCopy(txt,btn,ok);
  }catch(e){fallbackCopy(txt,btn,ok);}
}
function fallbackCopy(txt,btn,ok){
  try{
    const ta=document.createElement('textarea');
    ta.value=txt;ta.style.cssText='position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();ok();
  }catch(e){if(btn)btn.textContent='请手动复制：'+txt;}
}
function pick(i){
  const m=window._last[i];
  const q=collect();
  document.querySelectorAll('tr.cand').forEach(t=>t.classList.remove('sel'));
  const tr=$('cand'+i);if(tr)tr.classList.add('sel');
  renderResult(m,q);
}

/**/
function normNo(s){return String(s||'').toUpperCase().replace(/[\s．·.:：]/g,'');}
/*





*/
function baseNo(k){
  const seg=String(k||'').toUpperCase().split('-');
  if(seg.length<2)return seg[0];
  if(/^1F/.test(seg[0]))return seg[0];
  return seg.slice(0,seg.length-1).join('-');
}
function priceOf(no){
  const RAW=(typeof PRICES!=='undefined')?PRICES:{};
  const P=(function(){ if(RAW.__normIdx)return RAW.__normIdx; const idx={};
    for(const kk in RAW){ if(kk==='__normIdx')continue; idx[normNo(kk)]=RAW[kk]; }
    RAW.__normIdx=idx; return idx; })();
  const k=normNo(no);
  /**/
  if(P[k]&&P[k].length)return{kind:'exact',rows:P[k].slice(0,3)};
  /*



*/
  const b=baseNo(k);
  if(!b||b===k)return{kind:'none',rows:[]};
  const lcp=(a,c)=>{let i=0;while(i<a.length&&i<c.length&&a[i]===c[i])i++;return i;};
  const hits=Object.keys(P).filter(kk=>kk!==k&&baseNo(kk)===b)
    .sort((a,c)=>lcp(c,k)-lcp(a,k)||a.localeCompare(c));
  if(!hits.length)return{kind:'none',rows:[]};
  return{kind:'base',rows:hits.slice(0,2).map(kk=>Object.assign({},P[kk][0],{no:kk}))};
}
/**/
function money(v){return window.LANG_I18N?LANG_I18N.money(v):((v==null||isNaN(v))?'—':(Math.round(v*100)/100).toLocaleString('zh-CN'));}
function cur(v){return window.LANG_I18N?LANG_I18N.cur(v):('¥'+money(v));}
function curUnit(){return window.LANG_I18N?LANG_I18N.curUnit():' 元';}
function unitTxt(u){return window.LANG_I18N?LANG_I18N.unit(u):(u||'');}
function priceCell(no){
  const r=priceOf(no);
  const isRef=t=>/参考|同系列/.test(String(t||''));
  if(r.kind==='exact'){
    const a=r.rows[0],b=r.rows[1];
    return{price:a.p,p2:b?b.p:null,term:a.term||(b?b.term:''),date:a.date,src:a.src,type:a.type,
           extra:(r.rows.length>1?('共 '+r.rows.length+' 条记录'):''),cls:isRef(a.type)?'quote':'',
           refNo:null,refKind:'exact'};
  }
  if(r.kind==='base'){
    const a=r.rows[0];
    return{price:a.p,p2:null,term:a.term||'',date:a.date,src:a.src,
           type:'基本型号相同参考价（'+a.no+'）· 后面选件/长度段不同',extra:'',cls:'ref',
           refNo:a.no,refKind:'base',base:baseNo(no)};
  }
  return{price:null,p2:null,term:'',date:'',src:'无价格记录',
         type:'未采购过该型号，采购记录库里也没有同基本型号的记录',extra:'',cls:'none',refNo:null,refKind:'none'};
}
/**/
function priceTag(pc){
  if(pc.price==null)return '<span class="pill r" title="采购记录库里没有该型号、也没有同基本型号的采购/报价记录 —— 不能凭其他型号估算，请先询价">未采购过 · 需询价</span>';
  if(pc.cls==='ref')return '<span class="pill a" title="同基本型号的参考价：'+pc.refNo+'（与本机订货号不同，报价前需按本机型号核实）">参考价 · 型号不同</span>';
  return '<span class="pill g">采购记录库有价</span>';
}
/**/
function baseRefPrice(no){return priceCell(no);}
function bomRowHTML(i,name,spec,no,qty,unit){
  const pc=priceCell(no);
  let priceTxt=priceTag(pc);
  if(pc.price!=null){
    priceTxt=money(pc.price)+(pc.p2!=null?'<br><span class="p2">另一近期价 '+money(pc.p2)+'</span>':'')
      +(pc.cls==='ref'
        ?'<br><span class="pill a" title="同基本型号（'+pc.base+'）的参考价，来自 '+pc.refNo+' —— 与本机订货号不同，报价前请按本机型号向西门子核实">参考价</span>'
          +'<br><span class="sp">参考 '+pc.refNo+'</span>'
        :'');
  }
  const sub=(pc.price!=null)?money(pc.price*qty):'—';
  return '<tr><td>'+(i)+'</td>'
   +'<td style="min-width:210px"><b>'+name+'</b>'+(spec?'<br><span class="sp">'+spec+'</span>':'')+'</td>'
   +'<td><span class="order">'+no+'</span></td>'
   +'<td>'+qty+unitTxt(unit)+'</td>'
   +'<td class="pr">'+priceTxt+'</td>'
   +'<td>'+(pc.term||'—')+'</td>'
   +'<td style="min-width:150px">'+(pc.date?('报价/采购时间 <b>'+pc.date+'</b>'):'—')
   +'<br><span class="sp">'+pc.src+(pc.type?('　'+pc.type):'')+(pc.extra?('　'+pc.extra):'')+'</span></td>'
   +'<td class="sub">'+sub+'</td></tr>';
}
function bomTableHTML(items){
  let h='<table class="bomprice"><tr><th>#</th><th>物料 / 规格参数</th><th>订货号</th><th>数量</th>'
   +'<th>含税单价(元)</th><th>货期</th><th>报价时间 / 来源</th><th>小计(元)</th></tr>';
  let sum=0,known=0,missing=[];
  let bought=0;
  items.forEach((it,i)=>{
    const pp=it.pur||purchOfNo(it.no);
    if(pp)bought++;
    h+=bomRowHTML(i+1,it.name+(pp
        ?(' <span class="pill g" title="'+purchTip(pp)+'">✓ 已购</span>')
        :(' <span class="pill n" title="采购记录库里没有该型号的采购记录，按西门子样本推荐">样本</span>')),
      it.spec,it.no,it.qty,it.unit);
    const pc=priceCell(it.no);
    if(pc.price!=null){sum+=pc.price*(it.qty||1);known++;}
    else missing.push(it.no);
  });
  h+='</table>';
  h+='<div class="kv" style="margin-top:8px"><b>合计（已知价项）</b><span><b>'+money(sum)+'</b>'+curUnit()+'　'+known+'/'+items.length+' 项有价'
   +(missing.length?('　<span class="pill r">待询价：'+missing.join('、')+'</span>'):'')+'</span></div>';
  /**/
  h+='<div class="kv" style="display:none"><b>优先推荐级</b><span><span class="pill g">✓ 已购</span>＝采购记录库历史采购/报价记录里买过/报过的型号（本清单 <b>'+bought+'/'+items.length+'</b> 项）；'
   +'<span class="pill n">样本</span>＝按西门子样本推荐、采购记录库无记录，下单前请先询价。</span></div>';
  h+='<div class="kv" style="display:none"><b>价格口径</b><span>'
   +'① 订货号<b>完全相同</b> → 直接采用该次采购/报价价；'
   +'② <b>基本型号相同、后面字母不同</b>（如 1FL6096-1AC61 与 1FL6096-1AC75）→ 给<b>参考价</b>并注明型号不同、写出参考订货号；'
   +'③ <b>基本型号也不同</b>（如 1FL6096 与 1FL6090）→ <b>不写价</b>，标「未采购过 · 需询价」。'
   +'合计只累加有价项，参考价按参考值计入、下单前需按本机型号核实。</span></div>';
  return h;
}
/**/
function selBomItems(m,q){
  const cl=q.clen||10, pn=m.pn||0;
  const it=[];
  const motorSpec='额定 '+(m.mn)+' N·m / '+m.nn+' rpm / '+m.pn+' kW'+(m.m0!=null?('，静止 m₀='+m.m0+' N·m'):'')
    +'；'+(q.volt&&q.volt!=='any'?q.volt+'V，':'')+(m.cooling||'自然冷却')
    +'；SH '+m.sh+'；'+((m.encoders||[]).slice(-1)[0]||'')
    +(m.brake&&m.brake.avail?('；带抱闸'+(m.brake.torque?(' '+m.brake.torque+' N·m'):'')):'')
    +'；'+(m.mass?('重 '+m.mass+' kg'):'');
  let mno=m.order_no||null;
  /*
*/
  if(!mno||m.system==='S210'){ try{ mno=orderNo(m,q).full; }catch(e){ mno=mno||null; } }
  it.push({name:'伺服电机 '+(m.base||m.model),spec:motorSpec,no:(mno||m.base||m.model),qty:1});
  if(m.system==='V90'){
    /**/
    const dv=driveV90(m,q);
    const no=dv?((q.ctrl==='pulse')?dv.order_pulse:dv.order_pn)
      :(pn<=0.5?'6SL3210-5FB10-2UF2':pn<=1?'6SL3210-5FB10-4UF1':'6SL3210-5FB11-0UF1');
    it.push({name:'SINAMICS V90 伺服驱动器（'+(q.ctrl==='pulse'?'PTI 脉冲版':'PN 版')+'）',
      spec:'适配 '+m.pn+'kW / '+((m.voltage||[]).join('/'))+'V 电机'+(dv?('，外形尺寸 '+(dv.frame||'—')+'（'+dv.pn+'kW 档）'):'')
        +'，PROFINET 通讯，内置 EPOS 定位',no:no,qty:1});
    /**/
    it.push({name:'动力电缆（MOTION-CONNECT 300）',spec:'V90 动力线，'+cl+' 米，带电机侧插头，含屏蔽',no:V90PW(m,q),qty:1,unit:'根'});
    it.push({name:'编码器电缆（MOTION-CONNECT 300）',spec:'V90 编码器线，'+cl+' 米',no:V90ENC(m,q),qty:1,unit:'根'});
    if(m.brake&&m.brake.avail&&q.brake!=='no')
      it.push({name:'抱闸电缆（MOTION-CONNECT 300）',spec:'V90 抱闸线，'+cl+' 米',no:V90BK(m,q),qty:1,unit:'根'});
  }else if(m.system==='S200'){
    const dv=driveS200(m,q);
    const no=dv?((q.ctrl==='pulse')?dv.order_pulse:dv.order_pn)
      :(pn<=0.75?'6SL5510-1BE10-2AF0':'6SL5510-1BB10-2AF0');
    it.push({name:'SINAMICS S200 伺服驱动器（PN）',spec:'适配 '+m.pn+'kW / '+((m.voltage||[]).join('/'))+'V'+(dv?('，外形尺寸 '+(dv.frame||'—')):'')
      +'，PROFINET，内置 STO 安全功能',no:no,qty:1});
    if(m.family==='1FL1'){
      /**/
      const lb1=lenBlock(cl)||'1BA0', P=(typeof PRICES!=='undefined')?PRICES:{};
      const pick=(a)=>{for(const c of a){if(P[c])return c;}return a[0];};
      const pw=pick(['6FX1002-5DN32-'+lb1]);
      const bat=(q.enc==='mt_abs'||q.enc==='bat_abs'||q.enc==='any');
      const ec=pick(bat?['6FX1002-2XB14-'+lb1,'6FX1002-2XB12-'+lb1]:['6FX1002-2XB12-'+lb1,'6FX1002-2XB14-'+lb1]);
      it.push({name:'S200 Compact 动力电缆（含抱闸芯线）',spec:'MOTION-CONNECT 100，'+cl+' 米，非驱动端出线，抱闸芯线已含',no:pw,qty:1,unit:'根'});
      it.push({name:'S200 Compact 编码器电缆'+(bat?'（带电池）':''),spec:'MOTION-CONNECT 100，'+cl+' 米'+(bat?'，适配 21 位单圈+12 位多圈（带电池）':''),no:ec,qty:1,unit:'根'});
    }else{
    const lb2=lenBlock(cl);
    const twoNo=(function(){ const P=(typeof PRICES!=='undefined')?PRICES:{};
      for(const c of ['6FX3502-7CD01-'+lb2,'6FX3502-7DN01-'+lb2,'6FX3502-7DD01-'+lb2]){ if(P[c])return c; }
      return '6FX3502-7CD01-'+lb2; })();
    it.push({name:'S200 组合电缆（单接头双电缆）',spec:'非柔性 '+cl+' 米，折弯次数 100 万次，带抱闸控制，非轴端出线',no:twoNo,qty:1,unit:'根'});
    }
  }else if(m.system==='S210'){
    /**/
    const dv=driveS210(m,q);
    const no=dv?dv.order:null;
    const v0=((m.voltage||[])[0]||'380');
    it.push({name:'SINAMICS S210 伺服驱动器（PN 总线）',
      spec:'适配 '+m.pn+'kW / '+((m.voltage||[]).join('/'))+'V 电机'+(dv?('，'+dv.frame+' 机座，额定 '+dv.i_rated+'A / 最大 '+dv.i_max+'A（电机 Imax '+fnum(m.imax)+'A）'):'')
        +(dv&&dv.legacy&&v0==='230'?('；现场为 3AC 200…240 V 电源时改用 '+dv.legacy):'')
        +'，PROFINET/IRT 通讯，内置 STO 安全转矩关断与 EPOS 基本定位，带一键调谐（One Button Tuning）',
      no:(no||'6SL5310-1BE13-5DF1'),qty:1});
    const lb3=lenBlock(cl);
    const O=((DATA.cables||{}).S210_occ)||{};
    const occKey=((m.sh||0)>=63)?'M23':(((m.sh||0)<=20)?'M12':'M17');
    const o=(O[occKey]||{});
    const occNo=(o.product500||'6FX5002-8QN11')+'-'+(lb3||'1BA0');
    it.push({name:'OCC 单电缆（动力+编码器+抱闸一体）',
      spec:'1FK2 ⟷ S210 专用，'+(q.clen||10)+' 米，'+occKey+' 接头，'+fnum(o.cross)
        +'；一根线替代动力线/编码器线/抱闸线三根',
      no:occNo,qty:1,unit:'根'});
  }else{
    const multi=(q.axes==='multi');
    it.push({name:'S120 控制单元 '+(multi?'CU320-2 PN（多轴）':'CU310-2 PN（单轴）'),
      spec:multi?'多轴控制单元，PROFINET，最多带 6 个电机模块':'单轴控制单元，PROFINET，内置功率单元接口',
      no:(multi?'6SL3040-1MA01-0AA0':'6SL3040-1LA01-0AA0'),qty:1});
    it.push({name:'S120 CF 卡'+(multi?'（含性能扩展）':''),
      spec:multi?'含性能扩展包与许可证书（许可证保存在卡上）':'含性能扩展包与许可证书（V5.2 SP3）',
      no:(multi?'6SL3054-0FC31-1BA0':'6SL3054-0FC30-1BA0'),qty:1});
    it.push({name:'基本操作面板 BOP20',spec:'参数查看与手动调试',no:'6SL3055-0AA00-4BA0',qty:1});
    it.push({name:'24V 辅助电源 SITOP PSU200M',spec:'120/230V AC 输入，24VDC/5A 输出',no:'6EP1333-3BA10',qty:1});
    it.push({name:'制动电阻',spec:'按电机功率选配（案例口径 30–37kW 档同系列）',no:'JJY.023424020001',qty:1});
    it.push({name:'动力电缆（带抱闸）MOTION-CONNECT 500',spec:'6FX5002-5DG23 系列，长 '+cl+' 米，含抱闸芯线与电缆终端套',no:'6FX5002-5DG23-2AA0',qty:1,unit:'根'});
    it.push({name:'DRIVE-CLiQ 信号电缆',spec:'6FX5002-2DC10 系列，长 '+cl+' 米，含 24V',no:'6FX5002-2DC10-2AA0',qty:1,unit:'根'});
  }
  return it;
}
function bomCard(m,q,tag){
  const items=selBomItems(m,q);
  let h='<div class="card" style="margin-top:14px"><h3>'+(tag||'')+' 采购清单（电机 + 驱动器 + 配件 + 线缆）'
   +'<span class="tag">价格来自采购记录库 · 见各行报价时间</span></h3>';
  h+='<div class="kv"><b>清单口径</b><span>电机按照你选的 <b>'+(m.base||m.model)+'</b>（'+(m.inertia||'')+' / '+((m.voltage||[]).join('/'))+'V / SH'+m.sh+'）组合生成；配件与线缆按 '+(SYSNAME[m.system])+' 方案标配，同型号有多条记录时并列两个近期价。</span></div>';
  h+=bomTableHTML(items);
  h+='<div class="dl" style="margin-top:10px"><a class="main" href="javascript:void(0)" onclick="exportBomPDF(this)">⬇ 采购清单导出 PDF</a>'
   +'<span class="hint" style="margin:0;align-self:center">点击直接下载 PDF 文件（浏览器弹出下载/另存为），共 3 页：报价清单 ／ 电机·驱动器技术参数 ／ 转速扭矩曲线＋外形尺寸表。</span></div>';
  h+='</div>';
  return h;
}

let CURSEL=null;   /**/
/*
*/
const INFRAME=(function(){try{return window.self!==window.top;}catch(e){return true;}})();
/*
*/
function showDlNotice(fname,url,errMsg,openInTab){
  let host=document.getElementById('dlstage');
  if(!host){host=document.createElement('div');host.id='dlstage';(document.body||document.documentElement).appendChild(host);}
  host.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;max-width:470px';
  const safeName=String(fname).replace(/"/g,'').replace(/</g,'&lt;');
  const attrs=openInTab?'target="_blank" rel="noopener"':('download="'+safeName+'"');
  const btnTxt=openInTab?'打开打印页（新标签页）':('保存到本机 '+safeName);
  const g=INFRAME
   ?'<div style="margin-top:8px;background:#fff7e6;border:1px solid #e2c27d;border-radius:7px;padding:7px 9px;color:#7a5a12;font-size:12px">'
    +'⚠ 检测到本工具正运行在<b>内置预览面板</b>里：面板会拦截「下载文件」和「新标签页」，点了没反应是面板限制，不是文件问题。'
    +'请用<b>系统浏览器</b>（Chrome / Edge）打开「选型工具」文件夹里的 <b>index.html</b> 再点导出，即可一键另存 PDF。</div>'
   :'';
  host.innerHTML='<div style="background:#ffffff;border:1.5px solid #0e7a4f;border-radius:10px;padding:14px 16px;'
   +'font:13px/1.6 \'PingFang SC\',\'Microsoft YaHei\',sans-serif;color:#1c2a38;text-align:left">'
   +'<div style="font-weight:600;color:#0d3a2a;margin-bottom:8px">✅ 文件已生成，点这里拿</div>'
   +'<a href="'+url+'" '+attrs+' style="display:inline-block;background:#0e7a4f;color:#ffffff;'
   +'text-decoration:none;padding:8px 14px;border-radius:7px;font-weight:600">⬇ '+btnTxt+'</a>'
   +(openInTab
     ?('<a href="javascript:void(0)" onclick="showPageOverlay(window._lastPrintDoc||\'\')" '
       +'style="display:inline-block;margin-left:8px;background:#eef6f2;color:#0e7a4f;border:1px solid #93c4ac;'
       +'text-decoration:none;padding:7px 12px;border-radius:7px;font-weight:600">📄 在本页查看打印页</a>')
     :('<a href="javascript:void(0)" onclick="showPageOverlay(window._lastPrintDoc||\'\')" '
       +'style="display:inline-block;margin-left:8px;background:#eef6f2;color:#0e7a4f;border:1px solid #93c4ac;'
       +'text-decoration:none;padding:7px 12px;border-radius:7px;font-weight:600">📄 在本页查看打印版</a>'))
   +'<div style="margin-top:8px;color:#5b6672;font-size:12px">'
   +(openInTab
     ?'新标签页打开后按 <b>Ctrl+P</b>（Mac ⌘+P），目标打印机选「另存为 PDF」即可保存到桌面；'
      +'若新标签页被拦截，点「📄 在本页查看打印页」可先核对内容。'
     :'若「保存到本机」点了没反应（预览面板会拦截下载）：点「📄 在本页查看打印版」→ 在预览页面里'
      +'<b>右键 → 打印框架</b>（Chrome / Edge）→ 打印目标选「<b>另存为 PDF</b>」→ 保存，'
      +'即可不离开本页拿到同样的 PDF；或用系统浏览器打开 index.html 重新导出一键另存。')
   +g
   +(errMsg?('<br><span style="color:#8a97a5">说明：'+String(errMsg).replace(/</g,'&lt;')+'</span>'):'')
   +'<div style="margin-top:6px"><a href="javascript:void(0)" '
     +'onclick="document.getElementById(\'dlstage\').style.display=\'none\'" '
     +'style="color:#8a97a5">知道了，关闭</a></div>'
   +'</div></div>';
  if(host.scrollIntoView){try{host.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){}}
}
/*
*/
function showPageOverlay(doc){
  let ov=document.getElementById('pageov');
  if(!ov){ov=document.createElement('div');ov.id='pageov';(document.body||document.documentElement).appendChild(ov);}
  ov.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:99998;background:rgba(15,25,35,.55)';
  const esc=String(doc).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  ov.innerHTML='<div style="position:absolute;left:0;top:0;right:0;height:52px;background:#0e7a4f;color:#ffffff;'
   +'display:flex;align-items:center;gap:12px;padding:0 16px;font:13px/1.5 \'PingFang SC\',\'Microsoft YaHei\',sans-serif">'
   +'<b style="white-space:nowrap">打印页预览</b>'
   +'<span style="opacity:.9">这是导出用的 A4 打印页。保存办法：在本页内<b>右键 → 打印框架</b>，打印目标选「另存为 PDF」'
     +'（不要按 Ctrl+P，那会打印整个工具页）。</span>'
   +'<a href="javascript:void(0)" onclick="document.getElementById(\'pageov\').style.display=\'none\'" '
   +'style="margin-left:auto;color:#ffffff;text-decoration:underline;white-space:nowrap">✕ 关闭</a></div>'
   +'<iframe style="position:absolute;left:0;top:52px;width:100%;height:calc(100% - 52px);border:0;background:#ffffff" '
   +'srcdoc="'+esc+'"></iframe>';
}

/*



*/
function openDocInNewTab(doc,fname,why,earlyWin){
  window._lastPrintDoc=doc||'';
  try{
    let w=earlyWin||null;
    if(!w&&typeof window.open==='function'){try{w=window.open('','_blank');}catch(e){w=null;}}
    if(w&&!w.closed){
      try{w.document.write(doc);w.document.close();return true;}catch(e){}
    }
    const url=URL.createObjectURL(new Blob([doc],{type:'text/html'}));
    showDlNotice(fname,url,(why||'')+'；新标签页被拦截时，请点下面的「📄 在本页查看打印页」',true);
    return true;
  }catch(e){}
  alert('当前环境既不能生成 PDF 也打不开新页面。请把整个「选型工具」文件夹放到本地，用系统浏览器打开 index.html 后再导出。');
  return false;
}
/*



*/
function snapBySVG(blockEl,styleHTML){
  return new Promise(function(res,rej){
    try{
      if(typeof XMLSerializer!=='function'||typeof Image!=='function'){
        rej(new Error('当前环境不支持 SVG 渲染'));return;
      }
      const w=794;
      const rect=blockEl.getBoundingClientRect?blockEl.getBoundingClientRect():null;
      const h=Math.max(60,Math.ceil((rect&&rect.height)||blockEl.scrollHeight||1200));
      const box=document.createElement('div');
      box.className='pdfpg';
      try{box.style.cssText='width:'+w+'px;background:#ffffff;margin:0';}catch(e){}
      const st=document.createElement('style');
      st.textContent=styleHTML;
      box.appendChild(st);
      const clone=blockEl.cloneNode?blockEl.cloneNode(true):null;
      if(!clone){rej(new Error('无法克隆打印页节点'));return;}
      box.appendChild(clone);
      const inner=new XMLSerializer().serializeToString(box);
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'
        +'<foreignObject width="100%" height="100%">'+inner+'</foreignObject></svg>';
      const img=new Image();
      img.onload=function(){
        try{
          const cv=document.createElement('canvas');
          cv.width=w*2;cv.height=h*2;
          const ctx=cv.getContext('2d');
          ctx.scale(2,2);
          ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
          ctx.drawImage(img,0,0,w,h);
          cv.toDataURL('image/jpeg');  /**/
          res(cv);
        }catch(e){rej(e);}
      };
      img.onerror=function(){rej(new Error('SVG 渲染图加载失败'));};
      img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    }catch(e){rej(e);}
  });
}

/*






*/
function htmlToPDF(doc,fname,btn){
  if(!(window.jspdf&&window.jspdf.jsPDF&&window.html2canvas)){
    openDocInNewTab(doc,fname,'本环境没加载 PDF 组件（jspdf / html2canvas）');return;
  }
  /*


*/
  let savePick=null;
  if(typeof window.showSaveFilePicker==='function'){
    try{
      savePick=window.showSaveFilePicker({
        suggestedName:fname,
        types:[{description:'PDF 文档',accept:{'application/pdf':['.pdf']}}]
      }).catch(function(e){return {err:e};});
    }catch(e){savePick=Promise.resolve({err:e});}   /**/
  }
  /*
*/
  let earlyWin=null;
  if(!savePick){try{earlyWin=(typeof window.open==='function')?window.open('about:blank','_blank'):null;}catch(e){earlyWin=null;}}
  const closeEarly=function(){if(earlyWin){try{if(!earlyWin.closed)earlyWin.close();}catch(e){}}};
  const old=(btn&&btn.textContent)||'';
  if(btn){btn.textContent='⏳ 正在生成 PDF…';btn.style.pointerEvents='none';}
  const done=function(){if(btn){btn.textContent=old;btn.style.pointerEvents='';}};
  try{
    /**/
    let host=document.getElementById('pdfstage');
    if(!host){host=document.createElement('div');host.id='pdfstage';document.body.appendChild(host);}
    host.style.cssText='position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;z-index:-1;';
    const rawStyle=(doc.match(/<style>([\s\S]*?)<\/style>/)||['',''])[1];
    const style=rawStyle
      .replace('@page{size:A4;margin:12mm}','')
      .replace(':root{--line','#pdfstage{--line')      /**/
      .replace('body{','#pdfstage{');                   /**/
    const svgStyle=rawStyle                             /**/
      .replace('@page{size:A4;margin:12mm}','')
      .replace(/:root\{--line/g,'.pdfpg{--line')
      .replace(/body\{/g,'.pdfpg{');
    const body=(doc.match(/<body>([\s\S]*)<\/body>/)||['',''])[1]
      /**/
      .replace(new RegExp('<scr'+'ipt[\\s\\S]*?</scr'+'ipt>','gi'),'');
    host.innerHTML='<style>'+style+'</style>'+body;
    const blocks=Array.prototype.filter.call(host.children,function(el){return el.tagName==='DIV';});
    if(!blocks.length){host.innerHTML='';done();closeEarly();openDocInNewTab(doc,fname,'页面分块失败',earlyWin);return;}
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
    /**/
    const renderPage=function(el){
      return window.html2canvas(el,{scale:2,backgroundColor:'#ffffff',logging:false,useCORS:true})
        .catch(function(e){
          return snapBySVG(el,svgStyle).catch(function(e2){
            throw new Error('页面截图失败：'+((e&&e.message)||e)
              +(e2?('；SVG 兜底也失败：'+((e2&&e2.message)||e2)):''));
          });
        });
    };
    const next=function(i){
      if(i>=blocks.length){
        host.innerHTML='';done();closeEarly();
        let blob=null,blobErr='';
        try{blob=pdf.output('blob');}catch(e){blobErr=(e&&e.message)||String(e);}
        /**/
        const fallback=function(){
          let savedFlag=false;
          if(blob){try{pdf.save(fname);savedFlag=true;}catch(e){blobErr=(e&&e.message)||String(e);}}
          if(blob){
            let url='';
            try{url=URL.createObjectURL(blob);}catch(e){blobErr=blobErr||((e&&e.message)||String(e));}
            if(url&&(INFRAME||!savedFlag)){window._lastPrintDoc=doc;showDlNotice(fname,url,blobErr,false);}
          }else{
            openDocInNewTab(doc,fname,blobErr||'PDF 打包失败',earlyWin);
          }
        };
        if(!blob||!savePick){fallback();return;}
        /**/
        savePick.then(function(h){
          if(!h||!h.createWritable){
            const er=h&&h.err;
            if(er&&er.name==='AbortError')return;              /**/
            if(er)blobErr=blobErr||(er.message||String(er));
            fallback();return;
          }
          return h.createWritable().then(function(w){
            return w.write(new Blob([blob],{type:'application/pdf'})).then(function(){return w.close();});
          }).catch(function(e){
            if(e&&e.name==='AbortError')return;
            blobErr=blobErr||((e&&e.message)||String(e));
            fallback();
          });
        });
        return;
      }
      renderPage(blocks[i])
        .then(function(cv){
          const mmW=(cv.width/2)*25.4/96, mmH=(cv.height/2)*25.4/96;
          const k=Math.min(186/mmW,273/mmH);            /**/
          const w=mmW*k,h=mmH*k;
          if(i>0)pdf.addPage();
          pdf.addImage(cv.toDataURL('image/jpeg',0.93),'JPEG',(210-w)/2,(297-h)/2,w,h);
          next(i+1);
        })
        .catch(function(e){host.innerHTML='';done();
          openDocInNewTab(doc,fname,(e&&e.message)||String(e),earlyWin);});
    };
    /**/
    requestAnimationFrame(function(){requestAnimationFrame(function(){next(0);});});
  }catch(e){done();closeEarly();openDocInNewTab(doc,fname,(e&&e.message)||String(e),earlyWin);}
}

function exportBomPDF(btn){
  if(!CURSEL){alert('请先完成一次选型（点候选表任意一行）再导出。');return;}
  const m=CURSEL.m,q=CURSEL.q;
  let ord;try{ord=orderNo(m,q).full;}catch(e){ord=m.order_no||m.base||m.model;}
  const fname=(window.LANG_I18N?LANG_I18N.tr('采购清单_'):'采购清单_')+ord+'_'+new Date().toISOString().slice(0,10)+'.pdf';
  htmlToPDF(bomPrintHTML(m,q),fname,btn);
}
/*
*/
function exportSpecPDF(btn){
  if(!CURSEL){alert('请先完成一次选型（点候选表任意一行）再生成。');return;}
  const m=CURSEL.m,q=CURSEL.q;
  let ord;try{ord=orderNo(m,q).full;}catch(e){ord=m.order_no||m.base||m.model;}
  const fname=(window.LANG_I18N?LANG_I18N.tr('技术资料_'):'技术资料_')+ord+'_'+new Date().toISOString().slice(0,10)+'.pdf';
  htmlToPDF(specPrintHTML(m,q),fname,btn);
}
/*

*/
function specPrintHTML(m,q){
  const SPEC=specKVHTML(m,q);
  let ord;try{ord=orderNo(m,q).full;}catch(e){ord=m.order_no||m.base||m.model;}
  const now=new Date();
  const ts=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')
    +' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  const rng=function(r,unit){
    if(!r||!r.has)return '不限';
    const lo=r.lo,hi=r.hi;
    return (lo==null?('≤ '+hi):(hi==null?('≥ '+lo):(lo===hi?lo:lo+' – '+hi)))+(unit||'');
  };
  const em=m._enc||{exact:true,note:''};
  const CRPAGE=function(pg,tot){return '<div class="cr">版权归 力姆泰克（北京）传动设备股份有限公司 所有　｜　西门子伺服电机在线选型工具　｜　第 '+pg+' 页 / 共 '+tot+' 页</div>';};
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>技术资料 · '+(m.base||m.model)+'</title>'
   +'<style>'
   +'*{box-sizing:border-box;margin:0;padding:0}'
   +':root{--line:#dde8e2}'
   +'body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:#1c2a38;font-size:12px;line-height:1.6;padding:26px 30px;}'
   +'h1{font-size:19px;color:#0d3a2a;letter-spacing:.5px;}'
   +'h2{font-size:15px;color:#0d3a2a;background:#ecf5f0;border-left:4px solid #0e7a4f;padding:7px 12px;margin:0 0 10px;}'
   +'.meta{color:#5b6672;font-size:11px;margin-top:4px;}'
   +'.cond{background:#f2f8f5;border:1px solid #dde8e2;border-radius:6px;padding:8px 12px;margin:12px 0;font-size:11.5px;color:#33465c;}'
   +'.cond b{color:#0e7a4f}'
   +'table{width:100%;border-collapse:collapse;margin-top:6px;}'
   +'th{background:#0d3a2a;color:#fff;padding:6px 7px;text-align:left;font-weight:600;font-size:11px;white-space:nowrap;}'
   +'td{padding:6px 7px;border-bottom:1px solid #e4ece8;vertical-align:top;font-size:11.5px;}'
   +'td.r{text-align:right;white-space:nowrap;font-weight:600;color:#0d3a2a;}'
   +'td.mono{font-family:Consolas,monospace;font-size:11px;letter-spacing:.2px;white-space:nowrap;}'
   +'table.kv2 td.k{width:118px;color:#5b6672;font-weight:600;background:#f7fbf9;}'
   +'table.dims td.r{font-weight:600;}'
   +'.dswrap{display:flex;gap:14px;align-items:flex-start;margin:8px 0 4px;}'
   +'.dscol{flex:1 1 0;min-width:0;}'
   +'table.ds{width:100%;border-collapse:collapse;margin:0 0 12px;border:1.5px solid #3a3a3a;}'
   +'table.ds th{background:#d9d9d9;color:#111;border-bottom:1.5px solid #3a3a3a;padding:5px 8px;text-align:center;font-size:12px;font-weight:700;}'
   +'table.ds td{padding:4.5px 8px;border-bottom:1px solid #c9c9c9;font-size:10.8px;color:#111;vertical-align:top;word-break:break-word;}'
   +'table.ds td.k{width:55%;font-weight:400;}'
   +'table.ds tr:nth-child(2n+3) td{background:#f0f0f0;}'
   +'table.ds tr:last-child td{border-bottom:0;}'
   +'.note{margin-top:12px;padding:8px 12px;background:#fffaf0;border:1px solid #f0e0b8;border-radius:6px;color:#7a5b13;font-size:10.5px;line-height:1.7;}'
   +'.foot{margin-top:14px;color:#8a97a5;font-size:10px;}'
   +'.cr{margin-top:12px;padding-top:6px;border-top:1px solid #dde8e2;color:#0e7a4f;font-size:10px;font-weight:600;letter-spacing:.2px;}'
   +'.ord{font-family:Consolas,monospace;font-weight:700;color:#0e7a4f;}'
   +'.sec{page-break-after:always;}'
   +'@page{size:A4;margin:12mm}'
   +'</style></head><body>'
   /**/
   +'<div class="sec">'
   +'<h1>西门子伺服电机 · 技术资料包</h1>'
   +'<div class="meta">系统方案 '+(SYSNAME[m.system]||m.system)+' ｜ 电机 <b>'+(m.base||m.model)+'</b>'
   +' ｜ 推荐订货号 <span class="ord">'+ord+'</span> ｜ 生成时间 '+ts+'</div>'
   +'<div class="cr" style="margin:4px 0 0;border:0;padding:0;font-size:11px">版权归 力姆泰克（北京）传动设备股份有限公司 所有</div>'
   +'<div class="cond"><b>选型条件</b>　功率 '+rng(q.pn,' kW')+' ｜ 扭矩 '+rng(q.tq,' N·m')+' ｜ 额定转速 '+rng(q.nn,' rpm')
   +' ｜ 电缆长度 '+(q.clen||10)+' m ｜ '+(q.brake==='yes'?'需要抱闸':'抱闸不限')
   +' ｜ 控制 '+(q.ctrl==='pulse'?'脉冲 PTI':(q.ctrl==='pn'?'PROFINET':'不限'))
   +' ｜ 电压 '+(q.volt==='any'?'不限':q.volt+' V')
   +' ｜ 防护 '+(q.env==='any'?'不限':(q.env==='ip65'?'IP65':'IP54'))+'</div>'
   +'<h2>① 伺服电机技术参数表（官方数据表样式）　'+(m.base||m.model)+'</h2>'
   +(em.note?('<div class="note">'+em.note+'</div>'):'')
   +SPEC.dsHTML
   +'<div class="foot">参数来源：'+srcTxt(m).replace(/<[^>]+>/g,'')+(m.verified_doc?('（'+m.verified_doc+'）'):'')+'</div>'
   +CRPAGE(1,3)
   +'</div>'
   /**/
   +'<div class="sec">'
   +'<h2>② 转速—扭矩特性曲线</h2>'
   +curveSVG(m)
   +'<div class="note">本图为按机型库参数绘制的示意曲线（连续工作区 / 峰值区 / 恒功率区）；'
   +'需要西门子原厂精确曲线时，用工具页 ⑦「电机特性曲线 PDF」按已登记订货号下载。</div>'
   +CRPAGE(2,3)
   +'</div>'
   /**/
   +'<div>'
   +'<h2>③ 外形尺寸图'+dimFIG(m)[1]+'</h2>'
   +dimFIG(m)[0]
   +'<h2 style="margin-top:16px">④ 外形尺寸表　'+SPEC.fname+'</h2>'
   +SPEC.dimHTML
   +'<div class="foot">来源：西门子伺服电机在线选型工具（机型库数据来自西门子官方样本与官方数据表）；'
   +'本文件由浏览器即时生成，如需调整数量 / 线缆长度 / 防护等级，请回工具页改完重新生成。</div>'
   +CRPAGE(3,3)
   +'</div>'
   +'<script>setTimeout(function(){window.print();},300);<\/script>'
   +'</body></html>';
}
/*
*/
function specKVHTML(m,q){
  /*
*/
  const dsN=function(v,dec){
    if(v==null)return null;
    if(typeof v!=='number')return String(v);
    if(dec==null)dec=(Math.abs(v%1)>1e-9)?2:1;
    return v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:2});
  };
  const R=function(k,v){return (v!=null&&v!=='')?('<tr><td class="k">'+k+'</td><td>'+v+'</td></tr>'):'';};
  const G=function(title,pairs){
    const rows=pairs.map(function(p){return R(p[0],p[1]);}).join('');
    return rows?('<table class="ds"><tr><th colspan="2">'+title+'</th></tr>'+rows+'</table>'):'';
  };
  const brk=m.brake||{};
  const bh=(brk.hold_nm!=null)?brk.hold_nm:brk.torque;
  const vt=(m.voltage||[]).join('/');
  /**/
  const selG=G('选型数据',[
    ['额定转速', m.nn!=null?dsN(m.nn,0)+' rpm':null],
    ['极数', m.poles!=null?(m.poles+' 极'):null],
    ['额定功率', m.pn!=null?dsN(m.pn)+' kW':null],
    ['额定扭矩（100 K）', m.mn!=null?dsN(m.mn)+' N·m':null],
    ['额定电流', m.inn!=null?dsN(m.inn)+' A':null],
    ['静态扭矩（100 K）', m.m0!=null?dsN(m.m0)+' N·m':null],
    ['转矩常数', m.kt!=null?dsN(m.kt)+' N·m/A':null],
    ['转子的转动惯量', m.J!=null?(dsN(m.J)+' kg·cm²'+(m.Jb?('（带抱闸 '+dsN(m.Jb)+' kg·cm²）'):'')):(m.j_text||null)],
    ['电源电压 / 惯量', ((vt?(vt+' V'):'')+(m.inertia?(' · '+m.inertia):''))||null]
  ]);
  /**/
  const mechG=G('机械数据',[
    ['电机类型','永磁同步电机'],
    ['轴高', m.sh!=null?('SH '+m.sh):null],
    ['冷却', m.cooling||'自冷却'],
    ['防护等级', fnum(m.ip)],
    ['结构形式', fnum(m.mount)],
    ['轴端', (m.shaft||[]).join('/')||null],
    ['编码器', (m.encoders||[]).length?m.encoders.join('<br>'):null],
    ['重量', m.mass!=null?(dsN(m.mass)+' kg'+(m.massb?('（带抱闸 '+dsN(m.massb)+' kg）'):'')):null]
  ]);
  /**/
  const bestG=G('最佳工作点',[
    ['最佳转速', m.nn!=null?dsN(m.nn,0)+' rpm':null],
    ['最佳功率', m.pn!=null?dsN(m.pn)+' kW':null]
  ]);
  const limG=G('极限数据',[
    ['最大允许转速（机械）', m.nmax!=null?dsN(m.nmax,0)+' rpm':null],
    ['最大允许转速（变频器）', m.nmax_inv!=null?dsN(m.nmax_inv,0)+' rpm':null],
    ['最大扭矩', m.mmax!=null?(dsN(m.mmax)+' N·m（过载 '+overloadTxt(m)+'）'):null],
    ['最大电流', m.imax!=null?dsN(m.imax)+' A':null]
  ]);
  /**/
  let drvPairs=null,drvTitle='';
  if(m.system==='V90'){
    const d=driveV90(m,q);
    if(d){drvTitle='推荐的驱动器　SINAMICS V90';drvPairs=[
      ['适配功率档', d.pn?(d.pn+' kW'):null],
      ['外形尺寸', d.frame?(d.frame+(d.pn?('（'+d.pn+' kW 档）'):'')):null],
      ['脉冲 PTI 版订货号', q.ctrl!=='pn'?d.order_pulse:null],
      ['PROFINET PN 版订货号', q.ctrl!=='pulse'?d.order_pn:null],
      ['控制特性', 'PTI（脉冲序列）/ PN（PROFINET，含 8 路 DI/DO），内置 EPOS 定位功能']
    ];}
  }else if(m.system==='S200'){
    const d=driveS200(m,q);
    if(d){drvTitle='推荐的驱动器　SINAMICS S200'+(m.family==='1FL1'?' Compact':'');drvPairs=[
      ['适配功率档', d.pn?(d.pn+' kW'):null],
      ['外形尺寸', d.frame?(d.frame+(d.pn?('（'+d.pn+' kW 档）'):'')):null],
      ['脉冲 PTI 版订货号', q.ctrl!=='pn'?d.order_pulse:null],
      ['PROFINET PN 版订货号', q.ctrl!=='pulse'?d.order_pn:null],
      ['安全功能', '内置 STO（安全转矩关断）']
    ];}
  }else if(m.system==='S210'){
    const d=driveS210(m,q);
    if(d){drvTitle='推荐的驱动器　SINAMICS S210';drvPairs=[
      ['驱动器订货号', d.order],
      ['另有 3AC 200…240V 输入版', d.legacy],
      ['机座 / 功率等级', d.frame+'（'+d.pn+' kW）'],
      ['额定 / 最大输出电流', d.i_rated+' / '+d.i_max+' A（电机 Imax '+fnum(m.imax)+' A）'],
      ['外形尺寸（宽×高×深）', d.size?(d.size[0]+'×'+d.size[1]+'×'+d.size[2]+' mm'):null],
      ['重量', d.size?(d.size[3]+' kg'):null],
      ['电源 / 控制', ((m.voltage||[])[0]==='230')?'1AC 230 V（200…240 V）/ 3AC 200…240 V ｜ PROFINET/IRT（无脉冲 PTI 版本）':'3AC 380…480 V ｜ PROFINET/IRT（无脉冲 PTI 版本）'],
      ['控制特性', '内置 STO 安全转矩关断、EPOS 基本定位、一键调谐（One Button Tuning）、Web 服务器调试'],
      ['电机接线', 'OCC 单电缆（动力＋编码器＋抱闸一体，1FK2 与 S210 之间只需 1 根电缆）']
    ];}
  }else{
    drvTitle='推荐的电机模块　SINAMICS S120';drvPairs=[
      ['控制方式', 'SINAMICS S120：'+(q.axes==='multi'?'多轴 CU320-2':'单轴 CU310-2')+' + 电机模块，PROFINET'],
      ['控制单元', q.axes==='multi'?'CU320-2 PN（6SL3040-1MA01-0AA0）':'CU310-2 PN（6SL3040-1LA01-0AA0）'],
      ['变频器额定电流', m.module_in!=null?(m.module_in+' A（峰值 '+fnum(m.module_imax)+' A）'):null],
      ['模块扭矩能力', m.module_mmax!=null?(m.module_mmax+' N·m'):null]
    ];
  }
  const drvG=drvPairs?G(drvTitle,drvPairs):'';
  /**/
  const brkG=brk.avail?G('抱闸',[
    ['抱闸型号','永磁抱闸'],
    ['制动力矩', bh!=null?(bh+' N·m'):null],
    ['线圈电流', brk.current!=null?(brk.current+' A'):null],
    ['供电电压', brk.volt||'DC 24 V'],
    ['开启 / 闭合时间', brk.open_ms!=null?(brk.open_ms+' ms / '+(brk.close_ms!=null?(brk.close_ms+' ms'):'—')):null]
  ]):'';
  const drvNote=drvPairs?'':'<div class="note">该方案驱动器按订货号由西门子配置，请以订货号向西门子/代理商索取技术参数。</div>';
  const dsHTML='<div class="dswrap"><div class="dscol">'+selG+mechG+'</div>'
    +'<div class="dscol">'+bestG+limG+drvG+brkG+'</div></div>'+drvNote;
  /**/
  const DIMLBL={A:'法兰边长',AB:'法兰边长（方形）',B:'法兰外廓',C:'安装孔中心距',N:'止口直径',S:'螺栓孔径',
    LC:'法兰边长（方形）',LD:'法兰外廓',LD1:'法兰外廓（第二形式）',LA:'法兰尺寸 LA',P:'法兰尺寸 P',M:'法兰安装尺寸 M',
    LB:'止口直径',LZ:'止口深度',LR:'止口定位距',T:'法兰厚度',LG:'轴肩长度',LH:'高度尺寸',
    D:'轴径',DB:'轴端螺纹',D6:'轴端螺纹',E:'轴伸长度',F:'键宽',GA:'键长',QK:'键位',
    LL:'机身长度（无抱闸）',LLb:'总长（带抱闸）',L:'机身长度（无抱闸）',L1:'总长（带抱闸）'};
  const dimSeen={},dimRows=[];
  ['dim','dim2','flange'].forEach(function(k){
    const d=m[k]||{};
    for(const kk in d){
      const v=d[kk];
      if(v==null||v==='')continue;
      if(kk==='src'||kk==='L_dc'||kk==='L1_dc')continue;   /**/
      const key=kk+':'+v;
      if(dimSeen[key])continue;
      dimSeen[key]=1;
      dimRows.push('<tr><td class="mono">'+kk+'</td><td>'+(DIMLBL[kk]||'几何尺寸')+'</td><td class="r">'+v+'</td></tr>');
    }
  });
  const dimHTML=dimRows.length
    ?('<table class="dims"><tr><th style="width:70px">代号</th><th>含义</th><th style="width:110px;text-align:right">数值 (mm)</th></tr>'+dimRows.join('')+'</table>')
    :'<div class="note">该型号暂无结构化尺寸数据，请下载交付文件中的「外形尺寸图 PDF」（带公差标注的工程图）查看。</div>';
  return{dsHTML:dsHTML,dimHTML:dimHTML,fname:(m.base||m.model)};
}
function bomPrintHTML(m,q){
  let ord;try{ord=orderNo(m,q).full;}catch(e){ord=m.order_no||m.base||m.model;}
  const items=selBomItems(m,q);
  let sum=0,known=0;const missing=[];
  const rng=function(r,unit){
    if(!r.has)return '不限';
    const lo=(r.lo==null)?'':r.lo,hi=(r.hi==null)?'':r.hi;
    return (r.lo==null?('≤ '+hi):(r.hi==null?('≥ '+lo):(lo===hi?lo:lo+' – '+hi)))+(unit||'');
  };
  const rows=items.map(function(it,i){
    const pc=priceCell(it.no);
    if(pc.price!=null){sum+=pc.price*(it.qty||1);known++;}else missing.push(it.no);
    const pr=(pc.price!=null)
      ?('<span class="amt">'+money(pc.price)+'</span>'+(pc.cls==='ref'
        ?('<i class="rn">参考价 · 型号不同</i><div class="sp">参考 '+pc.refNo+'（同基本型号，选件段不同）</div>')
        :''))
      :'<b style="color:#c23a2b">未采购过 · 需询价</b>';
    return '<tr><td class="c">'+(i+1)+'</td>'
      +'<td><b>'+it.name+'</b>'+(it.spec?'<div class="sp">'+it.spec+'</div>':'')+'</td>'
      +'<td class="mono">'+(it.no||'—')+'</td>'
      +'<td class="c">'+(it.qty||1)+unitTxt(it.unit)+'</td>'
      +'<td class="r">'+pr+'</td>'
      +'<td>'+(pc.term||'—')+'</td>'
      /**/
      +'<td class="r">'+((pc.price!=null)?('<span class="amt">'+money(pc.price*(it.qty||1))+'</span>'):'—')+'</td></tr>';
  }).join('');
  const SPEC=specKVHTML(m,q);
  const dimHTML=SPEC.dimHTML;
  const now=new Date();
  const ts=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')
    +' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  const fname=SPEC.fname;
  const CRPAGE=function(pg,tot){return '<div class="cr">版权归 力姆泰克（北京）传动设备股份有限公司 所有　｜　西门子伺服电机在线选型工具　｜　第 '+pg+' 页 / 共 '+tot+' 页</div>';};
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>采购清单与技术文件 · '+fname+'</title>'
   +'<style>'
   +'*{box-sizing:border-box;margin:0;padding:0}'
   +':root{--line:#dde8e2}'
   +'body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:#1c2a38;font-size:12px;line-height:1.6;padding:26px 30px;}'
   +'h1{font-size:19px;color:#0d3a2a;letter-spacing:.5px;}'
   +'h2{font-size:15px;color:#0d3a2a;background:#ecf5f0;border-left:4px solid #0e7a4f;padding:7px 12px;margin:0 0 10px;}'
   +'.meta{color:#5b6672;font-size:11px;margin-top:4px;}'
   +'.cond{background:#f2f8f5;border:1px solid #dde8e2;border-radius:6px;padding:8px 12px;margin:12px 0;font-size:11.5px;color:#33465c;}'
   +'.cond b{color:#0e7a4f}'
   +'table{width:100%;border-collapse:collapse;margin-top:6px;}'
   +'th{background:#0d3a2a;color:#fff;padding:6px 7px;text-align:left;font-weight:600;font-size:11px;white-space:normal;line-height:1.35;overflow-wrap:anywhere;hyphens:auto;}'
   +'td{padding:6px 7px;border-bottom:1px solid #e4ece8;vertical-align:top;font-size:11.5px;overflow-wrap:anywhere;}'
   +'td.c{text-align:center;}td.r{text-align:right;font-weight:600;color:#0d3a2a;}'
   /*

*/
   +'table.qt{table-layout:fixed;}'
   +'.amt{white-space:nowrap;}'
   +'.rn{display:block;font-size:10px;font-weight:400;font-style:normal;color:#b97a12;line-height:1.4;}'
   +'td.mono{font-family:Consolas,monospace;font-size:11px;letter-spacing:.2px;white-space:nowrap;}'
   +'table.kv2 td{width:110px;color:#5b6672;font-weight:600;background:#f7fbf9;}'
   +'table.dims td.r{font-weight:600;}'
   +'.dswrap{display:flex;gap:14px;align-items:flex-start;margin:8px 0 4px;}'
   +'.dscol{flex:1 1 0;min-width:0;}'
   +'table.ds{width:100%;border-collapse:collapse;margin:0 0 12px;border:1.5px solid #3a3a3a;}'
   +'table.ds th{background:#d9d9d9;color:#111;border-bottom:1.5px solid #3a3a3a;padding:5px 8px;text-align:center;font-size:12px;font-weight:700;}'
   +'table.ds td{padding:4.5px 8px;border-bottom:1px solid #c9c9c9;font-size:10.8px;color:#111;vertical-align:top;word-break:break-word;}'
   +'table.ds td.k{width:55%;font-weight:400;}'
   +'table.ds tr:nth-child(2n+3) td{background:#f0f0f0;}'
   +'table.ds tr:last-child td{border-bottom:0;}'
   +'.sp{color:#5b6672;font-size:10.5px;}'
   +'tr.total td{background:#ecf5f0;font-size:13px;font-weight:700;color:#0d3a2a;border-top:2px solid #0e7a4f;}'
   +'.note{margin-top:12px;padding:8px 12px;background:#fffaf0;border:1px solid #f0e0b8;border-radius:6px;color:#7a5b13;font-size:10.5px;line-height:1.7;}'
   +'.foot{margin-top:14px;color:#8a97a5;font-size:10px;}'
   +'.cr{margin-top:12px;padding-top:6px;border-top:1px solid #dde8e2;color:#0e7a4f;font-size:10px;font-weight:600;letter-spacing:.2px;}'
   +'.sec{page-break-after:always;}'
   +'@page{size:A4;margin:12mm}'
   +'</style></head><body>'
   /**/
   +'<div class="sec">'
   +'<h1>西门子伺服电机选型 · 采购清单与技术文件</h1>'
   +'<div class="meta">系统方案 '+(SYSNAME[m.system]||m.system)+' ｜ 电机 '+(m.base||m.model)
   +' ｜ 推荐订货号 <b>'+ord+'</b> ｜ 生成时间 '+ts+'</div>'
   +'<div class="cr" style="margin:4px 0 0;border:0;padding:0;font-size:11px">版权归 力姆泰克（北京）传动设备股份有限公司 所有</div>'
   +'<h2 style="margin-top:14px">① 报价清单（含税价 · 采购记录库口径）</h2>'
   +'<div class="cond"><b>选型条件</b>　功率 '+rng(q.pn,' kW')+' ｜ 扭矩 '+rng(q.tq,' N·m')+' ｜ 额定转速 '+rng(q.nn,' rpm')
   +' ｜ 电缆长度 '+(q.clen||10)+' m ｜ '+(q.brake==='yes'?'需要抱闸':'抱闸不限')
   +' ｜ 控制 '+(q.ctrl==='pulse'?'脉冲 PTI':(q.ctrl==='pn'?'PROFINET':'不限'))
   +' ｜ 电压 '+(q.volt==='any'?'不限':q.volt+' V')+'</div>'
   +'<table class="qt"><colgroup><col style="width:5%"><col><col style="width:19%"><col style="width:8%"><col style="width:16%"><col style="width:9%"><col style="width:13%"></colgroup>'
   +'<tr><th style="width:26px">#</th><th>物料 / 规格参数</th><th>订货号</th><th>数量</th>'
   +'<th>含税单价(元)</th><th>货期</th><th>小计(元)</th></tr>'
   +rows
   +'<tr class="total"><td colspan="6">合计（已知价项 '+known+'/'+items.length+'）'
   +(missing.length?('　待询价：'+missing.join('、')):'')+'</td><td class="r"><span class="amt">'+money(sum)+curUnit()+'</span></td></tr>'
   +'</table>'
   /**/
   +'<div class="note">※ 单价为报价参考价（含税），仅供预算参考，实际以正式报价/下单询价为准。</div>'
   +CRPAGE(1,4)
   +'</div>'
   /**/
   +'<div class="sec">'
   +'<h2>② 伺服电机技术参数表（官方数据表样式）　'+(m.base||m.model)+'</h2>'
   +SPEC.dsHTML
   +'<div class="foot">参数来源：'+srcTxt(m)+(m.verified_doc?('（'+m.verified_doc+'）'):'')+'</div>'
   +CRPAGE(2,4)
   +'</div>'
   /**/
   +'<div class="sec">'
   +'<h2>③ 转速—扭矩特性曲线（示意）</h2>'
   +curveSVG(m)
   +'<div class="note">本图为示意曲线（峰值区 / 连续区 / 恒功率区）；精确官方曲线请用工具页 ⑦「电机特性曲线 PDF（转速-扭矩）」下载原厂数据。</div>'
   +CRPAGE(3,4)
   +'</div>'
   /**/
   +'<div>'
   +'<h2>④ 外形尺寸图'+dimFIG(m)[1]+'</h2>'
   +dimFIG(m)[0]
   +'<h2 style="margin-top:16px">⑤ 外形尺寸表　'+fname+'</h2>'
   +dimHTML
   +'<div class="note">带公差标注的正式工程图：工具页 ⑤ 交付文件「外形尺寸图 PDF」或 ⑦ 商城「外形尺寸图 PDF / DXF」下载；三维模型用 STEP 导入 SolidWorks / NX / Creo 查看。</div>'
   +'<div class="foot">来源：西门子伺服电机在线选型工具（数据来自西门子官方样本与官方数据表）；本文件由浏览器打印生成，如需修改数量/线缆长度请回工具页调整后重新导出。</div>'
   +CRPAGE(4,4)
   +'</div>'
   +'<script>setTimeout(function(){window.print();},300);<\/script>'
   +'</body></html>';
}

function renderResult(m,q,noScroll){
  CURSEL={m:m,q:q};   /**/
  const ord=orderNo(m,q);
  const em=m._enc||{exact:true,note:''};
  let h='';
  /**/
  h+='<div class="cards">';
  h+='<div class="card"><h3>① 伺服电机 <span class="tag">'+SYSNAME[m.system]+' · '+m.family+'</span></h3>';
  h+='<div class="kv"><b>推荐订货号</b><span><span class="order">'+ord.full+'</span></span></div>';
  h+='<div class="kv"><b>基本订货号</b><span><b>'+m.base+'</b>（'+(m.inertia||'—')+' ／ '+((m.voltage||[]).join('/'))+'V ／ SH'+m.sh+'）'
    +((m.dkey&&m.dkey!==m.model)?'<br><span class="pill a">注意：型号 '+m.model+' 另有不同电压/惯量版本，本页图纸与参数均按 '+m.base+'</span>':'')+'</span></div>';
  if(m.missing_fields&&m.missing_fields.length){
    h+='<div class="alert">⚠ 本型号<b>'+(m.incomplete_level==='severe'?'资料不全':'部分参数待补')
      +'</b>：'+m.missing_fields.join('、')+' 未在西门子样本/采购记录库中查到，上方以 — 表示。'
      +'下单前请用西门子选型配置器或样本确认这些参数。</div>';
  }
  h+='<div class="kv"><b>组装说明</b><span>'+ord.explain+'</span></div>';
  h+='<div class="kv"><b>额定功率</b><span>'+m.pn+' kW</span></div>';
  h+='<div class="kv"><b>额定扭矩</b><span>'+m.mn+' N·m'+(m.m0!=null?'（静止 m₀='+m.m0+'）':'')+'</span></div>';
  h+='<div class="kv"><b>峰值扭矩</b><span>'+fnum(m.mmax)+' N·m（过载 '+overloadTxt(m)+'）</span></div>';
  h+='<div class="kv"><b>额定转速</b><span>'+m.nn+' rpm</span></div>';
  h+='<div class="kv"><b>最高可用转速</b><span>'+nmaxTxt(m)+'</span></div>';
  h+='<div class="kv"><b>额定/峰值电流</b><span>'+fnum(m.inn)+' / '+fnum(m.imax)+' A</span></div>';
  h+='<div class="kv"><b>转矩常数</b><span>'+fnum(m.kt)+' N·m/A</span></div>';
  h+='<div class="kv"><b>转子惯量</b><span>'+(m.J!=null?(m.J+' kg·cm²'+(m.Jb?('（带抱闸 '+m.Jb+'）'):'')):(m.j_text||'—'))+'</span></div>';
  h+='<div class="kv"><b>重量</b><span>'+fnum(m.mass)+' kg'+(m.massb?'（带抱闸 '+m.massb+'）':'')+'</span></div>';
  h+='<div class="kv"><b>编码器</b><span>'+(m.encoders||[]).join('；')+(em.note?'<br><span class="pill a">'+em.note+'</span>':'')+'</span></div>';
  h+='<div class="kv"><b>抱闸</b><span>'+(m.brake&&m.brake.avail?('可选：'+(m.brake.torque?m.brake.torque+' N·m，':'')+(m.brake.open_ms?('开 '+m.brake.open_ms+'ms / 闭 '+m.brake.close_ms+'ms，'):'')+m.brake.volt):'无')+'</span></div>';
  h+='<div class="kv"><b>防护/安装</b><span>'+fnum(m.ip)+' ｜ '+fnum(m.mount)+' ｜ '+(m.cooling||'自然冷却')+'</span></div>';
  h+='<div class="kv"><b>轴高/轴端</b><span>SH '+m.sh+' ｜ '+(m.shaft||[]).join('/')+'</span></div>';
  h+='<div class="kv" style="display:none"><b>参数来源</b><span>'+srcTxt(m)
    +(m.verified_doc?('<br><span class="srcn">'+m.verified_doc+'</span>'):'')
    +(m.sh_src?('<br><span class="srcn">轴高：'+m.sh_src+'</span>'):'')+'</span></div>';
  h+='<div class="kv" style="display:none"><b>这是什么？</b><span class="srcn">'+SRCLEGEND+'</span></div>';
  const mpur=purchInfo(m);
  h+='<div class="kv" style="display:none"><b>优先推荐级</b><span>'+buyPill(mpur)
    +(mpur?(' <span class="srcn">'+purchTip(mpur)+'　→ 本机型属<b>优先推荐级</b>，优先下单</span>')
         :(' <span class="srcn">采购记录库中无该型号历史报价记录，'
           +'本页按西门子样本给出参数与订货号，属<b>样本选型</b>——下单前建议先询价确认。</span>'))+'</span></div></div>';

  /**/
  h+='<div class="card"><h3>② 驱动器 <span class="tag">SINAMICS '+(m.family==='1FL1'?'S200 Compact':'S200')+'</span></h3>';
  if(m.system==='V90'){
    const d=driveV90(m,q);
    if(d){
      h+='<div class="kv"><b>外形尺寸</b><span>'+d.frame+(d.pn?'（'+d.pn+'kW 档）':'')+'</span></div>';
      if(q.ctrl!=='pn')h+='<div class="kv"><b>脉冲 PTI 版本</b><span><span class="order">'+d.order_pulse+'</span></span></div>';
      if(q.ctrl!=='pulse')h+='<div class="kv"><b>PROFINET PN 版本</b><span><span class="order">'+d.order_pn+'</span></span></div>';
      h+='<div class="kv"><b>控制特性</b><span>PTI（脉冲序列）/ PN（PROFINET, 含 8 路DI/DO），V90 内置 EPOS 定位功能</span></div>';
      const vp=purchOfNo(d.order_pn)||purchOfNo(d.order_pulse);
      h+='<div class="kv" style="display:none"><b>优先推荐级</b><span>'+buyPill(vp)
        +(vp?(' <span class="srcn">'+purchTip(vp)+'　→ 该驱动器采购记录库有采购记录，优先推荐</span>'):'')+'</span></div>';
    }
  }else if(m.system==='S200'){
    const d=driveS200(m,q);
    if(d){
      h+='<div class="kv"><b>外形尺寸</b><span>'+d.frame+'（'+d.pn+'kW 档）</span></div>';
      if(q.ctrl!=='pn')h+='<div class="kv"><b>脉冲 PTI 版本</b><span><span class="order">'+d.order_pulse+'</span></span></div>';
      if(q.ctrl!=='pulse')h+='<div class="kv"><b>PROFINET PN 版本</b><span><span class="order">'+d.order_pn+'</span></span></div>';
      h+='<div class="kv"><b>说明</b><span>S200 系列内置 STO 安全功能；S200 Compact（1FL1，200V，≤750W）、S200C 经济型（≤750W）、S200B 基本型（≤1kW）、S200 标准型（≤7kW）</span></div>';
      const sp=purchOfNo(d.order_pn)||purchOfNo(d.order_pulse);
      h+='<div class="kv" style="display:none"><b>优先推荐级</b><span>'+buyPill(sp)
        +(sp?(' <span class="srcn">'+purchTip(sp)+'　→ 该驱动器采购记录库有采购记录，优先推荐</span>'):'')+'</span></div>';
    }
  }else if(m.system==='S210'){
    const d=driveS210(m,q);
    if(d){
      h+='<div class="kv"><b>推荐驱动器订货号</b><span><span class="order">'+d.order+'</span>'
        +(d.legacy?('<br><span class="pill a">另有 3AC 200…240V 输入版 '+d.legacy+'</span>'):'')+'</span></div>';
      h+='<div class="kv"><b>机座 / 电流</b><span>'+d.frame+' ｜ 额定输出 '+d.i_rated+' A ／ 最大输出 '+d.i_max+' A'
        +'；该机座按「驱动器最大输出电流 ≥ 电机最大电流（Imax '+fnum(m.imax)+' A）」选档</span></div>';
      h+='<div class="kv"><b>外形尺寸（宽×高×深）</b><span>'+(d.size?(d.size[0]+'×'+d.size[1]+'×'+d.size[2]+' mm / '+d.size[3]+' kg'):'—')+'</span></div>';
      h+='<div class="kv"><b>电源</b><span>3AC 380…480 V（'+fnum(m.pn)+' kW 档，'+fnum(d.pn)+' kW 功率等级）</span></div>';
      h+='<div class="kv"><b>控制特性</b><span>PROFINET / IRT 总线（<b>S210 无脉冲 PTI 版本</b>）；内置 STO（安全转矩关断）、EPOS 基本定位、一键调谐（One Button Tuning），支持 Web 服务器调试</span></div>';
      h+='<div class="kv"><b>接线</b><span><b>OCC 单电缆</b>：1FK2 与 S210 之间只需 1 根 MOTION-CONNECT 500 电缆（动力＋编码器＋抱闸一起走），不再需要动力线/编码器线两根</span></div>';
      if(q.ctrl==='pulse')h+='<div class="alert">注意：S210 不支持脉冲控制。如需脉冲（PTI）请改选 V90 或 S200。</div>';
      const dp=purchOfNo(d.order);
      h+='<div class="kv" style="display:none"><b>优先推荐级</b><span>'+buyPill(dp)
        +(dp?(' <span class="srcn">'+purchTip(dp)+'　→ 该驱动器采购记录库有采购记录，优先推荐</span>')
            :' <span class="srcn">采购记录库中暂无该型号记录，属样本选型；下方清单该行价格为同机座历史价参考推算，量级仅供参考，请以询价为准。</span>')+'</span></div>';
    }
  }else{
    h+='<div class="kv"><b>控制方式</b><span>SINAMICS S120：单轴 CU310-2 / 多轴 CU320-2 + 电机模块，PROFINET 或 PROFIBUS</span></div>';
    const cuNo=(q.axes==='multi'?'6SL3040-1MA01-0AA0':'6SL3040-1LA01-0AA0');
    const cuP=purchOfNo(cuNo), cfP=purchOfNo('6SL3054-0FC30-1BA0');
    h+='<div class="kv" style="display:none"><b>优先推荐级</b><span>'+buyPill(cuP||cfP)
      +' <span class="srcn">控制单元 '+cuNo+(cuP?('（✓ 采购记录库有采购记录，'+purchTip(cuP)+'）'):'（采购记录库无记录）')
      +'；CF 卡 6SL3054-0FC30-1BA0'+(cfP?'（✓ 采购记录库有采购记录）':'（采购记录库无记录）')+'。下方 ④ 清单逐行标注。</span></span></div>';
    if(q.ctrl==='pulse')h+='<div class="alert">注意：S120 为总线控制系统，不支持脉冲控制。如需脉冲控制请选 V90 或 S200。</div>';
  }
  h+='</div>';

  /**/
  const cab=m.system==='V90'?v90Cables(m,q):(m.system==='S200'?s200Cables(m,q):(m.system==='S210'?s210Cables(m,q):s120Cables(m,q)));
  h+='<div class="card"><h3>③ 线缆（'+q.clen+' 米）</h3>';
  cab.rows.forEach(r=>{h+='<div class="kv"><b>'+r.c+'</b><span><span class="order">'+r.t+'</span></span></div>';});
  h+='<div class="kv"><b>规则</b><span>'+cab.note+'</span></div></div>';
  h+='</div>';

  /**/
  if(m.system==='S120'){
    h+='<div class="card" style="margin-top:14px"><h3>④ SINAMICS S120 全套组件清单（'+(q.axes==='multi'?'多轴 CU320-2':'单轴 CU310-2')+'）</h3>';
    h+='<table class="bom"><tr><th>#</th><th>组件</th><th>订货号</th><th>尺寸/重量</th></tr>';
    s120Bom(m,q).forEach((b,i)=>{
      const bp=purchOfNo(b.no);
      h+='<tr><td>'+(i+1)+'</td><td>'+b.item+(bp?(' <span class="pill g" title="'+purchTip(bp)+'">✓ 已购</span>'):(' <span class="pill n">样本</span>'))+'</td>'
        +'<td><span class="order">'+b.no+'</span></td><td>'+fnum(b.dim)+'</td></tr>';});
    h+='</table>';
    h+='<div class="ok">✔ 参考工程案例 REF-01（真实项目 BOM）：单轴 S120 采用 CU310-2 PN（6SL3040-1LA01-0AA0）+ CF 卡 + BOP20 + SITOP 24V 电源 + 制动电阻 + 6FX5002 电缆组合，与本清单一致。电机侧大功率案例用 1FT7108-5WC70-1CB0（水冷 26kW）。</div>';
    h+='</div>';
  }

  /**/
  h+='<div class="card curvewrap" style="margin-top:14px"><h3>⑤ 转速—扭矩特性曲线（示意）</h3>'+curveSVG(m)+'</div>';

  /**/
  /*
*/
  const mdl=m.dkey||m.model;
  const mlabel=(m.dkey&&m.dkey!==m.model)
    ?(m.model+'（'+m.base+'　'+m.inertia+'　'+((m.voltage||[]).join('/'))+'V　SH'+m.sh+'）')
    :mdl;
  const base='deliverables/'+encodeURIComponent(mdl);
  const files=[
    {n:'技术参数表 PDF',u:base+'/'+encodeURIComponent(mdl+'_技术参数表.pdf'),main:true},
    {n:'转速扭矩曲线 PDF',u:base+'/'+encodeURIComponent(mdl+'_转速扭矩曲线.pdf')},
    {n:'外形尺寸图 PDF',u:base+'/'+encodeURIComponent(mdl+'_外形尺寸图.pdf')},
    {n:'三维模型 STEP',u:base+'/'+encodeURIComponent(mdl+'_三维模型.step'),main:true}
  ];
  h+='<div class="card" style="margin-top:14px"><h3>⑥ 交付文件（'+mlabel+'）</h3>';
  /**/
  h+='<div class="dl" style="margin-bottom:8px"><a class="main" href="javascript:void(0)" onclick="exportSpecPDF(this)">'
    +'⚡ 本页即时生成技术资料 PDF（技术参数表 + 转速扭矩曲线 + 外形尺寸图）</a></div>';
  h+='<div class="dl" id="dlbox">';
  files.forEach(f=>{h+='<a class="'+(f.main?'main':'')+'" data-u="'+f.u+'" href="'+f.u+'" target="_blank">📄 '+f.n+'</a>';});
  h+='</div>';
  h+='<div class="kv" style="margin-top:8px"><b>两排怎么用</b><span>'
    +'<b>⚡ 那一行</b>由本页数据即时现画，任何环境（含预览面板）都能下载到 PDF；'
    +'<b>📄 那 4 个</b>是提前做好的成品文件（技术参数表 / 转速扭矩曲线 / 带公差标注的外形尺寸图 / STEP 三维模型），'
    +'需要<b>用系统浏览器直接打开本页</b>才能点开——它们放在 <code>deliverables/</code> 子目录里，'
    +'预览面板只挂载本目录的顶层文件，子目录取不到（链接会被自动隐藏，不是没生成）。</span></div>';
  h+='<div class="kv" style="margin-top:8px"><b>关于 STEP</b><span>三维数模统一为 STEP（AP214 实体，单位 mm，轴向沿 +X：法兰面 x=0、轴伸向 -X）。'
    +'<b>浏览器不能直接显示 STEP</b>——点它会下载文件，请导入 SolidWorks / NX / UG / Creo / Inventor / 中望3D 打开；'
    +'需要原厂精确模型时，用下方 ⑦ 直接从西门子商城下载该订货号的官方 STEP。</span></div>';
  /**/
  if(location.protocol!=='file:')setTimeout(function(){
    const box=$('dlbox');if(!box)return;
    box.querySelectorAll('a').forEach(function(a){
      fetch(a.getAttribute('data-u'),{method:'HEAD'}).then(r=>{
        if(!r.ok){a.style.display='none';maybeDlNote(box);}
      }).catch(function(){a.style.display='none';maybeDlNote(box);});
    });
  },50);
  function maybeDlNote(box){
    const links=[].filter.call(box.querySelectorAll('a'),function(a){return a.style.display!=='none';});
    if(links.length||$('dlnote'))return;
    const show=function(msg){
      if($('dlnote'))return;
      const n=document.createElement('div');n.id='dlnote';n.className='note';n.innerHTML=msg;
      box.parentNode.appendChild(n);
    };
    /*
*/
    fetch('data.js',{method:'HEAD'}).then(function(r){
      show(r.ok
        ? '<b>当前是「预览面板」环境，这 4 个成品文件看不到。</b>预览面板只挂载本目录的顶层文件，'
          +'<code>deliverables/</code> 子目录里的图纸与模型取不到，所以链接被自动隐藏了（<b>不是没生成，文件都在</b>）。'
          +'两个办法：① 点上面的 <b>⚡ 本页即时生成</b>，任何环境都能出参数表 / 曲线 / 尺寸图 PDF；'
          +'② 用<b>系统浏览器</b>直接打开 <code>选型工具/index.html</code>，这 4 个成品文件即可正常点开（点击即另存为）。'
        : '该型号为新增数据，交付文件尚未批量生成。请点上方 <b>⚡ 本页即时生成</b> 立即拿到参数表 / 曲线 / 尺寸图 PDF，'
          +'或用下方 ⑦ 按订货号在西门子工业商城下载原厂图纸与三维模型。');
    }).catch(function(){
      show('当前环境取不到本目录的文件列表（浏览器安全限制）。请点上方 <b>⚡ 本页即时生成</b>；'
        +'若要打开下面 4 个成品文件，请把整个「选型工具」文件夹放到本地，用系统浏览器打开 index.html。');
    });
  }
  h+='</div>';

  /**/
  const mallDocs=[
    {n:'官方数据表 PDF（参数表）',did:'DCS_DATASHEET_CLEANED',main:true},
    {n:'电机特性曲线 PDF（转速-扭矩）',did:'DCS_CURVES'},
    {n:'外形尺寸图 PDF',did:'CADGENPLUS2D'},
    {n:'外形尺寸图 DXF',did:'CADGEN2DDXF'},
    {n:'三维模型 STEP',did:'CADGENPLUS3DSTEP',main:true}
  ];
  h+='<div class="card" style="margin-top:14px"><h3>⑦ 官方图纸 / 曲线 / 三维模型下载 <span class="tag">西门子工业商城 SPICE</span></h3>';
  /*




*/
  const mallArt=(function(){
    const b=(m.base||'').toUpperCase();
    if(!b||b.indexOf('-')<0)return ord.full;
    let sib=null;
    if(typeof PRICES!=='undefined'){
      const ks=Object.keys(PRICES).filter(function(k){
        const u=k.toUpperCase();
        return u.indexOf(b)===0 && u.length>b.length && /^[0-9A-Z\-]+$/.test(u)
          && /^(1FL6|1FL2|1FK2|1FK7|1FT2|1FT7|1PH8)/.test(u);
      });
      if(ks.length){
        const hit=ks.find(function(k){return k.toUpperCase()===ord.full.toUpperCase();});
        if(hit)return hit;
        sib=ks.sort()[0];
      }
    }
    const mv=(DATA.mall_variants||{})[b];
    if(mv)return mv;
    if(sib)return sib;
    return ord.full;
  })();
  const mallKnown=(mallArt.toUpperCase()!==ord.full.toUpperCase())
    ||!!((DATA.mall_variants||{})[(m.base||'').toUpperCase()]);
  const mallNote=(mallArt.toUpperCase()!==ord.full.toUpperCase())
    ?'　<span style="color:var(--amber)">↩ 推荐订货号 '+ord.full+' 商城未登记（这个选件组合商城没卖过，直链会报错/空白），'
      +'已<b>自动换成该基本型号在商城登记过的号</b>（'+mallArt+'）去取文件 —— 文档按基本型号通用（法兰/电气参数完全一样），'
      +'<b>下单请仍按上方 ① 区的推荐订货号</b></span>':'';
  h+='<div class="kv"><b>下载订货号</b><span><span class="order">'+mallArt+'</span>'+mallNote+'</span></div>';
  if(!mallKnown){
    h+='<div class="alert">⚠ 上面的下载订货号是<b>按你选的选项拼装出来的</b>（格式已按官方样本逐位核对），'
      +'但西门子商城只登记它实际销售过的选件组合——这个组合若没卖过，点下面的链接会显示错误/空白，属正常现象。'
      +'<b>这种情况请直接用上方 ⑥ 区的文件</b>：⑥ 里那排 <b>⚡ 本页即时生成</b> 一定会出 PDF（参数表 / 曲线 / 尺寸图），'
      +'4 个 📄 成品文件（含 STEP 三维模型）与 ⑦ 的原厂文件内容一致；也可以先点 📋 复制订货号，'
      +'自己到西门子工业商城按号查一下有没有这个组合。</div>';
  }
  h+='<div class="dl">';
  mallDocs.forEach(d=>{h+='<a class="'+(d.main?'main':'')+'" href="'+mallLink(mallArt,d.did)+'" target="_blank" rel="noopener">⬇ '+d.n+'</a>';});
  h+='<a href="javascript:void(0)" onclick="copyOrd(\''+mallArt+'\',this)">📋 复制订货号</a>';
  h+='</div>';
  h+='<div class="kv"><b>说明</b><span>链接由西门子商城文档服务按订货号直接生成，点击即下载原厂文件；CAD/STEP 首次生成约需 1 分钟。'
    +'数据表与特性曲线为 1 页 PDF，尺寸图为带公差标注的工程图，STEP 为 AP214 三维模型（导入 SolidWorks/UG/Creo 使用）。'
    +'<b>仅当该完整订货号在商城有登记时才有效</b>：若点开显示错误 — 先等约 1 分钟再点一次（商城接口偶发限流）；'
    +'若仍失败，就是这个选件组合商城没卖过，<b>改用 ⑥ 区文件即可，两者内容一致</b>。'
    +(mallKnown?'本机型已找到商城登记过的同基本型号号，正常情况下点开即可下载。':'')+'</span></div>';
  if(m._alt&&m._alt.length)h+='<div class="kv"><b>同基型号变体</b><span>'+m._alt.join('、')+'（仅尾码/抱闸编码不同，图纸相同）</span></div>';
  h+='</div>';

  /**/
  h+=bomCard(m,q,'⑧');

  /**/
  if(m.system==='S120'){
    h+='<div class="note">★ 中大功率单轴替代方案（工程案例 REF-02）：<b>1FK2206-4AF10-1MA0</b>（SIMOTICS S-1FK2，M0=12 N·m／额定 9.1 N·m @3000 rpm／2.85 kW／380–480 V，22 位+12 位多圈绝对编码器，带抱闸 13 N·m，IP64，轴高 63，轴端 D24×50）'
     +' + <b>SINAMICS S210 6SL5310-1BE13-5DF1</b>（3AC 400V，3.5 kW，PN）。1FK2 是 1FK7 换代产品，新项目建议优先评估。'
     +'<br>※ <b>1FK2 与 S210 现已正式收录进本工具机型库</b>（28 台 1FK2 + 8 档 S210 驱动器）：把上方「驱动系统」改为 <b>S210（1FK2）</b> 即可按 1FK2 原方案选型、报价并下载图纸；按 1FK7/1FT7 选出来的候选是电气等价的上一代方案，价格通常更成熟、货期更短，可作为对比。'
     +'<br>※ 接线：1FK2＋S210 用 <b>OCC 单电缆</b>（一根线并走动力＋编码器＋抱闸），不是「动力线＋编码器线」两根；选 S210 后第 ③ 区会按轴高自动给出接头规格（SH30/40/48/52 → M17 = 6FX5002-8QN08，0.75 mm²；SH63/80/100 → M23 = 6FX5002-8QN11，1.5 mm²）。50 m 即 <b>6FX5002-8QN11-1FA0</b>——长度码第二位 A=0/B=10/C=20/D=30/E=40/<b>F=50</b>，<b>1DA0 只代表 30 m</b>。另：OCC 电缆允许最长 50 m（已是上限），S210 内置滤波器仅保证 C3 到 25 m 电机线长，50 m 需另核 EMC 措施。</div>';
  }
  if(m.system==='S210'){
    h+='<div class="note">★ 本页为第四代方案 <b>SINAMICS S210 + SIMOTICS S-1FK2</b>：单轴、PROFINET、内置 STO 与 EPOS 定位，配 <b>OCC 单电缆</b>（一根线走动力＋编码器＋抱闸），现场布线最省。'
     +'<br>※ 相比上一代（S120 + 1FK7/1FT7）：1FK2 功率密度更高、同功率体积更小，但 1FK2 <b>只有 380…480 V 档</b>（无 220 V）；S210 <b>只有 PN 总线</b>（无脉冲），且为单轴驱动器（多轴请选 S120 CU320-2）。'
     +'<br>※ 订货号已按官方《1FK2 配置手册》2.5 数据位逐位拼装（抱闸／防护／轴端／编码器／连接），可在上方把「抱闸 / 输出轴 / 防护等级」改一改，「① 伺服电机」里的推荐订货号会跟着变。'
     +'<br>※ 防护等级：1FK2 默认 IP64，选 IP65 后带径向轴密封圈——<b>SH30/SH40 的可用轴伸会被密封圈缩短</b>（SH30 由 14×30 缩到 14×21.5），带轮/联轴器要按缩短后的轴伸复核。</div>';
  }

  $('result').innerHTML=h;
  if(!noScroll)$('result').scrollIntoView({behavior:'smooth',block:'start'});
}

/*
*/
function dimImgKey(m){
  const code=(m.model||m.base||'')+'';
  if(m.family==='1FL6')return 'V90:'+m.sh;
  if(m.family==='1FL2')return '1FL2:'+m.sh;
  if(m.family==='1FK7')return 'D214:1FK7';
  if(m.family==='1FT7')return /-5?[A-Z]*W/.test(code)?'D214:1FT7DC':'D214:1FT7';
  if(m.family==='1FK2'){
    const mt=code.match(/1FK2(\d{3})/);if(!mt)return null;
    return '1FK2:'+(['105','205','208','210'].indexOf(mt[1])>=0?mt[1]:mt[1].slice(1));
  }
  return null;
}
function dimFIG(m){
  let img=null;
  try{const k=dimImgKey(m);img=k&&(window.DIMIMG||{})[k]||null;}catch(e){}
  if(img)return ['<img src="'+img+'" style="width:100%;display:block" alt="外形尺寸图（西门子官方图纸）">','（西门子官方图纸）'];
  const svg=dimSVG(m);
  return [svg||'<div class="note">该机型暂无结构化尺寸数据，暂不能画示意图，请以下方尺寸表与交付文件为准。</div>','（示意工程图）'];
}
/*

*/
function dimSVG(m){
  /**/
  const F=m.flange||{},D2=m.dim2||{},DM=m.dim||{};
  const Lw=D2.L||DM.LL,Lb=D2.L1||DM.LLb,E=F.E||DM.E,AB=F.AB||DM.LC,Dd=F.D||DM.D;
  const P=F.P,N=F.N||DM.LB,S=F.S,M=F.M,T=F.T||DM.T,GA=F.GA||DM.GA,Fw=F.F||DM.F;
  const hasSide=!!(Lw&&E&&Dd),hasEnd=!!(AB&&Dd&&(P||N));
  if(!hasSide&&!hasEnd)return '';
  const r1=function(x){return Math.round(x*10)/10;};
  /**/
  let s=Math.min(hasSide?(250/((E||0)+Math.max(Lb||Lw,0))):9,hasEnd?(140/Math.max(AB,(P||0))):9);
  s=Math.max(0.25,Math.min(s,1.3));
  const ST='#1c2a38',LN='#8a97a5',DIM='#222',TXT='#111';
  const ah=function(x,y,a){const a1=a+Math.PI*0.94,a2=a-Math.PI*0.94;
    return '<polygon points="'+r1(x)+','+r1(y)+' '+r1(x+8*Math.cos(a1))+','+r1(y+8*Math.sin(a1))+' '+r1(x+8*Math.cos(a2))+','+r1(y+8*Math.sin(a2))+'" fill="'+DIM+'"/>';};
  const cl=function(x1,y1,x2,y2){return '<line x1="'+r1(x1)+'" y1="'+r1(y1)+'" x2="'+r1(x2)+'" y2="'+r1(y2)+'" stroke="#667" stroke-width="0.7" stroke-dasharray="10 3 2 3"/>';};
  const ext=function(x1,y1,x2,y2){return '<line x1="'+r1(x1)+'" y1="'+r1(y1)+'" x2="'+r1(x2)+'" y2="'+r1(y2)+'" stroke="'+LN+'" stroke-width="0.6"/>';};
  const dimH=function(x1,x2,y,label){
    const a=x2>x1?0:Math.PI;
    return '<line x1="'+r1(x1)+'" y1="'+r1(y)+'" x2="'+r1(x2)+'" y2="'+r1(y)+'" stroke="'+DIM+'" stroke-width="0.9"/>'
      +ah(x1,y,a)+ah(x2,y,Math.PI+a)
      +'<text x="'+r1((x1+x2)/2)+'" y="'+r1(y-4)+'" text-anchor="middle" font-size="11" fill="'+TXT+'">'+label+'</text>';};
  const leader=function(x,y,tx,ty,label){
    return '<line x1="'+r1(x)+'" y1="'+r1(y)+'" x2="'+r1(tx)+'" y2="'+r1(ty)+'" stroke="'+DIM+'" stroke-width="0.8"/>'
      +'<text x="'+r1(tx+(tx<x?-4:4))+'" y="'+r1(ty+4)+'" text-anchor="'+(tx<x?'end':'start')+'" font-size="11" fill="'+TXT+'">'+label+'</text>';};
  let g='';
  /**/
  if(hasSide){
    const y0=140,x0=70,t=Math.max((T||8)*s,4),h=(AB?AB*s:70),dsh=Math.max(Dd*s,4);
    const xF=x0+E*s,xR=xF+(Lb||Lw)*s;
    g+=cl(45,y0,xR+22,y0);
    /**/
    g+='<rect x="'+r1(xF)+'" y="'+r1(y0-h/2)+'" width="'+r1((Lw)*s)+'" height="'+r1(h)+'" fill="none" stroke="'+ST+'" stroke-width="1.3"/>';
    g+='<line x1="'+r1(xF+Lw*s*0.33)+'" y1="'+r1(y0-h/2)+'" x2="'+r1(xF+Lw*s*0.33)+'" y2="'+r1(y0+h/2)+'" stroke="'+LN+'" stroke-width="0.6"/>';
    g+='<line x1="'+r1(xF+Lw*s*0.66)+'" y1="'+r1(y0-h/2)+'" x2="'+r1(xF+Lw*s*0.66)+'" y2="'+r1(y0+h/2)+'" stroke="'+LN+'" stroke-width="0.6"/>';
    g+='<rect x="'+r1(xF-t)+'" y="'+r1(y0-(h+8)/2)+'" width="'+r1(t)+'" height="'+r1(h+8)+'" fill="#fff" stroke="'+ST+'" stroke-width="1.3"/>';
    if(Lb&&Lb>Lw)g+='<rect x="'+r1(xF+Lw*s)+'" y="'+r1(y0-(h*0.82)/2)+'" width="'+r1((Lb-Lw)*s)+'" height="'+r1(h*0.82)+'" fill="none" stroke="'+ST+'" stroke-width="1.1"/>';
    /**/
    g+='<rect x="'+r1(x0)+'" y="'+r1(y0-dsh/2)+'" width="'+r1(xF-x0)+'" height="'+r1(dsh)+'" fill="#fff" stroke="'+ST+'" stroke-width="1.2"/>';
    /**/
    g+=ext(x0,y0-dsh/2,x0,56)+ext(xF,y0-(h+8)/2,xF,40)+ext(xR,y0-h/2,xR,40);
    if(Lb){g+=dimH(xF,xR,46,'L '+Lw);if(Lb>Lw)g+=dimH(xF,xR,68,'L1 '+Lb+'（带抱闸）');}
    else g+=dimH(xF,xR,46,'L '+Lw);
    g+=dimH(x0,xF,88,'E '+E);
    g+=leader(x0+(xF-x0)*0.55,y0+dsh/2,x0+6,222,'⌀'+Dd);
    g+=leader(xF-t/2,y0-(h+8)/2,30,110,''+(T!=null?T:'—'));
  }
  /**/
  if(hasEnd){
    const cx=515,cy=140,sq=AB*s,rP=(P?P*s/2:0),rN=(N?N*s/2:0),rD=Dd*s/2;
    g+=cl(cx-115,cy,cx+115,cy)+cl(cx,cy-115,cx,cy+115);
    g+='<rect x="'+r1(cx-sq/2)+'" y="'+r1(cy-sq/2)+'" width="'+r1(sq)+'" height="'+r1(sq)+'" fill="none" stroke="'+ST+'" stroke-width="1.3"/>';
    if(P)g+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r1(rP)+'" fill="none" stroke="'+ST+'" stroke-width="1.2"/>';
    if(N)g+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r1(rN)+'" fill="none" stroke="'+ST+'" stroke-width="1" stroke-dasharray="5 3"/>';
    /**/
    if(S){
      const rb=(M?M*s/2:sq*0.33),rh=Math.max(S*s,2.5);
      for(let k=0;k<4;k++){
        const a=Math.PI/4+k*Math.PI/2,hx=cx+rb*Math.cos(a),hy=cy-rb*Math.sin(a);
        g+='<circle cx="'+r1(hx)+'" cy="'+r1(hy)+'" r="'+r1(rh)+'" fill="none" stroke="'+ST+'" stroke-width="1"/>';
      }
      g+=leader(cx+rb*Math.cos(Math.PI/4),cy-rb*Math.sin(Math.PI/4),cx+118,cy-96,'4×⌀'+S);
    }else{
      const rb=sq*0.35;
      [Math.PI/4,Math.PI*3/4,Math.PI*1.5].forEach(function(a){
        g+='<circle cx="'+r1(cx+rb*Math.cos(a))+'" cy="'+r1(cy-rb*Math.sin(a))+'" r="4" fill="none" stroke="'+ST+'" stroke-width="1"/>';
      });
    }
    /**/
    g+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r1(rD)+'" fill="#fff" stroke="'+ST+'" stroke-width="1.2"/>';
    if(Fw)g+='<rect x="'+r1(cx-Fw*s/2)+'" y="'+r1(cy-rD-Fw*s*0.55)+'" width="'+r1(Fw*s)+'" height="'+r1(Fw*s*0.75)+'" fill="#fff" stroke="'+ST+'" stroke-width="1"/>';
    if(Fw&&GA)g+=leader(cx+Fw*s/2,cy-rD,cx+118,cy-44,'键 '+Fw+'×'+GA);
    g+=leader(cx+rD*0.5,cy+rD*0.5,cx+128,cy-8,'⌀'+Dd);
    if(P)g+=leader(cx-rP*0.62,cy-rP*0.62,cx-132,cy-88,'⌀'+P);
    if(N)g+=leader(cx-rN*0.62,cy+rN*0.62,cx-132,cy+78,'⌀'+N);
    /**/
    g+=ext(cx-sq/2,cy+sq/2,cx-sq/2,cy+sq/2+26)+ext(cx+sq/2,cy+sq/2,cx+sq/2,cy+sq/2+26);
    g+=dimH(cx-sq/2,cx+sq/2,cy+sq/2+20,AB+'×'+AB);
  }
  /**/
  const dt=new Date();
  const ds=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
  let tb='';
  const tbx=372,tby=248,tbw=316,tbh=46;
  tb+='<rect x="'+tbx+'" y="'+tby+'" width="'+tbw+'" height="'+tbh+'" fill="#fff" stroke="'+ST+'" stroke-width="1"/>';
  tb+='<line x1="'+tbx+'" y1="'+(tby+15)+'" x2="'+(tbx+tbw)+'" y2="'+(tby+15)+'" stroke="'+ST+'" stroke-width="0.7"/>';
  tb+='<line x1="'+tbx+'" y1="'+(tby+30)+'" x2="'+(tbx+tbw)+'" y2="'+(tby+30)+'" stroke="'+ST+'" stroke-width="0.7"/>';
  tb+='<line x1="'+(tbx+62)+'" y1="'+tby+'" x2="'+(tbx+62)+'" y2="'+(tby+tbh)+'" stroke="'+ST+'" stroke-width="0.7"/>';
  tb+='<g font-size="10" fill="'+TXT+'">'
    +'<text x="'+(tbx+5)+'" y="'+(tby+11)+'">机型</text><text x="'+(tbx+68)+'" y="'+(tby+11)+'">'+(m.base||m.model)+'</text>'
    +'<text x="'+(tbx+5)+'" y="'+(tby+26)+'">订货号</text><text x="'+(tbx+68)+'" y="'+(tby+26)+'">'+(m.order_no||m.base||m.model)+'</text>'
    +'<text x="'+(tbx+5)+'" y="'+(tby+41)+'">日期</text><text x="'+(tbx+68)+'" y="'+(tby+41)+'">'+ds+'　单位 mm　比例 —（示意）</text>'
    +'</g>';
  const note='<text x="14" y="'+(tby+tbh-4)+'" font-size="10" fill="#5b6672">外形尺寸示意图（非比例，无公差标注）— 带公差正式图纸见交付文件「外形尺寸图 PDF」/ 商城 DXF</text>';
  return '<svg viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;background:#fff">'
    +'<rect x="2" y="2" width="696" height="296" fill="none" stroke="'+ST+'" stroke-width="1.6"/>'
    +'<rect x="8" y="8" width="684" height="284" fill="none" stroke="'+ST+'" stroke-width="0.7"/>'
    +g+note+tb+'</svg>';
}

function curveSVG(m){
  const W=640,H=300,padL=54,padB=36,padT=16,padR=16;
  const nn=m.nn,nx=nmaxEff(m)||m.nn*2,mn=m.mn,mx=m.mmax||m.mn*3;
  const x=v=>padL+(v/nx)*(W-padL-padR);
  const y=v=>H-padB-(v/mx)*(H-padB-padT);
  let s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:680px;background:#fff;border:1px solid var(--line);border-radius:8px">';
  s+='<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padR)+'" y2="'+(H-padB)+'" stroke="#98a4b0"/>';
  s+='<line x1="'+padL+'" y1="'+padT+'" x2="'+padL+'" y2="'+(H-padB)+'" stroke="#98a4b0"/>';
  for(let i=0;i<=4;i++){const gx=padL+i*(W-padL-padR)/4;
    s+='<line x1="'+gx+'" y1="'+padT+'" x2="'+gx+'" y2="'+(H-padB)+'" stroke="#edf1f5"/>';
    s+='<text x="'+gx+'" y="'+(H-padB+14)+'" font-size="10" fill="#5b6672" text-anchor="middle">'+Math.round(nx*i/4)+'</text>';}
  for(let i=0;i<=4;i++){const gy=(H-padB)-i*(H-padB-padT)/4;
    s+='<line x1="'+padL+'" y1="'+gy+'" x2="'+(W-padR)+'" y2="'+gy+'" stroke="#edf1f5"/>';
    s+='<text x="'+(padL-6)+'" y="'+(gy+3)+'" font-size="10" fill="#5b6672" text-anchor="end">'+(mx*i/4).toFixed(mx<10?1:0)+'</text>';}
  //
  const xr=x(nn);
  s+='<rect x="'+padL+'" y="'+y(mx)+'" width="'+(xr-padL)+'" height="'+((H-padB)-y(mx))+'" fill="#e9f3ee" opacity="0.65"/>';
  s+='<rect x="'+xr+'" y="'+y(mn)+'" width="'+((W-padR)-xr)+'" height="'+((H-padB)-y(mn))+'" fill="#e2f4e9" opacity="0.6"/>';
  s+='<path d="M '+padL+' '+y(mx)+' L '+xr+' '+y(mx)+'" stroke="#0e7a4f" stroke-width="2.5" fill="none"/>';
  s+='<path d="M '+padL+' '+y(mn)+' L '+xr+' '+y(mn)+' L '+(W-padR)+' '+y(mn*0.75)+'" stroke="#c23a2b" stroke-width="2.5" fill="none" stroke-dasharray="0"/>';
  s+='<path d="M '+xr+' '+y(mn)+' L '+(W-padR)+' '+y(mn*0.75)+'" stroke="#1a8a4a" stroke-width="2.5" fill="none"/>';
  s+='<text x="'+(padL+xr)/2+'" y="'+(y(mx)-6)+'" font-size="11" fill="#0e7a4f" text-anchor="middle">峰值扭矩区 Mmax='+mx+'</text>';
  s+='<text x="'+(padL+xr)/2+'" y="'+(y(mn)+16)+'" font-size="11" fill="#0e7a4f" text-anchor="middle">连续（额定）Mn='+mn+'</text>';
  s+='<text x="'+xr+(W-padR-xr)/2+'" y="'+(y(mn)-6)+'" font-size="11" fill="#1a8a4a" text-anchor="middle">恒功率区（弱磁）</text>';
  s+='<line x1="'+xr+'" y1="'+padT+'" x2="'+xr+'" y2="'+(H-padB)+'" stroke="#b97a12" stroke-dasharray="4 3"/>';
  s+='<text x="'+xr+'" y="'+(padT+10)+'" font-size="10" fill="#b97a12" text-anchor="middle">n 额定 '+nn+' rpm</text>';
  s+='<text x="'+(W/2)+'" y="'+(H-4)+'" font-size="11" fill="#22303e" text-anchor="middle">转速 n (rpm)</text>';
  s+='<text x="14" y="'+(H/2)+'" font-size="11" fill="#22303e" text-anchor="middle" transform="rotate(-90 14 '+(H/2)+')">扭矩 M (N·m)</text>';
  s+='</svg>';
  return s;
}

function reset(){
  ['pnMin','pnMax','tqMin','tqMax','nnMin','nnMax','nxMin','nxMax'].forEach(i=>$(i).value='');
  $('sys').value='auto';$('brake').value='any';$('enc').value='any';$('shaft').value='any';$('env').value='any';
  $('volt').value='any';$('ctrl').value='any';$('clen').value='10';$('axes').value='single';
  $('cands').innerHTML='<div id="empty">条件已清空。</div>';
}

/**/
const V3D={gl:null,parts:[],rx:-0.5,ry:0.7,zoom:1,cx:0,cy:0,cz:0,drag:null,raf:0};
function _b64f(s,Type){const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new Type(a.buffer);}
function open3d(url){
  const old=document.getElementById('ov3d');if(old)old.remove();
  const ov=document.createElement('div');ov.id='ov3d';
  ov.style.cssText='position:fixed;inset:0;background:rgba(8,14,26,.82);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px';
  ov.innerHTML='<div style="background:#101a2c;border:1px solid #1e3a2e;border-radius:12px;width:100%;max-width:860px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden">'
   +'<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #1e3a2e">'
   +'<b style="color:#dce7f7;font-size:15px">三维预览 · '+url.split('/').pop().replace(/_官方三维模型_web\.json$/,'').replace(/_web\.json$/,'')+'</b>'
   +'<span style="cursor:pointer;color:#93b8a6;font-size:22px;line-height:1" onclick="this.closest(\'#ov3d\').remove();cancelAnimationFrame(V3D.raf)">✕</span></div>'
   +'<canvas id="cv3d" style="width:100%;flex:1;min-height:0;touch-action:none;cursor:grab;background:#0b1220"></canvas>'
   +'<div style="padding:8px 16px;color:#93b8a6;font-size:12px;border-top:1px solid #1e3a2e">左键拖动旋转 · 滚轮缩放 · 右键拖动平移 · 数据来自官方 STEP 网格转换</div></div>';
  document.body.appendChild(ov);
  fetch(url).then(r=>r.json()).then(j=>init3d(ov.querySelector('#cv3d'),j)).catch(e=>{ov.querySelector('#cv3d').outerHTML='<div style="color:#f88;padding:40px">加载失败：'+e+'</div>';});
}
function init3d(cv,j){
  const gl=cv.getContext('webgl',{antialias:true});
  V3D.gl=gl;V3D.parts=[];V3D.rx=-0.55;V3D.ry=0.75;V3D.zoom=1;V3D.cx=0;V3D.cy=0;V3D.cz=0;
  const vs='attribute vec3 p,n;uniform mat4 mvp;uniform mat3 nm;varying vec3 vn,wp;'
   +'void main(){gl_Position=mvp*vec4(p,1.0);vn=nm*n;wp=p;}';
  const fs='precision mediump float;varying vec3 vn,wp;uniform vec3 col;'
   +'void main(){vec3 L1=normalize(vec3(.5,.8,.6)),L2=normalize(vec3(-.6,-.2,-.5));'
   +'float d=max(dot(normalize(vn),L1),0.0)*.75+max(dot(normalize(vn),L2),0.0)*.25;'
   +'vec3 c=col*(0.28+0.72*d);gl_FragColor=vec4(c,1.0);}';
  function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(pr);gl.useProgram(pr);
  const lp=gl.getAttribLocation(pr,'p'),ln=gl.getAttribLocation(pr,'n');
  const umvp=gl.getUniformLocation(pr,'mvp'),unm=gl.getUniformLocation(pr,'nm'),ucol=gl.getUniformLocation(pr,'col');
  gl.enable(gl.DEPTH_TEST);
  let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
  j.parts.forEach(pt=>{
    const P=_b64f(pt.pos,Float32Array),I=pt.idx32?_b64f(pt.idx,Uint32Array):_b64f(pt.idx,Uint16Array);
    for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){const v=P[i+k];if(v<mn[k])mn[k]=v;if(v>mx[k])mx[k]=v;}
    const pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,P,gl.STATIC_DRAW);
    let nb=null;if(pt.nrm){nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,_b64f(pt.nrm,Float32Array),gl.STATIC_DRAW);}
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,I,gl.STATIC_DRAW);
    V3D.parts.push({pb,nb,ib,n:I.length,t:(pt.idx32?4:2),c:pt.color||[0.72,0.74,0.78]});
  });
  V3D.cx=(mn[0]+mx[0])/2;V3D.cy=(mn[1]+mx[1])/2;V3D.cz=(mn[2]+mx[2])/2;
  const R=Math.max(mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2])||1;V3D.rad=R;
  function resize(){
    const dpr=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;
    cv.width=w*dpr;cv.height=h*dpr;gl.viewport(0,0,cv.width,cv.height);
  }
  function draw(){
    resize();
    gl.clearColor(0.043,0.071,0.125,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const dist=V3D.rad*2.6/V3D.zoom;
    const ox=dist*Math.cos(V3D.rx)*Math.sin(V3D.ry),oy=dist*Math.sin(V3D.rx),oz=dist*Math.cos(V3D.rx)*Math.cos(V3D.ry);
    const eye=[V3D.cx+ox,V3D.cy+oy,V3D.cz+oz];
    const tgt=[V3D.cx,V3D.cy,V3D.cz];
    let f=[tgt[0]-eye[0],tgt[1]-eye[1],tgt[2]-eye[2]];let fl=Math.hypot(f[0],f[1],f[2])||1;f=[f[0]/fl,f[1]/fl,f[2]/fl];
    let s=[-f[2],0,f[0]];const sl=Math.hypot(s[0],s[2])||1;s=[s[0]/sl,0,s[2]/sl];
    const u=[s[1]*f[2]-s[2]*f[1],s[2]*f[0]-s[0]*f[2],s[0]*f[1]-s[1]*f[0]];
    const n=0.01,fa=500,fovy=0.6;
    const sc=1/Math.tan(fovy/2),asp=cv.width/cv.height;
    const Pm=[sc/asp,0,0,0, 0,sc,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0];
    const Vm=[s[0],u[0],-f[0],0, s[1],u[1],-f[1],0, s[2],u[2],-f[2],0,
      -(s[0]*eye[0]+s[1]*eye[1]+s[2]*eye[2]),-(u[0]*eye[0]+u[1]*eye[1]+u[2]*eye[2]),-(-f[0]*eye[0]-f[1]*eye[1]-f[2]*eye[2]),1];
    function mul(a,b){const o=new Array(16);for(let i=0;i<4;i++)for(let k=0;k<4;k++){let q2=0;for(let q=0;q<4;q++)q2+=a[q*4+k]*b[i*4+q];o[i*4+k]=q2;}return o;}
    const MVP=mul(Pm,Vm);
    gl.uniformMatrix4fv(umvp,false,new Float32Array(MVP));
    gl.uniformMatrix3fv(unm,false,new Float32Array([1,0,0,0,1,0,0,0,1]));
    V3D.parts.forEach(p=>{
      gl.bindBuffer(gl.ARRAY_BUFFER,p.pb);gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,p.nb||p.pb);gl.enableVertexAttribArray(ln);gl.vertexAttribPointer(ln,3,gl.FLOAT,false,0,0);
      gl.uniform3fv(ucol,p.c);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,p.ib);
      gl.drawElements(gl.TRIANGLES,p.n,(p.t===4?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT),0);
    });
    V3D.raf=requestAnimationFrame(draw);
  }
  /**/
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('mousedown',e=>{V3D.drag={b:e.button,x:e.clientX,y:e.clientY};cv.style.cursor='grabbing';});
  window.addEventListener('mouseup',()=>{V3D.drag=null;cv.style.cursor='grab';});
  window.addEventListener('mousemove',e=>{
    if(!V3D.drag)return;const dx=e.clientX-V3D.drag.x,dy=e.clientY-V3D.drag.y;
    if(V3D.drag.b===2){const s=V3D.rad*0.0016/V3D.zoom;
      V3D.cx-=dx*s*Math.cos(V3D.ry);V3D.cz+=dx*s*Math.sin(V3D.ry);V3D.cy+=dy*s;}
    else{V3D.ry+=dx*0.008;V3D.rx=Math.max(-1.55,Math.min(1.55,V3D.rx+dy*0.008));}
    V3D.drag.x=e.clientX;V3D.drag.y=e.clientY;
  });
  cv.addEventListener('wheel',e=>{e.preventDefault();V3D.zoom*=e.deltaY<0?1.12:0.89;V3D.zoom=Math.max(0.15,Math.min(12,V3D.zoom));},{passive:false});
  let pt=null;
  cv.addEventListener('touchstart',e=>{if(e.touches.length===1)pt={x:e.touches[0].clientX,y:e.touches[0].clientY};else if(e.touches.length===2)pt={d:Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),z:V3D.zoom};e.preventDefault();},{passive:false});
  cv.addEventListener('touchmove',e=>{
    if(e.touches.length===1&&pt&&pt.x!=null){V3D.ry+=(e.touches[0].clientX-pt.x)*0.008;V3D.rx=Math.max(-1.55,Math.min(1.55,V3D.rx+(e.touches[0].clientY-pt.y)*0.008));pt={x:e.touches[0].clientX,y:e.touches[0].clientY};}
    else if(e.touches.length===2&&pt&&pt.d){V3D.zoom=Math.max(0.15,Math.min(12,pt.z*pt.d/Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)));}
    e.preventDefault();},{passive:false});
  cv.style.cursor='grab';
  /**/
  cancelAnimationFrame(V3D.raf);draw();
}

/*


*/
function pdfI18n(html){
  if(!window.LANG_I18N||LANG_I18N.lang==='zh')return html;
  /**/
  html=String(html).replace('</head>','<style>table.kv2 td.k{width:auto;min-width:118px;max-width:34%;word-break:break-word;}</style></head>');
  var note=LANG_I18N.fxNote();
  if(note)html=String(html).replace('</body>','<div style="margin-top:14px;padding:8px 12px;border:1px solid #f0e0b8;'
    +'background:#fffaf0;border-radius:6px;color:#7a5b13;font-size:10px;line-height:1.6">'+note+'</div></body>');
  return LANG_I18N.trHTML(html);
}
(function(){
  var _bom=bomPrintHTML, _spec=specPrintHTML;
  bomPrintHTML=function(m,q){return pdfI18n(_bom(m,q));};
  specPrintHTML=function(m,q){return pdfI18n(_spec(m,q));};
})();
/**/
window.__langRerender=function(){
  try{ if(window._last&&window._last.length)run(); }catch(e){}
  try{ if(CURSEL)renderResult(CURSEL.m,CURSEL.q,true); }catch(e){}
};
