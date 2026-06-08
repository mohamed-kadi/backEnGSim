import { useEffect, useState, useRef, type ReactNode } from 'react';
import Editor from '@monaco-editor/react';

type ScenarioDefinition = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  trigger: string;
  failureMode: string;
  learningGoal: string;
  seniorDiagnosis: string;
  remediation: string;
  affectedComponents: string[];
  concepts: string[];
  investigationSteps: string[];
};

type DependencyStatus = {
  id: string;
  name: string;
  role: string;
  status: 'UP' | 'DOWN' | 'DEGRADED' | string;
  detail: string;
};

type LearningNote = {
  scenarioId: string;
  notes: string;
  completed: boolean;
  updatedAt: string | null;
};

const scenarioIcons: Record<string, string> = {
  '01-dto-regression': '💣',
  '02-api-latency': '🐌',
  '03-db-connection': '🔌',
  '04-cache-stampede': '💥',
  '05-write-failure': '📝',
  '06-memory-leak': '💧',
  '07-kafka-consumer-lag': '🐢',
  '08-saga-failure': '🔗',
  '09-rate-limiting': '🚦',
};

const readJson = async (res: Response) => {
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
};

export default function App() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [scenarioCatalog, setScenarioCatalog] = useState<ScenarioDefinition[]>([]);
  const [dependencies, setDependencies] = useState<DependencyStatus[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : '';
  const activeScenarioDetails = scenarioCatalog.find((scenario) => scenario.id === activeScenario) || null;
  const [editorContent, setEditorContent] = useState<string>(
`# SRE Configuration Editor
spring.datasource.url=jdbc:postgresql://localhost:5433/backendlab
spring.data.redis.port=6379
management.endpoints.web.exposure.include=health,prometheus

# Use this editor to practice identifying configuration drift.`
  );

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/_system/scenario/status');
      const data = await readJson(res);
      const scenario = data.activeScenario;
      setActiveScenario(scenario && scenario !== "none" ? scenario : null);
    } catch (e) {
      console.error("Failed to fetch status", e);
      setActiveScenario(null);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/_system/logs');
      const data = await readJson(res);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch logs", e);
      setLogs([]);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/_system/scenario/catalog');
      const data = await readJson(res);
      setScenarioCatalog(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch scenario catalog", e);
      setScenarioCatalog([]);
    }
  };

  const fetchDependencies = async () => {
    try {
      const res = await fetch('/api/_system/dependencies');
      const data = await readJson(res);
      setDependencies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch dependency health", e);
      setDependencies([]);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchStatus();
    fetchLogs();
    fetchDependencies();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
      fetchDependencies();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Only scroll the internal terminal container (not the whole page), and only when a NEW log arrives
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [lastLog]);

  const triggerScenario = async (id: string) => {
    await fetch(`/api/_system/scenario/activate/${id}`, { method: 'POST' });
    fetchStatus();
  };

  const resetSystem = async () => {
    await fetch('/api/_system/scenario/reset', { method: 'POST' });
    fetchStatus();
  };

  const generateTestUser = async () => {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'dashboard_tester', email: 'tester@example.com' })
    });
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto font-sans">
      <header className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-emerald-400 tracking-tight">🚀 SRE Operations Dashboard</h1>
        <p className="text-slate-400 mt-2">Chaos Engineering & Incident Simulation Control Panel</p>
      </header>
      
      <div className={`p-6 rounded-lg mb-8 shadow-lg transition-colors duration-300 border ${activeScenario ? 'bg-red-950 border-red-700' : 'bg-slate-800 border-slate-700'}`}>
        <h2 className="text-xl font-mono flex items-center gap-3">
          <span className="text-slate-400">STATUS:</span> 
          {activeScenario ? (
            <span className="text-red-400 animate-pulse">⚠️ INCIDENT ACTIVE ({activeScenario})</span>
          ) : (
            <span className="text-emerald-400">✅ NORMAL</span>
          )}
        </h2>
      </div>

      <SystemMapPanel dependencies={dependencies} affectedComponents={activeScenarioDetails?.affectedComponents || []} />

      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
        <div className="mb-4 border-b border-slate-700 pb-2">
          <h3 className="text-lg font-semibold text-slate-300">Scenario Catalog</h3>
          <p className="text-sm text-slate-400 mt-1">Each scenario teaches a production failure pattern, the senior-level diagnosis, and a concrete investigation path.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarioCatalog.length === 0 ? (
            <div className="md:col-span-2 rounded-lg border border-yellow-600/40 bg-yellow-950/30 p-4 text-sm text-yellow-100">
              Scenario catalog unavailable. Check that the backend is running at http://localhost:8080, then refresh the dashboard.
            </div>
          ) : (
            scenarioCatalog.map((scenario) => (
              <ScenarioButton
                key={scenario.id}
                icon={scenarioIcons[scenario.id] || '⚙️'}
                title={scenario.title}
                eyebrow={`${scenario.category} · ${scenario.difficulty}`}
                onClick={() => triggerScenario(scenario.id)}
                isActive={activeScenario === scenario.id}
              />
            ))
          )}

          {/* Diagnostic Button */}
          <div className="col-span-1 md:col-span-2 border-t border-slate-700/50 my-2"></div>
          <ScenarioButton icon="👤" title="Generate Test User (Kafka)" onClick={generateTestUser} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">Live Configuration</h3>
          <div className="h-64 rounded overflow-hidden border border-slate-700">
            <Editor
              height="100%"
              defaultLanguage="ini"
              theme="vs-dark"
              value={editorContent}
              onChange={(value) => setEditorContent(value || '')}
            />
          </div>
        </div>

          <div className="bg-black rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
            <WindowHeader title="system-terminal ~ tail -f /var/log/syslog" />
            <div ref={terminalContainerRef} className="p-4 font-mono text-xs h-72 overflow-y-auto scroll-smooth leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">Waiting for system events...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`${log.includes('FAULT INJECTED') ? 'text-red-400 font-bold' : 'text-emerald-500'} ${log.includes('SCENARIO ENGINE') ? 'text-cyan-400' : ''} ${log.includes('KAFKA') ? 'text-purple-400 font-bold' : ''}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <PipelineVisualizer activeScenario={activeScenario} />

        <LearningPanel scenario={activeScenarioDetails} />

        <LearningRunbookPanel scenario={activeScenarioDetails} />

        <button 
          onClick={resetSystem} 
          className="w-full mt-4 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.01] border border-emerald-500/50 tracking-wide"
        >
          ✅ Reset to Normal
        </button>
    </div>
  );
}

const WindowHeader = ({ title }: { title: string }) => (
  <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
    <div className="flex gap-1.5">
      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
    </div>
    <span className="text-xs font-mono text-slate-400 ml-2">{title}</span>
  </div>
);

const ScenarioButton = ({ icon, title, eyebrow, onClick, isActive }: { icon: string, title: string, eyebrow?: string, onClick: () => void, isActive?: boolean }) => {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 shadow-sm text-left ${isActive ? 'bg-red-900/40 border-red-500/50 text-red-100 ring-1 ring-red-500/50' : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-300'}`}
    >
      <span className="text-xl">{icon}</span>
      <span>
        {eyebrow && <span className="block text-[11px] uppercase tracking-widest text-slate-500">{eyebrow}</span>}
        <span className="font-medium text-sm">{title}</span>
      </span>
    </button>
  );
};

