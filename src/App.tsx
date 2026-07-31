import { useEffect } from 'react';
import { AppStoreProvider } from '@/store/AppStore';
import { useHashRoute } from '@/hooks/usePwa';
import { AppShell } from '@/components/Layout';
import { Dashboard } from '@/screens/Dashboard';
import { Inventory } from '@/screens/Inventory';
import { ItemForm } from '@/screens/ItemForm';
import { ItemDetail } from '@/screens/ItemDetail';
import { Analytics } from '@/screens/Analytics';
import { Maintenance, Warranties } from '@/screens/Warranties';
import { Categories } from '@/screens/Categories';
import { Scanner, SearchScreen } from '@/screens/Tools';
import { NotFound, Profile, Settings } from '@/screens/Account';

function Router() {
  const [route, navigate] = useHashRoute();
  const segments = route.split('/').filter(Boolean);
  const head = segments[0] ?? '';
  const param = segments[1];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  let screen: React.ReactNode;
  switch (head) {
    case '':
      screen = <Dashboard navigate={navigate} />;
      break;
    case 'inventory':
      screen = <Inventory navigate={navigate} mode="all" />;
      break;
    case 'favorites':
      screen = <Inventory navigate={navigate} mode="favorites" />;
      break;
    case 'archive':
      screen = <Inventory navigate={navigate} mode="archived" />;
      break;
    case 'add':
      screen = <ItemForm navigate={navigate} />;
      break;
    case 'edit':
      screen = param ? <ItemForm navigate={navigate} itemId={param} /> : <NotFound navigate={navigate} />;
      break;
    case 'item':
      screen = param ? <ItemDetail navigate={navigate} itemId={param} /> : <NotFound navigate={navigate} />;
      break;
    case 'analytics':
      screen = <Analytics navigate={navigate} />;
      break;
    case 'warranties':
      screen = <Warranties navigate={navigate} />;
      break;
    case 'maintenance':
      screen = <Maintenance navigate={navigate} />;
      break;
    case 'categories':
      screen = <Categories navigate={navigate} />;
      break;
    case 'search':
      screen = <SearchScreen navigate={navigate} />;
      break;
    case 'scan':
      screen = <Scanner navigate={navigate} />;
      break;
    case 'profile':
      screen = <Profile navigate={navigate} />;
      break;
    case 'settings':
      screen = <Settings navigate={navigate} />;
      break;
    default:
      screen = <NotFound navigate={navigate} />;
  }

  return (
    <AppShell route={route} navigate={navigate}>
      {screen}
    </AppShell>
  );
}

export default function App() {
  useEffect(() => {
    const boot = document.getElementById('boot');
    if (!boot) return;
    boot.style.transition = 'opacity 380ms ease';
    boot.style.opacity = '0';
    const id = window.setTimeout(() => boot.remove(), 420);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <AppStoreProvider>
      <Router />
    </AppStoreProvider>
  );
}
