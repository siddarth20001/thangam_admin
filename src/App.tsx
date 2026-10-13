import { useEffect, useState } from 'react'
import { Boxes, LayoutDashboard, Layers, Search, Plus, Pencil, Trash2, X, Sparkles, LogOut, Download, Upload, Percent, ShoppingBag, ClipboardList, Package, Grid2X2, BadgeCheck, ReceiptText } from 'lucide-react'
import { seedCategories, seedProducts } from './data/catalog'
import type { Category, Product } from './data/catalog'
import { supabase } from './lib/supabase'
import Orders from './Orders'
import Brand from './Brand'
import ThemeToggle from './ThemeToggle'
import BulkDiscount from './BulkDiscount'
import CsvImport from './CsvImport'
import type { ImportRow } from './lib/csvImport'
import './App.css'
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
function localCatalog() {
  try { const saved = localStorage.getItem('thangam-catalog-v1'); if (saved) return JSON.parse(saved) as { products: Product[]; categories: Category[] } } catch { /* Use source catalog if storage is unavailable. */ }
  return { products: seedProducts, categories: seedCategories }
}
export default function App() {
  const [catalog, setCatalog] = useState(localCatalog)
  const [importOpen, setImportOpen] = useState(false)
  const [page, setPage] = useState('Products')
  const [orderCount, setOrderCount] = useState<number | null>(supabase ? null : 0)
  const [orderCountError, setOrderCountError] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [discount, setDiscount] = useState('0')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(!supabase)
  const [signedIn, setSignedIn] = useState(!supabase)
  const [modal, setModal] = useState<{ kind: 'product' | 'category' | 'discount'; item?: Product | Category } | null>(null)
  const { products, categories } = catalog
  async function refresh() {
    if (!supabase) return
    const [c,p] = await Promise.all([supabase.from('categories').select('*').order('name'),supabase.from('products').select('*').order('serial')])
    if (c.error || p.error) throw new Error(c.error?.message || p.error?.message)
    setCatalog({categories:c.data,products:p.data}); setReady(true)
  }
  useEffect(()=>{
    if (!supabase) return
    const client = supabase
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{setSignedIn(!!session);setReady(false);setError('')})
    client.auth.getSession().then(({data,error})=>{if(error)setError(error.message);setSignedIn(!!data.session)})
    return ()=>subscription.unsubscribe()
  },[])
  useEffect(()=>{if(supabase&&signedIn) refresh().catch(e=>setError(e.message))},[signedIn])
  useEffect(() => {
    if (!supabase || !signedIn || page !== 'Overview') return
    const client = supabase
    let active = true
    async function fetchOrderCount() {
      const { count, error } = await client.from('orders').select('id', { count: 'exact', head: true })
      if (!active) return
      setOrderCountError(!!error)
      setOrderCount(error ? null : count ?? 0)
    }
    const refreshCount = () => { if (!document.hidden) void fetchOrderCount() }
    void fetchOrderCount()
    const timer = window.setInterval(refreshCount, 30000)
    window.addEventListener('focus', refreshCount)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refreshCount) }
  }, [signedIn, page])
  useEffect(()=>{if(!supabase)try{localStorage.setItem('thangam-catalog-v1',JSON.stringify(catalog))}catch{setError('Browser storage is unavailable; changes will last for this session only.')}},[catalog])
  useEffect(()=>{if(!modal)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setModal(null)};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close)},[modal])
  async function login(form: HTMLFormElement) {
    const f=new FormData(form);setBusy(true);setError('')
    try {const {error}=await supabase!.auth.signInWithPassword({email:String(f.get('email')),password:String(f.get('password'))});if(error)throw error} catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function save(form: HTMLFormElement) {
    if(!modal)return
    const f=new FormData(form);const name=String(f.get('name') ?? modal.item?.name ?? '').trim();if(!name){setError('Please enter a name.');return}
    setBusy(true);setError('')
    try {
      if (modal.kind === 'discount') {
        const product = modal.item as Product
        const discount_percent = Number(discount)
        if (!discount.trim() || !Number.isFinite(discount_percent) || discount_percent < 0 || discount_percent > 100) throw new Error('Enter a discount between 0 and 100%.')
        if (!categories.find(c => c.id === product.category_id)?.discountable) throw new Error('This category does not allow discounts.')
        let updated: Product = { ...product, discount_percent }
        if (supabase) {
          const { data, error } = await supabase.from('products').update({ discount_percent }).eq('id', product.id).select('*').single()
          if (error) throw error
          updated = data as Product
        }
        setCatalog(v => ({ ...v, products: v.products.map(p => p.id === product.id ? updated : p) }))
      } else if(modal.kind==='category') {
        const item:Category={id:modal.item?.id??crypto.randomUUID(),name,discountable:f.get('discountable')==='on'}
        if(categories.some(c=>c.id!==item.id&&c.name.toLowerCase()===name.toLowerCase()))throw new Error('This category name already exists.')
        if(supabase){const {error}=await supabase.from('categories').upsert(item);if(error)throw error;await refresh()}
        else setCatalog(v=>({...v,categories:[...v.categories.filter(c=>c.id!==item.id),item]}))
      } else {
        const item:Product={id:modal.item?.id??crypto.randomUUID(),name,serial:Number(f.get('serial')),price:Number(f.get('price')),unit:String(f.get('unit')),category_id:String(f.get('category_id')),active:f.get('active')==='on',discount_percent:categories.find(c=>c.id===String(f.get('category_id')))?.discountable ? ((modal.item as Product)?.discount_percent??0) : 0}
        if(products.some(p=>p.id!==item.id&&p.serial===item.serial))throw new Error('That serial number already exists.')
        if(!Number.isInteger(item.serial)||item.serial<1||!Number.isFinite(item.price)||item.price<0||!categories.some(c=>c.id===item.category_id))throw new Error('Enter a valid serial number, price, and category.')
        if(supabase){const {error}=await supabase.from('products').upsert(item);if(error)throw error;await refresh()}
        else setCatalog(v=>({...v,products:[...v.products.filter(p=>p.id!==item.id),item].sort((a,b)=>a.serial-b.serial)}))
      }
      setModal(null);setStatus('Saved successfully.')
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function saveCsv(rows: ImportRow[]) {
    setBusy(true)
    try {
      if (supabase) {
        const { error } = await supabase.from('products').upsert(rows, { onConflict: 'serial' })
        if (error) throw error
        try { await refresh() } catch { setError('The import was saved, but the list could not refresh. Reload the page to see your products.') }
      } else {
        setCatalog(current => {
          const next = new Map(current.products.map(product => [product.serial, product]))
          for (const row of rows) next.set(row.serial, {...row,id:next.get(row.serial)?.id ?? crypto.randomUUID()})
          return {...current,products:[...next.values()].sort((a,b)=>a.serial-b.serial)}
        })
      }
      setStatus(`Imported ${rows.length} products successfully.`)
    } finally { setBusy(false) }
  }
  async function applyBulkDiscount(percent: number): Promise<number> {
    setBusy(true)
    try {
      if (supabase) {
        const { data, error } = await supabase.rpc('apply_catalog_discount', { p_percent: percent })
        if (error) throw error
        try { await refresh() } catch { throw new Error('Discounts were saved, but the list could not refresh. Reload the page to see updated prices.') }
        return data as number
      }
      const eligible = new Set(categories.filter(category => category.discountable).map(category => category.id))
      const count = products.filter(product => eligible.has(product.category_id)).length
      setCatalog(current => ({ ...current, products: current.products.map(product => eligible.has(product.category_id) ? { ...product, discount_percent: percent } : product) }))
      return count
    } finally { setBusy(false) }
  }
  async function toggleProduct(product: Product) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      let updated = { ...product, active: !product.active }
      if (supabase) {
        const { data, error } = await supabase.from('products')
          .update({ active: updated.active }).eq('id', product.id).select('*').single()
        if (error) throw error
        updated = data as Product
      }
      setCatalog(current => ({ ...current, products: current.products.map(item => item.id === product.id ? updated : item) }))
      setStatus(`${product.name}: ${updated.active ? 'ON — visible on website' : 'OFF — hidden from website'}.`)
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function remove(kind:'product'|'category',item:Product|Category) {
    if(kind==='category'&&products.some(p=>p.category_id===item.id)){setError('Move or delete this category’s products first.');return}
    if(!window.confirm(`Delete “${item.name}”?`))return
    setBusy(true);setError('')
    try{const table=kind==='product'?'products':'categories';if(supabase){const {error}=await supabase.from(table).delete().eq('id',item.id);if(error)throw error;await refresh()}else setCatalog(v=>({...v,[table]:v[table].filter(x=>x.id!==item.id)}));setStatus('Deleted successfully.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function importCatalog() {
    if(!supabase||!window.confirm('Import the original PDF catalog? Matching PDF IDs will be overwritten.'))return
    setBusy(true);setError('')
    try{const {error:c}=await supabase.from('categories').upsert(seedCategories);if(c)throw c;const {error:p}=await supabase.from('products').upsert(seedProducts);if(p)throw p;await refresh();setStatus('PDF catalog imported.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  const effectiveDiscount = (p: Product) => categories.find(c => c.id === p.category_id)?.discountable ? (p.discount_percent ?? 0) : 0
  const salePrice = (p: Product) => Math.round(p.price * (1 - effectiveDiscount(p) / 100) * 100) / 100
  const visible=products.filter(p=>(!filter||p.category_id===filter)&&(!query||`${p.name} ${p.serial}`.toLowerCase().includes(query.toLowerCase()))&&(!statusFilter|| (statusFilter==='active'?p.active:!p.active)))
  function exportCsv(){const rows=[['Serial','Product','Category','Price INR','Unit','Active','Discount %','Sale price INR'],...visible.map(p=>[p.serial,p.name,categories.find(c=>c.id===p.category_id)?.name??'',p.price,p.unit,p.active,effectiveDiscount(p),salePrice(p)])];const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='thangam-products.csv';a.click();URL.revokeObjectURL(url)}
  if(!signedIn)return <main className="login"><form onSubmit={e=>{e.preventDefault();void login(e.currentTarget)}}><div className="login-brand-row"><Brand/><ThemeToggle/></div><h1>Welcome back.</h1><p>Sign in to manage your catalog.</p><label>Email<input name="email" type="email" required autoComplete="username"/></label><label>Password<input name="password" type="password" required autoComplete="current-password"/></label>{error&&<p role="alert" className="error">{error}</p>}<button className="primary" disabled={busy}>Sign in</button></form></main>
  return <div className="app"><aside><Brand/><div className="nav-label">WORKSPACE</div><nav>{([['Overview',LayoutDashboard],['Orders',ClipboardList],['Products',ShoppingBag],['Categories',Layers]] as const).map(([label,Icon])=><button key={String(label)} className={page===label?'selected':''} onClick={()=>{setPage(String(label));setQuery('');setFilter('');setStatusFilter('')}}><Icon size={19}/>{String(label)}{label==='Products'&&<span>{products.length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="season"><Sparkles/><strong>Diwali 2026</strong><p>Your festive collection,<br/>all in one place.</p></div><div className="profile"><b>TT</b><div>Thangam Traders<small>Catalog administrator</small></div></div></div></aside><div className="workspace"><header><span>Workspace <span className="muted">/ {page}</span></span><span className="connection"><i/>{supabase?'Supabase connected':'Local preview'}</span><ThemeToggle/>{supabase&&<button aria-label="Sign out" onClick={async()=>{const {error}=await supabase!.auth.signOut();if(error)setError(error.message)}}><LogOut size={18}/></button>}</header><main><div className="heading"><div><div className="eyebrow">THANGAM CATALOG</div><h1>{page==='Overview'?'A brighter season starts here.':page}</h1><p>{page==='Orders'?'View customer orders and track their status.':page==='Categories'?'Organize your collection and manage discount eligibility.':'Manage your festive collection, prices, and availability.'}</p></div>{(page==='Products'||page==='Categories')&&<button className="primary" disabled={busy||!ready} onClick={()=>setModal({kind:page==='Categories'?'category':'product'})}><Plus size={18}/>Add {page==='Categories'?'category':'product'}</button>}</div>{!supabase&&<div className="notice">Preview mode · Changes are saved in this browser. Connect Supabase to manage your shared catalog.</div>}{error&&<div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}{status&&<div className="success" role="status">{status}<button aria-label="Dismiss notification" onClick={()=>setStatus('')}><X size={16}/></button></div>}{!ready&&<div className="notice">{error?'Database could not be loaded. Check the schema and your admin access.':'Loading catalog…'}<button onClick={()=>refresh().catch(e=>setError(e.message))}>Retry</button></div>}
  {ready&&<>{(page==='Overview'||page==='Categories')&&<div className={`stats ${page==='Overview'?'overview-stats':''}`}>{([[Package,'Total products',products.length,'In your 2026 collection'],[Grid2X2,'Categories',categories.length,'Thoughtfully organized'],[BadgeCheck,'Active products',products.filter(p=>p.active).length,'Available in the catalog']] as const).map(([Icon,label,value,detail])=><div className="stat" key={String(label)}><div><span>{String(label)}</span><h2>{String(value)}</h2><small>{String(detail)}</small></div><div className="stat-icon"><Icon size={22}/></div></div>)}{page==='Overview'&&<div className="stat"><div><span>Total orders</span><h2>{orderCount ?? '—'}</h2><small>{orderCountError?'Count unavailable; retrying automatically':'All customer orders'}</small></div><div className="stat-icon"><ReceiptText size={22}/></div></div>}</div>}
  {page==='Orders'?<Orders/>:page==='Categories'?<div className="category-grid">{categories.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())).map(c=><article key={c.id}><div className="category-icon"><Layers/></div><h3>{c.name}</h3><p>{products.filter(p=>p.category_id===c.id).length} products</p><span className="badge">{c.discountable?'Discount eligible':'Flat rate · No discount'}</span><div className="card-actions"><button onClick={()=>setModal({kind:'category',item:c})}><Pencil size={16}/>Edit</button><button disabled={busy} aria-label={`Delete ${c.name}`} onClick={()=>remove('category',c)}><Trash2 size={16}/></button></div></article>)}</div>:<section className="catalog"><div className="section-heading"><div><h3>{page==='Overview'?'Your product collection':'All products'} <span className="count">{products.length}</span></h3><p>Price list 2026 · Prices in Indian rupees</p></div><div className="catalog-tools"><button className="secondary" disabled={busy||!ready} onClick={()=>setImportOpen(value=>!value)}><Upload size={16}/>Import CSV</button><button className="secondary" onClick={exportCsv}><Download size={16}/>Export CSV</button></div></div>{importOpen&&<CsvImport categories={categories} products={products} onSave={saveCsv} onClose={()=>setImportOpen(false)}/>}<BulkDiscount disabled={busy||!ready} onApply={applyBulkDiscount}/><div className="filters"><div className="search"><Search size={18}/><input aria-label="Search products" placeholder="Search products or serial number…" value={query} onChange={e=>setQuery(e.target.value)}/></div><select aria-label="Filter category" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Filter status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div className="table-scroll"><table><thead><tr><th>S.NO.</th><th>PRODUCT NAME</th><th>CATEGORY</th><th>PRICE</th><th>UNIT</th><th>ACTIONS</th></tr></thead><tbody>{visible.map(p=><tr key={p.id}><td className="muted">{String(p.serial).padStart(3,'0')}</td><td><div className="product-name"><span className="product-icon"><Sparkles size={18}/></span><strong>{p.name}</strong></div></td><td><span className="category-tag">{categories.find(c=>c.id===p.category_id)?.name}</span></td><td className="price">{effectiveDiscount(p)>0?<><del className="original-price">{money(p.price)}</del><span>{money(salePrice(p))}</span></>:money(p.price)}</td><td className="muted">{p.unit}</td><td><div className="actions"><button type="button" role="switch" aria-checked={p.active} aria-label={`Show ${p.name} on website`} title={p.active ? 'Switch OFF to hide from website' : 'Switch ON to show on website'} disabled={busy} className={`product-switch ${p.active ? 'is-on' : ''}`} onClick={() => void toggleProduct(p)}><span className="switch-track"><span className="switch-thumb"/></span><span>{p.active ? 'ON' : 'OFF'}</span></button><button className="discount-button" aria-label={`Set discount for ${p.name}`} title={categories.find(c=>c.id===p.category_id)?.discountable ? 'Set product discount' : 'Flat rate: discounts not allowed'} disabled={busy || !categories.find(c=>c.id===p.category_id)?.discountable} onClick={()=>{setError('');setDiscount(String(p.discount_percent??0));setModal({kind:'discount',item:p})}}><Percent size={15}/>{effectiveDiscount(p)>0?`${effectiveDiscount(p)}%`: 'Discount'}</button><button aria-label={`Edit ${p.name}`} onClick={()=>setModal({kind:'product',item:p})}><Pencil size={16}/></button><button disabled={busy} aria-label={`Delete ${p.name}`} onClick={()=>remove('product',p)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!visible.length&&<div className="empty"><Boxes size={32}/><h3>No products found</h3><p>{products.length?'Try another search or category.':'Add a product or import the PDF catalog.'}</p>{supabase&&!products.length&&<button disabled={busy} className="primary" onClick={importCatalog}>Import PDF catalog</button>}</div>}</div><footer>Showing {visible.length} of {products.length} products<span>Thangam Traders · 2026</span></footer></section>}</>}
  </main></div>{modal&&<div className="modal-backdrop"><form role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal" onSubmit={e=>{e.preventDefault();void save(e.currentTarget)}}><div className="modal-heading"><h2 id="modal-title">{modal.item?'Edit':'Add'} {modal.kind}</h2><button type="button" aria-label="Close dialog" onClick={()=>setModal(null)}><X/></button></div>{error&&<p role="alert" className="error">{error}</p>}{modal.kind==='discount'?<><p>{modal.item?.name}</p><label>Discount (%)<input autoFocus type="number" min="0" max="100" step="0.01" required value={discount} onChange={e=>setDiscount(e.target.value)}/></label><div className="discount-preview"><span>Original price: {money((modal.item as Product).price)}</span><strong>Sale price: {money(Math.round((modal.item as Product).price*(1-Math.min(100,Math.max(0,Number(discount)||0))/100)*100)/100)}</strong></div><p>Set 0% to remove the discount.</p></>:<><label>Name<input autoFocus name="name" required defaultValue={modal.item?.name}/></label>{modal.kind==='product'?<><div className="form-row"><label>Serial number<input name="serial" type="number" required min="1" step="1" defaultValue={(modal.item as Product)?.serial??Math.max(0,...products.map(p=>p.serial))+1}/></label><label>Price (₹)<input name="price" type="number" required min="0" step="0.01" defaultValue={(modal.item as Product)?.price}/></label></div><label>Category<select name="category_id" required defaultValue={(modal.item as Product)?.category_id??categories[0]?.id}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Selling unit<select name="unit" defaultValue={(modal.item as Product)?.unit??'1 Box'}>{['1 Box','1 pkt','1 Bag','1 pcs'].map(u=><option key={u}>{u}</option>)}</select></label><label className="checkbox"><input name="active" type="checkbox" defaultChecked={(modal.item as Product)?.active??true}/>Show on website</label></>:<label className="checkbox"><input name="discountable" type="checkbox" defaultChecked={(modal.item as Category)?.discountable??true}/>Eligible for discounts</label>}</>}<div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(null)}>Cancel</button><button disabled={busy} className="primary">{busy?'Saving…':'Save changes'}</button></div></form></div>}</div>
}
