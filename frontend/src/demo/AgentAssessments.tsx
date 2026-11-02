import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, RefreshCw, TriangleAlert } from 'lucide-react';
import { Badge, Card, DetailRows, Notice, PageIntro } from '../components';

const stagePalette = {
  'Waiting for input': 'neutral',
  'Assessment available': 'info',
  'Insufficient evidence': 'warning',
  'Human review required': 'warning',
  Stale: 'danger',
  Conflict: 'danger',
  Unavailable: 'neutral',
} as const;

type StageState = keyof typeof stagePalette;

type AgentAssessment = {
  id: 'OMS' | 'IMS' | 'TMS' | 'Verification' | 'Finance/Compliance';
  role: string;
  limits: string;
  resource: string;
  status: StageState;
  freshness: string;
  confidence: number;
  recommendation: string;
  evidence: string[];
  reasonLabel: string;
  requiredReview: boolean;
  stale: boolean;
  conflict?: boolean;
  linkedFrom?: string;
};

type ReviewAction = 'Acknowledge' | 'Reject' | 'Request reassessment';

type ReviewRecord = {
  id: string;
  agent: AgentAssessment['id'];
  action: ReviewAction;
  reason: string;
  reviewer: string;
  time: string;
  previous?: string;
};

const ORDER_STAGES = [
  { stage: 'Booking intake', state: 'Assessment available', detail: 'Customer booking accepted.' },
  { stage: 'OMS completeness', state: 'Human review required', detail: 'Customer and cargo details reviewed.' },
  { stage: 'Pre-assignment Verification', state: 'Waiting for input', detail: 'Candidate documents not yet staged.' },
  { stage: 'IMS availability/conflicts', state: 'Conflict', detail: 'Vehicle conflict remains unresolved.' },
  { stage: 'Finance/Compliance prerequisites', state: 'Assessment available', detail: 'Payment and hold checks in progress.' },
  { stage: 'Human decision and backend gate', state: 'Human review required', detail: 'Operational execution remains disabled.' },
  { stage: 'TMS trip assessment', state: 'Assessment available', detail: 'Trip readiness and exceptions evaluated.' },
  { stage: 'Authorized operator actions', state: 'Unavailable', detail: 'Live backend still pending verification.' },
  { stage: 'POD Verification', state: 'Insufficient evidence', detail: 'No fresh POD evidence yet.' },
  { stage: 'Finance/Compliance reconciliation', state: 'Assessment available', detail: 'Settlement review only; no release action.' },
  { stage: 'Authorized closure', state: 'Waiting for input', detail: 'Closure requires verified backend authorization.' },
] as const;

const initialAgents: AgentAssessment[] = [
  {
    id: 'OMS',
    role: 'Order lifecycle and booking completeness',
    limits: 'No dispatch, payment or customer data execution authority.',
    resource: 'Order ZP-2048 · cargo manifest, route and booking reference',
    status: 'Human review required',
    freshness: '2 minutes ago',
    confidence: 82,
    recommendation: 'Human review required before assignment request is released.',
    evidence: ['Customer booking reference present.', 'Cargo type and weight are captured.', 'Pickup window and route details are incomplete.', 'Confirmation was not released to a live backend.'],
    reasonLabel: 'Booking hole: pickup window missing.',
    requiredReview: true,
    stale: false,
    conflict: false,
  },
  {
    id: 'IMS',
    role: 'Vehicle and driver availability checks',
    limits: 'Observes capacity and conflict only. No reservation or dispatch action.',
    resource: 'Vehicle pool · TN 01 AB 2048 / TN 39 AE 5100',
    status: 'Conflict',
    freshness: '11 minutes ago',
    confidence: 76,
    recommendation: 'Conflict remains unresolved. Separate the reservation windows before operator review.',
    evidence: ['Driver availability overlap detected for the same slot.', 'Vehicle capacity is sufficient for cargo weight.', 'A reservation conflict has not been resolved by a verified backend.', 'Open question: which assignment remains authoritative?'],
    reasonLabel: 'Reservation conflict between active runner and backup resource.',
    requiredReview: true,
    stale: false,
    conflict: true,
  },
  {
    id: 'TMS',
    role: 'Trip readiness and exception monitoring',
    limits: 'Reviews trip and exception state; no dispatch or closure permission.',
    resource: 'Trip ZP-2048 / route Chennai → Bengaluru',
    status: 'Assessment available',
    freshness: '5 minutes ago',
    confidence: 88,
    recommendation: 'Trip can be prepared for operator review; settlement and closure remain separate.',
    evidence: ['Route and loading sequence are available.', 'No live tracking source is connected.', 'Exception queue includes only a stale checkpoint warning.', 'Backend execution is not available in this demo.'],
    reasonLabel: 'Operational exception warning but no confirmed failure state.',
    requiredReview: false,
    stale: false,
    conflict: false,
  },
  {
    id: 'Verification',
    role: 'Pre-assignment and POD evidence review',
    limits: 'Reviews documents and proof only. No OTP, document approval or payment release authority.',
    resource: 'Document packet · dispatch checklist and POD bundle',
    status: 'Stale',
    freshness: '1 hour ago',
    confidence: 62,
    recommendation: 'Evidence is stale; a new assessment is required before any review acknowledgement.',
    evidence: ['Carrier permit document is missing from the current packet.', 'POD evidence is unavailable for the latest checkpoint.', 'Previous verification result is preserved for reference only.', 'No document approval or payment release is inferred.'],
    reasonLabel: 'Missing current POD and expired document packet.',
    requiredReview: true,
    stale: true,
    conflict: false,
    linkedFrom: 'Verification • previous packet',
  },
  {
    id: 'Finance/Compliance',
    role: 'Payment, consent and reconciliation checks',
    limits: 'Evaluates conditions only; no payment, refund or payout execution authority.',
    resource: 'Settlement ledger · hold and payment balance snapshot',
    status: 'Assessment available',
    freshness: '4 minutes ago',
    confidence: 80,
    recommendation: 'Hold remains active pending reconciled customer payment and consent state.',
    evidence: ['Payment state is incomplete for the current order cycle.', 'Consent status is recorded but not live-authorized.', 'A reconciliation discrepancy remains unresolved.', 'Unresolved policy: approval thresholds are intentionally undocumented in this demo.'],
    reasonLabel: 'Settlement discrepancy and unresolved payment prerequisites.',
    requiredReview: true,
    stale: false,
    conflict: false,
  },
];

