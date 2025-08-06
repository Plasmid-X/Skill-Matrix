import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Search,
  Eye,
  EyeOff,
  Users,
  Power,
  PowerOff
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { Team, SubTeam, CreateSubTeamRequest } from '../../../types/admin';
import { toast } from 'sonner';
import { SubTeamDetailModal } from '../modals/SubTeamDetailModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { SubTeamReassignmentModal } from '../modals/SubTeamReassignmentModal';

interface SubTeamManagementProps {
  onStatsUpdate: () => void;
}

export const SubTeamManagement: React.FC<SubTeamManagementProps> = ({ onStatsUpdate }) => {
  const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [editingSubTeam, setEditingSubTeam] = useState<SubTeam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubTeam, setSelectedSubTeam] = useState<SubTeam | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'deactivate' | 'activate';
    subTeam: SubTeam | null;
    loading: boolean;
  }>({
    isOpen: false,
    type: 'delete',
    subTeam: null,
    loading: false
  });
  const [reassignmentModal, setReassignmentModal] = useState<{
    isOpen: boolean;
    subTeam: SubTeam | null;
    loading: boolean;
  }>({
    isOpen: false,
    subTeam: null,
    loading: false
  });
  const [formData, setFormData] = useState<CreateSubTeamRequest>({
    name: '',
    teamId: null,
  });

  useEffect(() => {
    loadData();
  }, [showInactive, selectedTeamFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subTeamsResponse, teamsResponse] = await Promise.all([
        adminService.getAllSubTeams(
          selectedTeamFilter === 'all' ? undefined : parseInt(selectedTeamFilter),
          false // Always load non-deleted, we'll filter by active/inactive
        ),
        adminService.getAllTeams(false)
      ]);

      if (subTeamsResponse.success) {
        const filteredSubTeams = subTeamsResponse.data.filter(val=>val.isActive === !showInactive) || [];
        setSubTeams(filteredSubTeams);
        
        // Update selectedSubTeam if modal is open and subteam exists in updated data
        if (selectedSubTeam && isDetailModalOpen) {
          const updatedSubTeam = subTeamsResponse.data.find((st: SubTeam) => st.id === selectedSubTeam.id);
          if (updatedSubTeam) {
            setSelectedSubTeam(updatedSubTeam);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubTeam) {
        const response = await adminService.updateSubTeam(editingSubTeam.id, formData);
        if (response.success) {
          toast.success('Sub-team updated successfully');
        }
      } else {
        const response = await adminService.createSubTeam(formData);
        if (response.success) {
          toast.success('Sub-team created successfully');
        }
      }
      setIsDialogOpen(false);
      setEditingSubTeam(null);
      setFormData({ name: '', teamId: 0 });
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const openConfirmationModal = (type: 'delete' | 'deactivate' | 'activate', subTeam: SubTeam) => {
    if (type === 'delete') {
      // Open reassignment modal for deletion
      setReassignmentModal({
        isOpen: true,
        subTeam,
        loading: false
      });
    } else {
      setConfirmationModal({
        isOpen: true,
        type,
        subTeam,
        loading: false
      });
    }
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: 'delete',
      subTeam: null,
      loading: false
    });
  };

  const closeReassignmentModal = () => {
    setReassignmentModal({
      isOpen: false,
      subTeam: null,
      loading: false
    });
  };

  const handleDirectDelete = async () => {
    if (!reassignmentModal.subTeam) return;

    setReassignmentModal(prev => ({ ...prev, loading: true }));

    try {
      await adminService.deleteSubTeam(reassignmentModal.subTeam.id);
      toast.success('Sub-team deleted successfully');
      loadData();
      onStatsUpdate();
      closeReassignmentModal();
    } catch (error: any) {
      console.error('Error deleting sub-team:', error);
      // Even if the API returns an error, the deletion might have succeeded
      // Let's refresh the data to check
      try {
        await loadData();
        onStatsUpdate();
        // If the sub-team is no longer in the list, it was deleted successfully
        const stillExists = subTeams.find(st => st.id === reassignmentModal.subTeam?.id);
        if (!stillExists) {
          toast.success('Sub-team deleted successfully');
          closeReassignmentModal();
        } else {
          toast.error(error.message || 'Failed to delete sub-team');
          setReassignmentModal(prev => ({ ...prev, loading: false }));
        }
      } catch (refreshError) {
        toast.error(error.message || 'Failed to delete sub-team');
        setReassignmentModal(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal.subTeam) return;

    setConfirmationModal(prev => ({ ...prev, loading: true }));

    try {
      switch (confirmationModal.type) {
        case 'activate':
          await adminService.activateSubTeam(confirmationModal.subTeam.id);
          toast.success('Sub-team activated successfully');
          break;
        case 'deactivate':
          await adminService.deactivateSubTeam(confirmationModal.subTeam.id);
          toast.success('Sub-team deactivated successfully');
          break;
      }
      
      loadData();
      onStatsUpdate();
      closeConfirmationModal();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${confirmationModal.type} sub-team`);
      setConfirmationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRestore = async (subTeam: SubTeam) => {
    try {
      await adminService.restoreSubTeam(subTeam.id);
      toast.success('Sub-team restored successfully');
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore sub-team');
    }
  };

  const openEditDialog = (subTeam: SubTeam) => {
    setEditingSubTeam(subTeam);
    setFormData({
      name: subTeam.name,
      teamId: subTeam.teamId,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSubTeam(null);
    setFormData({ name: '', teamId: 0 });
    setIsDialogOpen(true);
  };

  const openDetailModal = (subTeam: SubTeam) => {
    setSelectedSubTeam(subTeam);
    setIsDetailModalOpen(true);
  };

  const filteredSubTeams = subTeams.filter(subTeam => {
    const matchesSearch = subTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subTeam.description && subTeam.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subTeam.teams && subTeam.teams.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesActiveFilter = showInactive ? true : subTeam.isActive;
    
    return matchesSearch && matchesActiveFilter && !subTeam.deletedAt;
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
                <span>Add Sub-Team</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubTeam ? 'Edit Sub-Team' : 'Create New Sub-Team'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubTeam 
                    ? 'Update the sub-team information below.' 
                    : 'Fill in the details to create a new sub-team.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="teamId">Parent Team</Label>
                  <Select
                    value = {formData.teamId ? (formData.teamId.toString()): ''}
                    onValueChange={(value) => setFormData({ ...formData, teamId: value === '0' ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key={0} value={"0"}>
                          unassigned
                        </SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Sub-Team Name</Label>
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
                    {editingSubTeam ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sub-teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id.toString()}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubTeams.map((subTeam) => (
            <Card 
              key={subTeam.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${subTeam.deletedAt ? 'opacity-60' : ''} compact-card`}
              onClick={() => openDetailModal(subTeam)}
            >
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2 flex-1 min-w-0">
                    <Users className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{subTeam.name}</span>
                      <span className="text-sm text-gray-500 font-normal truncate">
                        {subTeam.teams?.name} • {subTeam.user?.length || 0} users
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
                            openEditDialog(subTeam);
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
                            openConfirmationModal('delete', subTeam);
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
                  {subTeam.description && (
                    <p className="text-sm text-gray-600">{subTeam.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredSubTeams.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No sub-teams found</p>
        </div>
      )}

      <SubTeamDetailModal
        subTeam={selectedSubTeam}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        openConfirmationModal={openConfirmationModal}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        title={
          confirmationModal.type === 'delete' 
            ? 'Delete Sub-Team' 
            : confirmationModal.type === 'deactivate'
            ? 'Deactivate Sub-Team'
            : 'Activate Sub-Team'
        }
        description={
          confirmationModal.type === 'delete'
            ? `Are you sure you want to delete "${confirmationModal.subTeam?.name}"? This action cannot be undone.`
            : confirmationModal.type === 'deactivate'
            ? `Are you sure you want to deactivate "${confirmationModal.subTeam?.name}"? This will make the sub-team inactive.`
            : `Are you sure you want to activate "${confirmationModal.subTeam?.name}"? This will make the sub-team active.`
        }
        confirmText={
          confirmationModal.type === 'delete' 
            ? 'Delete' 
            : confirmationModal.type === 'deactivate'
            ? 'Deactivate'
            : 'Activate'
        }
        type={confirmationModal.type}
        loading={confirmationModal.loading}
      />

      <SubTeamReassignmentModal
        isOpen={reassignmentModal.isOpen}
        onClose={closeReassignmentModal}
        onConfirm={() => {
          // This will be called after successful operations to refresh data
          loadData();
          onStatsUpdate();
          closeReassignmentModal();
        }}
        subTeam={reassignmentModal.subTeam}
        loading={reassignmentModal.loading}
      />
    </div>
  );
};

export default SubTeamManagement;