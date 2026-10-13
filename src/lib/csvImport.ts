import Papa from 'papaparse'
import type { Category, Product } from '../data/catalog'
export type ImportRow = Omit<Product, 'id'> & { discount_percent: number }
export function prepareCsv(text: string, categories: Category[], products: Product[]): { rows: ImportRow[]; errors: string[]; created: number; updated: number } {
  const result = Papa.parse<Record<string,string>>(text.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: 'greedy', transformHeader: value => value.trim().toLowerCase() })
  const errors = result.errors.map(error => `CSV row ${(error.row ?? 0) + 2}: ${error.message}`)
  const headers = result.meta.fields ?? []
  for (const header of ['serial','product','category','price inr','unit']) if (!headers.includes(header)) errors.push(`Missing column: ${header}`)
  if (new Set(headers).size !== headers.length || Object.keys(result.meta.renamedHeaders ?? {}).length) errors.push('Duplicate column headings are not allowed.')
  if (!result.data.length) errors.push('The CSV has no product rows.')
  if (result.data.length > 2000) errors.push('Import up to 2,000 products at a time.')
  if (errors.length) return { rows: [], errors, created: 0, updated: 0 }
  const serials = new Set<number>()
  const rows: ImportRow[] = []
  let updated = 0
  result.data.forEach((row, index) => {
    const rowErrors: string[] = []
    const serialText = row.serial?.trim() ?? ''
    const serial = Number(serialText)
    if (!/^\d+$/.test(serialText) || !Number.isSafeInteger(serial) || serial<1 || serial>2147483647) rowErrors.push('Serial must be a positive whole number.')
    if (serials.has(serial)) rowErrors.push(`Duplicate serial ${serial}.`)
    serials.add(serial)
    const existing = products.find(product => product.serial===serial)
    const name = row.product?.trim() ?? ''
    if (!name || name.length>500) rowErrors.push('Product name is required (up to 500 characters).')
    const category = categories.find(category => category.name.toLowerCase() === row.category?.trim().toLowerCase())
    if (!category) rowErrors.push(`Unknown category “${row.category ?? ''}”; create it under Categories first.`)
    const priceText = row['price inr']?.trim() ?? ''
    const price = Number(priceText)
    if (!/^\d+(\.\d{1,2})?$/.test(priceText) || !Number.isFinite(price) || price<0 || price>9999999999.99) rowErrors.push('Price INR must be a non-negative number with up to two decimal places (without ₹ or commas).')
    const unit = row.unit?.trim() ?? ''
    if (!['1 Box','1 pkt','1 Bag','1 pcs'].includes(unit)) rowErrors.push('Unit must be 1 Box, 1 pkt, 1 Bag, or 1 pcs.')
    const activeText = row.active?.trim().toLowerCase() ?? ''
    let active = existing?.active ?? true
    if (activeText) { if (['true','on','1','yes'].includes(activeText)) active=true; else if (['false','off','0','no'].includes(activeText)) active=false; else rowErrors.push('Active must be true/false, ON/OFF, yes/no, or 1/0.') }
    const discountText = row['discount %']?.trim() ?? ''
    const discount_percent = discountText ? Number(discountText) : category?.discountable ? existing?.discount_percent ?? 0 : 0
    if (!Number.isFinite(discount_percent) || discount_percent<0 || discount_percent>100 || (discountText && !/^\d+(\.\d{1,2})?$/.test(discountText))) rowErrors.push('Discount % must be between 0 and 100 with up to two decimal places.')
    if (category && !category.discountable && discount_percent>0) rowErrors.push('This category is flat-rate and cannot have a discount.')
    if (rowErrors.length) errors.push(...rowErrors.map(error => `Row ${index+2}: ${error}`))
    else { rows.push({serial,name,price,unit,category_id:category!.id,active,discount_percent}); if(existing)updated++ }
  })
  return { rows, errors, updated, created: rows.length-updated }
}