const initialHistory: ReviewRecord[] = [
  { id: 'review-1', agent: 'OMS', action: 'Reject', reason: 'Pickup window is incomplete. Human review required.', reviewer: 'Synthetic reviewer A', time: '09:12', previous: 'initial' },
  { id: 'review-2', agent: 'Verification', action: 'Request reassessment', reason: 'Previous document packet is stale. Candidate documents are missing.', reviewer: 'Synthetic reviewer B', time: '09:32', previous: 'verification-previous' },
];

export default function AgentAssessments() {
  const [agents, setAgents] = useState<AgentAssessment[]>(initialAgents);
  const [selected, setSelected] = useState<AgentAssessment['id']>('OMS');
  const [reviewReason, setReviewReason] = useState('');
  const [history, setHistory] = useState<ReviewRecord[]>(initialHistory);

  const selectedAgent = useMemo(() => agents.find(item => item.id === selected) ?? agents[0], [agents, selected]);

  const resetDemo = () => {
    setAgents(initialAgents);
    setSelected('OMS');
    setReviewReason('');
    setHistory(initialHistory);
  };

  const applyReview = (action: ReviewAction) => {
    if (!selectedAgent) return;
    const reason = reviewReason.trim();
    if (action !== 'Request reassessment' && !reason) return;

    const next: ReviewRecord = {
      id: `review-${Date.now()}`,
      agent: selectedAgent.id,
      action,
      reason: reason || (action === 'Request reassessment' ? 'Synthetic reassessment requested. Prior evidence preserved.' : 'Review recorded without approval or execution.'),
      reviewer: 'Synthetic reviewer • demo',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      previous: selectedAgent.linkedFrom || selectedAgent.id,
    };

    setHistory(prev => [next, ...prev]);

    if (action === 'Request reassessment') {
      const nextState: AgentAssessment = {
        ...selectedAgent,
        status: 'Assessment available',
        stale: false,
        recommendation: 'New synthetic assessment opened. Prior evidence remains visible and linked.',
        reasonLabel: 'Reassessment initiated with previous evidence retained.',
        linkedFrom: `${selectedAgent.id} • previous result`,
      };
      setAgents(prev => prev.map(item => item.id === selectedAgent.id ? nextState : item));
    }

    if (action === 'Reject') {
      setAgents(prev => prev.map(item => item.id === selectedAgent.id ? {
        ...item,
        status: 'Insufficient evidence',
        stale: false,
        recommendation: 'Rejected pending additional evidence.',
        reasonLabel: 'Review rejected; evidence remains insufficient.',
      } : item));
    }

    setReviewReason('');
  };

  const staleActionsBlocked = selectedAgent.stale;

  return (
    <div className="space-y-6">
      <PageIntro title="Agent assessments" subtitle="Synthetic inspection only. Live backend verification remains blocked behind the published release gates." eyebrow="DEMO MODE • SYNTHETIC • BACKEND DISABLED" />
      <Notice>
        Evaluation data below is fictional. No provider, Xano route, model, or payment system is invoked. The real service capability flags remain false, and live authorization is enforced by the backend.
      </Notice>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <AlertTriangle size={14} className="text-brand" />
          <span>Demo review only · no operations are executed</span>
        </div>
        <button className="btn soft" type="button" onClick={resetDemo} aria-label="Reset demo assessments">
          <RefreshCw size={15} /> Reset demo
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-4">
          <Card title="Agents" subtitle="Five synthetic responsibility views" className="overflow-hidden">
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {agents.map(agent => {
                const active = agent.id === selectedAgent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(agent.id)}
                    className={`rounded-2xl border p-4 text-left transition ${active ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand/80'}`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold">{agent.id}</span>
                      <Badge tone={stagePalette[agent.status]}>{agent.status}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-ink">{agent.role}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{agent.resource}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                      <span>{agent.freshness}</span>
                      <span>{agent.confidence}% confidence</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title={`${selectedAgent.id} assessment`} subtitle={selectedAgent.role}>
            <div className="space-y-4 px-5 pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={stagePalette[selectedAgent.status]}>{selectedAgent.status}</Badge>
                {selectedAgent.requiredReview && <Badge tone="warning">Human review required</Badge>}
                {selectedAgent.stale && <Badge tone="danger">Stale evidence</Badge>}
              </div>
              <DetailRows rows={[
                ['Role and limits', selectedAgent.limits],
                ['Synthetic resource', selectedAgent.resource],
                ['Assessment status', selectedAgent.status],
                ['Freshness', selectedAgent.freshness],
                ['Recommendation', selectedAgent.recommendation],
                ['Evidence reason', selectedAgent.reasonLabel],
              ]} />
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-muted">Supporting evidence</h3>
                <ul className="space-y-2 text-sm text-ink">
                  {selectedAgent.evidence.map(item => (
                    <li key={item} className="flex gap-2"><span className="mt-1 text-brand"><FileText size={14} /></span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
              {selectedAgent.linkedFrom && <p className="text-xs text-muted">Linked prior result: {selectedAgent.linkedFrom}</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Synthetic human review" subtitle="Demo-only review actions">
            <div className="space-y-4 px-5 pb-5">
              <label className="field">
                <span>Review reason</span>
                <textarea value={reviewReason} onChange={e => setReviewReason(e.target.value)} placeholder="Provide a bounded review reason..." aria-label="Review reason" rows={4} />
              </label>

              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <button type="button" className="btn primary" disabled={staleActionsBlocked} onClick={() => applyReview('Acknowledge')} aria-label="Acknowledge assessment">
                  <CheckCircle2 size={15} /> Acknowledge
                </button>
                <button type="button" className="btn" disabled={staleActionsBlocked} onClick={() => applyReview('Reject')} aria-label="Reject assessment">
                  <TriangleAlert size={15} /> Reject
                </button>
                <button type="button" className="btn soft" onClick={() => applyReview('Request reassessment')} aria-label="Request reassessment">
                  <RefreshCw size={15} /> Request reassessment
                </button>
              </div>

              <div className="rounded-xl border border-line bg-canvas p-3 text-xs leading-relaxed text-muted">
                Review acknowledgement does not approve or execute a business operation.
                <ul className="mt-2 space-y-1 pl-4 list-disc">
                  <li>No booking, trip, payment, document or settlement action is executed.</li>
                  <li>Unresolved policy remains explicitly documented.</li>
                </ul>
              </div>

              {staleActionsBlocked && (
                <Notice>
                  Stale evidence cannot be acknowledged as current. Use the reassessment action to create a linked synthetic review result.
                </Notice>
              )}
            </div>
          </Card>

          <Card title="Review history" subtitle="Visible synthetic decisions only">
            <div className="space-y-3 px-5 pb-5">
              {history.map(entry => (
                <div key={entry.id} className="rounded-xl border border-line bg-canvas p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{entry.agent}</span>
                    <Badge tone={entry.action === 'Acknowledge' ? 'success' : entry.action === 'Reject' ? 'danger' : 'warning'}>{entry.action}</Badge>
                  </div>
                  <p className="text-xs text-muted">{entry.reason}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    <span>{entry.reviewer}</span>
                    <span>•</span>
                    <span>{entry.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Proposed order cycle" subtitle="Assessment sequence remains separate from live booking, trip and payment state">
        <div className="px-5 pb-5">
          <ol className="space-y-3">
            {ORDER_STAGES.map((item, index) => (
              <li key={item.stage} className="flex gap-3 rounded-xl border border-line bg-canvas p-3">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{item.stage}</p>
                    <Badge tone={stagePalette[item.state]}>{item.state}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </div>
  );
}
