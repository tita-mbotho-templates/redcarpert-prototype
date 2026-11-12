import assert from 'node:assert/strict';
import test from 'node:test';
import {initializeHomepageHeaderScroll} from '../src/client/HomepageHeaderScroll.js';

function fixture(home=true,header=true) {
  const prior={window:globalThis.window,document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  const tokens=new Set(home?['redcarpert-home-native']:[]);
  const listeners=new Map();
  const scheduled=[];
  globalThis.document={
    body:{classList:{
      contains:k=>tokens.has(k),
      add:(...keys)=>keys.forEach(k=>tokens.add(k)),
      remove:(...keys)=>keys.forEach(k=>tokens.delete(k)),
    }},
    querySelector:selector=>selector==='#header'&&header?{}:null,
  };
  globalThis.window={
    scrollY:0,
    addEventListener:(name,fn)=>listeners.set(name,fn),
    removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name)},
  };
  globalThis.requestAnimationFrame=fn=>(scheduled.push(fn),scheduled.length);
  globalThis.cancelAnimationFrame=()=>{};
  const scrollTo=y=>{
    globalThis.window.scrollY=y;
    listeners.get('scroll')?.();
    while(scheduled.length)scheduled.shift()();
  };
  return {tokens,listeners,scrollTo,restore(){for(const [key,val] of Object.entries(prior))globalThis[key]=val}};
}
test('compact header appears on scrolling up, tucks on down, and restores at top',()=>{
  const f=fixture();
  try{
    const cleanup=initializeHomepageHeaderScroll();
    assert.equal(f.tokens.has('fixed-header-scroll'),false);
    f.scrollTo(80);
    assert(f.tokens.has('fixed-header-scroll'));
    assert.equal(f.tokens.has('redcarpert-header-tucked'),false);
    f.scrollTo(180);
    assert(f.tokens.has('redcarpert-header-tucked'));
    f.scrollTo(130);
    assert(!f.tokens.has('redcarpert-header-tucked'));
    assert(f.tokens.has('fixed-header-scroll'));
    f.scrollTo(0);
    assert(!f.tokens.has('fixed-header-scroll'));
    assert(!f.tokens.has('redcarpert-header-tucked'));
    cleanup();
    assert.equal(f.listeners.size,0);
  }finally{f.restore()}
});
test('non-home pages and missing headers retain their own theme behaviour',()=>{
 for(const [home,header] of [[false,true],[true,false]]){
   const f=fixture(home,header);
   try {
     assert.equal(initializeHomepageHeaderScroll(),undefined);
     assert.equal(f.listeners.size,0);
   }finally{f.restore()}
 }
});
