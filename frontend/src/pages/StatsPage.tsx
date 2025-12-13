import { useState, useEffect } from 'react';
import { BarChart3, Users, Ticket, Eye, Stethoscope, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { statsService, TodayStats, DailyTrend } from '../services/stats.service';

export default function StatsPage() {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [trend, setTrend] = useState<DailyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [today, dailyTrend] = await Promise.all([
        statsService.getTodayStats(),
        statsService.getDailyTrend(7),
      ]);
      setTodayStats(today);
      setTrend(dailyTrend);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getStationLabel = (station: string) => {
    const labels: Record<string, string> = {
      ACCUEIL: 'Accueil',
      TEST_VUE: 'Test Vue',
      CONSULTATION: 'Consultation',
      LUNETTES: 'Lunettes',
    };
    return labels[station] || station;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        <Button onClick={loadStats} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{todayStats?.patients.newToday || 0}</p>
            <p className="text-sm text-gray-600">Nouveaux patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Ticket className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{todayStats?.tickets.total || 0}</p>
            <p className="text-sm text-gray-600">Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{todayStats?.tickets.waiting || 0}</p>
            <p className="text-sm text-gray-600">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
            <p className="text-2xl font-bold">{todayStats?.visionTests || 0}</p>
            <p className="text-sm text-gray-600">Tests de vue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Stethoscope className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{todayStats?.consultations || 0}</p>
            <p className="text-sm text-gray-600">Consultations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
            <p className="text-2xl font-bold">{todayStats?.tickets.completed || 0}</p>
            <p className="text-sm text-gray-600">Terminés</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut des tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">En attente</span>
                <div className="flex items-center">
                  <div className="w-32 h-3 bg-gray-200 rounded-full mr-3">
                    <div className="h-3 bg-yellow-500 rounded-full" style={{ width: `${((todayStats?.tickets.waiting || 0) / (todayStats?.tickets.total || 1)) * 100}%` }}></div>
                  </div>
                  <span className="font-medium w-8">{todayStats?.tickets.waiting || 0}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">En cours</span>
                <div className="flex items-center">
                  <div className="w-32 h-3 bg-gray-200 rounded-full mr-3">
                    <div className="h-3 bg-blue-500 rounded-full" style={{ width: `${((todayStats?.tickets.inProgress || 0) / (todayStats?.tickets.total || 1)) * 100}%` }}></div>
                  </div>
                  <span className="font-medium w-8">{todayStats?.tickets.inProgress || 0}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Terminés</span>
                <div className="flex items-center">
                  <div className="w-32 h-3 bg-gray-200 rounded-full mr-3">
                    <div className="h-3 bg-green-500 rounded-full" style={{ width: `${((todayStats?.tickets.completed || 0) / (todayStats?.tickets.total || 1)) * 100}%` }}></div>
                  </div>
                  <span className="font-medium w-8">{todayStats?.tickets.completed || 0}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Annulés</span>
                <div className="flex items-center">
                  <div className="w-32 h-3 bg-gray-200 rounded-full mr-3">
                    <div className="h-3 bg-gray-500 rounded-full" style={{ width: `${((todayStats?.tickets.cancelled || 0) / (todayStats?.tickets.total || 1)) * 100}%` }}></div>
                  </div>
                  <span className="font-medium w-8">{todayStats?.tickets.cancelled || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques par station */}
        <Card>
          <CardHeader>
            <CardTitle>Par station</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayStats?.queueStats.map((station) => (
                <div key={station.station} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{getStationLabel(station.station)}</span>
                    <span className="text-sm text-gray-500">~{station.avgWaitTime} min</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-yellow-100 rounded p-1">
                      <p className="font-bold text-yellow-800">{station.waiting}</p>
                      <p className="text-yellow-600 text-xs">Attente</p>
                    </div>
                    <div className="bg-blue-100 rounded p-1">
                      <p className="font-bold text-blue-800">{station.inService}</p>
                      <p className="text-blue-600 text-xs">En cours</p>
                    </div>
                    <div className="bg-green-100 rounded p-1">
                      <p className="font-bold text-green-800">{station.completed}</p>
                      <p className="text-green-600 text-xs">Terminés</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendance sur 7 jours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Tendance sur 7 jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-center py-2">Patients</th>
                  <th className="text-center py-2">Tickets</th>
                  <th className="text-center py-2">Terminés</th>
                  <th className="text-center py-2">Annulés</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((day) => (
                  <tr key={day.date} className="border-b hover:bg-gray-50">
                    <td className="py-2">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td className="text-center py-2">{day.totalPatients}</td>
                    <td className="text-center py-2">{day.totalTickets}</td>
                    <td className="text-center py-2 text-green-600">{day.completedTickets}</td>
                    <td className="text-center py-2 text-gray-500">{day.cancelledTickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
