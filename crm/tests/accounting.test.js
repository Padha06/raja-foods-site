import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openItems, partySummary, today, addDays, birdBook } from '../src/lib.js'
import { validateAction } from '../src/validation.js'

const state = () => ({parties:[{id:'B',opening:0,openingDate:addDays(today(),-20),creditDays:7,creditLimit:1000}],invoices:[{no:'I1',partyId:'B',date:addDays(today(),-10),lines:[{qty:10,rate:10}]}], payments:[], birdMoves:[{date:today(),type:'opening',qty:20}],retailMoves:[{date:today(),type:'opening',product:'curry',kg:10}],dispatches:[]})
test('a bill three days overdue is overdue',()=>assert.equal(partySummary(state(),'B').overdue,100))
test('explicitly unallocated payment stays as account credit',()=>{
  const s=state(); s.payments=[{partyId:'B',date:today(),amount:40,alloc:[],allocationMode:'explicit'}]
  const result=openItems(s,'B'); assert.equal(result.open[0].due,100); assert.equal(result.unallocated,40); assert.equal(partySummary(s,'B').outstanding,60)
})
test('legacy oldest-first payments still reconcile',()=>{
 const s=state(); s.payments=[{partyId:'B',date:today(),amount:40}]; assert.equal(openItems(s,'B').open[0].due,60)
})
test('repeated product lines cannot collectively oversell',()=>{
 const error=validateAction(state(),'invoice',{unit:'retail',paid:0,lines:[{product:'curry',qty:6,rate:10},{product:'curry',qty:6,rate:10}]},{id:'owner'}); assert.match(error,/stock/)
})
test('processing cannot create more dressed weight than live input',()=>assert.match(validateAction(state(),'processing',{birds:10,liveKg:20,dressedKg:25,split:{curry:25}},{id:'owner'}),/weight/))
test('mortality cannot exceed available stock',()=>assert.ok(validateAction(state(),'mortality',{qty:21,reason:'test'},{id:'owner'})))
test('bird book reconciles movements',()=>{
 const s=state(); s.birdMoves.push({date:today(),type:'mortality',qty:2},{date:today(),type:'transferred',qty:5}); assert.equal(birdBook(s,today(),today()).closing,13)
})
