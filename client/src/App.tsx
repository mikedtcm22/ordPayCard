import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { TopUpPage } from './pages/TopUpPage';
import { ManualFlowsPage } from './pages/ManualFlowsPage';
import { WalletTestPage } from './pages/WalletTestPage';
import { XverseDebugPage } from './pages/XverseDebugPage';
import { XverseMinimalTest } from './pages/XverseMinimalTest';
import { XverseRaceConditionTest } from './pages/XverseRaceConditionTest';
import { InscriptionPreview } from './pages/InscriptionPreview';
import { PsbtDebug } from './pages/PsbtDebug';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationContainer } from './components/common/Notification';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/topup" element={<TopUpPage />} />
            <Route path="/manual" element={<ManualFlowsPage />} />
            <Route path="/wallet-test" element={<WalletTestPage />} />
            <Route path="/xverse-debug" element={<XverseDebugPage />} />
            <Route path="/xverse-minimal" element={<XverseMinimalTest />} />
            <Route path="/xverse-race" element={<XverseRaceConditionTest />} />
            <Route path="/inscription-preview" element={<InscriptionPreview />} />
            <Route path="/psbt-debug" element={<PsbtDebug />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MainLayout>
        <NotificationContainer />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
