import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Plus, 
  Award, 
  Activity,
  TrendingUp,
  BookOpen,
  CheckCircle,
  Zap
} from 'lucide-react';
import SkillCriteriaPage from '../criteria/SkillCriteriaPage';

const AdminSkillsPage: React.FC = () => {
  const handleStatsUpdate = () => {
    // Handle stats update if needed
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
              <Target className="h-8 w-8" />
              <span>Skills Management</span>
            </h1>
            <p className="text-red-100 text-lg">
              Configure skill criteria, assessments, and competency frameworks
            </p>
          </div>
          {/* <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="secondary" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div> */}
        </div>
      </div>

      {/* Main Skills Management Component */}
      <SkillCriteriaPage onStatsUpdate={handleStatsUpdate} />
    </div>
  );
};

export default AdminSkillsPage;