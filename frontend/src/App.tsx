import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes/router';
import { useAuthBootstrap } from './shared/hooks/useAuthBootstrap';

function App() {
  useAuthBootstrap();
  return <RouterProvider router={router} />;
}

export default App;
