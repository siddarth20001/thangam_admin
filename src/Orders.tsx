import { useEffect, useRef, useState } from 'react'
import { Search, ShoppingBag, RefreshCw } from 'lucide-react'
import { supabase } from './lib/supabase'

type Order = { id: string; order_number: number; customer_name: string; customer_phone: string; customer_email: string | null; total: number; status: string; payment_method: string; created_at: string }
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const formatMoney = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const revision = useRef(0)
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
    <div className="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>PHONE</th><th>DATE</th><th>TOTAL</th><th>PAYMENT</th><th>STATUS</th></tr></thead><tbody>{visible.map(order => <tr key={order.id}><td><strong>#{String(order.order_number).padStart(4, '0')}</strong></td><td><strong>{order.customer_name}</strong>{order.customer_email && <small className="order-email">{order.customer_email}</small>}</td><td>{order.customer_phone}</td><td>{new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(order.created_at))}</td><td className="price">{formatMoney(order.total)}</td><td><span className="badge">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}</span></td><td><div className="order-status-control"><select className={`order-status-select status-${order.status}`} aria-label={`Status for order ${order.order_number}`} value={order.status} disabled={!!savingId || !supabase} onChange={event => void updateStatus(order, event.target.value)}>{statuses.map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select>{savingId === order.id && <small role="status">Saving…</small>}</div></td></tr>)}</tbody></table>{loading ? <div className="empty" role="status">Loading orders…</div> : !error && !visible.length && <div className="empty"><ShoppingBag size={32}/><h3>{orders.length ? 'No matching orders' : 'No orders yet'}</h3><p>{orders.length ? 'Try another search or status.' : 'Orders will appear here once the website checkout is connected.'}</p></div>}</div>
    <footer>Showing {visible.length} of {orders.length} orders<span>Thangam Traders</span></footer>
  </section>
}
