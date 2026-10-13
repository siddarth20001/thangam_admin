import { useState } from 'react'
import { Download, Upload, X } from 'lucide-react'
import Papa from 'papaparse'
import type { Category, Product } from './data/catalog'
import { prepareCsv } from './lib/csvImport'
import type { ImportRow } from './lib/csvImport'
import { seedCategories } from './data/catalog'
export default function CsvImport({ categories, products, onSave, onClose }: { categories: Category[]; products: Product[]; onSave: (rows: ImportRow[]) => Promise<void>; onClose: () => void }) {
  const [preview,setPreview] = useState<ReturnType<typeof prepareCsv> | null>(null)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  async function choose(file?: File) {
    setPreview(null);setError('')
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv') || file.size>2*1024*1024) {setError('Choose a CSV file smaller than 2 MB.');return}
    setBusy(true)
    try {setPreview(prepareCsv(await file.text(),categories,products))}catch{setError('Could not read this CSV file.')}finally{setBusy(false)}
  }
  function template() {
    const csv=Papa.unparse([['Serial','Product','Category','Price INR','Unit','Active','Discount %'],[String(Math.max(0,...products.map(product=>product.serial))+1),'Example product',categories.find(c=>c.discountable)?.name ?? seedCategories[0].name,'100','1 Box','true','0']])
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='thangam-import-template.csv';a.click();URL.revokeObjectURL(url)
  }
  async function save() {
    if (!preview || preview.errors.length || !preview.rows.length) return
    setBusy(true);setError('')
    try {await onSave(preview.rows);onClose()}catch(error){setError((error as Error).message)}finally{setBusy(false)}
  }
  return <section className="csv-import-panel" aria-label="Import products from CSV"><div className="csv-import-heading"><h3>Import products</h3><button disabled={busy} aria-label="Close CSV import" onClick={onClose}><X size={18}/></button></div><p>Match by serial number: existing products are updated and new serials are added. Products omitted from the file stay in the catalog. Categories must already exist.</p><div className="csv-import-controls"><label>Choose CSV file<input type="file" accept=".csv,text/csv" disabled={busy} onChange={event=>void choose(event.target.files?.[0])}/></label><button className="secondary" disabled={busy} onClick={template}><Download size={16}/>Download template</button></div>{error&&<div className="error" role="alert">{error}</div>}{preview&&<><p>{preview.created} new · {preview.updated} updates · {preview.errors.length} validation issues</p>{preview.errors.length>0?<div className="csv-errors" role="alert">{preview.errors.slice(0,25).map((error,i)=><p key={i}>{error}</p>)}{preview.errors.length>25&&<p>…and {preview.errors.length-25} more. Fix the CSV and choose it again.</p>}</div>:<><div className="table-scroll csv-preview"><table><thead><tr><th>SERIAL</th><th>PRODUCT</th><th>CATEGORY</th><th>PRICE INR</th><th>DISCOUNT</th><th>WEBSITE</th></tr></thead><tbody>{preview.rows.map(row=><tr key={row.serial}><td>{row.serial}</td><td>{row.name}</td><td>{categories.find(c=>c.id===row.category_id)?.name}</td><td>{row.price.toFixed(2)}</td><td>{row.discount_percent}%</td><td>{row.active?'ON':'OFF'}</td></tr>)}</tbody></table></div><div className="csv-import-actions"><button className="secondary" disabled={busy} onClick={onClose}>Cancel</button><button className="primary" disabled={busy} onClick={()=>void save()}><Upload size={16}/>{busy?'Importing…':`Import ${preview.rows.length} products`}</button></div></>}</>}</section>
}
