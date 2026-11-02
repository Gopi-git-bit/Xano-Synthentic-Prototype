import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import Access from './Access';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './styles.css';

// Vite eliminates this import and all fixture/role-preview code in production.
const Demo = import.meta.env.DEV ? lazy(() => import('./demo/App')) : null;

const explicitDemo = import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === '1';
createRoot(document.getElementById('root')!).render(<StrictMode>{Demo && explicitDemo ? <Suspense fallback={<div role="status" className="p-8 text-muted">Opening your preview…</div>}><Demo /></Suspense> : <Access />}</StrictMode>);
