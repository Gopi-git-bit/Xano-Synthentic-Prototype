import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import Access from './Access';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './styles.css';

// Explicitly opt-in synthetic UI only. Standard production builds do not ship it.
const allowSandbox = import.meta.env.DEV
  || (import.meta.env.MODE === 'sandbox-preview' && import.meta.env.VITE_ZIPPY_SANDBOX_UI === 'synthetic-only');
const Demo = import.meta.env.DEV ? lazy(() => import('./demo/App')) : null;
const Sandbox = allowSandbox ? lazy(() => import('./sandbox/CustomerPreview')) : null;
const params = new URLSearchParams(location.search);
const explicitDemo = import.meta.env.DEV && params.get('demo') === '1';
const explicitSandbox = allowSandbox && params.get('sandbox') === '1';
const fallback = <div role="status" className="p-8 text-muted">Opening your preview…</div>;

createRoot(document.getElementById('root')!).render(<StrictMode>
  {Sandbox && explicitSandbox
    ? <Suspense fallback={fallback}><Sandbox /></Suspense>
    : Demo && explicitDemo
      ? <Suspense fallback={fallback}><Demo /></Suspense>
      : <Access />}
</StrictMode>);
