import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function Brand() {
  const [imageAvailable, setImageAvailable] = useState(true)
  return <div className="brand brand-logo">
    {imageAvailable ? <img src="/thangam-logo.png" alt="Thangam" onError={() => setImageAvailable(false)}/> : <div className="brand-fallback"><Sparkles size={30}/><span>Thangam</span></div>}
    <small>CRACKERS · ADMIN</small>
  </div>
}
