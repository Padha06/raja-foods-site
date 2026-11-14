import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultProducts, productsFor, saveProduct, productError, nextInvoiceNumber } from '../src/catalog.js'
import { UNITS } from '../src/config.js'

test('wholesale invoice name omits District Wholesale',()=>assert.equal(UNITS.district.billingName,'Raja Foods'))
test('new invoice series starts at 0001 despite legacy demo bills',()=>assert.equal(nextInvoiceNumber([{no:'RFD-1003'}],'RFD'),'RFD-0001'))
test('numbering preserves prefixes and never reuses voided bills',()=>assert.equal(nextInvoiceNumber([{no:'RFD-0001',void:true},{no:'RBH-0008'}],'RFD'),'RFD-0002'))
test('sequence continues beyond four digits without reusing numbers',()=>assert.equal(nextInvoiceNumber([{no:'RFD-9999',seriesNumber:9999}],'RFD'),'RFD-10000'))
test('new products are usable by assigned business and survive serialization',()=>{
 const s=saveProduct({}, {name:'Chicken wings',price:180,units:['retail'],active:true},'wings')
 const loaded=JSON.parse(JSON.stringify(s))
 assert.ok(productsFor(loaded,'retail',true).some(p=>p.id==='wings'))
 assert.equal(productsFor(loaded,'district',true).some(p=>p.id==='wings'),false)
})
test('editing a product preserves identity and does not mutate invoice history',()=>{
 const invoice={no:'RBC-0001',lines:[{product:'curry',item:'Curry cut',rate:240,qty:1}]}
 const s={products:defaultProducts(),invoices:[invoice]}
 const updated=saveProduct(s,{id:'curry',name:'Curry cut premium',price:260,units:['retail'],active:false})
 assert.equal(updated.invoices[0].lines[0].rate,240)
 assert.equal(updated.invoices[0].lines[0].item,'Curry cut')
 assert.equal(productsFor(updated,'retail',true).some(p=>p.id==='curry'),false)
 assert.ok(productsFor(updated,'retail').some(p=>p.id==='curry'))
})
test('invalid prices and duplicate product names are rejected',()=>{
 assert.ok(productError({}, {name:'Curry cut',price:20,units:['retail']}))
 assert.ok(productError({}, {name:'New',price:-1,units:['retail']}))
})
