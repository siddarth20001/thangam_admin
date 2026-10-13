import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
const require=createRequire(import.meta.url)
const source=ts.transpileModule(fs.readFileSync(new URL('../src/lib/csvImport.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText.replace("'papaparse'",JSON.stringify(pathToFileURL(require.resolve('papaparse')).href))
const {prepareCsv}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const catalogSource=ts.transpileModule(fs.readFileSync(new URL('../src/data/catalog.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {seedCategories,seedProducts}=await import('data:text/javascript;base64,'+Buffer.from(catalogSource).toString('base64'))
const Papa=require('papaparse')
test('round-trips all PDF catalog rows from the exported CSV format',()=>{
 const csv=Papa.unparse([['Serial','Product','Category','Price INR','Unit','Active','Discount %','Sale price INR'],...seedProducts.map(p=>[p.serial,p.name,seedCategories.find(c=>c.id===p.category_id).name,p.price,p.unit,p.active,0,p.price])])
 const result=prepareCsv('\uFEFF'+csv,seedCategories,seedProducts)
 assert.deepEqual(result.errors,[]);assert.equal(result.updated,155);assert.equal(result.created,0);assert.equal(result.rows[0].name,seedProducts[0].name)
})
test('handles quoted commas, escaped quotes, multiline fields, and preserves missing optional fields',()=>{
 const p={...seedProducts[0],active:false,discount_percent:25}
 const result=prepareCsv(Papa.unparse([['Serial','Product','Category','Price INR','Unit'],[p.serial,'4" Cracker, deluxe\npack',seedCategories[0].name,'42.50','1 pkt']]),seedCategories,[p])
 assert.deepEqual(result.errors,[]);assert.equal(result.rows[0].active,false);assert.equal(result.rows[0].discount_percent,25);assert.equal(result.rows[0].price,42.5);assert.match(result.rows[0].name,/\n/)
})
test('rejects duplicates, invalid prices, unknown categories, and malformed rows',()=>{
 for(const csv of ['Serial,Product,Category,Price INR,Unit\n1,A,One Sound Crackers,-10,1 pkt','Serial,Product,Category,Price INR,Unit\n1,A,Unknown,10,1 pkt','Serial,Product,Category,Price INR,Unit\n1,A,One Sound Crackers,10,1 pkt\n1,B,One Sound Crackers,20,1 pkt','Serial,Product,Category,Price INR,Unit\n1,A,One Sound Crackers,,1 pkt','Serial,Product,Category,Price INR,Unit\n1,A,One Sound Crackers,20','Serial,Product,Product,Category,Price INR,Unit\n1,A,B,One Sound Crackers,10,1 pkt'])assert.ok(prepareCsv(csv,seedCategories,seedProducts).errors.length)
})
test('rejects flat-rate discounts and accepts explicit visibility changes and new serials',()=>{
 const invalid=prepareCsv('Serial,Product,Category,Price INR,Unit,Active,Discount %\n164,Test,Gift Box,100,1 Box,true,20',seedCategories,seedProducts)
 assert.ok(invalid.errors.some(e=>e.includes('flat-rate')))
 const valid=prepareCsv('Serial,Product,Category,Price INR,Unit,Active,Discount %\n164,Test,One Sound Crackers,100,1 pkt,OFF,20',seedCategories,seedProducts)
 assert.deepEqual(valid.errors,[]);assert.equal(valid.created,1);assert.equal(valid.rows[0].active,false)
})
