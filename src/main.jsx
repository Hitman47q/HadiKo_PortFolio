import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import Site, { NotFound } from './site/Site.jsx'

// The dashboard is a separate chunk, so visitors never download it.
const Admin = lazy(() => import('./admin/Admin.jsx'))

const path = window.location.pathname.replace(/\/+$/, '') || '/'
let page = <NotFound />
if (path === '/' || path === '/index.html') page = <Site />
else if (path === '/admin' || path.startsWith('/admin/')) page = <Suspense fallback={null}><Admin /></Suspense>

createRoot(document.getElementById('root')).render(<StrictMode>{page}</StrictMode>)
