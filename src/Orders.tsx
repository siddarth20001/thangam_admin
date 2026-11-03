import { useEffect, useRef, useState } from 'react'
import { Download, Search, ShoppingBag, RefreshCw, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import { orderPdf } from './lib/orderPdf'

type Order = { id: string; order_number: number; customer_name: string; customer_phone: string; customer_email: string | null; total: number; status: string; created_at: string; delivery_address: string | null; delivery_city: string | null; delivery_pincode: string | null }
type OrderItem = { id: string; product_name: string; unit: string; quantity: number; original_price: number; discount_percent: number; unit_price: number; line_total: number }
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const formatMoney = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
const formatDate = (value: string) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(value))
export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const revision = useRef(0)
  const itemsRequest = useRef(0)
  const saving = useRef(false)
  async function load() {
    if (!supabase || saving.current) return
    const requestRevision = revision.current
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (error) throw error
      if (requestRevision === revision.current) setOrders(data as Order[])
    } catch (error) { if (requestRevision === revision.current) setError((error as Error).message) }
    finally { setLoading(false) }
  }
  async function updateStatus(order: Order, nextStatus: string) {
    if (!supabase || saving.current || !statuses.includes(nextStatus) || nextStatus === order.status) return
    saving.current = true
    revision.current += 1
    setSavingId(order.id)
    setError('')
    setNotice('')
    try {
      const { data, error } = await supabase.from('orders')
        .update({ status: nextStatus }).eq('id', order.id).eq('status', order.status).select('*').single()
      if (error) throw new Error(error.code === 'PGRST116' ? 'This order changed elsewhere. Refresh and try again.' : error.message)
      setOrders(current => current.map(item => item.id === order.id ? data as Order : item))
      setNotice(`Order #${String(order.order_number).padStart(4, '0')} updated to ${nextStatus}.`)
    } catch (error) {
      setError((error as Error).message)
    } finally {
      saving.current = false
      setSavingId(null)
    }
  }
  async function openOrder(order: Order) {
    if (!supabase) return
    const request = ++itemsRequest.current
    setSelected(order); setItems([]); setItemsError(''); setItemsLoading(true)
    try {
      const { data, error } = await supabase.from('order_items')
        .select('id, product_name, unit, quantity, original_price, discount_percent, unit_price, line_total').eq('order_id', order.id).order('product_name')
      if (error) throw error
      if (request === itemsRequest.current) setItems(data as OrderItem[])
    } catch (error) { if (request === itemsRequest.current) setItemsError((error as Error).message) }
    finally { if (request === itemsRequest.current) setItemsLoading(false) }
  }
  async function downloadPdf(order: Order) {
    setPdfBusy(true); setItemsError('')
    try {
      const pdf = await orderPdf(order, items)
      const url = URL.createObjectURL(new Blob([pdf.bytes as BlobPart], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url; link.download = pdf.filename; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { setItemsError('The PDF could not be created. Please try again.') }
    finally { setPdfBusy(false) }
  }
  useEffect(() => {
    if (!selected) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [selected])
  useEffect(() => {
    void load()
    const refresh = () => { if (!document.hidden) void load() }
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  const visible = orders.filter(order => (!status || order.status === status) && `${order.order_number} ${order.customer_name} ${order.customer_phone} ${order.customer_email ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="catalog">
    <div className="section-heading"><div><h3>All orders <span className="count">{orders.length}</span></h3><p>Customer orders · Newest first</p></div><button className="secondary" disabled={loading || !!savingId || !supabase} onClick={() => void load()}><RefreshCw size={16}/>Refresh</button></div>
    <div className="filters"><div className="search"><Search size={18}/><input aria-label="Search orders" placeholder="Search order number, customer, phone or email…" value={query} onChange={event => setQuery(event.target.value)}/></div><select aria-label="Filter order status" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></div>
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="success" role="status">{notice}</div>}
    <div className="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>PHONE</th><th>DATE</th><th>TOTAL</th><th>STATUS</th></tr></thead><tbody>{visible.map(order => <tr key={order.id} className="order-row" onClick={() => void openOrder(order)}><td><button type="button" className="order-link" aria-label={`View products in order ${order.order_number}`} onClick={event => { event.stopPropagation(); void openOrder(order) }}>#{String(order.order_number).padStart(4, '0')}</button></td><td><strong>{order.customer_name}</strong>{order.customer_email && <small className="order-email">{order.customer_email}</small>}</td><td>{order.customer_phone}</td><td>{formatDate(order.created_at)}</td><td className="price">{formatMoney(order.total)}</td><td onClick={event => event.stopPropagation()}><div className="order-status-control"><select className={`order-status-select status-${order.status}`} aria-label={`Status for order ${order.order_number}`} value={order.status} disabled={!!savingId || !supabase} onChange={event => void updateStatus(order, event.target.value)}>{statuses.map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select>{savingId === order.id && <small role="status">Saving…</small>}</div></td></tr>)}</tbody></table>{loading ? <div className="empty" role="status">Loading orders…</div> : !error && !visible.length && <div className="empty"><ShoppingBag size={32}/><h3>{orders.length ? 'No matching orders' : 'No orders yet'}</h3><p>{orders.length ? 'Try another search or status.' : 'Orders will appear here once the website checkout is connected.'}</p></div>}</div>
    <footer>Showing {visible.length} of {orders.length} orders<span>Thangam Traders</span></footer>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div role="dialog" aria-modal="true" aria-labelledby="order-title" className="modal order-modal" onClick={event => event.stopPropagation()}>
      <div className="modal-heading"><div><h2 id="order-title">Order #{String(selected.order_number).padStart(4, '0')}</h2><small>{formatDate(selected.created_at)} · <span className="order-status">{selected.status}</span></small></div><button type="button" aria-label="Close order details" autoFocus onClick={() => setSelected(null)}><X/></button></div>
      <div className="order-customer"><div><span>Customer</span><strong>{selected.customer_name}</strong><small>{selected.customer_phone}{selected.customer_email && ` · ${selected.customer_email}`}</small></div>{selected.delivery_address && <div><span>Delivery address</span><p>{[selected.delivery_address, selected.delivery_city, selected.delivery_pincode].filter(Boolean).join(', ')}</p></div>}</div>
      {itemsError && <div className="error" role="alert">{itemsError}</div>}
      {itemsLoading ? <div className="empty" role="status">Loading products…</div> : !itemsError && <>
        <h3 className="order-items-heading">{items.length} {items.length === 1 ? 'product' : 'products'} · {items.reduce((sum, item) => sum + item.quantity, 0)} items</h3>
        <div className="table-scroll"><table className="order-items"><thead><tr><th>PRODUCT</th><th>QTY</th><th>PRICE</th><th>TOTAL</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.product_name}</strong><small>{item.unit}</small></td><td>{item.quantity}</td><td>{formatMoney(item.unit_price)}{item.discount_percent > 0 && <small><s>{formatMoney(item.original_price)}</s> {item.discount_percent}% off</small>}</td><td className="price">{formatMoney(item.line_total)}</td></tr>)}</tbody></table></div>
        <div className="order-total"><span>Order total</span><strong>{formatMoney(selected.total)}</strong></div>
        <div className="order-actions"><button type="button" className="secondary" disabled={pdfBusy || !items.length} onClick={() => void downloadPdf(selected)}><Download size={16}/>{pdfBusy ? 'Preparing PDF…' : 'Download PDF'}</button></div>
      </>}
    </div></div>}
  </section>
}
