import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8081/api/builds";

const SAMPLE_LOGS = [
  {
    label: "Maven Build Failure",
    log: `[INFO] Scanning for projects...\n[INFO] BUILD FAILURE\n[ERROR] Failed to execute goal maven-compiler-plugin:3.8.1:compile\n[ERROR] /workspace/UserService.java:[45,23] error: cannot find symbol\n[ERROR]   symbol:   method getUserById(int)\n[ERROR] /workspace/OrderController.java:[78,12] error: incompatible types: String cannot be converted to Long\n[INFO] Total time: 4.321 s`
  },
  {
    label: "Docker Push Failure",
    log: `[Pipeline] stage: Build Docker Image\n+ docker build -t myapp:latest .\nnpm ERR! code ENOTFOUND\nnpm ERR! network request to https://registry.npmjs.org/express failed\nERROR: failed to push image: unauthorized: authentication required\nFAILED`
  },
  {
    label: "Test Suite Failure",
    log: `[INFO] Running com.example.UserServiceTest\n[ERROR] Tests run: 12, Failures: 3, Errors: 1\n[ERROR] FAILURE - testCreateUser\njava.lang.AssertionError: Expected status 201 but was 500\nCaused by: DataIntegrityViolationException: constraint [users_email_unique]\n[ERROR] FAILURE - testDeleteUser\njava.lang.NullPointerException at UserService.java:89\n[INFO] BUILD FAILURE`
  }
];

const sev = { CRITICAL: "#ff2d2d", HIGH: "#ff8c00", MEDIUM: "#f5a623", LOW: "#00cc66" };

const Badge = ({ text, color }) => (
  <span style={{
    background: `${color}18`, color, border: `1px solid ${color}33`,
    padding: "1px 8px", borderRadius: 3, fontSize: 10,
    fontFamily: "monospace", fontWeight: 700, letterSpacing: 1.5
  }}>{text}</span>
);

