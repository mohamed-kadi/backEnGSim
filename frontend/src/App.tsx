import { useEffect, useState, useRef } from 'react';
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

export default function App() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [scenarioCatalog, setScenarioCatalog] = useState<ScenarioDefinition[]>([]);
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
      const data = await res.json();
      const scenario = data.activeScenario;
      setActiveScenario(scenario && scenario !== "none" ? scenario : null);
    } catch (e) {
      console.error("Failed to fetch status", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/_system/logs');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/_system/scenario/catalog');
      const data = await res.json();
      setScenarioCatalog(data);
    } catch (e) {
      console.error("Failed to fetch scenario catalog", e);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchStatus();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
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

      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
        <div className="mb-4 border-b border-slate-700 pb-2">
          <h3 className="text-lg font-semibold text-slate-300">Scenario Catalog</h3>
          <p className="text-sm text-slate-400 mt-1">Each scenario teaches a production failure pattern, the senior-level diagnosis, and a concrete investigation path.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarioCatalog.map((scenario) => (
            <ScenarioButton
              key={scenario.id}
              icon={scenarioIcons[scenario.id] || '⚙️'}
              title={scenario.title}
              eyebrow={`${scenario.category} · ${scenario.difficulty}`}
              onClick={() => triggerScenario(scenario.id)}
              isActive={activeScenario === scenario.id}
            />
          ))}

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
