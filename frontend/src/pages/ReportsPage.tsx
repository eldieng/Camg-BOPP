import { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Users, Eye, Stethoscope, Clock, TrendingUp, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { reportService, ReportStats } from '../services/report.service';

type PresetRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState<PresetRange>('month');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const loadStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await reportService.getStats(dateRange.start, dateRange.end);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const setPresetRange = (preset: PresetRange) => {
    if (preset === 'custom') {
      setActivePreset('custom');
      return;
    }
    
    const now = new Date();
    let start: Date;
    
    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    setActivePreset(preset);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    });
  };

  const exportToCSV = () => {
    if (!stats) return;

    const rows: string[][] = [];
    
    // En-têtes
    rows.push(['Métrique', 'Valeur']);
    
    // Données brutes
    rows.push(['Période début', dateRange.start]);
    rows.push(['Période fin', dateRange.end]);
    rows.push(['Patients total', stats.patients.total.toString()]);
    rows.push(['Nouveaux patients', stats.patients.new.toString()]);
    rows.push(['Tests de vue', stats.visionTests.total.toString()]);
    rows.push(['Consultations', stats.consultations.total.toString()]);
    rows.push(['Consultations avec ordonnance', stats.consultations.withPrescriptions.toString()]);
    rows.push(['Tickets émis', stats.tickets.total.toString()]);
    rows.push(['Tickets complétés', stats.tickets.completed.toString()]);
    rows.push(['Tickets annulés', stats.tickets.cancelled.toString()]);
    rows.push(['Temps attente moyen (min)', stats.queues.averageWaitTime.toString()]);
    
    // Par station
    stats.queues.byStation.forEach(s => {
      rows.push([`Station ${s.station} - Total`, s.total.toString()]);
      rows.push([`Station ${s.station} - Complétés`, s.completed.toString()]);
    });
    
    // Parcours patient par station
    if (stats.stationFlow) {
      rows.push(['', '']);
      rows.push(['=== PARCOURS PATIENT ===', '']);
      rows.push(['Accueil - Tickets', stats.stationFlow.accueil.tickets.toString()]);
      rows.push(['Accueil - Complétés', stats.stationFlow.accueil.completed.toString()]);
      rows.push(['Test Vue - Total', stats.stationFlow.testVue.total.toString()]);
      rows.push(['Test Vue - Complétés', stats.stationFlow.testVue.completed.toString()]);
      rows.push(['Consultation - Total', stats.stationFlow.consultation.total.toString()]);
      rows.push(['Consultation - Ordonnances', stats.stationFlow.consultation.withPrescriptions.toString()]);
      rows.push(['Lunettes - Total', stats.stationFlow.lunettes.total.toString()]);
      rows.push(['Lunettes - Complétés', stats.stationFlow.lunettes.completed.toString()]);
      rows.push(['Médicaments - Total', stats.stationFlow.medicaments.total.toString()]);
      rows.push(['Médicaments - Complétés', stats.stationFlow.medicaments.completed.toString()]);
      rows.push(['Bloc Opératoire - Chirurgies', stats.stationFlow.blocOperatoire.surgeries.toString()]);
      rows.push(['Bloc Opératoire - Analyses', stats.stationFlow.blocOperatoire.analyses.toString()]);
      rows.push(['Bloc Opératoire - Complétés', stats.stationFlow.blocOperatoire.completed.toString()]);
    }
    
    // Commandes de lunettes
    if (stats.glassesOrders) {
      rows.push(['', '']);
      rows.push(['=== COMMANDES LUNETTES ===', '']);
      rows.push(['Commandes - Total', stats.glassesOrders.total.toString()]);
      rows.push(['Commandes - En attente', stats.glassesOrders.pending.toString()]);
      rows.push(['Commandes - Prêtes', stats.glassesOrders.ready.toString()]);
      rows.push(['Commandes - Livrées', stats.glassesOrders.delivered.toString()]);
    }
    
    // Journalier
    if (stats.dailyStats.length > 0) {
      rows.push(['', '']);
      rows.push(['Date', 'Patients', 'Consultations', 'Tests']);
      stats.dailyStats.forEach(d => {
        rows.push([d.date, d.patients.toString(), d.consultations.toString(), d.visionTests.toString()]);
      });
    }
    
    // Convert to CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-camg-bopp-${dateRange.start}-${dateRange.end}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadStats();
    }
  }, [dateRange]);

  const exportToPDF = () => {
    if (!stats) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport CAMG-BOPP</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .period { background: #f3f4f6; padding: 10px 20px; border-radius: 8px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; color: #1e40af; }
          .stat-label { color: #6b7280; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rapport d'Activité - CAMG-BOPP</h1>
          <div class="period">
            <strong>Période:</strong> ${new Date(stats.period.start).toLocaleDateString('fr-FR')} - ${new Date(stats.period.end).toLocaleDateString('fr-FR')}
          </div>
        </div>

        <h2>Résumé Global</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.patients.total}</div>
            <div class="stat-label">Patients Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.patients.new}</div>
            <div class="stat-label">Nouveaux Patients</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.visionTests.total}</div>
            <div class="stat-label">Tests de Vue</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.consultations.total}</div>
            <div class="stat-label">Consultations</div>
          </div>
        </div>

        <h2>Détails des Tickets</h2>
        <table>
          <tr>
            <th>Métrique</th>
            <th>Valeur</th>
          </tr>
          <tr>
            <td>Tickets émis</td>
            <td>${stats.tickets.total}</td>
          </tr>
          <tr>
            <td>Tickets complétés</td>
            <td>${stats.tickets.completed}</td>
          </tr>
          <tr>
            <td>Tickets annulés</td>
            <td>${stats.tickets.cancelled}</td>
          </tr>
          <tr>
            <td>Taux de complétion</td>
            <td>${stats.tickets.total > 0 ? Math.round((stats.tickets.completed / stats.tickets.total) * 100) : 0}%</td>
          </tr>
        </table>

        <h2>Consultations</h2>
        <table>
          <tr>
            <th>Métrique</th>
            <th>Valeur</th>
          </tr>
          <tr>
            <td>Total consultations</td>
            <td>${stats.consultations.total}</td>
          </tr>
          <tr>
            <td>Avec prescriptions</td>
            <td>${stats.consultations.withPrescriptions}</td>
          </tr>
          <tr>
            <td>Temps d'attente moyen</td>
            <td>${stats.queues.averageWaitTime} minutes</td>
          </tr>
        </table>

        <h2>Parcours Patient - Suivi par Station</h2>
        <table>
          <tr>
            <th>Station</th>
            <th>Total</th>
            <th>Complétés/Détails</th>
          </tr>
          ${stats.stationFlow ? `
            <tr><td>🎫 Accueil</td><td>${stats.stationFlow.accueil.tickets}</td><td>${stats.stationFlow.accueil.completed} complétés</td></tr>
            <tr><td>👁️ Test Vue</td><td>${stats.stationFlow.testVue.total}</td><td>${stats.stationFlow.testVue.completed} complétés</td></tr>
            <tr><td>🩺 Consultation</td><td>${stats.stationFlow.consultation.total}</td><td>${stats.stationFlow.consultation.withPrescriptions} ordonnances</td></tr>
            <tr><td>👓 Lunettes</td><td>${stats.stationFlow.lunettes.total}</td><td>${stats.stationFlow.lunettes.completed} complétés</td></tr>
            <tr><td>💊 Médicaments</td><td>${stats.stationFlow.medicaments.total}</td><td>${stats.stationFlow.medicaments.completed} complétés</td></tr>
            <tr><td>🏥 Bloc Opératoire</td><td>${stats.stationFlow.blocOperatoire.surgeries} chirurgies</td><td>${stats.stationFlow.blocOperatoire.analyses} analyses</td></tr>
          ` : ''}
        </table>

        ${stats.glassesOrders ? `
          <h2>Commandes de Lunettes</h2>
          <table>
            <tr>
              <th>Statut</th>
              <th>Nombre</th>
            </tr>
            <tr><td>Total</td><td>${stats.glassesOrders.total}</td></tr>
            <tr><td>En attente</td><td>${stats.glassesOrders.pending}</td></tr>
            <tr><td>Prêtes</td><td>${stats.glassesOrders.ready}</td></tr>
            <tr><td>Livrées</td><td>${stats.glassesOrders.delivered}</td></tr>
          </table>
        ` : ''}

        ${stats.dailyStats.length > 0 ? `
          <h2>Activité Journalière</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Patients</th>
              <th>Consultations</th>
              <th>Tests de Vue</th>
            </tr>
            ${stats.dailyStats.map(d => `
              <tr>
                <td>${new Date(d.date).toLocaleDateString('fr-FR')}</td>
                <td>${d.patients}</td>
                <td>${d.consultations}</td>
                <td>${d.visionTests}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}

        <div class="footer">
          <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>CAMG-BOPP - Dispensaire Ophtalmologique</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const stationLabels: Record<string, string> = {
    'ACCUEIL': 'Accueil',
    'TEST_VUE': 'Test de Vue',
    'CONSULTATION': 'Consultation',
    'LUNETTES': 'Lunettes',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-600">Analyse de l'activité du dispensaire</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStats} variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />} disabled={isLoading}>
            Actualiser
          </Button>
          <Button onClick={exportToCSV} variant="secondary" leftIcon={<FileSpreadsheet className="w-4 h-4" />} disabled={!stats}>
            Export CSV
          </Button>
          <Button onClick={exportToPDF} leftIcon={<Download className="w-4 h-4" />} disabled={!stats}>
            Export PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtres de date */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Période:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPresetRange('today')}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  activePreset === 'today' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setPresetRange('week')}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  activePreset === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                7 jours
              </button>
              <button
                onClick={() => setPresetRange('month')}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  activePreset === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Ce mois
              </button>
              <button
                onClick={() => setPresetRange('year')}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  activePreset === 'year' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cette année
              </button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => { setActivePreset('custom'); setDateRange({ ...dateRange, start: e.target.value }); }}
                className={`px-3 py-1 border rounded-lg text-sm ${activePreset === 'custom' ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
              />
              <span className="text-gray-500">à</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => { setActivePreset('custom'); setDateRange({ ...dateRange, end: e.target.value }); }}
                className={`px-3 py-1 border rounded-lg text-sm ${activePreset === 'custom' ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : stats ? (
        <>
          {/* Cartes de statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Patients Total</p>
                    <p className="text-3xl font-bold">{stats.patients.total}</p>
                    <p className="text-blue-100 text-xs mt-1">+{stats.patients.new} nouveaux</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Tests de Vue</p>
                    <p className="text-3xl font-bold">{stats.visionTests.total}</p>
                    <p className="text-green-100 text-xs mt-1">sur la période</p>
                  </div>
                  <Eye className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Consultations</p>
                    <p className="text-3xl font-bold">{stats.consultations.total}</p>
                    <p className="text-purple-100 text-xs mt-1">{stats.consultations.withPrescriptions} avec ordonnance</p>
                  </div>
                  <Stethoscope className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Temps d'attente</p>
                    <p className="text-3xl font-bold">{stats.queues.averageWaitTime}</p>
                    <p className="text-orange-100 text-xs mt-1">minutes en moyenne</p>
                  </div>
                  <Clock className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parcours Patient - Flux complet */}
          {stats.stationFlow && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Parcours Patient - Suivi par Station
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Accueil */}
                  <div className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-200">
                    <div className="text-3xl mb-2">🎫</div>
                    <p className="font-semibold text-blue-800">Accueil</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.stationFlow.accueil.tickets}</p>
                    <p className="text-xs text-blue-600">{stats.stationFlow.accueil.completed} complétés</p>
                  </div>
                  
                  {/* Test Vue */}
                  <div className="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
                    <div className="text-3xl mb-2">👁️</div>
                    <p className="font-semibold text-green-800">Test Vue</p>
                    <p className="text-2xl font-bold text-green-600">{stats.stationFlow.testVue.total}</p>
                    <p className="text-xs text-green-600">{stats.stationFlow.testVue.completed} complétés</p>
                  </div>
                  
                  {/* Consultation */}
                  <div className="bg-purple-50 rounded-lg p-4 text-center border-2 border-purple-200">
                    <div className="text-3xl mb-2">🩺</div>
                    <p className="font-semibold text-purple-800">Consultation</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.stationFlow.consultation.total}</p>
                    <p className="text-xs text-purple-600">{stats.stationFlow.consultation.withPrescriptions} ordonnances</p>
                  </div>
                  
                  {/* Lunettes */}
                  <div className="bg-indigo-50 rounded-lg p-4 text-center border-2 border-indigo-200">
                    <div className="text-3xl mb-2">👓</div>
                    <p className="font-semibold text-indigo-800">Lunettes</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.stationFlow.lunettes.total}</p>
                    <p className="text-xs text-indigo-600">{stats.stationFlow.lunettes.completed} complétés</p>
                  </div>
                  
                  {/* Médicaments */}
                  <div className="bg-teal-50 rounded-lg p-4 text-center border-2 border-teal-200">
                    <div className="text-3xl mb-2">💊</div>
                    <p className="font-semibold text-teal-800">Médicaments</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.stationFlow.medicaments.total}</p>
                    <p className="text-xs text-teal-600">{stats.stationFlow.medicaments.completed} complétés</p>
                  </div>
                  
                  {/* Bloc Opératoire */}
                  <div className="bg-orange-50 rounded-lg p-4 text-center border-2 border-orange-200">
                    <div className="text-3xl mb-2">🏥</div>
                    <p className="font-semibold text-orange-800">Bloc Op.</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.stationFlow.blocOperatoire.surgeries}</p>
                    <p className="text-xs text-orange-600">{stats.stationFlow.blocOperatoire.analyses} analyses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Commandes de Lunettes */}
          {stats.glassesOrders && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  👓 Commandes de Lunettes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.glassesOrders.total}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-700">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.glassesOrders.pending}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-700">Prêtes</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.glassesOrders.ready}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-700">Livrées</p>
                    <p className="text-2xl font-bold text-green-600">{stats.glassesOrders.delivered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Détails */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total émis</span>
                    <span className="font-semibold">{stats.tickets.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Complétés</span>
                    <span className="font-semibold text-green-600">{stats.tickets.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Annulés</span>
                    <span className="font-semibold text-red-600">{stats.tickets.cancelled}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taux de complétion</span>
                      <span className="font-bold text-blue-600">
                        {stats.tickets.total > 0 ? Math.round((stats.tickets.completed / stats.tickets.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.tickets.total > 0 ? (stats.tickets.completed / stats.tickets.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Par station */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Activité par Station
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.queues.byStation.map((station) => (
                    <div key={station.station}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">{stationLabels[station.station] || station.station}</span>
                        <span className="text-sm">
                          <span className="font-semibold">{station.completed}</span>
                          <span className="text-gray-400">/{station.total}</span>
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${station.total > 0 ? (station.completed / station.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau journalier */}
          {stats.dailyStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activité Journalière</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-600">Patients</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-600">Consultations</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-600">Tests de Vue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.dailyStats.map((day) => (
                        <tr key={day.date} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                              {day.patients}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold">
                              {day.consultations}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold">
                              {day.visionTests}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
