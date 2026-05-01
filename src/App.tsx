import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import WorkflowDetail from './pages/WorkflowDetail';
import Queue from './pages/Queue';
import About from './pages/About';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="w/:slug" element={<WorkflowDetail />} />
        <Route path="queue" element={<Queue />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
