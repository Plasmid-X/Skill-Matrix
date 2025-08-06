import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  EyeOff,
  Building2,
  Power,
  PowerOff
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { Team, CreateTeamRequest, UpdateTeamRequest } from '../../../types/admin';
import { toast } from 'sonner';
import { TeamDetailModal } from '../modals/TeamDetailModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { PreDeletionReassignmentModal } from '../modals/PreDeletionReassignmentModal';

interface TeamManagementProps {
  onStatsUpdate: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ onStatsUpdate }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'deactivate' | 'activate';
    team: Team | null;
    loading: boolean;
  }>({
    isOpen: false,
    type: 'delete',
    team: null,
    loading: false
  });
  const [preDeleteModal, setPreDeleteModal] = useState<{
    isOpen: boolean;
    team: Team | null;
    loading: boolean;
  }>({
    isOpen: false,
    team: null,
    loading: false
  });
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: ''
  });

  useEffect(() => {
    loadTeams();
  }, [showInactive]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllTeams();
      if (response.success) {
        const filteredTeams = response.data.filter(val=>val.isActive === !showInactive) || [];
        setTeams(filteredTeams);
        
        // Update selectedTeam if modal is open and team exists in updated data
        if (selectedTeam && isDetailModalOpen) {
          const updatedTeam = response.data.find((t: Team) => t.id === selectedTeam.id);
          if (updatedTeam) {
            setSelectedTeam(updatedTeam);
          }
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        const response = await adminService.updateTeam(editingTeam.id, formData);
        if (response.success) {
          toast.success('Team updated successfully');
        }
      } else {
        const response = await adminService.createTeam(formData);
        if (response.success) {
          toast.success('Team created successfully');
        }
      }
      setIsDialogOpen(false);
      setEditingTeam(null);
      setFormData({ name: ''});
      loadTeams();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const openConfirmationModal = (type: 'delete' | 'deactivate' | 'activate', team: Team) => {
    if (type === 'delete') {
      // Open pre-deletion reassignment modal for delete operations
      setPreDeleteModal({
        isOpen: true,
        team,
        loading: false
      });
    } else {
      // Use regular confirmation modal for activate/deactivate
      setConfirmationModal({
        isOpen: true,
        type,
        team,
        loading: false
      });
    }
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: 'delete',
      team: null,
      loading: false
    });
  };

  const closePreDeleteModal = () => {
    setPreDeleteModal({
      isOpen: false,
      team: null,
      loading: false
    });
  };

  const handlePreDeleteConfirm = () => {
    // This is called after successful reassignment and deletion
    loadTeams();
    onStatsUpdate();
    closePreDeleteModal();
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal.team) return;

    setConfirmationModal(prev => ({ ...prev, loading: true }));

    try {
      switch (confirmationModal.type) {
        case 'activate':
          await adminService.activateTeam(confirmationModal.team.id);
          toast.success('Team activated successfully');
          break;
        case 'deactivate':
          await adminService.deactivateTeam(confirmationModal.team.id);
          toast.success('Team deactivated successfully');
          break;
        // Delete case is now handled by PreDeletionReassignmentModal
      }
      
      loadTeams();
      onStatsUpdate();
      closeConfirmationModal();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${confirmationModal.type} team`);
      setConfirmationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRestore = async (team: Team) => {
    try {
      await adminService.restoreTeam(team.id);
      toast.success('Team restored successfully');
      loadTeams();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore team');
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTeam(null);
    setFormData({ name: '' });
    setIsDialogOpen(true);
  };

  const openDetailModal = (team: Team) => {
    setSelectedTeam(team);
    setIsDetailModalOpen(true);
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // const matchesActiveFilter = showInactive ? true : team.isActive;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center space-x-2"
          >
            {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showInactive ? 'Active' : 'Show Inactive'}</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Team</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTeam ? 'Edit Team' : 'Create New Team'}
                </DialogTitle>
                <DialogDescription>
                  {editingTeam 
                    ? 'Update the team information below.' 
                    : 'Fill in the details to create a new team.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTeam ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <Card 
              key={team.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${!team.isActive ? 'opacity-60' : ''} compact-card`}
              onClick={() => openDetailModal(team)}
            >
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2 flex-1 min-w-0">
                    <Building2 className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{team.name}</span>
                      <span className="text-sm text-gray-500 font-normal truncate">
                        {team.subteam?.length || 0} sub-teams • {team.user?.length || 0} users
                      </span>
                    </div>
                  </CardTitle>
                  
                  {/* Action buttons beside the name */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(team);
                      }}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirmationModal('delete', team);
                      }}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {team.description && (
                    <p className="text-sm text-gray-600">{team.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredTeams.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No teams found</p>
        </div>
      )}

      <TeamDetailModal
        team={selectedTeam}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        openConfirmationModal={openConfirmationModal}
      />

      <PreDeletionReassignmentModal
        isOpen={preDeleteModal.isOpen}
        onClose={closePreDeleteModal}
        onConfirm={handlePreDeleteConfirm}
        team={preDeleteModal.team}
        loading={preDeleteModal.loading}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        title={
          confirmationModal.type === 'deactivate'
            ? 'Deactivate Team'
            : 'Activate Team'
        }
        description={
          confirmationModal.type === 'deactivate'
            ? `Are you sure you want to deactivate "${confirmationModal.team?.name}"? This will make the team inactive.`
            : `Are you sure you want to activate "${confirmationModal.team?.name}"? This will make the team active.`
        }
        confirmText={
          confirmationModal.type === 'deactivate'
            ? 'Deactivate'
            : 'Activate'
        }
        type={confirmationModal.type}
        loading={confirmationModal.loading}
      />
    </div>
  );
};

export default TeamManagement;