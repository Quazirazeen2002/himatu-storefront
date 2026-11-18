import type { FigureProduct } from '../src/lib/types';

const figure = (id: string, stockQuantity = 6): FigureProduct => ({
  id, kind: 'figure', name: id, price: 1000, availability: 'in-stock', stockQuantity,
} as FigureProduct);

async function setup(saved: Record<string, number> = {}) {
  jest.resetModules();
  const memory = new Map<string,string>([['himatu-demo-v2', JSON.stringify({bag:saved,wishlist:[],recent:[]})]]);
  Object.defineProperty(globalThis, 'localStorage', { configurable:true, value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)} });
  const store=await import('../src/lib/demo-store');
  store.getSnapshot();
  return store;
}

afterEach(()=>{Reflect.deleteProperty(globalThis,'localStorage');});
it('starts a new visitor with no products and adds exactly one chosen product',async()=>{
  const store=await setup();store.registerStoreProducts([figure('a'),figure('b'),figure('c'),figure('d')]);
  expect(store.getSnapshot().bag).toEqual({});
  store.setQuantity('a',1);expect(store.getSnapshot().bag).toEqual({a:1});
});
it('handles four units separately from four different products',async()=>{
  const store=await setup();store.registerStoreProducts(['a','b','c','d'].map(id=>figure(id)));
  store.setQuantity('a',4);expect(store.getSnapshot().bag).toEqual({a:4});
  for(const id of ['a','b','c','d'])store.setQuantity(id,1);
  expect(store.getSnapshot().bag).toEqual({a:1,b:1,c:1,d:1});
});
it('removes stale and unavailable products after a successful catalogue refresh and caps stock',async()=>{
  const store=await setup({deleted:1,a:9,sold:1});
  store.registerStoreProducts([figure('a',2),{...figure('sold',0),availability:'sold-out'}]);
  expect(store.getSnapshot().bag).toEqual({a:2});
  store.setQuantity('a',10);expect(store.getSnapshot().bag).toEqual({a:2});
});
it('removes only purchased quantities, preserving other selections and additions',async()=>{
  const store=await setup({a:4,b:1});store.registerStoreProducts([figure('a'),figure('b')]);
  store.completePurchase([{id:'a',quantity:3}]);expect(store.getSnapshot().bag).toEqual({a:1,b:1});
  store.completePurchase([{id:'a',quantity:1},{id:'b',quantity:1}]);expect(store.getSnapshot().bag).toEqual({});
});
