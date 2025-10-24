import React, {useEffect, useMemo, useState} from 'react'

type Pricing = {
  bases: Record<string,{labourPerM2:number, materialPerM2:number}>
  tiers: Record<string, number>
  access: Record<string, number>
  wasteAddPerM2: Record<string, number>
  productivity: Record<string, number>
  overheadRate: number
  contingencyRate: number
  overheadFloor: number
}

const currency = (n:number)=> n.toLocaleString('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0})

const DEFAULT_CFG = {
  brand:{
    name:'Bates Landscapes',
    owner:'Bates Landscapes',
    phone:'+44 7785 585 870',
    whatsapp:'447785585870',
    email:'jrboyce@hotmail.com',
    areas:'Sheffield & Peak District',
    strap:'Patios • Shed Bases • Garden Beds — Sheffield & Peak District',
  },
  pricing:{
    bases:{
      patio:{labourPerM2:70, materialPerM2:55},
      shedbase:{labourPerM2:55, materialPerM2:35},
      steps:{labourPerM2:120, materialPerM2:65},
      raisedbeds:{labourPerM2:65, materialPerM2:50},
      path:{labourPerM2:50, materialPerM2:30},
    },
    tiers:{basic:1, mid:1.35, premium:1.75},
    access:{easy:1, normal:1.1, tricky:1.25},
    wasteAddPerM2:{none:0, some:5, heavy:12},
    productivity:{patio:8, shedbase:10, steps:4, raisedbeds:10, path:12},
    overheadRate:0.05, contingencyRate:0.08, overheadFloor:50
  } as Pricing
}

export default function App(){
  const [cfg, setCfg] = useState(DEFAULT_CFG)
  useEffect(()=>{
    fetch('/config.json')
      .then(r=>r.ok?r.json():DEFAULT_CFG)
      .then((data)=> setCfg(prev=>({...prev, ...data, pricing:{...prev.pricing, ...(data.pricing||{})}})))
      .catch(()=>{})
  },[])

  const BASES = cfg.pricing.bases
  const PRODUCTIVITY = cfg.pricing.productivity

  const [project, setProject] = useState<keyof typeof BASES>('patio')
  const [tier, setTier] = useState<keyof typeof cfg.pricing.tiers>('mid')
  const [access, setAccess] = useState<keyof typeof cfg.pricing.access>('normal')
  const [waste, setWaste] = useState<keyof typeof cfg.pricing.wasteAddPerM2>('some')
  const [length, setLength] = useState('4')
  const [width, setWidth] = useState('3')
  const [notes, setNotes] = useState('')
  const [name, setName] = useState('')
  const [postcode, setPostcode] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const area = useMemo(()=>{
    const L = parseFloat(length)||0; const W = parseFloat(width)||0; return Math.max(0, L*W)
  },[length,width])

  const estimate = useMemo(()=>{
    const base = BASES[project]
    const t = cfg.pricing.tiers[tier]
    const a = cfg.pricing.access[access]
    const wasteAdd = cfg.pricing.wasteAddPerM2[waste]

    const labour = base.labourPerM2 * area * a
    const materials = (base.materialPerM2 * t + wasteAdd) * area
    const subtotal = labour + materials
    const overhead = Math.max(cfg.pricing.overheadFloor, subtotal * cfg.pricing.overheadRate)
    const contingency = subtotal * cfg.pricing.contingencyRate
    const total = subtotal + overhead + contingency
    const low = total * 0.9
    const high = total * 1.1
    const days = Math.max(1, Math.ceil(area / (PRODUCTIVITY[project]||8)))
    return {labour, materials, overhead, contingency, total, low, high, days}
  },[project,tier,access,waste,area,cfg])

  const encodedWhatsApp = useMemo(()=>{
    const msg = [
      `Hi ${cfg.brand.owner}, I'd like an exact quote.`,
      ``,
      `Project: ${labelFor(project)}`,
      `Size: ${length}m x ${width}m (≈ ${area.toFixed(1)} m²)`,
      `Material tier: ${tierLabel(tier)}`,
      `Access: ${accessLabel(access)}`,
      `Waste: ${wasteLabel(waste)}`,
      notes?`Notes: ${notes}`:``,
      `My details: ${name||'(name)'}, ${postcode||'(postcode)'}, ${phone||email||'(contact)'}`,
      `Estimator shows ~${currency(estimate.low)}–${currency(estimate.high)} over ~${estimate.days} day(s).`
    ].filter(Boolean).join('\n')
    return encodeURIComponent(msg)
  },[cfg, project,length,width,area,tier,access,waste,notes,name,postcode,phone,email,estimate])

  const whatsappHref = `https://wa.me/${cfg.brand.whatsapp}?text=${encodedWhatsApp}`
  const mailtoHref = useMemo(()=>{
    const subject = encodeURIComponent(`${cfg.brand.name} enquiry — ${labelFor(project)}`)
    const body = encodeURIComponent(
      `Hello ${cfg.brand.owner},\n\n`+
      `I'm interested in: ${labelFor(project)}\n`+
      `Size: ${length}m x ${width}m (≈ ${area.toFixed(1)} m²)\n`+
      `Tier: ${tierLabel(tier)}\n`+
      `Access: ${accessLabel(access)}\n`+
      `Waste: ${wasteLabel(waste)}\n`+
      (notes?`Notes: ${notes}\n`:``)+
      `Estimator range: ${currency(estimate.low)}–${currency(estimate.high)} over ~${estimate.days} day(s).\n\n`+
      `My details: ${name} ${postcode?`(${postcode})`:``} ${phone||email?`— ${phone||email}`:``}`
    )
    return `mailto:${cfg.brand.email}?subject=${subject}&body=${body}`
  },[cfg,project,length,width,area,tier,access,waste,notes,name,postcode,phone,email,estimate])

  function labelFor(k:string){
    const map:Record<string,string>={
      patio:'Patio (natural stone or porcelain)',
      shedbase:'Shed Base (concrete/slab)',
      steps:'Garden Steps',
      raisedbeds:'Raised Beds (sleepers)',
      path:'Garden Path (gravel/flags)',
    }
    return map[k]||k
  }
  function tierLabel(k:string){ const m:Record<string,string>={basic:'£ (budget)', mid:'££ (mid)', premium:'£££ (premium)'}; return m[k]||k }
  function accessLabel(k:string){ const m:Record<string,string>={easy:'Easy', normal:'Normal', tricky:'Tricky'}; return m[k]||k }
  function wasteLabel(k:string){ const m:Record<string,string>={none:'None', some:'Some', heavy:'Heavy'}; return m[k]||k }

  // Auto Gallery: import any images added to src/assets/gallery (no code edits)
  const galleryUrls = useMemo(()=>{
    const mods = import.meta.glob('/src/assets/gallery/*.{jpg,jpeg,png,webp}', { eager:true, as:'url' }) as Record<string,string>
    return Object.values(mods)
  },[])
  const [active, setActive] = useState<string|null>(null)

  return (
    <div>
      <header>
        <div className="container" style={{padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:700, fontSize:18}}>{cfg.brand.name}</div>
            <div style={{fontSize:12, color:'#6b7280'}}>{cfg.brand.areas}</div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <a className="btn outline" href={`tel:${cfg.brand.phone}`}>Call</a>
            <a className="btn" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </header>

      <main className="container" style={{padding:'28px 16px'}}>
        <div className="row">
          <div>
            <h1>{cfg.brand.strap}</h1>
            <p>Trusted local landscaper for patios, shed bases, steps, raised beds and paths. Honest quotes, tidy work, punctual and polite.</p>
            <div style={{marginTop:8}}>
              <span className="pill">Precise prep</span>
              <span className="pill">Insured</span>
              <span className="pill">Reliable scheduling</span>
              <span className="pill">Transparent pricing</span>
            </div>
          </div>

          <div className="card">
            <div style={{display:'flex',alignItems:'center',gap:8, marginBottom:8}}>
              <h2>Instant Estimate</h2>
            </div>
            <p className="muted" style={{fontSize:14}}>Get a ballpark cost and timeframe. For an exact quote, send photos via WhatsApp.</p>

            <div className="grid2">
              <div style={{gridColumn:'1/3'}}>
                <label>Project type</label>
                <select value={project as string} onChange={e=>setProject(e.target.value as any)}>
                  {Object.keys(BASES).map(k=>(<option key={k} value={k}>{labelFor(k)}</option>))}
                </select>
              </div>
              <div>
                <label>Length (m)</label>
                <input inputMode="decimal" value={length} onChange={e=>setLength(e.target.value)}/>
              </div>
              <div>
                <label>Width (m)</label>
                <input inputMode="decimal" value={width} onChange={e=>setWidth(e.target.value)}/>
              </div>
              <div>
                <label>Material quality</label>
                <select value={tier as string} onChange={e=>setTier(e.target.value as any)}>
                  {Object.keys(cfg.pricing.tiers).map(k=>(<option key={k} value={k}>{tierLabel(k)}</option>))}
                </select>
              </div>
              <div>
                <label>Access</label>
                <select value={access as string} onChange={e=>setAccess(e.target.value as any)}>
                  {Object.keys(cfg.pricing.access).map(k=>(<option key={k} value={k}>{accessLabel(k)}</option>))}
                </select>
              </div>
              <div>
                <label>Waste</label>
                <select value={waste as string} onChange={e=>setWaste(e.target.value as any)}>
                  {Object.keys(cfg.pricing.wasteAddPerM2).map(k=>(<option key={k} value={k}>{wasteLabel(k)}</option>))}
                </select>
              </div>
              <div style={{gridColumn:'1/3'}}>
                <label>Extra notes (optional)</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Stone type, photos to WhatsApp, access notes, skip on drive, drainage, etc."/>
              </div>
            </div>

            <div className="est" style={{marginTop:12}}>
              <div className="kv"><span>Area</span><span>{area?`${area.toFixed(1)} m²`:'—'}</span></div>
              <div className="kv"><span>Labour</span><span>{currency(estimate.labour)}</span></div>
              <div className="kv"><span>Materials</span><span>{currency(estimate.materials)}</span></div>
              <div className="kv"><span>Overheads & contingency</span><span>{currency(estimate.overhead+estimate.contingency)}</span></div>
              <div className="kv" style={{fontWeight:700, marginTop:6}}><span>Estimated total</span><span>{currency(estimate.total)}</span></div>
              <div className="kv" style={{color:'#6b7280'}}><span>Likely range</span><span>{currency(estimate.low)}–{currency(estimate.high)}</span></div>
              <div className="kv" style={{color:'#6b7280'}}><span>Likely duration</span><span>~{estimate.days} day(s)</span></div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <a className="btn outline" onClick={()=>{navigator.clipboard.writeText(`PROJECT SUMMARY\n${labelFor(project)}\n${length}m x ${width}m (≈ ${area.toFixed(1)} m²)\nTier: ${tierLabel(tier)}\nAccess: ${accessLabel(access)}\nWaste: ${wasteLabel(waste)}\nEstimate: ${currency(estimate.low)}–${currency(estimate.high)} over ~${estimate.days} day(s)\n${notes?`Notes: ${notes}`:''}`)}}>Copy summary</a>
              <a className="btn" href={whatsappHref} target="_blank" rel="noreferrer">Send to WhatsApp</a>
            </div>
            <p style={{fontSize:12,color:'#6b7280',marginTop:8}}>Guide only. Final quotes follow a site visit and written scope. Prices assume materials delivered to site. VAT not included unless specified.</p>
          </div>
        </div>

        <section style={{marginTop:28}}>
          <h3>Recent Work</h3>
          <p style={{fontSize:14,color:'#6b7280'}}>A few real jobs around Sheffield & the Peaks. Ask for references and site photos.</p>
          <div className="gallery gallery-columns">
            {galleryUrls.map(src => (
              <img key={src} src={src} alt="Bates Landscapes project" onClick={()=>setActive(src)} loading="lazy" />
            ))}
          </div>
          {active && (
            <div className="lightbox" onClick={()=>setActive(null)}>
              <img src={active} alt="Preview"/>
            </div>
          )}
        </section>

        <section style={{marginTop:28}}>
          <div className="card">
            <h3 style={{marginBottom:6}}>Quick Enquiry</h3>
            <p style={{fontSize:14,color:'#6b7280'}}>Prefer email? Share your details and we’ll confirm a site visit window.</p>
            <div className="grid2">
              <div><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Doe"/></div>
              <div><label>Postcode</label><input value={postcode} onChange={e=>setPostcode(e.target.value)} placeholder="S7 1AA"/></div>
              <div><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
              <div><label>Phone</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07…"/></div>
            </div>
            <div style={{marginTop:12, display:'flex', gap:8}}>
              <a className="btn" href={mailtoHref}>Send Enquiry Email</a>
              <a className="btn outline" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp instead</a>
            </div>
          </div>
        </section>
      </main>

      <footer>© {new Date().getFullYear()} {cfg.brand.name}. Built with love and graft.</footer>
    </div>
  )
}
