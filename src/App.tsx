import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import WorkflowDetail from './pages/WorkflowDetail';
import Project from './pages/Project';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="w/:slug" element={<WorkflowDetail />} />
        <Route path="project" element={<Project />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
