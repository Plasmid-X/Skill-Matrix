import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Plus, 
  Briefcase, 
  Activity,
  TrendingUp,
  Target,
  UserCheck,
  Star
} from 'lucide-react';
import PositionManagement from './page/PositionManagement';

const AdminPositionsPage: React.FC = () => {
  const handleStatsUpdate = () => {
    // Handle stats update if needed
  };

  const positionStats = [
    {
      title: 'Total Positions',
      value: '28',
      change: '+10%',
      changeType: 'positive',
      icon: MapPin,
      color: 'bg-orange-500'
    },
    {
      title: 'Active Positions',
      value: '25',
      change: '+7%',
      changeType: 'positive',
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      title: 'Job Roles',
      value: '18',
      change: '+3%',
      changeType: 'positive',
      icon: Briefcase,
      color: 'bg-blue-500'
    },
    {
      title: 'Senior Positions',
      value: '12',
      change: '+15%',
      changeType: 'positive',
      icon: Star,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
              <MapPin className="h-8 w-8" />
              <span>Position Management</span>
            </h1>
            <p className="text-orange-100 text-lg">
              Define and manage job positions and roles across your organization
            </p>
          </div>
          {/* <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="secondary" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Position
            </Button>
          </div> */}
        </div>
      </div>

      {/* Main Position Management Component */}
      <PositionManagement onStatsUpdate={handleStatsUpdate} />
    </div>
  );
};

export default AdminPositionsPage;