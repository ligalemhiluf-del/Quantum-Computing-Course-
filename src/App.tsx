import { Component, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './ui/Layout';
import { Dashboard } from './ui/pages/Dashboard';
import { Curriculum } from './ui/pages/Curriculum';
import { ModulePage } from './ui/pages/Module';
import { LessonPage } from './ui/pages/Lesson';
import { LabPage, LabsIndex } from './ui/pages/Labs';
import { ReviewPage } from './ui/pages/Review';
import { TutorPage } from './ui/pages/TutorPage';
import { ResearchPage } from './ui/pages/Research';
import { SettingsPage } from './ui/pages/Settings';
import { ConventionsPage } from './ui/pages/Conventions';
import { NotFound } from './ui/pages/NotFound';
import { SessionProvider } from './app/state';

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="wrap" role="alert" style={{ padding: 24 }}>
        <h1>Something went wrong on this page</h1>
        <p>The error was caught and your saved progress was not touched. You can reload, or go back to the dashboard.</p>
        <pre className="code">{this.state.error.message}</pre>
        <p><a className="btn" href="./">Reload the app</a></p>
      </div>
    );
  }
}

export function App() {
  return (
    <Boundary>
      <SessionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="curriculum" element={<Curriculum />} />
            <Route path="module/:id" element={<ModulePage />} />
            <Route path="lesson/:id" element={<LessonPage />} />
            <Route path="labs" element={<LabsIndex />} />
            <Route path="lab/:id" element={<LabPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="tutor" element={<TutorPage />} />
            <Route path="research" element={<ResearchPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="conventions" element={<ConventionsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SessionProvider>
    </Boundary>
  );
}
