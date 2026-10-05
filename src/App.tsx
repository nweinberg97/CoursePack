import { getCourse } from './data';
import { allLessons } from './lib/buildCourse';
import { useRoute } from './state/router';
import { StoreProvider } from './state/store';
import { ToastProvider, LinkButton } from './components/ui/primitives';
import { AppShell } from './components/layout/Shell';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Explore } from './pages/Explore';
import { Build } from './pages/Build';
import { CourseOverview } from './pages/CourseOverview';
import { Learn } from './pages/Learn';
import { StudyKit } from './pages/StudyKit';
import { Progress } from './pages/Progress';
import { Complete } from './pages/Complete';

function Router() {
  const [page, a, b] = useRoute();
  const course = a ? getCourse(a) : undefined;
  switch (page) {
    case undefined:
    case '':
      return <Landing />;
    case 'home':
      return <Dashboard />;
    case 'explore':
      return <Explore />;
    case 'build':
      return <Build query={a} />;
    case 'course':
      if (course) return <CourseOverview course={course} />;
      break;
    case 'learn':
      if (course) return <Learn course={course} lessonId={b ?? allLessons(course)[0].id} />;
      break;
    case 'study':
      if (course) return <StudyKit course={course} tab={b} />;
      break;
    case 'progress':
      return <Progress courseId={a} />;
    case 'complete':
      if (course) return <Complete course={course} />;
      break;
  }
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[560px] flex-col items-start gap-4 px-4 py-24 sm:px-6">
        <h1 className="text-[30px] font-[680] tracking-[-0.03em]">That page isn’t here</h1>
        <p className="text-muted">The link may be from a path that was built in another browser. Head home, or build the path again.</p>
        <LinkButton href="#/home" variant="primary">Go to your dashboard</LinkButton>
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </StoreProvider>
  );
}
