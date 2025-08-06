import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Building, 
  MapPin, 
  Target, 
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrganizationOverview from './page/OrganizationOverview';

const HRAdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, and manage user accounts',
      icon: Users,
      color: 'bg-blue-500',
      route: '/admin-users',
    },
    {
      title: 'Team Management',
      description: 'Organize and manage teams',
      icon: Building,
      color: 'bg-green-500',
      route: '/admin-teams',
    },
    {
      title: 'Sub Teams',
      description: 'Manage sub-team structures',
      icon: Users,
      color: 'bg-purple-500',
      route: '/admin-subteams',
    },
    {
      title: 'Positions',
      description: 'Define and manage job positions',
      icon: MapPin,
      color: 'bg-orange-500',
      route: '/admin-positions',
    },
    {
      title: 'Skills Management',
      description: 'Configure skill criteria and assessments',
      icon: Target,
      color: 'bg-red-500',
      route: '/admin-skills',
    }
  ];


  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Welcome back! Here's what's happening in your organization today.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md"
                onClick={() => navigate(action.route)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${action.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div> */}

      {/* Main Content Grid */}
        {/* Organization Overview - Takes 2 columns */}
        <div className="lg:col-span-2">
          {/* <h2 className="text-2xl font-semibold text-gray-900 mb-6">Organization Overview</h2> */}
          <OrganizationOverview />
      </div>
    </div>
  );
};

export default HRAdminDashboard;