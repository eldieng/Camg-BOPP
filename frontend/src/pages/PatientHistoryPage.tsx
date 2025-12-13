import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Eye, Stethoscope, Glasses, FileText, Clock } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { patientService, Patient } from '../services/patient.service';
import { consultationService, PatientHistory } from '../services/consultation.service';
import { visionTestService, VisionTest } from '../services/visionTest.service';

export default function PatientHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [visionTests, setVisionTests] = useState<VisionTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'consultations' | 'tests' | 'prescriptions'>('overview');

  useEffect(() => {
    if (id) {
      loadPatientData(id);
    }
  }, [id]);

  const loadPatientData = async (patientId: string) => {
    setIsLoading(true);
    try {
      const [patientData, historyData, testsData] = await Promise.all([
        patientService.getById(patientId),
        consultationService.getPatientHistory(patientId),
        visionTestService.getByPatient(patientId),
      ]);
      setPatient(patientData);
      setHistory(historyData);
      setVisionTests(testsData);
    } catch (err) {
      console.error('Erreur chargement données patient:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient non trouvé</p>
        <Button onClick={() => navigate('/patients')} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/patients')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dossier Patient: {patient.lastName} {patient.firstName}
          </h1>
          <p className="text-gray-600">Historique complet des visites et traitements</p>
        </div>
      </div>

      {/* Infos patient */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-700" />
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nom complet</p>
                <p className="font-semibold">{patient.lastName} {patient.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Âge</p>
                <p className="font-semibold">{calculateAge(patient.dateOfBirth)} ans</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Genre</p>
                <p className="font-semibold">{patient.gender === 'MALE' ? 'Homme' : 'Femme'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-semibold">{patient.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de naissance</p>
                <p className="font-semibold">{new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-semibold">{patient.address || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Statut particulier</p>
                <div className="flex gap-2 mt-1">
                  {patient.isPregnant && <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">Femme enceinte</span>}
                  {patient.isDisabled && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Personne handicapée</span>}
                  {!patient.isPregnant && !patient.isDisabled && <span className="text-gray-500">Aucun</span>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{history?.consultations?.length || 0}</div>
            <div className="text-sm text-gray-500">Consultations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
            <div className="text-2xl font-bold">{visionTests.length}</div>
            <div className="text-sm text-gray-500">Tests de vue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Glasses className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">
              {history?.consultations?.reduce((acc, c) => acc + (c.prescriptions?.length || 0), 0) || 0}
            </div>
            <div className="text-sm text-gray-500">Prescriptions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              {history?.consultations?.[0] 
                ? new Date(history.consultations[0].createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : '-'}
            </div>
            <div className="text-sm text-gray-500">Dernière visite</div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: FileText },
            { id: 'consultations', label: 'Consultations', icon: Stethoscope },
            { id: 'tests', label: 'Tests de vue', icon: Eye },
            { id: 'prescriptions', label: 'Prescriptions', icon: Glasses },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dernière consultation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-green-500" />
                Dernière consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history?.consultations?.[0] ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    {formatDate(history.consultations[0].createdAt)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Motif</p>
                    <p>{history.consultations[0].chiefComplaint || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Diagnostic</p>
                    <p>{history.consultations[0].diagnosis || '-'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune consultation</p>
              )}
            </CardContent>
          </Card>

          {/* Dernier test de vue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                Dernier test de vue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visionTests[0] ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    {formatDate(visionTests[0].createdAt)}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-700">Œil Droit (OD)</p>
                      <p className="text-lg font-bold">{visionTests[0].visualAcuityOD || '-'}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-700">Œil Gauche (OG)</p>
                      <p className="text-lg font-bold">{visionTests[0].visualAcuityOG || '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun test de vue</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'consultations' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des consultations</CardTitle>
          </CardHeader>
          <CardContent>
            {history?.consultations && history.consultations.length > 0 ? (
              <div className="space-y-4">
                {history.consultations.map((consultation, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm text-gray-500">{formatDate(consultation.createdAt)}</div>
                      {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {consultation.prescriptions.length} prescription(s)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Motif</p>
                        <p className="text-gray-900">{consultation.chiefComplaint || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Diagnostic</p>
                        <p className="text-gray-900">{consultation.diagnosis || '-'}</p>
                      </div>
                      {consultation.notes && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-700">Notes</p>
                          <p className="text-gray-900">{consultation.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune consultation enregistrée</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'tests' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des tests de vue</CardTitle>
          </CardHeader>
          <CardContent>
            {visionTests.length > 0 ? (
              <div className="space-y-4">
                {visionTests.map((test, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="text-sm text-gray-500 mb-3">{formatDate(test.createdAt)}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs text-blue-600">Acuité OD</p>
                        <p className="text-xl font-bold text-blue-800">{test.visualAcuityOD || '-'}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-xs text-green-600">Acuité OG</p>
                        <p className="text-xl font-bold text-green-800">{test.visualAcuityOG || '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Correction OD</p>
                        <p className="text-xl font-bold text-gray-800">{test.correctedAcuityOD || '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Correction OG</p>
                        <p className="text-xl font-bold text-gray-800">{test.correctedAcuityOG || '-'}</p>
                      </div>
                    </div>
                    {test.notes && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">Notes: {test.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun test de vue enregistré</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'prescriptions' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {history?.consultations?.some(c => c.prescriptions && c.prescriptions.length > 0) ? (
              <div className="space-y-4">
                {history.consultations
                  .filter(c => c.prescriptions && c.prescriptions.length > 0)
                  .map((consultation, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-500 mb-3">
                        Consultation du {formatDate(consultation.createdAt)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {consultation.prescriptions?.map((prescription, pIdx) => (
                          <div 
                            key={pIdx} 
                            className={`p-3 rounded-lg ${prescription.eyeType === 'OD' ? 'bg-blue-50' : 'bg-green-50'}`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">
                                {prescription.eyeType === 'OD' ? 'Œil Droit (OD)' : 'Œil Gauche (OG)'}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Sph</p>
                                <p className="font-medium">{prescription.sphere ?? '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Cyl</p>
                                <p className="font-medium">{prescription.cylinder ?? '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Axe</p>
                                <p className="font-medium">{prescription.axis ?? '-'}°</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Add</p>
                                <p className="font-medium">{prescription.addition ?? '-'}</p>
                              </div>
                            </div>
                            {(prescription.lensType || prescription.coating) && (
                              <div className="mt-2 pt-2 border-t text-sm">
                                {prescription.lensType && <span className="mr-3">Verre: {prescription.lensType}</span>}
                                {prescription.coating && <span>Traitement: {prescription.coating}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune prescription enregistrée</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
