import { relativeTime } from '../../utils/time';

const ExecutionLog = ({ logs }) => {
  return (
    <div className="execution-log">
      {logs.length === 0 ? (
        <div className="text-muted text-center" style={{ padding: '2rem' }}>Waiting for executions...</div>
      ) : (
        logs.map((log, index) => (
          <div key={log.executionId || index} className={`log-entry ${log.status}`}>
            <div className={`log-status ${log.status}`} style={{ width: '60px' }}>
              {log.status.toUpperCase()}
            </div>
            <div className="log-job-name">{log.jobName || 'Unknown Job'}</div>
            <div className="log-duration">{log.durationMs}ms</div>
            <div className="mono text-muted" style={{ fontSize: '0.75rem', width: '40px', textAlign: 'right' }}>
              {log.statusCode}
            </div>
            <div className="log-time" title={new Date(log.executedAt).toLocaleString()}>
              {relativeTime(log.executedAt)}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ExecutionLog;
