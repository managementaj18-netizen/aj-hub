/* Soramma Shop — minimal PDF writer (JPEG pages). */
(function(root){"use strict";
var SC={};
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
