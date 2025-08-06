import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Plus, 
  Building, 
  Activity,
  TrendingUp,
  Target,
  UserCheck,
  GitBranch
} from 'lucide-react';
import SubTeamManagement from './page/SubTeamManagement';

const AdminSubTeamsPage: React.FC = () => {
  const handleStatsUpdate = () => {
    // Handle stats update if needed
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
              <Users className="h-8 w-8" />
              <span>Sub Team Management</span>
            </h1>
            <p className="text-purple-100 text-lg">
              Manage sub-team structures and their assignments within parent teams
            </p>
          </div>
          {/* <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="secondary" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sub Team
            </Button>
          </div> */}
        </div>
      </div>

      {/* Main Sub Team Management Component */}
      <SubTeamManagement onStatsUpdate={handleStatsUpdate} />
    </div>
  );
};

export default AdminSubTeamsPage;