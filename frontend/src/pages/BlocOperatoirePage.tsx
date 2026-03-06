import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, AlertTriangle, Calendar, Activity, FileText, ChevronDown, ChevronUp, X, FlaskConical, Scissors, Eye } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Alert } from '../components/ui';
import { patientService, Patient } from '../services/patient.service';
import {
  surgeryService,
  Surgery,
  LabAnalysis,
  PostOpFollowUp,
  BlocStats,
  AnalysisType,
  SurgeryType,
  OperatedEye,
  analysisTypeLabels,
  analysisStatusLabels,
  analysisStatusColors,
  surgeryTypeLabels,
  surgeryStatusLabels,
  surgeryStatusColors,
  eyeLabels,
} from '../services/surgery.service';

type Tab = 'dashboard' | 'analyses' | 'surgeries' | 'planning' | 'followups';

export default function BlocOperatoirePage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard
  const [stats, setStats] = useState<BlocStats | null>(null);

  // Analyses
  const [pendingAnalyses, setPendingAnalyses] = useState<LabAnalysis[]>([]);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [analysisPatientSearch, setAnalysisPatientSearch] = useState('');
  const [analysisPatientResults, setAnalysisPatientResults] = useState<Patient[]>([]);
  const [selectedAnalysisPatient, setSelectedAnalysisPatient] = useState<Patient | null>(null);
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<AnalysisType[]>([]);
  const [editingAnalysis, setEditingAnalysis] = useState<LabAnalysis | null>(null);
  const [analysisResults, setAnalysisResults] = useState({ results: '', resultValue: '', isNormal: true, notes: '' });

  // Surgeries
  const [waitingList, setWaitingList] = useState<Surgery[]>([]);
  const [showSurgeryForm, setShowSurgeryForm] = useState(false);
  const [surgeryPatientSearch, setSurgeryPatientSearch] = useState('');
  const [surgeryPatientResults, setSurgeryPatientResults] = useState<Patient[]>([]);
  const [selectedSurgeryPatient, setSelectedSurgeryPatient] = useState<Patient | null>(null);
  const [surgeryForm, setSurgeryForm] = useState({
    type: 'CATARACTE' as SurgeryType,
    customType: '',
    operatedEye: 'OD' as OperatedEye,
    diagnosis: '',
    anesthesiaType: 'Locale',
    notes: '',
  });

  // Planning
  const [scheduledSurgeries, setScheduledSurgeries] = useState<Surgery[]>([]);
  const [planningDate, setPlanningDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedulingForm, setSchedulingForm] = useState({ surgeryId: '', scheduledDate: '', scheduledTime: '' });

  // Follow-ups
  const [pendingFollowUps, setPendingFollowUps] = useState<PostOpFollowUp[]>([]);
  const [editingFollowUp, setEditingFollowUp] = useState<PostOpFollowUp | null>(null);
  const [followUpForm, setFollowUpForm] = useState({ visualAcuity: '', intraocularPressure: '', woundStatus: '', complications: '', treatment: '', notes: '' });

  // Expanded surgery details
  const [expandedSurgery, setExpandedSurgery] = useState<string | null>(null);

  // ---- Data Loading ----

  const loadStats = async () => {
    try {
      const data = await surgeryService.getBlocStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const loadPendingAnalyses = async () => {
    try {
      const data = await surgeryService.getPendingAnalyses();
      setPendingAnalyses(data);
    } catch (err) {
      console.error('Erreur analyses:', err);
    }
  };

  const loadWaitingList = async () => {
    try {
      const data = await surgeryService.getWaitingList();
      setWaitingList(data);
    } catch (err) {
      console.error('Erreur liste attente:', err);
    }
  };

  const loadScheduled = async () => {
    try {
      const data = await surgeryService.getScheduledSurgeries(planningDate);
      setScheduledSurgeries(data);
    } catch (err) {
      console.error('Erreur planning:', err);
    }
  };

  const loadPendingFollowUps = async () => {
    try {
      const data = await surgeryService.getPendingFollowUps();
      setPendingFollowUps(data);
    } catch (err) {
      console.error('Erreur suivis:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'analyses') loadPendingAnalyses();
    if (activeTab === 'surgeries') loadWaitingList();
    if (activeTab === 'planning') loadScheduled();
    if (activeTab === 'followups') loadPendingFollowUps();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'planning') loadScheduled();
  }, [planningDate]);

  // ---- Patient Search (shared) ----

  useEffect(() => {
    const search = async () => {
      if (analysisPatientSearch.length < 2) { setAnalysisPatientResults([]); return; }
      const results = await patientService.quickSearch(analysisPatientSearch);
      setAnalysisPatientResults(results);
    };
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [analysisPatientSearch]);

  useEffect(() => {
    const search = async () => {
      if (surgeryPatientSearch.length < 2) { setSurgeryPatientResults([]); return; }
      const results = await patientService.quickSearch(surgeryPatientSearch);
      setSurgeryPatientResults(results);
    };
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [surgeryPatientSearch]);

  // ---- Handlers: Analyses ----

  const handlePrescribeAnalyses = async () => {
    if (!selectedAnalysisPatient || selectedAnalysisTypes.length === 0) {
      setError('Sélectionnez un patient et au moins un type d\'analyse');
      return;
    }
    setIsLoading(true);
    try {
      await surgeryService.createMultipleAnalyses({
        patientId: selectedAnalysisPatient.id,
        types: selectedAnalysisTypes,
      });
      setSuccess(`${selectedAnalysisTypes.length} analyse(s) prescrite(s)`);
      setShowAnalysisForm(false);
      setSelectedAnalysisPatient(null);
      setSelectedAnalysisTypes([]);
      setAnalysisPatientSearch('');
      loadPendingAnalyses();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAnalysisResults = async () => {
    if (!editingAnalysis) return;
    setIsLoading(true);
    try {
      await surgeryService.updateAnalysis(editingAnalysis.id, {
        status: 'COMPLETED',
        results: analysisResults.results,
        resultValue: analysisResults.resultValue ? parseFloat(analysisResults.resultValue) : undefined,
        isNormal: analysisResults.isNormal,
        notes: analysisResults.notes,
      });
      setSuccess('Résultats enregistrés');
      setEditingAnalysis(null);
      loadPendingAnalyses();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Handlers: Surgeries ----

  const handleCreateSurgery = async () => {
    if (!selectedSurgeryPatient) {
      setError('Sélectionnez un patient');
      return;
    }
    setIsLoading(true);
    try {
      await surgeryService.createSurgery({
        patientId: selectedSurgeryPatient.id,
        type: surgeryForm.type,
        customType: surgeryForm.type === 'AUTRE' ? surgeryForm.customType : undefined,
        operatedEye: surgeryForm.operatedEye,
        diagnosis: surgeryForm.diagnosis,
        anesthesiaType: surgeryForm.anesthesiaType,
        notes: surgeryForm.notes,
      });
      setSuccess('Opération créée - en attente d\'analyses');
      setShowSurgeryForm(false);
      setSelectedSurgeryPatient(null);
      setSurgeryPatientSearch('');
      setSurgeryForm({ type: 'CATARACTE', customType: '', operatedEye: 'OD', diagnosis: '', anesthesiaType: 'Locale', notes: '' });
      loadWaitingList();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSurgeryStatus = async (id: string, status: string) => {
    try {
      await surgeryService.updateSurgery(id, { status });
      setSuccess(`Statut mis à jour: ${surgeryStatusLabels[status as keyof typeof surgeryStatusLabels]}`);
      loadWaitingList();
      loadScheduled();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleScheduleSurgery = async () => {
    if (!schedulingForm.surgeryId || !schedulingForm.scheduledDate || !schedulingForm.scheduledTime) {
      setError('Remplissez tous les champs du planning');
      return;
    }
    try {
      await surgeryService.updateSurgery(schedulingForm.surgeryId, {
        status: 'SCHEDULED',
        scheduledDate: schedulingForm.scheduledDate,
        scheduledTime: schedulingForm.scheduledTime,
      });
      // Create default follow-ups
      await surgeryService.createDefaultFollowUps(schedulingForm.surgeryId, schedulingForm.scheduledDate);
      setSuccess('Opération planifiée + suivis J+1, J+7, J+30 créés');
      setSchedulingForm({ surgeryId: '', scheduledDate: '', scheduledTime: '' });
      loadWaitingList();
      loadScheduled();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  // ---- Handlers: Follow-ups ----

  const handleSaveFollowUp = async () => {
    if (!editingFollowUp) return;
    setIsLoading(true);
    try {
      await surgeryService.updateFollowUp(editingFollowUp.id, {
        actualDate: new Date().toISOString(),
        visualAcuity: followUpForm.visualAcuity,
        intraocularPressure: followUpForm.intraocularPressure ? parseFloat(followUpForm.intraocularPressure) : undefined,
        woundStatus: followUpForm.woundStatus,
        complications: followUpForm.complications,
        treatment: followUpForm.treatment,
        notes: followUpForm.notes,
        isCompleted: true,
      });
      setSuccess('Suivi post-opératoire enregistré');
      setEditingFollowUp(null);
      setFollowUpForm({ visualAcuity: '', intraocularPressure: '', woundStatus: '', complications: '', treatment: '', notes: '' });
      loadPendingFollowUps();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Auto-clear messages ----
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  // ---- Tabs ----
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Tableau de bord', icon: <Activity className="w-4 h-4" /> },
    { key: 'analyses', label: 'Analyses', icon: <FlaskConical className="w-4 h-4" /> },
    { key: 'surgeries', label: 'Opérations', icon: <Scissors className="w-4 h-4" /> },
    { key: 'planning', label: 'Planning', icon: <Calendar className="w-4 h-4" /> },
    { key: 'followups', label: 'Suivi post-op', icon: <Eye className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bloc Opératoire</h1>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 sm:gap-2 bg-white p-1 rounded-lg shadow-sm border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ===== DASHBOARD ===== */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Opérations totales</p>
              <p className="text-2xl font-bold text-primary-600">{stats.totalSurgeries}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Aujourd'hui</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todaySurgeries}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Liste d'attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.waitingList}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Analyses en attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingAnalyses}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Suivis à faire</p>
              <p className="text-2xl font-bold text-red-600">{stats.pendingFollowUps}</p>
            </CardContent></Card>
          </div>

          {stats.byType.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Opérations par type</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {stats.byType.map((t) => (
                    <div key={t.type} className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">{surgeryTypeLabels[t.type as SurgeryType] || t.type}</p>
                      <p className="text-lg font-bold">{t.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== ANALYSES ===== */}
      {activeTab === 'analyses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Analyses en attente ({pendingAnalyses.length})</h2>
            <Button onClick={() => setShowAnalysisForm(!showAnalysisForm)} leftIcon={<Plus className="w-4 h-4" />} size="sm">
              Prescrire
            </Button>
          </div>

          {/* Form: Prescribe analyses */}
          {showAnalysisForm && (
            <Card className="border-2 border-primary-300">
              <CardHeader><CardTitle>Prescrire des analyses</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Patient search */}
                <div>
                  {!selectedAnalysisPatient ? (
                    <>
                      <Input label="Rechercher patient" placeholder="Nom, prénom..." value={analysisPatientSearch} onChange={(e) => setAnalysisPatientSearch(e.target.value)} />
                      {analysisPatientResults.length > 0 && (
                        <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {analysisPatientResults.map((p) => (
                            <button key={p.id} onClick={() => { setSelectedAnalysisPatient(p); setAnalysisPatientSearch(''); }} className="w-full p-2 text-left hover:bg-gray-50 text-sm">
                              <span className="font-medium">{p.lastName} {p.firstName}</span> - {p.phone || 'Pas de tél.'}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient sélectionné</label>
                      <div className="p-2 bg-primary-50 rounded flex justify-between items-center">
                        <span className="text-sm font-medium">{selectedAnalysisPatient.lastName} {selectedAnalysisPatient.firstName}</span>
                        <button onClick={() => { setSelectedAnalysisPatient(null); setAnalysisPatientSearch(''); setAnalysisPatientResults([]); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Analysis types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Types d'analyses</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.entries(analysisTypeLabels) as [AnalysisType, string][]).map(([type, label]) => (
                      <label key={type} className={`flex items-center p-2 rounded-lg border cursor-pointer text-sm ${selectedAnalysisTypes.includes(type) ? 'bg-primary-50 border-primary-300' : 'hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={selectedAnalysisTypes.includes(type)} onChange={(e) => {
                          if (e.target.checked) setSelectedAnalysisTypes([...selectedAnalysisTypes, type]);
                          else setSelectedAnalysisTypes(selectedAnalysisTypes.filter((t) => t !== type));
                        }} className="mr-2" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={handlePrescribeAnalyses} isLoading={isLoading} className="w-full">
                  Prescrire {selectedAnalysisTypes.length} analyse(s)
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Edit analysis results modal */}
          {editingAnalysis && (
            <Card className="border-2 border-blue-300">
              <CardHeader>
                <CardTitle>Saisir résultats - {analysisTypeLabels[editingAnalysis.type]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Patient: <strong>{editingAnalysis.patient.lastName} {editingAnalysis.patient.firstName}</strong></p>
                <Input label="Résultats" value={analysisResults.results} onChange={(e) => setAnalysisResults({ ...analysisResults, results: e.target.value })} placeholder="Ex: 0.95 g/L" />
                <Input label="Valeur numérique" type="number" value={analysisResults.resultValue} onChange={(e) => setAnalysisResults({ ...analysisResults, resultValue: e.target.value })} placeholder="Optionnel" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Résultat normal ?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center"><input type="radio" checked={analysisResults.isNormal} onChange={() => setAnalysisResults({ ...analysisResults, isNormal: true })} className="mr-2" /> Normal</label>
                    <label className="flex items-center"><input type="radio" checked={!analysisResults.isNormal} onChange={() => setAnalysisResults({ ...analysisResults, isNormal: false })} className="mr-2" /> Anormal</label>
                  </div>
                </div>
                <Input label="Notes" value={analysisResults.notes} onChange={(e) => setAnalysisResults({ ...analysisResults, notes: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={handleSaveAnalysisResults} isLoading={isLoading} className="flex-1">Enregistrer</Button>
                  <Button variant="secondary" onClick={() => setEditingAnalysis(null)} className="flex-1">Annuler</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending analyses list */}
          <div className="space-y-2">
            {pendingAnalyses.map((analysis) => (
              <Card key={analysis.id}>
                <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{analysis.patient.lastName} {analysis.patient.firstName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${analysisStatusColors[analysis.status]}`}>
                        {analysisStatusLabels[analysis.status]}
                      </span>
                      <span className="text-sm text-gray-600">{analysisTypeLabels[analysis.type]}</span>
                      <span className="text-xs text-gray-400">{new Date(analysis.prescribedDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => {
                    setEditingAnalysis(analysis);
                    setAnalysisResults({ results: analysis.results || '', resultValue: analysis.resultValue?.toString() || '', isNormal: analysis.isNormal ?? true, notes: analysis.notes || '' });
                  }} leftIcon={<FileText className="w-4 h-4" />}>
                    Saisir résultats
                  </Button>
                </CardContent>
              </Card>
            ))}
            {pendingAnalyses.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucune analyse en attente</p>
            )}
          </div>
        </div>
      )}

      {/* ===== SURGERIES (Liste d'attente) ===== */}
      {activeTab === 'surgeries' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Liste d'attente opératoire ({waitingList.length})</h2>
            <Button onClick={() => setShowSurgeryForm(!showSurgeryForm)} leftIcon={<Plus className="w-4 h-4" />} size="sm">
              Nouvelle opération
            </Button>
          </div>

          {/* Form: New surgery */}
          {showSurgeryForm && (
            <Card className="border-2 border-primary-300">
              <CardHeader><CardTitle>Planifier une opération</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  {!selectedSurgeryPatient ? (
                    <>
                      <Input label="Rechercher patient" placeholder="Nom, prénom..." value={surgeryPatientSearch} onChange={(e) => setSurgeryPatientSearch(e.target.value)} />
                      {surgeryPatientResults.length > 0 && (
                        <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {surgeryPatientResults.map((p) => (
                            <button key={p.id} onClick={() => { setSelectedSurgeryPatient(p); setSurgeryPatientSearch(''); }} className="w-full p-2 text-left hover:bg-gray-50 text-sm">
                              <span className="font-medium">{p.lastName} {p.firstName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient sélectionné</label>
                      <div className="p-2 bg-primary-50 rounded flex justify-between items-center">
                        <span className="text-sm font-medium">{selectedSurgeryPatient.lastName} {selectedSurgeryPatient.firstName}</span>
                        <button onClick={() => { setSelectedSurgeryPatient(null); setSurgeryPatientSearch(''); setSurgeryPatientResults([]); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'opération *</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={surgeryForm.type} onChange={(e) => setSurgeryForm({ ...surgeryForm, type: e.target.value as SurgeryType })}>
                      {(Object.entries(surgeryTypeLabels) as [SurgeryType, string][]).map(([type, label]) => (
                        <option key={type} value={type}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Œil opéré</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={surgeryForm.operatedEye} onChange={(e) => setSurgeryForm({ ...surgeryForm, operatedEye: e.target.value as OperatedEye })}>
                      {(Object.entries(eyeLabels) as [OperatedEye, string][]).map(([eye, label]) => (
                        <option key={eye} value={eye}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {surgeryForm.type === 'AUTRE' && (
                  <Input label="Préciser le type" value={surgeryForm.customType} onChange={(e) => setSurgeryForm({ ...surgeryForm, customType: e.target.value })} />
                )}
                <Input label="Diagnostic" value={surgeryForm.diagnosis} onChange={(e) => setSurgeryForm({ ...surgeryForm, diagnosis: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'anesthésie</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={surgeryForm.anesthesiaType} onChange={(e) => setSurgeryForm({ ...surgeryForm, anesthesiaType: e.target.value })}>
                    <option value="Locale">Locale</option>
                    <option value="Générale">Générale</option>
                    <option value="Locorégionale">Locorégionale</option>
                  </select>
                </div>
                <Input label="Notes" value={surgeryForm.notes} onChange={(e) => setSurgeryForm({ ...surgeryForm, notes: e.target.value })} />
                <Button onClick={handleCreateSurgery} isLoading={isLoading} className="w-full">
                  Créer l'opération
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Waiting list */}
          <div className="space-y-2">
            {waitingList.map((surgery) => (
              <Card key={surgery.id}>
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{surgery.patient.lastName} {surgery.patient.firstName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${surgeryStatusColors[surgery.status]}`}>
                          {surgeryStatusLabels[surgery.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {surgeryTypeLabels[surgery.type]} - {surgery.operatedEye ? eyeLabels[surgery.operatedEye] : 'N/A'}
                        {surgery.diagnosis && ` - ${surgery.diagnosis}`}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {surgery.status === 'WAITING_ANALYSIS' && (
                        <Button size="sm" variant="secondary" onClick={() => handleUpdateSurgeryStatus(surgery.id, 'ANALYSIS_COMPLETE')}>
                          Analyses OK
                        </Button>
                      )}
                      {surgery.status === 'ANALYSIS_COMPLETE' && (
                        <>
                          <Button size="sm" onClick={() => handleUpdateSurgeryStatus(surgery.id, 'ELIGIBLE')}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Éligible
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleUpdateSurgeryStatus(surgery.id, 'NOT_ELIGIBLE')}>
                            <AlertTriangle className="w-4 h-4 mr-1" /> Non éligible
                          </Button>
                        </>
                      )}
                      {surgery.status === 'ELIGIBLE' && (
                        <Button size="sm" onClick={() => {
                          setSchedulingForm({ surgeryId: surgery.id, scheduledDate: '', scheduledTime: '' });
                          setActiveTab('planning');
                        }} leftIcon={<Calendar className="w-4 h-4" />}>
                          Planifier
                        </Button>
                      )}
                      <button onClick={() => setExpandedSurgery(expandedSurgery === surgery.id ? null : surgery.id)} className="text-gray-400 hover:text-gray-600 p-1">
                        {expandedSurgery === surgery.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {expandedSurgery === surgery.id && (
                    <div className="mt-3 pt-3 border-t text-sm space-y-1 text-gray-600">
                      <p><strong>Anesthésie:</strong> {surgery.anesthesiaType || 'Non défini'}</p>
                      <p><strong>Consentement:</strong> {surgery.consentSigned ? '✅ Signé' : '❌ Non signé'}</p>
                      {surgery.notes && <p><strong>Notes:</strong> {surgery.notes}</p>}
                      <p><strong>Créé le:</strong> {new Date(surgery.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {waitingList.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucune opération en attente</p>
            )}
          </div>
        </div>
      )}

      {/* ===== PLANNING ===== */}
      {activeTab === 'planning' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-semibold">Planning opératoire</h2>
            <Input type="date" value={planningDate} onChange={(e) => setPlanningDate(e.target.value)} className="w-auto" />
          </div>

          {/* Schedule form */}
          {schedulingForm.surgeryId && (
            <Card className="border-2 border-indigo-300">
              <CardHeader><CardTitle>Planifier l'opération</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" label="Date" value={schedulingForm.scheduledDate} onChange={(e) => setSchedulingForm({ ...schedulingForm, scheduledDate: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                  <Input type="time" label="Heure" value={schedulingForm.scheduledTime} onChange={(e) => setSchedulingForm({ ...schedulingForm, scheduledTime: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleScheduleSurgery} className="flex-1">Confirmer</Button>
                  <Button variant="secondary" onClick={() => setSchedulingForm({ surgeryId: '', scheduledDate: '', scheduledTime: '' })} className="flex-1">Annuler</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduled surgeries */}
          <div className="space-y-2">
            {scheduledSurgeries.map((surgery) => (
              <Card key={surgery.id}>
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-primary-600">{surgery.scheduledTime || '--:--'}</span>
                        <span className="font-medium">{surgery.patient.lastName} {surgery.patient.firstName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${surgeryStatusColors[surgery.status]}`}>
                          {surgeryStatusLabels[surgery.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 ml-8">
                        {surgeryTypeLabels[surgery.type]} - {surgery.operatedEye ? eyeLabels[surgery.operatedEye] : ''} - {surgery.anesthesiaType || ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {surgery.status === 'SCHEDULED' && (
                        <Button size="sm" onClick={() => handleUpdateSurgeryStatus(surgery.id, 'PRE_OP')}>Pré-op</Button>
                      )}
                      {surgery.status === 'PRE_OP' && (
                        <Button size="sm" onClick={() => handleUpdateSurgeryStatus(surgery.id, 'IN_SURGERY')}>Début opération</Button>
                      )}
                      {surgery.status === 'IN_SURGERY' && (
                        <Button size="sm" onClick={() => handleUpdateSurgeryStatus(surgery.id, 'POST_OP')}>Fin opération</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {scheduledSurgeries.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucune opération planifiée pour cette date</p>
            )}
          </div>
        </div>
      )}

      {/* ===== FOLLOW-UPS ===== */}
      {activeTab === 'followups' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Suivis post-opératoires à faire ({pendingFollowUps.length})</h2>

          {/* Edit follow-up form */}
          {editingFollowUp && (
            <Card className="border-2 border-teal-300">
              <CardHeader>
                <CardTitle>
                  Suivi J+{editingFollowUp.dayNumber} - {editingFollowUp.surgery?.patient.lastName} {editingFollowUp.surgery?.patient.firstName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Acuité visuelle" value={followUpForm.visualAcuity} onChange={(e) => setFollowUpForm({ ...followUpForm, visualAcuity: e.target.value })} placeholder="Ex: 8/10" />
                  <Input label="Pression intraoculaire" type="number" value={followUpForm.intraocularPressure} onChange={(e) => setFollowUpForm({ ...followUpForm, intraocularPressure: e.target.value })} placeholder="mmHg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">État de la cicatrice</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={followUpForm.woundStatus} onChange={(e) => setFollowUpForm({ ...followUpForm, woundStatus: e.target.value })}>
                    <option value="">Sélectionner...</option>
                    <option value="Bonne cicatrisation">Bonne cicatrisation</option>
                    <option value="Cicatrisation en cours">Cicatrisation en cours</option>
                    <option value="Inflammation">Inflammation</option>
                    <option value="Infection">Infection</option>
                  </select>
                </div>
                <Input label="Complications" value={followUpForm.complications} onChange={(e) => setFollowUpForm({ ...followUpForm, complications: e.target.value })} placeholder="Aucune complication" />
                <Input label="Traitement prescrit" value={followUpForm.treatment} onChange={(e) => setFollowUpForm({ ...followUpForm, treatment: e.target.value })} />
                <Input label="Notes" value={followUpForm.notes} onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={handleSaveFollowUp} isLoading={isLoading} className="flex-1">Enregistrer le suivi</Button>
                  <Button variant="secondary" onClick={() => setEditingFollowUp(null)} className="flex-1">Annuler</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending follow-ups list */}
          <div className="space-y-2">
            {pendingFollowUps.map((fu) => (
              <Card key={fu.id}>
                <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{fu.surgery?.patient.lastName} {fu.surgery?.patient.firstName}</p>
                    <p className="text-sm text-gray-600">
                      J+{fu.dayNumber} - {fu.surgery ? surgeryTypeLabels[fu.surgery.type] : ''} - {fu.surgery?.operatedEye ? eyeLabels[fu.surgery.operatedEye] : ''}
                    </p>
                    {fu.scheduledDate && (
                      <p className="text-xs text-gray-400">Prévu: {new Date(fu.scheduledDate).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => {
                    setEditingFollowUp(fu);
                    setFollowUpForm({ visualAcuity: '', intraocularPressure: '', woundStatus: '', complications: '', treatment: '', notes: '' });
                  }} leftIcon={<FileText className="w-4 h-4" />}>
                    Remplir suivi
                  </Button>
                </CardContent>
              </Card>
            ))}
            {pendingFollowUps.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucun suivi en attente</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
