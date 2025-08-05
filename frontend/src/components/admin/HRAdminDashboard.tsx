import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import TeamManagement from './page/TeamManagement';
import SubTeamManagement from './page/SubTeamManagement';
import PositionManagement from './page/PositionManagement';
import UserManagement from './page/UserManagement';
import OrganizationOverview from './page/OrganizationOverview';
import SkillCriteriaPage from '../criteria/SkillCriteriaPage';

const HRAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'users', 'teams', 'subteams', 'positions', 'skills'].includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab('overview'); // Default to overview
    }
  }, [location.search]);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleStatsUpdate = () => {
  };

  return (
    <div className="space-y-6">
      

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsContent value="overview" className="space-y-4">
          <OrganizationOverview />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>

        <TabsContent value="subteams" className="space-y-4">
          <SubTeamManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <PositionManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillCriteriaPage onStatsUpdate={handleStatsUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRAdminDashboard;