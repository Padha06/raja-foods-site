import {test} from 'node:test'
import assert from 'node:assert/strict'
import {prepareBillingSeries} from '../src/billing-series.js'
import {nextInvoiceNumber} from '../src/catalog.js'
test('sample history does not consume 0001 and its linked payments are preserved',()=>{
 const s=prepareBillingSeries({invoices:[{no:'RBH-0001'},{no:'RBH-0226'}],payments:[{amount:100,alloc:[{no:'RBH-0001',amount:100}]}],dispatches:[],retailMoves:[{note:'RBH-0001'}]})
 assert.equal(nextInvoiceNumber(s.invoices,'RBH'),'RBH-0001')
 assert.equal(s.payments[0].alloc[0].no,'DEMO-RBH-0001')
 assert.equal(s.retailMoves[0].note,'DEMO-RBH-0001')
 assert.deepEqual(prepareBillingSeries(s),s)
})
test('user-created 0227 remains intact while new sequence starts at 0001',()=>{
 const s=prepareBillingSeries({invoices:[{no:'RBH-0227',seriesNumber:227,createdAt:123}],payments:[]})
 assert.equal(s.invoices[0].no,'RBH-0227')
 assert.equal(nextInvoiceNumber(s.invoices,'RBH'),'RBH-0001')
 s.invoices.push({no:'RBH-0001',seriesNumber:1,createdAt:456})
 assert.equal(nextInvoiceNumber(s.invoices,'RBH'),'RBH-0002')
})
