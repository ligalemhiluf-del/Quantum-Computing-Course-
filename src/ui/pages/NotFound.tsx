import { Link } from 'react-router-dom';
import { PageTitle } from '../components/Common';

export function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <div className="stack">
      <PageTitle>That {what} was not found</PageTitle>
      <p>The link may be mistyped or from an older version of the course. Your progress is safe.</p>
      <p><Link className="btn" to="/">Back to the dashboard</Link> <Link className="btn secondary" to="/curriculum">Open the curriculum</Link></p>
    </div>
  );
}
