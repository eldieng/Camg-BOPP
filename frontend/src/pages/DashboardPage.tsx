import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Users, Ticket, Activity, Eye, TrendingUp, Clock } from 'lucide-react';
import { statsService, TodayStats, DailyTrend } from '../services/stats.service';
import { ticketService, Ticket as TicketType } from '../services/ticket.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
  const [waitingTickets, setWaitingTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [stats, trend, ticketsData] = await Promise.all([
        statsService.getTodayStats(),
        statsService.getDailyTrend(7),
        ticketService.getTodayTickets(),
      ]);
      setTodayStats(stats);
      setDailyTrend(trend);
      // Filtrer les tickets en attente
      const waiting = ticketsData.tickets.filter(t => t.status === 'WAITING' || t.status === 'IN_PROGRESS');
      setWaitingTickets(waiting);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // Refresh toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: 'Patients du jour',
      value: todayStats?.patients.newToday ?? 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Tickets en attente',
      value: todayStats?.tickets.waiting ?? 0,
      icon: Ticket,
      color: 'bg-yellow-500',
    },
    {
      title: 'Tests de vue',
      value: todayStats?.visionTests ?? 0,
      icon: Eye,
      color: 'bg-indigo-500',
    },
    {
      title: 'Consultations',
      value: todayStats?.consultations ?? 0,
      icon: Activity,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-gray-600">
          Voici un aperçu de l'activité du dispensaire aujourd'hui.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File d'attente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              File d'attente ({waitingTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : waitingTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun patient en attente</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {waitingTickets.slice(0, 10).map((ticket, idx) => (
                  <div 
                    key={ticket.id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-blue-600">{ticket.ticketNumber.split('-')[1]}</span>
                      <div>
                        <p className="font-medium text-sm">{ticket.patient.lastName} {ticket.patient.firstName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ticket.priority === 'NORMAL' ? 'bg-gray-200 text-gray-600' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {ticket.priority === 'NORMAL' ? 'Normal' : 'Prioritaire'}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résumé des tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets du jour</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Total</span>
                  <span className="font-bold">{todayStats?.tickets.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-700">En attente</span>
                  <span className="font-bold text-yellow-800">{todayStats?.tickets.waiting ?? 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-blue-700">En cours</span>
                  <span className="font-bold text-blue-800">{todayStats?.tickets.inProgress ?? 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-green-700">Terminés</span>
                  <span className="font-bold text-green-800">{todayStats?.tickets.completed ?? 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Annulés / Absents</span>
                  <span className="font-bold text-gray-700">
                    {(todayStats?.tickets.cancelled ?? 0) + (todayStats?.tickets.noShow ?? 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File d'attente par station */}
        <Card>
          <CardHeader>
            <CardTitle>File d'attente par station</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : (
              <div className="space-y-3">
                {todayStats?.queueStats.map((station) => (
                  <div key={station.station} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {station.station === 'ACCUEIL' ? 'Accueil' :
                         station.station === 'TEST_VUE' ? 'Test Vue' :
                         station.station === 'CONSULTATION' ? 'Consultation' : 'Lunettes'}
                      </span>
                      <span className="text-sm text-gray-500">~{station.avgWaitTime} min</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-yellow-100 rounded p-1">
                        <p className="font-bold text-yellow-800">{station.waiting}</p>
                        <p className="text-yellow-600">Attente</p>
                      </div>
                      <div className="bg-blue-100 rounded p-1">
                        <p className="font-bold text-blue-800">{station.inService}</p>
                        <p className="text-blue-600">En cours</p>
                      </div>
                      <div className="bg-green-100 rounded p-1">
                        <p className="font-bold text-green-800">{station.completed}</p>
                        <p className="text-green-600">Terminés</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!todayStats?.queueStats || todayStats.queueStats.length === 0) && (
                  <p className="text-center text-gray-500 py-4">Aucune donnée</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendance sur 7 jours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Tendance sur 7 jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="totalTickets" name="Tickets" stroke="#3B82F6" fill="#93C5FD" />
                  <Area type="monotone" dataKey="completedTickets" name="Terminés" stroke="#10B981" fill="#6EE7B7" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">Aucune donnée</div>
            )}
          </CardContent>
        </Card>

        {/* Répartition des tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des tickets du jour</CardTitle>
          </CardHeader>
          <CardContent>
            {todayStats && todayStats.tickets.total > 0 ? (
              <div className="flex items-center">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'En attente', value: todayStats.tickets.waiting },
                        { name: 'En cours', value: todayStats.tickets.inProgress },
                        { name: 'Terminés', value: todayStats.tickets.completed },
                        { name: 'Annulés', value: todayStats.tickets.cancelled },
                        { name: 'Absents', value: todayStats.tickets.noShow },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[0, 1, 2, 3, 4].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-1/2 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>En attente: {todayStats.tickets.waiting}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>En cours: {todayStats.tickets.inProgress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Terminés: {todayStats.tickets.completed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Annulés: {todayStats.tickets.cancelled}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Absents: {todayStats.tickets.noShow}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Aucun ticket aujourd'hui</div>
            )}
          </CardContent>
        </Card>

        {/* Activité par station */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité par station</CardTitle>
          </CardHeader>
          <CardContent>
            {todayStats?.queueStats && todayStats.queueStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={todayStats.queueStats.map(s => ({
                  ...s,
                  station: s.station === 'ACCUEIL' ? 'Accueil' :
                           s.station === 'TEST_VUE' ? 'Test Vue' :
                           s.station === 'CONSULTATION' ? 'Consultation' : 'Lunettes'
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="station" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="waiting" name="En attente" fill="#F59E0B" />
                  <Bar dataKey="inService" name="En cours" fill="#3B82F6" />
                  <Bar dataKey="completed" name="Terminés" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">Aucune donnée</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