const componentNodes = [
  { id: 'client', name: 'Client / k6', role: 'Traffic source and API consumer', icon: '💻' },
  { id: 'aop', name: 'Chaos Aspect', role: 'Runtime fault injection boundary', icon: '🛡️' },
  { id: 'api', name: 'Backend API', role: 'User API and scenario engine', icon: '⚙️' },
  { id: 'postgres', name: 'PostgreSQL', role: 'Transactional persistence', icon: '🗄️' },
  { id: 'redis', name: 'Redis', role: 'Cache boundary', icon: '⚡' },
  { id: 'kafka', name: 'Kafka', role: 'Async event backbone', icon: '📨' },
  { id: 'order', name: 'Order Service', role: 'Secondary service / saga boundary', icon: '📦' },
];

const SystemMapPanel = ({ dependencies, affectedComponents }: { dependencies: DependencyStatus[], affectedComponents: string[] }) => {
  const statusById = new Map(dependencies.map((dependency) => [dependency.id, dependency]));

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg mb-8">
      <div className="mb-4 border-b border-slate-700 pb-2">
        <h3 className="text-lg font-semibold text-slate-300">System Map & Dependency Health</h3>
        <p className="text-sm text-slate-400 mt-1">Use this map to connect each failure to the service boundary it stresses.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {componentNodes.map((node) => {
          const health = statusById.get(node.id);
          const isAffected = affectedComponents.includes(node.id);
          const status = health?.status || (node.id === 'client' || node.id === 'aop' ? 'LOCAL' : 'UNKNOWN');
          return (
            <div
              key={node.id}
              className={`min-h-32 rounded-lg border p-4 transition-colors ${isAffected ? 'border-red-500 bg-red-950/40' : 'border-slate-700 bg-slate-900/60'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{node.icon}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{node.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{node.role}</p>
                  </div>
                </div>
                <StatusPill status={status} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">{health?.detail || (isAffected ? 'Affected by active scenario' : 'No live probe required')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatusPill = ({ status }: { status: string }) => {
  const normalized = status.toUpperCase();
  const className =
    normalized === 'UP' ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300' :
    normalized === 'DOWN' ? 'border-red-500/50 bg-red-950/60 text-red-300' :
    normalized === 'DEGRADED' ? 'border-yellow-500/50 bg-yellow-950/60 text-yellow-300' :
    'border-slate-600 bg-slate-800 text-slate-400';

  return <span className={`shrink-0 rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${className}`}>{status}</span>;
};

const runbookEvidenceByComponent: Record<string, string[]> = {
  client: ['Compare expected response contracts with the current API payload.', 'Capture the exact request, response status, and response body.'],
  aop: ['Check which fault injection scenario is active.', 'Map the injected behavior to the intercepted controller or repository method.'],
  api: ['Review backend logs around the failing request.', 'Check whether the failure is synchronous, asynchronous, transient, or deterministic.'],
  postgres: ['Inspect repository behavior and transaction boundaries.', 'Decide whether the symptom is connection exhaustion, write failure, or schema/data drift.'],
  redis: ['Look for cache timeout symptoms and backend fallback behavior.', 'Decide whether the cache is accelerating reads or becoming a dependency bottleneck.'],
  kafka: ['Check producer and consumer logs separately.', 'Describe whether the issue affects command handling, event publication, or downstream processing.'],
  order: ['Call the order service health endpoint.', 'Decide whether the backend should fail closed, retry, compensate, or continue best-effort.'],
};

const getRunbookEvidence = (scenario: ScenarioDefinition) => {
  const evidence = scenario.affectedComponents.flatMap((component) => runbookEvidenceByComponent[component] || []);
  return Array.from(new Set(evidence));
};

const getRunbookSummaryPrompt = (scenario: ScenarioDefinition) => {
  return `Incident: ${scenario.title}
Failed boundary:
Evidence:
User impact:
Root cause hypothesis:
Remediation:
Terms to use: ${scenario.concepts.join(', ')}`;
};

const PipelineVisualizer = ({ activeScenario }: { activeScenario: string | null }) => {
  const [progress, setProgress] = useState(0);

  const rawSteps = [
    { name: 'Build', isFailurePoint: false },
    { name: 'Unit Tests', isFailurePoint: false },
    { name: 'Contract Tests', isFailurePoint: activeScenario === '01-dto-regression' },
    { name: 'Integration', isFailurePoint: ['02-api-latency', '03-db-connection', '04-cache-stampede', '05-write-failure', '06-memory-leak', '07-kafka-consumer-lag', '08-saga-failure', '09-rate-limiting'].includes(activeScenario || '') },
    { name: 'Deploy', isFailurePoint: false }
  ];

  const failureIndex = rawSteps.findIndex(s => s.isFailurePoint);
  const targetProgress = failureIndex !== -1 ? failureIndex : 5;

  useEffect(() => {
    // Trigger a simulated pipeline run every time the scenario changes
    setProgress(0);
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= targetProgress) {
          clearInterval(timer);
          return targetProgress;
        }
        return p + 1;
      });
    }, 1200); // 1.2 seconds per pipeline stage
    
    return () => clearInterval(timer);
  }, [activeScenario, targetProgress]);

  const steps = rawSteps.map((step, idx) => {
    let status = 'pending';
    
    if (progress > idx) {
      status = 'success';
    } else if (progress === idx) {
      status = step.isFailurePoint ? 'failed' : 'running';
    } else if (progress === targetProgress && targetProgress !== 5) {
      status = 'cancelled';
    }
    return { ...step, status };
  });

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 shadow-lg backdrop-blur-sm">
      <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-8">Live CI/CD Pipeline Status</h3>
      <div className="flex items-center justify-between relative px-2 md:px-8">
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-700/80 -z-10 rounded-full"></div>
        
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center gap-4 bg-transparent relative z-10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-xl transition-all duration-300 ${
              step.status === 'success' ? 'bg-emerald-900/80 text-emerald-400 border-2 border-emerald-500 shadow-emerald-900/50' :
              step.status === 'failed' ? 'bg-red-900/80 text-red-400 border-2 border-red-500 animate-pulse shadow-red-900/50' :
              step.status === 'running' ? 'bg-blue-900/80 text-blue-400 border-2 border-blue-500 animate-spin shadow-blue-900/50' :
              'bg-slate-800 text-slate-500 border-2 border-slate-600'
            }`}>
              {step.status === 'success' ? '✓' : step.status === 'failed' ? '✗' : step.status === 'running' ? '↻' : '⋯'}
            </div>
            <div className={`text-xs font-bold text-center uppercase tracking-wider ${
              step.status === 'success' ? 'text-emerald-400' :
              step.status === 'failed' ? 'text-red-400' :
              step.status === 'running' ? 'text-blue-400' :
              'text-slate-400'
            }`}>
              {step.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LearningRunbookPanel = ({ scenario }: { scenario: ScenarioDefinition | null }) => {
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  const [noteReady, setNoteReady] = useState(false);
  const storageKey = scenario ? `backendlab.runbook.${scenario.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      setNotes('');
      setCompleted(false);
      setNoteReady(false);
      return;
    }

    const scenarioId = scenario?.id;
    if (!scenarioId) return;

    const fallback = readLocalLearningNote(storageKey, scenarioId);
    setNotes(fallback.notes);
    setCompleted(fallback.completed);
    setSyncState('idle');
    setNoteReady(false);

    let cancelled = false;
    fetch(`/api/_learning/notes/${scenarioId}`)
      .then(readJson)
      .then((data: LearningNote) => {
        if (cancelled) return;
        setNotes(data.notes || '');
        setCompleted(Boolean(data.completed));
        writeLocalLearningNote(storageKey, {
          scenarioId,
          notes: data.notes || '',
          completed: Boolean(data.completed),
          updatedAt: data.updatedAt || null,
        });
        setSyncState('saved');
        setNoteReady(true);
      })
      .catch((error) => {
        console.error('Failed to fetch learning notes', error);
        if (!cancelled) {
          setSyncState('offline');
          setNoteReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey, scenario]);

  useEffect(() => {
    if (!scenario || !storageKey || !noteReady) return;

    writeLocalLearningNote(storageKey, {
      scenarioId: scenario.id,
      notes,
      completed,
      updatedAt: new Date().toISOString(),
    });

    setSyncState('saving');
    const timeout = window.setTimeout(() => {
      fetch(`/api/_learning/notes/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, completed }),
      })
        .then(readJson)
        .then((data: LearningNote) => {
          writeLocalLearningNote(storageKey, data);
          setSyncState('saved');
        })
        .catch((error) => {
          console.error('Failed to save learning notes', error);
          setSyncState('offline');
        });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [notes, completed, scenario, storageKey, noteReady]);

  const saveNotes = (value: string) => {
    setNotes(value);
  };

  if (!scenario) {
    return (
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg mt-8">
        <div className="mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-slate-200">Guided Incident Runbook</h3>
          <p className="text-sm text-slate-400 mt-1">Activate a scenario to get an investigation path, vocabulary prompts, and a notes workspace.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <RunbookStep label="1" title="Trigger" body="Start with one scenario so the failure has a clear boundary." />
          <RunbookStep label="2" title="Observe" body="Read logs, dependency health, and the system map before guessing." />
          <RunbookStep label="3" title="Explain" body="Write a short diagnosis using backend and system-design vocabulary." />
        </div>
      </div>
    );
  }

  const evidence = getRunbookEvidence(scenario);
  const summaryPrompt = getRunbookSummaryPrompt(scenario);

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-blue-800/60 shadow-lg mt-8">
      <div className="mb-5 border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-blue-300">Guided Incident Runbook</h3>
        <p className="text-sm text-slate-400 mt-1">Use this flow while the scenario is active. The goal is to build an evidence-based diagnosis, not just click the reset button.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RunbookSection title="What Broke">
          <p className="text-sm leading-relaxed text-slate-300">{scenario.failureMode}</p>
          <div className="mt-3 rounded border border-red-900/40 bg-red-950/20 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-red-300">Failed Boundary</p>
            <p className="mt-1 text-sm text-slate-200">{scenario.affectedComponents.join(' / ')}</p>
          </div>
        </RunbookSection>

        <RunbookSection title="Where To Look">
          <ol className="space-y-2 text-sm text-slate-300">
            {evidence.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="text-slate-500 font-mono">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </RunbookSection>

        <RunbookSection title="Vocabulary">
          <div className="flex flex-wrap gap-2">
            {scenario.concepts.map((concept) => (
              <span key={concept} className="rounded border border-blue-700/50 bg-blue-950/30 px-2 py-1 text-xs text-blue-100">{concept}</span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{scenario.seniorDiagnosis}</p>
        </RunbookSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <RunbookSection title="Investigation Checklist">
          <ol className="space-y-2 text-sm text-slate-300">
            {scenario.investigationSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 accent-blue-500" aria-label={`Complete step ${index + 1}`} />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </RunbookSection>

        <RunbookSection title="Learner Notes">
          <textarea
            value={notes}
            onChange={(event) => saveNotes(event.target.value)}
            placeholder={summaryPrompt}
            className="min-h-64 w-full resize-y rounded border border-slate-700 bg-slate-950 p-3 font-mono text-sm leading-relaxed text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={completed}
                onChange={(event) => setCompleted(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-emerald-500"
              />
              Mark scenario complete
            </label>
            <span className={`text-xs ${syncState === 'offline' ? 'text-yellow-300' : 'text-slate-500'}`}>
              {syncState === 'saving' ? 'Saving...' : syncState === 'offline' ? 'Saved locally; backend unavailable' : 'Saved to learning notes'}
            </span>
          </div>
        </RunbookSection>
      </div>
    </div>
  );
};

const readLocalLearningNote = (storageKey: string, scenarioId: string): LearningNote => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return { scenarioId, notes: '', completed: false, updatedAt: null };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LearningNote>;
    return {
      scenarioId,
      notes: parsed.notes || '',
      completed: Boolean(parsed.completed),
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return { scenarioId, notes: raw, completed: false, updatedAt: null };
  }
};

const writeLocalLearningNote = (storageKey: string, note: LearningNote) => {
  localStorage.setItem(storageKey, JSON.stringify(note));
};

const RunbookSection = ({ title, children }: { title: string, children: ReactNode }) => (
  <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">{title}</h4>
    {children}
  </section>
);

const RunbookStep = ({ label, title, body }: { label: string, title: string, body: string }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-bold text-blue-300">{label}</span>
      <h4 className="font-semibold text-slate-200">{title}</h4>
    </div>
    <p className="mt-3 text-slate-400 leading-relaxed">{body}</p>
  </div>
);

const TopologyDiagram = ({ activeScenario }: { activeScenario: string }) => {
  const getStatus = (node: string) => {
    const map: Record<string, string[]> = {
      '01-dto-regression': ['client', 'aop'],
      '02-api-latency': ['aop'],
      '03-db-connection': ['postgres'],
      '04-cache-stampede': ['redis', 'postgres'],
      '05-write-failure': ['postgres'],
      '06-memory-leak': ['api'],
      '07-kafka-consumer-lag': ['kafka'],
      '08-saga-failure': ['order'],
      '09-rate-limiting': ['api'],
    };
    const affected = map[activeScenario] || [];
    if (affected.includes(node)) {
      return 'bg-red-900/40 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse';
    }
    return 'bg-slate-800/80 border-slate-600 text-slate-300';
  };

  const Node = ({ id, icon, title }: { id: string, icon: string, title: string }) => (
    <div className={`px-4 py-3 rounded-lg border-2 flex flex-col items-center w-32 text-center transition-all duration-500 ${getStatus(id)}`}>
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
    </div>
  );

  const Arrow = () => <div className="text-slate-600 rotate-90 md:rotate-0 text-xl font-bold">➔</div>;

  return (
    <div className="flex flex-col items-center w-full my-6 bg-black/30 p-6 rounded-xl border border-slate-800/80">
      <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-6 text-center w-full">Incident Flow Topology</h4>
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full justify-center">
        <Node id="client" icon="💻" title="Client / k6" />
        <Arrow />
        <Node id="aop" icon="🛡️" title="Chaos Aspect" />
        <Arrow />
        <Node id="api" icon="⚙️" title="Spring Boot" />
        <Arrow />
        <div className="flex flex-col gap-4">
          <Node id="redis" icon="⚡" title="Redis Cache" />
          <Node id="kafka" icon="📨" title="Apache Kafka" />
          <Node id="postgres" icon="🗄️" title="PostgreSQL" />
          <Node id="order" icon="📦" title="Order Service" />
        </div>
      </div>
    </div>
  );
};

const LearningPanel = ({ scenario }: { scenario: ScenarioDefinition | null }) => {
  if (!scenario) return null;

  return (
    <div className="bg-slate-900 p-6 rounded-xl border-l-4 border-l-blue-500 shadow-2xl mt-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
        <span className="text-2xl">🎓</span>
        <div>
          <h3 className="text-lg font-bold text-blue-400">{scenario.title}</h3>
          <p className="text-xs uppercase tracking-widest text-slate-500">{scenario.category} · {scenario.difficulty} · Trigger: {scenario.trigger}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">What This Injects</h4>
          <p className="text-slate-200 font-mono text-sm bg-black/50 p-2 rounded border border-slate-800">{scenario.failureMode}</p>
        </div>
        
        <TopologyDiagram activeScenario={scenario.id} />

        <div>
          <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Learning Goal</h4>
          <p className="text-slate-300 text-sm leading-relaxed">{scenario.learningGoal}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Senior Diagnosis</h4>
          <p className="text-slate-300 text-sm leading-relaxed">{scenario.seniorDiagnosis}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Recommended Remediation</h4>
          <p className="text-emerald-400/90 text-sm leading-relaxed font-medium bg-emerald-950/20 p-3 rounded border border-emerald-900/30">{scenario.remediation}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Concepts To Learn</h4>
          <div className="flex flex-wrap gap-2">
            {scenario.concepts.map((concept) => (
              <span key={concept} className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 text-slate-300">{concept}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Investigation Checklist</h4>
          <ol className="space-y-2 text-sm text-slate-300">
            {scenario.investigationSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="text-slate-500 font-mono">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
