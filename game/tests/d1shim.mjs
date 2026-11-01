import {DatabaseSync} from 'node:sqlite';
export function makeDB(){const db=new DatabaseSync(':memory:');
 const mk=(sql,args=[])=>({bind:(...a)=>mk(sql,a),
  first:async()=>{const r=db.prepare(sql).get(...args);return r?{...r}:null},
  all:async()=>({results:db.prepare(sql).all(...args).map(r=>({...r}))}),
  run:async()=>{db.prepare(sql).run(...args);return{}},_x:()=>db.prepare(sql).run(...args)});
 return{prepare:s=>mk(s),batch:async(L)=>{for(const x of L)x._x();return[]}}}
