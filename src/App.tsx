import { useState } from 'react';
import { SimpleForm } from './SimpleForm';
import ComplexForm from './ComplexForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function App() {
  const [page, setPage] = useState<'simple' | 'complex'>('simple');
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ margin: 40 }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <button
            onClick={() => {
              setPage('simple');
            }}
          >
            Simple
          </button>
          <button
            onClick={() => {
              setPage('complex');
            }}
          >
            Complex
          </button>
        </div>
        <div style={{ marginTop: 20 }}>
          {page === 'simple' && <SimpleForm />}
          {page === 'complex' && <ComplexForm />}
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
