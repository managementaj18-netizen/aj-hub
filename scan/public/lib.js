/* Soramma Scan — pure helpers (no DOM): MRZ parsing, document edge detection, perspective warp, enhancement, PDF writer. */
(function(root){"use strict";
var SC={};

/* ---------- MRZ ---------- */
var W=[7,3,1];
function val(c){if(c==="<")return 0;var n=c.charCodeAt(0);if(n>=48&&n<=57)return n-48;if(n>=65&&n<=90)return n-55;return 0}
function cd(s){var t=0;for(var i=0;i<s.length;i++)t+=val(s[i])*W[i%3];return t%10}
SC.checkDigit=cd;
var D2L={"0":"O","1":"I","2":"Z","5":"S","8":"B","6":"G"},L2D={O:"0",Q:"0",D:"0",I:"1",L:"1",Z:"2",S:"5",B:"8",G:"6",T:"7"};
function num(s){return s.split("").map(function(c){return L2D[c]||c}).join("")}
function alp(s){return s.split("").map(function(c){return D2L[c]||c}).join("")}
function dateISO(yymmdd,kind){if(!/^\d{6}$/.test(yymmdd))return"";var yy=+yymmdd.slice(0,2),mm=yymmdd.slice(2,4),dd=yymmdd.slice(4,6),cur=new Date().getFullYear()%100,y;
  if(kind==="dob")y=yy>cur?1900+yy:2000+yy;else y=yy>=70?1900+yy:2000+yy;
  if(+mm<1||+mm>12||+dd<1||+dd>31)return"";return y+"-"+mm+"-"+dd}
function cleanTail(s){var t=String(s||"").replace(/\s+/g," ").trim().split(" ");while(t.length>1&&/^[KLCSXEZ]{3,}$/.test(t[t.length-1]))t.pop();if(t.length)t[t.length-1]=t[t.length-1].replace(/[KLC]{3,}$/,"");return t.filter(Boolean).join(" ")}
function nameTokens(p){return p.split(/<+/).filter(function(t){return t&&!/^[KLCSXEZ]+$/.test(t)})}
function nm(raw){var s=alp(String(raw).replace(/\s+/g,"<").replace(/O0(?=<|$)/g,"O")).replace(/0/g,"O").replace(/^<+/,""),i=s.indexOf("<<"),sur="",giv="",end=0;
  if(i>=2){var gp=s.slice(i+2).split("<<")[0],st=nameTokens(s.slice(0,i)),gt=nameTokens(gp);sur=st.join(" ");giv=gt.join(" ");end=gt.length?s.indexOf(gt[gt.length-1],i+2)+gt[gt.length-1].length:i+2}
  if(!giv){var tk=nameTokens(s);if(tk.length>=3)tk=tk.filter(function(t,k){return k===0||k===tk.length-1||t.length>2});sur=tk[0]||"";giv=tk.slice(1).join(" ");end=tk.length?s.lastIndexOf(tk[tk.length-1])+tk[tk.length-1].length:0}
  /* OCR often reads the first filler '<' after the last name as a glued L/K: drop one when lots of such noise follows */
  var last=giv||sur;if(last.length>3&&/[KL]$/.test(last)&&/[KLCSXEZ]{6,}/.test(s.slice(end).replace(/</g,"")))last=last.slice(0,-1);
  if(giv)giv=last;else sur=last;
  return{surname:cleanTail(sur),given:cleanTail(giv)}}
function norm(line){return String(line).toUpperCase().replace(/\s+/g,"").replace(/[«‹›»]/g,"<").replace(/[^A-Z0-9<]/g,"<")}
function fit(s,n){return s.length>=n?s.slice(0,n):s+new Array(n-s.length+1).join("<")}
var AMB={O:["0"],"0":["O"],I:["1"],"1":["I","7"],B:["8"],"8":["B"],S:["5"],"5":["S"],Z:["2","7"],"2":["Z"],G:["6"],"6":["G"],"7":["Z","1"]};
function repair(f,d){/* alphanumeric field: if its check digit fails, try swapping look-alike characters until it passes */
  var dd=+num(d);if(cd(f)===dd)return f;var pos=[],i;for(i=0;i<f.length;i++)if(AMB[f[i]])pos.push(i);if(pos.length>9)return f;var tries=0,found=null;
  (function go(k,cur){if(found||tries>20000)return;if(k===pos.length){tries++;if(cd(cur.join(""))===dd&&cur.join("")!==f)found=cur.join("");return}
    go(k+1,cur);var o=AMB[cur[pos[k]]],orig=cur[pos[k]];for(var j=0;j<o.length;j++){cur[pos[k]]=o[j];go(k+1,cur)}cur[pos[k]]=orig})(0,f.split(""));
  return found||f}
function parseTD3(a,b){a=fit(a,44);b=fit(b,44);
  var docno=repair(b.slice(0,9),b[9]),dcd=num(b[9]),nat=alp(b.slice(10,13)),dob=num(b.slice(13,19)),dobcd=num(b[19]),sex=b[20],exp=num(b.slice(21,27)),expcd=num(b[27]),pers=repair(b.slice(28,42),b[42]),perscd=num(b[42]),fin=num(b[43]);
  var ok={docno:cd(docno)===+dcd,dob:cd(dob)===+dobcd,exp:cd(exp)===+expcd,final:cd(docno+b[9]+b.slice(13,20)+b.slice(21,28)+pers+b[42])===+fin};
  var n=nm(a.slice(5,44));
  return{form:"TD3",type:a.slice(0,2).replace(/</g,""),issuer:alp(a.slice(2,5)).replace(/</g,""),surname:n.surname,given:n.given,docno:docno.replace(/</g,""),nationality:nat.replace(/</g,""),dob:dateISO(dob,"dob"),sex:sex==="M"||sex==="F"?sex:"",expiry:dateISO(exp,"exp"),personal:pers.replace(/</g,""),ok:ok}}
function parseTD2(a,b){a=fit(a,36);b=fit(b,36);
  var docno=repair(b.slice(0,9),b[9]),dcd=num(b[9]),nat=alp(b.slice(10,13)),dob=num(b.slice(13,19)),dobcd=num(b[19]),sex=b[20],exp=num(b.slice(21,27)),expcd=num(b[27]),opt=b.slice(28,35),fin=num(b[35]);
  var ok={docno:cd(docno)===+dcd,dob:cd(dob)===+dobcd,exp:cd(exp)===+expcd,final:cd(docno+b[9]+b.slice(13,20)+b.slice(21,35))===+fin};
  var n=nm(a.slice(5,36));
  return{form:"TD2",type:a.slice(0,2).replace(/</g,""),issuer:alp(a.slice(2,5)).replace(/</g,""),surname:n.surname,given:n.given,docno:docno.replace(/</g,""),nationality:nat.replace(/</g,""),dob:dateISO(dob,"dob"),sex:sex==="M"||sex==="F"?sex:"",expiry:dateISO(exp,"exp"),personal:opt.replace(/</g,""),ok:ok}}
function fill(s){return/^[<KLCSXEZ]*$/.test(s)?new Array(s.length+1).join("<"):s}
function nmTD1(c){return nm(norm(c))}
function parseTD1(a,b,c){a=a.length>=15?a.slice(0,15)+fill(a.slice(15,30)):a;a=fit(a,30);
  if(b.length>=19&&b.length!==30)b=b.slice(0,18)+new Array(12).join("<")+b[b.length-1];else if(b.length===30)b=b.slice(0,18)+fill(b.slice(18,29))+b[29];
  b=fit(b,30);
  var docno=repair(a.slice(5,14),a[14]),dcd=num(a[14]),dob=num(b.slice(0,6)),dobcd=num(b[6]),sex=b[7],exp=num(b.slice(8,14)),expcd=num(b[14]),nat=alp(b.slice(15,18)),fin=num(b[29]);
  var ok={docno:cd(docno)===+dcd,dob:cd(dob)===+dobcd,exp:cd(exp)===+expcd,final:cd(docno+a.slice(14,30)+b.slice(0,7)+b.slice(8,15)+b.slice(18,29))===+fin};
  var n=nmTD1(c);
  return{form:"TD1",type:a.slice(0,2).replace(/</g,""),issuer:alp(a.slice(2,5)).replace(/</g,""),surname:n.surname,given:n.given,docno:docno.replace(/</g,""),nationality:nat.replace(/</g,""),dob:dateISO(dob,"dob"),sex:sex==="M"||sex==="F"?sex:"",expiry:dateISO(exp,"exp"),personal:a.slice(15,30).replace(/</g,""),ok:ok}}
function score(r){var s=0;["docno","dob","exp","final"].forEach(function(k){if(r.ok[k])s++});return s}
/* text: raw OCR text possibly containing the MRZ lines. returns best parse or null */
SC.mrzParse=function(text){
  var lines=String(text).split(/\r?\n/).map(norm).filter(function(l){return l.length>=24&&(l.match(/</g)||[]).length>=2||l.length>=28});
  var best=null;
  function tryit(r){if(!r)return;if(!best||score(r)>score(best))best=r}
  for(var i=0;i<lines.length;i++){
    var a=lines[i],b=lines[i+1],c=lines[i+2];
    if(b&&Math.abs(a.length-44)<=4&&Math.abs(b.length-44)<=4&&/^[PVA][A-Z<]/.test(a))tryit(parseTD3(a,b));
    if(b&&Math.abs(a.length-36)<=3&&Math.abs(b.length-36)<=3&&/^[IAC][A-Z<]/.test(a))tryit(parseTD2(a,b));
    if(b&&c&&Math.abs(a.length-30)<=3&&Math.abs(b.length-30)<=3&&c.length>=12&&/^[IAC][A-Z<]/.test(a))tryit(parseTD1(a,b,c));
  }
  if(best){var pv=cleanTail(best.personal||"");best.personal=/^[KLCSXEZ]*$/.test(pv)?"":pv}return best&&best.docno?best:null};
SC.mrzValid=function(r){return!!r&&score(r)>=3};
SC.COUNTRY=(function(){var s="AFG:Afghanistan,ALB:Albania,DZA:Algeria,AND:Andorra,AGO:Angola,ARG:Argentina,ARM:Armenia,AUS:Australia,AUT:Austria,AZE:Azerbaijan,BHR:Bahrain,BGD:Bangladesh,BLR:Belarus,BEL:Belgium,BTN:Bhutan,BOL:Bolivia,BIH:Bosnia and Herzegovina,BRA:Brazil,BRN:Brunei,BGR:Bulgaria,KHM:Cambodia,CMR:Cameroon,CAN:Canada,CHL:Chile,CHN:China,COL:Colombia,HRV:Croatia,CUB:Cuba,CYP:Cyprus,CZE:Czechia,DNK:Denmark,DOM:Dominican Republic,ECU:Ecuador,EGY:Egypt,EST:Estonia,ETH:Ethiopia,FIN:Finland,FRA:France,GEO:Georgia,D:Germany,DEU:Germany,GHA:Ghana,GRC:Greece,GTM:Guatemala,HKG:Hong Kong,HUN:Hungary,ISL:Iceland,IND:India,IDN:Indonesia,IRN:Iran,IRQ:Iraq,IRL:Ireland,ISR:Israel,ITA:Italy,JPN:Japan,JOR:Jordan,KAZ:Kazakhstan,KEN:Kenya,PRK:North Korea,KOR:South Korea,KWT:Kuwait,KGZ:Kyrgyzstan,LAO:Laos,LVA:Latvia,LBN:Lebanon,LBY:Libya,LIE:Liechtenstein,LTU:Lithuania,LUX:Luxembourg,MAC:Macao,MYS:Malaysia,MDV:Maldives,MLT:Malta,MEX:Mexico,MDA:Moldova,MCO:Monaco,MNG:Mongolia,MNE:Montenegro,MAR:Morocco,MMR:Myanmar,NPL:Nepal,NLD:Netherlands,NZL:New Zealand,NGA:Nigeria,MKD:North Macedonia,NOR:Norway,OMN:Oman,PAK:Pakistan,PSE:Palestine,PAN:Panama,PER:Peru,PHL:Philippines,POL:Poland,PRT:Portugal,QAT:Qatar,ROU:Romania,RUS:Russia,SAU:Saudi Arabia,SRB:Serbia,SGP:Singapore,SVK:Slovakia,SVN:Slovenia,ZAF:South Africa,ESP:Spain,LKA:Sri Lanka,SWE:Sweden,CHE:Switzerland,SYR:Syria,TWN:Taiwan,TJK:Tajikistan,TZA:Tanzania,THA:Thailand,TLS:Timor-Leste,TUN:Tunisia,TUR:Turkey,TKM:Turkmenistan,UGA:Uganda,UKR:Ukraine,ARE:United Arab Emirates,GBR:United Kingdom,GBD:United Kingdom,GBN:United Kingdom,USA:United States,URY:Uruguay,UZB:Uzbekistan,VEN:Venezuela,VNM:Vietnam,YEM:Yemen,ZMB:Zambia,ZWE:Zimbabwe,UTO:Utopia (specimen)",m={};s.split(",").forEach(function(x){var p=x.split(":");m[p[0]]=p[1]});return m})();

/* ---------- document edge detection ---------- */
function boxBlur(g,w,h,r){var out=new Uint8Array(w*h),tmp=new Float32Array(w*h),i,x,y,s,n;
  for(y=0;y<h;y++){s=0;n=0;for(x=-r;x<w;x++){var add=x+r,rem=x-r-1;if(add<w){s+=g[y*w+add];n++}if(rem>=0){s-=g[y*w+rem];n--}if(x>=0)tmp[y*w+x]=s/n}}
  for(x=0;x<w;x++){s=0;n=0;for(y=-r;y<h;y++){var a=y+r,b=y-r-1;if(a<h){s+=tmp[a*w+x];n++}if(b>=0){s-=tmp[b*w+x];n--}if(y>=0)out[y*w+x]=Math.round(s/n)}}
  return out}
function otsu(g){var hist=new Array(256).fill(0),i,total=g.length;for(i=0;i<total;i++)hist[g[i]]++;var sum=0;for(i=0;i<256;i++)sum+=i*hist[i];var sb=0,wb=0,mx=0,th=127;
  for(i=0;i<256;i++){wb+=hist[i];if(!wb)continue;var wf=total-wb;if(!wf)break;sb+=i*hist[i];var mb=sb/wb,mf=(sum-sb)/wf,v=wb*wf*(mb-mf)*(mb-mf);if(v>mx){mx=v;th=i}}return th}
/* grey: Uint8Array w*h (already small, e.g. <=320). returns [[x,y]x4] TL,TR,BR,BL in this image's coordinates, or null */
SC.detectQuad=function(grey,w,h){
  var g=boxBlur(grey,w,h,2),th=otsu(g),best=null;
  [true,false].forEach(function(bright){
    var mask=new Uint8Array(w*h),i;for(i=0;i<w*h;i++)mask[i]=(bright?g[i]>th:g[i]<=th)?1:0;
    var label=new Int32Array(w*h),stack=[],comps=[],cur=0;
    for(var y0=0;y0<h;y0++)for(var x0=0;x0<w;x0++){var p0=y0*w+x0;if(!mask[p0]||label[p0])continue;cur++;var cnt=0,minx=w,maxx=0,miny=h,maxy=0,border=0,cx=0;stack.length=0;stack.push(p0);label[p0]=cur;
      while(stack.length){var p=stack.pop(),x=p%w,y=(p-x)/w;cnt++;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;if(x===0||y===0||x===w-1||y===h-1)border++;
        if(x>0&&mask[p-1]&&!label[p-1]){label[p-1]=cur;stack.push(p-1)}if(x<w-1&&mask[p+1]&&!label[p+1]){label[p+1]=cur;stack.push(p+1)}
        if(y>0&&mask[p-w]&&!label[p-w]){label[p-w]=cur;stack.push(p-w)}if(y<h-1&&mask[p+w]&&!label[p+w]){label[p+w]=cur;stack.push(p+w)}}
      comps[cur]={cnt:cnt,minx:minx,maxx:maxx,miny:miny,maxy:maxy,border:border}}
    /* component with most pixels inside the central window */
    var cxm=Math.round(w*.3),cxM=Math.round(w*.7),cym=Math.round(h*.3),cyM=Math.round(h*.7),votes={},bl=0,bv=0;
    for(var yy=cym;yy<cyM;yy++)for(var xx=cxm;xx<cxM;xx++){var l=label[yy*w+xx];if(l){votes[l]=(votes[l]||0)+1;if(votes[l]>bv){bv=votes[l];bl=l}}}
    if(!bl)return;var c=comps[bl],frac=c.cnt/(w*h),per=2*(w+h);
    if(frac<.12||frac>.96||c.border/per>.2)return;
    var tl=null,tr=null,br=null,bl2=null,mnS=1e9,mxS=-1e9,mxD=-1e9,mnD=1e9;
    for(var y=c.miny;y<=c.maxy;y++)for(var x=c.minx;x<=c.maxx;x++){if(label[y*w+x]!==bl)continue;var s=x+y,d=x-y;
      if(s<mnS){mnS=s;tl=[x,y]}if(s>mxS){mxS=s;br=[x,y]}if(d>mxD){mxD=d;tr=[x,y]}if(d<mnD){mnD=d;bl2=[x,y]}}
    var q=[tl,tr,br,bl2],area=Math.abs((q[0][0]*q[1][1]-q[1][0]*q[0][1])+(q[1][0]*q[2][1]-q[2][0]*q[1][1])+(q[2][0]*q[3][1]-q[3][0]*q[2][1])+(q[3][0]*q[0][1]-q[0][0]*q[3][1]))/2;
    if(area<c.cnt*.7||area>(w*h)*.98)return;
    var sc=c.border/per-frac*.05;if(!best||sc<best.sc)best={sc:sc,q:q}});
  return best?best.q:null};

/* ---------- perspective warp ---------- */
SC.unitToQuad=function(q){var x0=q[0][0],y0=q[0][1],x1=q[1][0],y1=q[1][1],x2=q[2][0],y2=q[2][1],x3=q[3][0],y3=q[3][1];
  var sx=x0-x1+x2-x3,sy=y0-y1+y2-y3,a,b,c,d,e,f,g,h;
  if(Math.abs(sx)<1e-9&&Math.abs(sy)<1e-9){a=x1-x0;b=x3-x0;c=x0;d=y1-y0;e=y3-y0;f=y0;g=0;h=0}
  else{var dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2,den=dx1*dy2-dx2*dy1;g=(sx*dy2-dx2*sy)/den;h=(dx1*sy-sx*dy1)/den;a=x1-x0+g*x1;b=x3-x0+h*x3;c=x0;d=y1-y0+g*y1;e=y3-y0+h*y3;f=y0}
  return[a,b,c,d,e,f,g,h]};
SC.outSize=function(q,maxDim,aspect){var L=function(p,r){return Math.hypot(p[0]-r[0],p[1]-r[1])},w=Math.max(L(q[0],q[1]),L(q[3],q[2])),h=Math.max(L(q[0],q[3]),L(q[1],q[2]));
  if(aspect){var cur=w/h,landscape=cur>=1,ar=landscape?aspect:1/aspect;if(Math.abs(cur-ar)/ar<.15){if(w/ar<=h)h=w/ar;else w=h*ar}}
  var s=Math.min(1,maxDim/Math.max(w,h));return[Math.max(8,Math.round(w*s)),Math.max(8,Math.round(h*s))]};
SC.warp=function(src,sw,sh,q,ow,oh){var H=SC.unitToQuad(q),out=new Uint8ClampedArray(ow*oh*4),a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
  for(var y=0;y<oh;y++){var v=(y+.5)/oh;for(var x=0;x<ow;x++){var u=(x+.5)/ow,den=g*u+h*v+1,sx=(a*u+b*v+c)/den-.5,sy=(d*u+e*v+f)/den-.5;
    var x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0,o=(y*ow+x)*4;
    if(x0<0)x0=0;if(y0<0)y0=0;if(x0>sw-2)x0=sw-2;if(y0>sh-2)y0=sh-2;if(x0<0||y0<0){continue}
    var i00=(y0*sw+x0)*4,i10=i00+4,i01=i00+sw*4,i11=i01+4;
    for(var k=0;k<3;k++)out[o+k]=(src[i00+k]*(1-fx)+src[i10+k]*fx)*(1-fy)+(src[i01+k]*(1-fx)+src[i11+k]*fx)*fy;
    out[o+3]=255}}
  return out};

/* ---------- enhancement ---------- */
function lumHist(px){var hist=new Uint32Array(256),n=px.length/4;for(var i=0;i<px.length;i+=4)hist[(px[i]*77+px[i+1]*150+px[i+2]*29)>>8]++;return{hist:hist,n:n}}
function pct(hist,n,p){var t=n*p,s=0;for(var i=0;i<256;i++){s+=hist[i];if(s>=t)return i}return 255}
SC.enhance=function(px,w,h,mode){
  if(mode==="orig")return px;var out=new Uint8ClampedArray(px.length),L=lumHist(px),lo=pct(L.hist,L.n,.01),hi=pct(L.hist,L.n,.985),sc=255/Math.max(40,hi-lo),i;
  if(mode==="color"||mode==="gray"){
    for(i=0;i<px.length;i+=4){if(mode==="gray"){var y=(px[i]*77+px[i+1]*150+px[i+2]*29)>>8,v=(y-lo)*sc;out[i]=out[i+1]=out[i+2]=v}else{out[i]=(px[i]-lo)*sc;out[i+1]=(px[i+1]-lo)*sc;out[i+2]=(px[i+2]-lo)*sc}out[i+3]=255}return out}
  if(mode==="bw"){
    var gr=new Uint8Array(w*h);for(i=0;i<w*h;i++)gr[i]=(px[i*4]*77+px[i*4+1]*150+px[i*4+2]*29)>>8;
    var bg=boxBlur(gr,w,h,Math.max(8,Math.round(Math.min(w,h)/16)));
    for(i=0;i<w*h;i++){var v2=gr[i]<bg[i]*.9?0:255;out[i*4]=out[i*4+1]=out[i*4+2]=v2;out[i*4+3]=255}return out}
  return px};
SC.grayscaleBoost=function(px,w,h){/* for OCR: grayscale + contrast stretch */var o=new Uint8ClampedArray(px.length),L=lumHist(px),lo=pct(L.hist,L.n,.02),hi=pct(L.hist,L.n,.98),sc=255/Math.max(40,hi-lo);
  for(var i=0;i<px.length;i+=4){var y=((px[i]*77+px[i+1]*150+px[i+2]*29)>>8),v=(y-lo)*sc;o[i]=o[i+1]=o[i+2]=v;o[i+3]=255}return o};

/* ---------- PDF writer ---------- */
function enc(s){var a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i)&255;return a}
/* pages: [{jpeg:Uint8Array,w,h,full:boolean}] -> Uint8Array */
SC.makePdf=function(pages,title){
  var chunks=[],offs=[],len=0;function push(u8){chunks.push(u8);len+=u8.length}function str(s){push(enc(s))}
  function obj(n,body){offs[n]=len;str(n+" 0 obj\n"+body+"\nendobj\n")}
  str("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  var n=pages.length,kids=[],id=3;
  obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
  var pageObjs=[];
  for(var i=0;i<n;i++){var pg=pages[i],land=pg.w>pg.h,PW=land?842:595,PH=land?595:842,m=pg.full?0:36,bw=PW-2*m,bh=PH-2*m,sc=Math.min(bw/pg.w,bh/pg.h),dw=pg.w*sc,dh=pg.h*sc,dx=(PW-dw)/2,dy=pg.full?(PH-dh)/2:PH-m-dh;
    var po=id++,co=id++,io=id++;kids.push(po+" 0 R");pageObjs.push({po:po,co:co,io:io,PW:PW,PH:PH,dw:dw,dh:dh,dx:dx,dy:dy,pg:pg})}
  obj(2,"<< /Type /Pages /Kids ["+kids.join(" ")+"] /Count "+n+" >>");
  pageObjs.forEach(function(o,i){
    obj(o.po,"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+o.PW+" "+o.PH+"] /Resources << /XObject << /Im0 "+o.io+" 0 R >> >> /Contents "+o.co+" 0 R >>");
    var cs="q "+o.dw.toFixed(2)+" 0 0 "+o.dh.toFixed(2)+" "+o.dx.toFixed(2)+" "+o.dy.toFixed(2)+" cm /Im0 Do Q";obj(o.co,"<< /Length "+cs.length+" >>\nstream\n"+cs+"\nendstream");
    offs[o.io]=len;str(o.io+" 0 obj\n<< /Type /XObject /Subtype /Image /Width "+o.pg.w+" /Height "+o.pg.h+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+o.pg.jpeg.length+" >>\nstream\n");push(o.pg.jpeg);str("\nendstream\nendobj\n")});
  var infoId=id++;obj(infoId,"<< /Title ("+String(title||"Scan").replace(/[()\\]/g,"")+") /Producer (Soramma Scan) >>");
  var xr=len;str("xref\n0 "+id+"\n0000000000 65535 f \n");for(var k=1;k<id;k++)str(("0000000000"+offs[k]).slice(-10)+" 00000 n \n");
  str("trailer\n<< /Size "+id+" /Root 1 0 R /Info "+infoId+" 0 R >>\nstartxref\n"+xr+"\n%%EOF\n");
  var out=new Uint8Array(len),p=0;chunks.forEach(function(c){out.set(c,p);p+=c.length});return out};

if(typeof module!=="undefined"&&module.exports)module.exports=SC;else root.SC=SC;
})(typeof window!=="undefined"?window:this);
