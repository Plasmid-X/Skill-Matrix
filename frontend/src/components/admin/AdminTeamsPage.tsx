import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Plus, 
  Users, 
  Activity,
  TrendingUp,
  Target,
  UserCheck,
  Briefcase
} from 'lucide-react';
import TeamManagement from './page/TeamManagement';

const AdminTeamsPage: React.FC = () => {
  const handleStatsUpdate = () => {
    // Handle stats update if needed
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
              <Building className="h-8 w-8" />
              <span>Team Management</span>
            </h1>
            <p className="text-green-100 text-lg">
              Organize and manage teams across your organization
            </p>
          </div>
          {/* <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="secondary" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </div> */}
        </div>
      </div>

      {/* Main Team Management Component */}
      <TeamManagement onStatsUpdate={handleStatsUpdate} />
    </div>
  );
};

export default AdminTeamsPage;