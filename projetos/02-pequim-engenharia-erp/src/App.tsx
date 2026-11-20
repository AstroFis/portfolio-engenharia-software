import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopRoleBar } from './components/TopRoleBar';
import { OSPrintModal } from './components/OSPrintModal';
import { OnboardingTourModal, GuidedJourneyBar } from './components/OnboardingTourModal';
import { ManagementModule } from './modules/ManagementModule';
import { ServiceModule } from './modules/ServiceModule';
import { ClientModule } from './modules/ClientModule';

const MainRouter: React.FC = () => {
  const { activeRole, printingOS } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f1ea] text-stone-900">
      <TopRoleBar />
      <GuidedJourneyBar />
      <div className={`flex-1 ${printingOS ? 'print:hidden' : ''}`}>
        {activeRole === 'ADMIN' && <ManagementModule />}
        {activeRole === 'TECH' && <ServiceModule />}
        {activeRole === 'CLIENT' && <ClientModule />}
      </div>
      <OnboardingTourModal />
      <OSPrintModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}

export default App;
