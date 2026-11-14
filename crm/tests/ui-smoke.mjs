import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import assert from 'node:assert/strict'

const server = await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'})
await import('motion/react')
globalThis.localStorage = {getItem:()=>null}
globalThis.sessionStorage = {getItem:()=> 'owner'}
try {
 const { StoreProvider, reducer } = await server.ssrLoadModule('/src/store.jsx')
 const { default:Products } = await server.ssrLoadModule('/src/pages/Products.jsx')
 const { default:Retail } = await server.ssrLoadModule('/src/pages/Retail.jsx')
 const { default:Reports } = await server.ssrLoadModule('/src/pages/Reports.jsx')
 const { PaymentModal, InvoiceView } = await server.ssrLoadModule('/src/components/Invoice.jsx')
 const { makeSeed } = await server.ssrLoadModule('/src/data.js')
 const { prepareBillingSeries } = await server.ssrLoadModule('/src/billing-series.js')
 const wrap = element => renderToString(React.createElement(StoreProvider,null,element))
 assert.match(wrap(React.createElement(Products)),/Add product/)
 assert.match(wrap(React.createElement(PaymentModal,{open:true,onClose:()=>{}})),/Record payment received/)
 let s=prepareBillingSeries(makeSeed()), user={id:'owner',person:'Owner',label:'Owner'}
 const newProduct={name:'Chicken wings',price:180,units:['retail'],active:true}
 s=reducer(s,{type:'product',p:newProduct,user})
 const product=s.products.find(p=>p.name===newProduct.name)
 assert.ok(product)
 s=reducer(s,{type:'stockReceipt',p:{product:product.id,kg:10,reason:'Opening stock'},user})
 const before=s.invoices.map(i=>i.no)
 s=reducer(s,{type:'invoice',p:{unit:'retail',partyId:'C1',lines:[{product:product.id,item:product.name,qty:2,rate:180,uom:'kg'}],paid:360,method:'Cash'},user})
 assert.equal(new Set(s.invoices.map(i=>i.no)).size,s.invoices.length)
 assert.deepEqual(s.invoices.slice(0,-1).map(i=>i.no),before)
 assert.equal(s.invoices.at(-1).lines[0].item,'Chicken wings')
 assert.equal(s.retailMoves.at(-1).kg,2)
 globalThis.localStorage={getItem:()=>JSON.stringify(s)}
 assert.match(wrap(React.createElement(Retail)),/Chicken wings/)
 assert.match(wrap(React.createElement(Reports)),/Retail shop/)
 assert.match(wrap(React.createElement(InvoiceView,{no:s.lastInvoice,onClose:()=>{}})),/Chicken wings/)
 const wholesale=s.invoices.find(i=>i.unit==='district')
 const bill=wrap(React.createElement(InvoiceView,{no:wholesale.no,onClose:()=>{}}))
 assert.match(bill,/Raja Foods/)
 assert.doesNotMatch(bill,/Raja Foods \(District Wholesale\)/)
 assert.match(bill,/Park Road, Manapparai 621306/)
 console.log('UI render and reducer smoke checks passed: products, payment form, stock receipt, bill, header and preserved history.')
} finally { await server.close() }