const StatusDot = ({ status }) => {
  const c = status === "SUCCESS" ? "#00cc66" : status === "FAILURE" ? "#ff4444" : "#888";
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}`, marginRight: 6 }} />;
};

export default function DevOpsAssistant() {
  const [tab, setTab] = useState("analyze");
  const [mode, setMode] = useState("raw");
  const [logInput, setLogInput] = useState("");
  const [jobName, setJobName] = useState("");
  const [buildNumber, setBuildNumber] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, failed: 0, critical: 0, high: 0 });
  const [selectedRun, setSelectedRun] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const resultRef = useRef(null);

  const stages = ["Checkout", "Build", "Test", "Package", "Push", "Deploy"];

  useEffect(() => {
    fetch(`${API_BASE}/history`)
      .then(r => r.json())
      .then(data => { if (data?.length) setHistory(data); })
      .catch(() => {});
    fetch(`${API_BASE}/stats`)
      .then(r => r.json())
      .then(data => { if (data?.total !== undefined) setStats(data); })
      .catch(() => {});
  }, []);

  const analyze = async () => {
    setAnalyzing(true);
    setError("");
    setAnalysis(null);
    try {
      let res;
      if (mode === "raw") {
        res = await fetch(`${API_BASE}/analyze/raw`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobName: jobName || "manual-paste", log: logInput })
        });
      } else {
        res = await fetch(`${API_BASE}/analyze/jenkins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobName, buildNumber: parseInt(buildNumber) })
        });
      }
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setAnalysis(data);
      setHistory(prev => [{
        id: Date.now(), jobName: jobName || "manual-paste",
        buildNumber: parseInt(buildNumber) || 0,
        status: "FAILURE", failedStage: data.failedStage,
        severity: data.severity, failureSummary: data.title,
        duration: 0, triggeredAt: new Date().toISOString()
      }, ...prev]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(`Backend unavailable — ${e.message}. Make sure Spring Boot is running on :8081`);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredHistory = history.filter(r => {
    const matchStatus = historyFilter === "ALL" || r.status === historyFilter;
    const matchSearch = !searchTerm ||
      r.jobName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.failureSummary?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stageIndex = analysis ? stages.indexOf(analysis.failedStage) : -1;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c0f", color: "#c9d1d9", fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-btn { background: transparent; border: none; cursor: pointer; font-family: inherit; letter-spacing: 2px; font-size: 11px; padding: 10px 20px; transition: all .15s; }
        .tab-btn:hover { color: #f5a623 !important; }
        .card { background: #0d1117; border: 1px solid #21262d; border-radius: 6px; }
        .input-field { background: #010409; border: 1px solid #21262d; border-radius: 4px; color: #c9d1d9; font-family: inherit; font-size: 12px; padding: 8px 12px; width: 100%; transition: border-color .15s; }
        .input-field:focus { outline: none; border-color: #f5a623; }
        .primary-btn { background: #f5a62312; border: 1px solid #f5a623; color: #f5a623; padding: 9px 22px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 11px; font-weight: 700; letter-spacing: 2px; transition: all .15s; }
        .primary-btn:hover:not(:disabled) { background: #f5a623; color: #0a0c0f; }
        .primary-btn:disabled { opacity: .4; cursor: not-allowed; }
        .ghost-btn { background: transparent; border: 1px solid #30363d; color: #666; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 1px; transition: all .15s; }
        .ghost-btn:hover { border-color: #f5a62355; color: #f5a623; }
        .tr-hover:hover { background: #161b22 !important; cursor: pointer; }
        .mode-btn { background: transparent; border: 1px solid #21262d; color: #555; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 1px; transition: all .15s; }
        .mode-btn.active { border-color: #f5a623; color: #f5a623; background: #f5a62310; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #21262d", background: "#0d1117", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 34, height: 34, background: "#f5a62315", border: "1px solid #f5a62333", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>⚙</div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#e6edf3" }}>DevOps<span style={{ color: "#f5a623" }}>AI</span></div>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>CI/CD PIPELINE ANALYZER · SPRING BOOT + OPENAI</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ label: "TOTAL", val: stats.total, c: "#888" }, { label: "FAILED", val: stats.failed, c: "#ff4444" }, { label: "CRITICAL", val: stats.critical, c: "#ff2d2d" }].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "0 12px" }}>
              <div style={{ fontSize: 16, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: s.c }}>{s.val}</div>
              <div style={{ fontSize: 8, color: "#444", letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #21262d", background: "#0d1117", display: "flex" }}>
        {[["analyze", "▶ ANALYZE"], ["history", "◈ HISTORY"]].map(([id, label]) => (
          <button key={id} className="tab-btn" onClick={() => setTab(id)} style={{ color: tab === id ? "#f5a623" : "#555", borderBottom: tab === id ? "2px solid #f5a623" : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px" }}>

        {/* ANALYZE TAB */}
        {tab === "analyze" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: "#f5a623", letterSpacing: 2 }}>▸ INPUT SOURCE</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className={`mode-btn ${mode === "raw" ? "active" : ""}`} onClick={() => setMode("raw")}>PASTE LOG</button>
                  <button className={`mode-btn ${mode === "jenkins" ? "active" : ""}`} onClick={() => setMode("jenkins")}>JENKINS API</button>
                </div>
              </div>

              {mode === "raw" ? (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <input className="input-field" style={{ width: 200 }} placeholder="Job name (optional)" value={jobName} onChange={e => setJobName(e.target.value)} />
                    <div style={{ flex: 1 }} />
                    {SAMPLE_LOGS.map((s, i) => (
                      <button key={i} className="ghost-btn" onClick={() => setLogInput(s.log)}>{s.label}</button>
                    ))}
                  </div>
                  <textarea
                    className="input-field"
                    value={logInput}
                    onChange={e => setLogInput(e.target.value)}
                    placeholder={`Paste Jenkins console log here...\n\n[ERROR] BUILD FAILURE\n[ERROR] Compilation error...`}
                    style={{ minHeight: 220, resize: "vertical", lineHeight: 1.7 }}
                  />
                </>
              ) : (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>JOB NAME</div>
                    <input className="input-field" placeholder="e.g. payment-service-pipeline" value={jobName} onChange={e => setJobName(e.target.value)} />
                  </div>
                  <div style={{ width: 140 }}>
                    <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>BUILD NUMBER</div>
                    <input className="input-field" type="number" placeholder="e.g. 42" value={buildNumber} onChange={e => setBuildNumber(e.target.value)} />
                  </div>
                </div>
              )}

              {error && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#ff444411", border: "1px solid #ff444433", borderRadius: 4, fontSize: 11, color: "#ff8888" }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                <button className="ghost-btn" onClick={() => { setLogInput(""); setAnalysis(null); setError(""); }}>CLEAR</button>
                <button className="primary-btn" onClick={analyze} disabled={analyzing || (mode === "raw" ? !logInput.trim() : (!jobName || !buildNumber))}>
                  {analyzing ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid #f5a623", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                      ANALYZING...
                    </span>
                  ) : "▶ RUN ANALYSIS"}
                </button>
              </div>
            </div>

            {/* Analysis Result */}
            {analysis && (
              <div ref={resultRef} style={{ animation: "fadeIn 0.35s ease", display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card" style={{ padding: 20, borderLeft: `3px solid ${sev[analysis.severity] || "#f5a623"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: "#e6edf3", marginBottom: 8 }}>{analysis.title}</div>
                      <p style={{ fontSize: 12, color: "#8b949e", margin: 0, lineHeight: 1.7 }}>{analysis.rootCause}</p>
                      {analysis.errorCodes?.length > 0 && (
                        <div style={{ marginTop: 12, display: "flex", gap: 7, flexWrap: "wrap" }}>
                          {analysis.errorCodes.map((e, i) => <span key={i} style={{ background: "#161b22", border: "1px solid #30363d", color: "#ff8c69", padding: "2px 10px", borderRadius: 3, fontSize: 11 }}>{e}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", minWidth: 130 }}>
                      <Badge text={analysis.severity} color={sev[analysis.severity] || "#888"} />
                      <span style={{ fontSize: 10, color: "#555" }}>Stage: <span style={{ color: "#ff4444" }}>{analysis.failedStage}</span></span>
                      <span style={{ fontSize: 10, color: "#555" }}>Fix: <span style={{ color: "#00cc66" }}>{analysis.estimatedFixTime}</span></span>
                    </div>
                  </div>
                </div>

                {analysis.fixes?.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, color: "#00cc66", letterSpacing: 2, marginBottom: 16, fontWeight: 700 }}>▸ REMEDIATION STEPS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {analysis.fixes.map((fix, i) => (
                        <div key={i} style={{ display: "flex", gap: 14, background: "#010409", border: "1px solid #21262d", borderRadius: 4, padding: 14 }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#00cc6618", border: "1px solid #00cc6633", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#00cc66", fontWeight: 700, flexShrink: 0 }}>{fix.step}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: "#c9d1d9", marginBottom: fix.command ? 8 : 0 }}>{fix.action}</div>
                            {fix.command && <code style={{ display: "block", background: "#0d1117", border: "1px solid #30363d", borderLeft: "3px solid #f5a623", padding: "7px 12px", borderRadius: 3, fontSize: 11, color: "#f5a623", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{fix.command}</code>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.preventionTips?.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, color: "#8b949e", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>▸ PREVENTION TIPS</div>
                    {analysis.preventionTips.map((t, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid #161b22" }}>
                        <span style={{ color: "#30363d" }}>◆</span>
                        <span style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.6 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
              <input className="input-field" style={{ width: 260 }} placeholder="🔍 Search job name or summary..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <div style={{ display: "flex", gap: 6 }}>
                {["ALL", "SUCCESS", "FAILURE", "ABORTED"].map(f => (
                  <button key={f} className={`mode-btn ${historyFilter === f ? "active" : ""}`} onClick={() => setHistoryFilter(f)}>{f}</button>
                ))}
              </div>
              <span style={{ fontSize: 10, color: "#444", marginLeft: "auto" }}>{filteredHistory.length} RUNS</span>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              {filteredHistory.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#444", fontSize: 12 }}>
                  No runs yet. Analyze a build log to see history here.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #21262d" }}>
                      {["#", "JOB", "BUILD", "STATUS", "STAGE", "SEVERITY", "SUMMARY", "TIME"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, color: "#555", letterSpacing: 1.5, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((r, i) => (
                      <tr key={r.id} className="tr-hover"
                        onClick={() => setSelectedRun(selectedRun?.id === r.id ? null : r)}
                        style={{ borderBottom: "1px solid #161b22", background: selectedRun?.id === r.id ? "#161b22" : "transparent" }}>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#444" }}>{i + 1}</td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#e6edf3", fontWeight: 600 }}>{r.jobName}</td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#555" }}>#{r.buildNumber}</td>
                        <td style={{ padding: "10px 14px" }}><StatusDot status={r.status} /><span style={{ fontSize: 10, color: r.status === "SUCCESS" ? "#00cc66" : r.status === "FAILURE" ? "#ff4444" : "#888" }}>{r.status}</span></td>
                        <td style={{ padding: "10px 14px", fontSize: 10, color: "#666" }}>{r.failedStage || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{r.severity ? <Badge text={r.severity} color={sev[r.severity]} /> : <span style={{ color: "#333" }}>—</span>}</td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#8b949e", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.failureSummary || "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 10, color: "#444" }}>{new Date(r.triggeredAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}