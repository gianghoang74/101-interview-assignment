import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { CreateInvoicePage } from './pages/CreateInvoicePage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { InvoiceListPage } from './pages/InvoiceListPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<InvoiceListPage />} />
          <Route path="/invoices/new" element={<CreateInvoicePage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
