import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, MapPin, TrendingUp, Activity, BarChart3, Target, User, ChevronRight } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { OrganizationStats } from '@/types/admin';
import { useNavigate } from 'react-router-dom';

const OrganizationOverview: React.FC = () => {
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrganizationStats();
  }, []);

  const loadOrganizationStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getOrganizationStats();
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to load stats');
      }
    } catch (err) {
      setError('Failed to load organization statistics');
      console.error('Error loading organization stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'teams':
        navigate('/admin-teams');
        break;
      case 'subteams':
        navigate('/admin-subteams');
        break;
      case 'positions':
        navigate('/admin-positions');
        break;
      case 'users':
        navigate('/admin-users');
        break;
      case 'skills':
        navigate('/admin-skills');
        break;
      default:
        break;
    }
  };

  // Reusable StatCard component
  const StatCard: React.FC<{
    title: string;
    activeCount: number;
    totalCount: number;
    icon: React.ReactNode;
    bgColor: string;
    badgeColor: string;
    onClick: () => void;
  }> = ({ title, activeCount, totalCount, icon, bgColor, badgeColor, onClick }) => (
    <Card 
      className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 shadow-lg cursor-pointer bg-gradient-to-br from-white to-gray-50 overflow-hidden relative"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
          {title}
        </CardTitle>
        <div className={`${bgColor} p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-4xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {activeCount.toLocaleString()}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={`text-xs font-medium ${badgeColor}`}>
              {totalCount.toLocaleString()} Total
            </Badge>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-gray-200 rounded w-16 mb-3"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No organization statistics available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Organization Overview</h1>
        <p className="text-gray-600">Monitor and manage your organization's key metrics</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Active Teams"
          activeCount={stats.teams.active}
          totalCount={stats.teams.total}
          icon={<Building className="h-5 w-5 text-white" />}
          bgColor="bg-gradient-to-r from-blue-500 to-blue-600"
          badgeColor="bg-blue-100 text-blue-800"
          onClick={() => handleCardClick('teams')}
        />

        <StatCard
          title="Active Sub Teams"
          activeCount={stats.subTeams.active}
          totalCount={stats.subTeams.total}
          icon={<Users className="h-5 w-5 text-white" />}
          bgColor="bg-gradient-to-r from-green-500 to-green-600"
          badgeColor="bg-green-100 text-green-800"
          onClick={() => handleCardClick('subteams')}
        />

        <StatCard
          title="Active Positions"
          activeCount={stats.positions.active}
          totalCount={stats.positions.total}
          icon={<MapPin className="h-5 w-5 text-white" />}
          bgColor="bg-gradient-to-r from-purple-500 to-purple-600"
          badgeColor="bg-purple-100 text-purple-800"
          onClick={() => handleCardClick('positions')}
        />

        <StatCard
          title="Active Users"
          activeCount={stats.users?.active || 0}
          totalCount={stats.users?.total || 0}
          icon={<User className="h-5 w-5 text-white" />}
          bgColor="bg-gradient-to-r from-orange-500 to-orange-600"
          badgeColor="bg-orange-100 text-orange-800"
          onClick={() => handleCardClick('users')}
        />

        <StatCard
          title="Active Skills"
          activeCount={stats.skills?.active || 0}
          totalCount={stats.skills?.total || 0}
          icon={<Target className="h-5 w-5 text-white" />}
          bgColor="bg-gradient-to-r from-red-500 to-red-600"
          badgeColor="bg-red-100 text-red-800"
          onClick={() => handleCardClick('skills')}
        />
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => handleCardClick('teams')}
            className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300 group"
          >
            <Building className="h-5 w-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Manage Teams</span>
          </button>
          
          <button
            onClick={() => handleCardClick('subteams')}
            className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-green-300 group"
          >
            <Users className="h-5 w-5 text-green-600 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">Manage Sub Teams</span>
          </button>
          
          <button
            onClick={() => handleCardClick('positions')}
            className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-purple-300 group"
          >
            <MapPin className="h-5 w-5 text-purple-600 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">Manage Positions</span>
          </button>
          
          <button
            onClick={() => handleCardClick('users')}
            className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-orange-300 group"
          >
            <User className="h-5 w-5 text-orange-600 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">Manage Users</span>
          </button>
          
          <button
            onClick={() => handleCardClick('skills')}
            className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-red-300 group"
          >
            <Target className="h-5 w-5 text-red-600 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">Manage Skills</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationOverview;