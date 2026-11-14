import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../store.jsx'
import { catalogOf } from '../catalog.js'
import { UNITS } from '../config.js'
import { retailStock, rs } from '../lib.js'
import { PageHeader, Card, Table, Button, Modal, Field, Input, Select, Badge } from '../components/ui.jsx'

export default function Products() {
  const { data, user, dispatch } = useStore()
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [receipt, setReceipt] = useState(null)
  const rows = catalogOf(data).filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  return <div className="space-y-4">
    <PageHeader title="Products" sub="Manage products and selling prices for bills. Existing bills keep their original names and rates." actions={<Button icon={Plus} onClick={() => setEditing({name:'',price:'',units:['retail'],active:true})}>Add product</Button>} />
    <Input aria-label="Search products" placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} />
    <Card><Table rows={rows.map(p=>({...p,key:p.id}))} cols={[
      {key:'name',label:'Product'},
      {key:'units',label:'Business',render:p=>p.units.map(u=>UNITS[u].short).join(', ')},
      {key:'price',label:'Price / kg',right:true,render:p=>rs(p.price)},
      {key:'stock',label:'Stock (kg)',right:true,render:p=>p.units.includes('retail')?retailStock(data,p.id).toFixed(1):'Farm bird stock'},
      {key:'active',label:'Status',render:p=><Badge>{p.active?'Active':'Inactive'}</Badge>},
      {key:'edit',label:'',render:p=><Button size="sm" variant="outline" onClick={()=>setEditing(p)}>Edit</Button>},
      {key:'receive',label:'',render:p=>p.units.includes('retail') && <Button size="sm" variant="outline" onClick={()=>setReceipt(p)}>Add stock</Button>},
    ]} /></Card>
    {editing && <ProductForm key={editing.id||'new'} product={editing} onClose={()=>setEditing(null)} onSave={p=>{if(dispatch('product',p,'Product saved')) setEditing(null)}} />}
    {receipt && <StockReceipt product={receipt} onClose={()=>setReceipt(null)} onSave={p=>{if(dispatch('stockReceipt',p,'Stock received')) setReceipt(null)}} />}
  </div>
}

function StockReceipt({product,onClose,onSave}) {
  const [kg,setKg]=useState('')
  const [reason,setReason]=useState('')
  return <Modal open onClose={onClose} title={`Receive ${product.name}`} sub="Use this for purchased or opening stock. Use Processing & yield for live birds processed from the farm.">
    <form className="grid gap-3" onSubmit={e=>{e.preventDefault();onSave({product:product.id,kg:Number(kg),reason})}}>
      <Field label="Quantity (kg)"><Input autoFocus type="number" min="0.001" step="0.001" required value={kg} onChange={e=>setKg(e.target.value)} /></Field>
      <Field label="Source / reference"><Input required value={reason} onChange={e=>setReason(e.target.value)} placeholder="Supplier bill or opening stock reference" /></Field>
      <Button type="submit">Receive stock</Button>
    </form>
  </Modal>
}

function ProductForm({product,onClose,onSave}) {
  const [f,setF]=useState(product)
  return <Modal open onClose={onClose} title={f.id?'Edit product':'Add product'} sub="Products are billed in kilograms. New products start with zero stock; record stock before selling.">
    <form className="grid gap-3" onSubmit={e=>{e.preventDefault();onSave({...f,price:Number(f.price)})}}>
      <Field label="Product name"><Input autoFocus required maxLength={80} value={f.name} onChange={e=>setF({...f,name:e.target.value})} /></Field>
      <Field label="Selling price / kg (₹)"><Input required type="number" min="0.01" step="0.01" value={f.price} onChange={e=>setF({...f,price:e.target.value})} /></Field>
      <Field label="Business"><Select disabled={!!f.id} value={f.units[0]} onChange={e=>setF({...f,units:[e.target.value]})} options={['retail','district','local'].map(u=>({value:u,label:UNITS[u].name}))} /></Field>
      <Field label="Status"><Select value={String(f.active)} onChange={e=>setF({...f,active:e.target.value==='true'})} options={[{value:'true',label:'Active'},{value:'false',label:'Inactive'}]} /></Field>
      <Button type="submit">Save product</Button>
    </form>
  </Modal>
}
