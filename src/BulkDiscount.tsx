import { useState } from 'react'
import { Percent } from 'lucide-react'
export default function BulkDiscount({ disabled, onApply }: { disabled: boolean; onApply: (percent: number) => Promise<number> }) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function apply() {
    const percent = Number(value)
    if (!value.trim() || !Number.isFinite(percent) || percent < 0 || percent > 100) { setError('Enter a percentage from 0 to 100.'); return }
    setSaving(true); setError(''); setMessage('')
    try { const count = await onApply(percent); setMessage(`${percent}% discount applied to ${count} products.`) }
    catch (error) { setError((error as Error).message) }
    finally { setSaving(false) }
  }
  return <div className="bulk-discount-panel"><div className="bulk-discount-controls"><label htmlFor="bulk-discount">Discount for all products (%)</label><input id="bulk-discount" type="number" min="0" max="100" step="0.01" placeholder="e.g. 20" value={value} disabled={disabled || saving} onChange={event => setValue(event.target.value)}/><button type="button" className="primary" disabled={disabled || saving} onClick={() => void apply()}><Percent size={16}/>{saving ? 'Applying…' : 'Apply to all'}</button></div><p>Replaces individual discounts for all eligible products, including OFF products. Gift boxes and colour matches keep their flat prices. Use 0% to remove discounts.</p>{error && <div className="error" role="alert">{error}</div>}{message && <div className="success" role="status">{message}</div>}</div>
}
