import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import {
  Plus, Edit, Trash2, Search, Eye, EyeOff, Briefcase, ChevronDown,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { roleService, skillService } from '../../../services/api';
import { Position, CreatePositionRequest } from '../../../types/admin';
import { toast } from 'sonner';
import { PositionDetailModal } from '../modals/PositionDetailModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { PositionReassignmentModal } from '../modals/PositionReassignmentModal';

interface PositionManagementProps {
  onStatsUpdate: () => void;
}

interface Role {
  id: number;
  name: string;
}

interface PositionWithSkillCount extends Position {
  skillCount?: number;
}

export const PositionManagement: React.FC<PositionManagementProps> = ({ onStatsUpdate }) => {
  const [positions, setPositions] = useState<PositionWithSkillCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionWithSkillCount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesOpen, setRolesOpen] = useState<Record<number, boolean>>({});
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'delete' as 'delete' | 'deactivate' | 'activate',
    position: null as Position | null,
    loading: false,
  });
  const [reassignmentModal, setReassignmentModal] = useState({
    isOpen: false,
    position: null as Position | null,
    loading: false,
  });

  const [formData, setFormData] = useState<CreatePositionRequest>({
    name: '',
    roleId: 0,
  });

  useEffect(() => {
    loadPositions();
    loadRoles();
  }, [showInactive]);

  const loadRoles = async () => {
    try {
      const response = await roleService.getAllRoles();
      if (response) {
        setRoles(response);
        const openStates = Object.fromEntries(response.map((role: Role) => [role.id, false]));
        setRolesOpen(openStates);
      }
    } catch (error) {
      toast.error('Failed to load roles');
    }
  };

  const loadPositions = async () => {
    try {
      setLoading(true);
      const [positionsResponse, skillsResponse] = await Promise.all([
        adminService.getAllPositions(false),
        skillService.getAllSkills(),
      ]);

      if (positionsResponse.success) {
        let positionsData = positionsResponse.data || [];
        const skillsData = skillsResponse || [];

        positionsData = positionsData.filter(val => val.isActive === !showInactive);

        const positionsWithSkillCount = positionsData.map((position: Position) => {
          const skillCount = skillsData.filter((skill: any) =>
            skill.positionId === position.id
          ).length;

          return { ...position, skillCount };
        });

        setPositions(positionsWithSkillCount);

        if (selectedPosition && isDetailModalOpen) {
          const updatedPosition = positionsResponse.data.find((p: Position) => p.id === selectedPosition.id);
          if (updatedPosition) {
            const skillCount = skillsData.filter((skill: any) =>
              skill.positionId === updatedPosition.id
            ).length;
            setSelectedPosition({ ...updatedPosition, skillCount });
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPosition) {
        const response = await adminService.updatePosition(editingPosition.id, formData);
        if (response.success) {
          toast.success('Position updated successfully');
        }
      } else {
        const response = await adminService.createPosition(formData);
        if (response.success) {
          toast.success('Position created successfully');
        }
      }
      setIsDialogOpen(false);
      setEditingPosition(null);
      setFormData({ name: '', roleId: 0 });
      loadPositions();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const openEditDialog = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      roleId: position.roleId,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPosition(null);
    setFormData({ name: '', roleId: 0 });
    setIsDialogOpen(true);
  };

  const openDetailModal = (position: PositionWithSkillCount) => {
    setSelectedPosition(position);
    setIsDetailModalOpen(true);
  };

  const openConfirmationModal = (type: 'delete' | 'deactivate' | 'activate', position: Position) => {
    if (type === 'delete') {
      setReassignmentModal({ isOpen: true, position, loading: false });
    } else {
      setConfirmationModal({ isOpen: true, type, position, loading: false });
    }
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({ isOpen: false, type: 'delete', position: null, loading: false });
  };

  const closeReassignmentModal = () => {
    setReassignmentModal({ isOpen: false, position: null, loading: false });
  };

  const handleDirectDelete = async () => {
    if (!reassignmentModal.position) return;
    setReassignmentModal(prev => ({ ...prev, loading: true }));

    try {
      await adminService.deletePosition(reassignmentModal.position.id);
      toast.success('Position deleted successfully');
      loadPositions();
      onStatsUpdate();
      closeReassignmentModal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete position');
      setReassignmentModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal.position) return;
    setConfirmationModal(prev => ({ ...prev, loading: true }));

    try {
      switch (confirmationModal.type) {
        case 'activate':
          await adminService.activatePosition(confirmationModal.position.id);
          toast.success('Position activated successfully');
          break;
        case 'deactivate':
          await adminService.deactivatePosition(confirmationModal.position.id);
          toast.success('Position deactivated successfully');
          break;
      }
      await loadPositions();
      onStatsUpdate();
      closeConfirmationModal();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
      setConfirmationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredPositions = positions.filter(position =>
    position.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (showInactive || position.isActive) &&
    !position.deletedAt
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowInactive(prev => !prev)}>
            {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showInactive ? 'Active' : 'Show Inactive'}</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPosition ? 'Edit Position' : 'Create New Position'}</DialogTitle>
                <DialogDescription>
                  {editingPosition
                    ? 'Update the position information below.'
                    : 'Fill in the details to create a new position.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingPosition && (
                  <div>
                    <Label htmlFor="role">Select Role</Label>
                    <select
                      id="role"
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    >
                      <option value="">-- Select Role --</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label htmlFor="name">Position Name</Label>
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
                  <Button type="submit">{editingPosition ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search positions..."
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
        roles.map(role => {
          const rolePositions = filteredPositions.filter(p => p.roleId === role.id);
          if (rolePositions.length === 0) return null;

          return (
            <Card key={role.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer bg-gray-100 px-4 py-2"
                onClick={() => setRolesOpen(prev => ({
                  ...prev,
                  [role.id]: !prev[role.id]
                }))}
              >
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{role.name}</span>
                  <ChevronDown
                    className={`h-5 w-5 transform transition-transform ${rolesOpen[role.id] ? 'rotate-180' : ''}`}
                  />
                </CardTitle>
              </CardHeader>

              {rolesOpen[role.id] && (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {rolePositions.map((position) => (
                    <Card
                      key={position.id}
                      className="cursor-pointer hover:shadow-md"
                      onClick={() => openDetailModal(position)}
                    >
                      <CardHeader className="pb-3 px-4 pt-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center space-x-2 flex-1 min-w-0">
                            <Briefcase className="h-5 w-5" />
                            <div className="min-w-0">
                              <span className="block truncate font-medium">{position.name}</span>
                              <span className="text-sm text-gray-500 font-normal truncate">
                                {position.user?.length || 0} users • {position.skillCount || 0} skills
                              </span>
                            </div>
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(position);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              openConfirmationModal('delete', position);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {filteredPositions.length === 0 && !loading && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No positions found</p>
        </div>
      )}

      <PositionDetailModal
        position={selectedPosition}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSave={loadPositions}
        openConfirmationModal={openConfirmationModal}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        title={
          confirmationModal.type === 'delete'
            ? 'Delete Position'
            : confirmationModal.type === 'deactivate'
            ? 'Deactivate Position'
            : 'Activate Position'
        }
        description={`Are you sure you want to ${
          confirmationModal.type
        } "${confirmationModal.position?.name}"?`}
        confirmText={confirmationModal.type.charAt(0).toUpperCase() + confirmationModal.type.slice(1)}
        type={confirmationModal.type}
        loading={confirmationModal.loading}
      />

      <PositionReassignmentModal
        isOpen={reassignmentModal.isOpen}
        onClose={closeReassignmentModal}
        onConfirm={() => {
          loadPositions();
          onStatsUpdate();
          closeReassignmentModal();
        }}
        position={reassignmentModal.position}
        loading={reassignmentModal.loading}
      />
    </div>
  );
};

export default PositionManagement;
