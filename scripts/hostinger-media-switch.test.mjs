import test from "node:test";
import assert from "node:assert/strict";
import {replaceMedia,assertChange} from "./hostinger-media-switch.mjs";

test("replaces exact media URLs recursively without changing other product or customer data",()=>{
  const from="https://source.example/image.jpg",to="https://media.himatu.com/products/image.jpg";
  const value={price:100,stock:4,email:"user@example.test",items:[{image:from,notes:`prefix ${from}`}],nullable:null};
  const changed=replaceMedia(value,new Map([[from,to]]));
  assert.deepEqual(changed,{...value,items:[{image:to,notes:`prefix ${from}`}]});
  assert.equal(value.items[0].image,from);
});
test("rollback entries can only write approved media columns",()=>{
  const valid={table:"ProductImage",keyColumn:"id",key:"id",field:"imageUrl",json:false};
  assert.doesNotThrow(()=>assertChange(valid));
  assert.throws(()=>assertChange({...valid,table:"UserProfile",field:"role"}));
  assert.throws(()=>assertChange({...valid,table:"Product",field:"price"}));
  assert.throws(()=>assertChange({...valid,field:"imageUrl\";DROP TABLE"}));
  assert.throws(()=>assertChange({...valid,json:true}));
});
