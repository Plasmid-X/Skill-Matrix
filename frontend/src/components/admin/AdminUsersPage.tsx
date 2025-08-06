import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Activity,
  TrendingUp,
  UserCheck,
  UserX,
  Crown
} from 'lucide-react';
import UserManagement from './page/UserManagement';

const AdminUsersPage: React.FC = () => {
  const handleStatsUpdate = () => {
    // Handle stats update if needed
  };
  
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
              <Users className="h-8 w-8" />
              <span>User Management</span>
            </h1>
            <p className="text-blue-100 text-lg">
              Manage user accounts, roles, and permissions across your organization
            </p>
          </div>
          {/* <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="secondary" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div> */}
        </div>
      </div>

      {/* Main User Management Component */}
      <UserManagement onStatsUpdate={handleStatsUpdate} />
    </div>
  );
};

export default AdminUsersPage;