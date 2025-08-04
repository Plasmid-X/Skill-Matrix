import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

import { Position, Skill, Role } from '../../../types/admin';
import { roleService, skillService } from '../../../services/api';
import { toast } from 'sonner';
import {
  Briefcase,
  Calendar,
  User,
  Mail,
  Clock,
  Building,
  Users,
  Target,
  Search,
  Save,
  CheckCircle,
  Circle
} from 'lucide-react';
 
interface PositionDetailModalProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  openConfirmationModal?: (type: 'delete' | 'deactivate' | 'activate', position: Position) => void;
}
 
export const PositionDetailModal: React.FC<PositionDetailModalProps> = ({
  position,
  isOpen,
  onClose,
  onSave,
  openConfirmationModal
}) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showSkillsSection, setShowSkillsSection] = useState(false);
  const [roles,setRoles]=useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles]=useState<Set<number>>(new Set());
  useEffect(() => {
    if (isOpen && position) {
      loadSkills();
    }
  }, [isOpen, position]);
 
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);
 
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !showSkillsSection) return;
     
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault();
            handleSelectAll();
            break;
          case 'd':
            event.preventDefault();
            handleDeselectAll();
            break;
          case 's':
            event.preventDefault();
            handleSaveSkills();
            break;
        }
      }
    };
 
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showSkillsSection, searchTerm, selectedSkills]);
 
  const loadSkills = async () => {
    try {
      setLoading(true);
      const skillsResponse = await skillService.getAllSkills();
      const roleResponse = await roleService.getAllRoles();
      if (skillsResponse) {
        setSkills(skillsResponse);
        // Set currently mapped skills for this position
        const mappedSkills = skillsResponse
          .filter((skill: Skill) => skill.positionId == position?.id)
          .map((skill: Skill) => skill.id);
        setSelectedSkills(new Set(mappedSkills));
      }
      if(roleResponse){
        setRoles(roleResponse)
        const mappedroles=roleResponse.filter((role:Role)=>role.id==position?.roleId)
        .map((role:Role)=>role.id);
        setSelectedRoles(new Set(mappedroles));
      }
    } catch (error) {
      console.error('Error loading skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };
 
  const handleSkillToggle = (skillId: number) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId);
    } else {
      newSelected.add(skillId);
    }
    setSelectedSkills(newSelected);
  };
 
  const handleSaveSkills = async () => {
    try {
      setSaving(true);
     
      // Update all skills that should be assigned to this position
      const selectedSkillsArray = Array.from(selectedSkills);
      const skillUpdates = selectedSkillsArray.map(skillId => {
        const existingSkill = skills.find(s => s.id === skillId);
        if (!existingSkill) return Promise.resolve();
       
        return skillService.updateSkill({
          id: skillId,
          name: existingSkill.name,
          basic: existingSkill.basic,
          low: existingSkill.low,
          medium: existingSkill.medium,
          high: existingSkill.high,
          expert: existingSkill.expert,
          position: [position.id]  // Pass as array of position IDs
        });
      });
     
      // Also update any previously assigned skills that are no longer selected
      const unselectedSkills = skills
        .filter(skill => skill.positionId === position.id && !selectedSkills.has(skill.id))
        .map(skill => {
          return skillService.updateSkill({
            id: skill.id,
            name: skill.name,
            basic: skill.basic,
            low: skill.low,
            medium: skill.medium,
            high: skill.high,
            expert: skill.expert,
            position: []  // Empty array means not assigned to any position
          });
        });
 
      // Wait for all updates to complete
      await Promise.all([...skillUpdates, ...unselectedSkills]);
     
      toast.success('Position skill requirements updated successfully');
      onSave?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update skill requirements');
      console.error('Error updating skills:', error);
    } finally {
      setSaving(false);
      setShowSkillsSection(false);
    }
  };
 
  const handleSelectAll = () => {
    const filteredSkills = skills.filter(skill =>
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const allFilteredIds = new Set(filteredSkills.map(skill => skill.id));
    setSelectedSkills(prev => new Set([...prev, ...allFilteredIds]));
  };
 
  const handleDeselectAll = () => {
    const filteredSkills = skills.filter(skill =>
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredIds = new Set(filteredSkills.map(skill => skill.id));
    setSelectedSkills(prev => new Set([...prev].filter(id => !filteredIds.has(id))));
  };
 
  if (!position) return null;
 
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
 
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl modal-content flex flex-col position-detail-modal">
       <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>{position.name}</span>
              {position.deletedAt && (
                <Badge variant="destructive">Deleted</Badge>
              )}
            </div>
            {!position.deletedAt}
          </DialogTitle>
          <DialogDescription>
            Detailed information about the position and its holders
          </DialogDescription>
        </DialogHeader>
 
          <div className="space-y-6 scrollable-content flex-1 min-h-0 pr-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <Button
                  variant={position.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openConfirmationModal(position.isActive ? 'deactivate' : 'activate', position);
                  }}
                  className={position.isActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                >
                  {position.isActive ? 'Deactivate' : 'Activate'} Position
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Position Name</label>
                <p className="text-sm">{position.name}</p>
              </div>
             
              {position.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm">{position.description}</p>
                </div>
              )}
 
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={position.isActive ? 'default' : 'secondary'} className="mr-2">
                      {position.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
               
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-sm">{roles.find(role => role.id === position.roleId)?.name || "N/A"}</p>
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(position.createdAt)}</span>
                  </div>
                </div>
               
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(position.updatedAt)}</span>
                  </div>
                </div>
              </div>
 
              {position.deletedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Deleted At</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-600">{formatDate(position.deletedAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
 
          {/* Position Holders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Position Holders ({position.user?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {position.user && position.user.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {position.user.map((user) => (
                    <div key={user.id} className="border rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.profilePhoto ? (
                            <img
                              src={user.profilePhoto}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-medium">
                              {user.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{user.name}</h4>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.Team && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Building className="h-3 w-3" />
                              <span>{user.Team.name}</span>
                            </div>
                          )}
                          {user.SubTeam && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Users className="h-3 w-3" />
                              <span>{user.SubTeam.name}</span>
                            </div>
                          )}
                          {user.role && (
                            <Badge variant="outline" className="mt-1">
                              {user.role.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No position holders found</p>
              )}
            </CardContent>
          </Card>
 
          {/* Skills Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Skills Requirements ({selectedSkills.size} selected)</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSkillsSection(!showSkillsSection)}
                  className="flex items-center space-x-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                  <span>
                    {loading ? 'Loading...' : showSkillsSection ? 'Hide Skills' : 'Manage Skills'}
                  </span>
                </Button>
              </div>
            </CardHeader>
             <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showSkillsSection ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <CardContent className="space-y-4 flex flex-col h-96">
                {/* Search and Actions */}
                <div className="flex-shrink-0 space-y-3">
                   <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                 
                  {/* Quick Actions */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {(() => {
                        const filteredSkills = skills.filter(skill =>
                          skill.name.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                        const selectedInFiltered = filteredSkills.filter(skill =>
                          selectedSkills.has(skill.id)
                        ).length;
                        return `${selectedInFiltered} of ${filteredSkills.length} visible skills selected`;
                      })()}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-6 px-2 text-xs"
                        title="Select All (Ctrl+A)"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAll}
                        className="h-6 px-2 text-xs"
                        title="Deselect All (Ctrl+D)"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                </div>
 
                {/* Skills List */}
                 <div className="border rounded-lg flex-1 min-h-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4 h-full skills-list-container">
                      {(() => {
                        const filteredSkills = skills.filter(skill =>
                          skill.name.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                       
                        // Sort skills: checked items first, then unchecked
                        const sortedSkills = filteredSkills.sort((a, b) => {
                          const aSelected = selectedSkills.has(a.id);
                          const bSelected = selectedSkills.has(b.id);
                          if (aSelected && !bSelected) return -1;
                          if (!aSelected && bSelected) return 1;
                          return a.name.localeCompare(b.name);
                        });
 
                        return sortedSkills.length === 0 ? (
                          <div className="text-center text-gray-500 py-8">
                            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-sm">No skills found matching your search.</p>
                            {searchTerm && (
                              <p className="text-xs text-gray-400 mt-2">
                                Try adjusting your search terms
                              </p>
                            )}
                          </div>
                        ) : (
                          sortedSkills.map((skill) => (
                            <div
                              key={skill.id}
                              onClick={() => handleSkillToggle(skill.id)}
                              className={`skill-card-selectable relative flex items-start space-x-3 p-4 border rounded-lg cursor-pointer ${
                                selectedSkills.has(skill.id)
                                  ? 'selected'
                                  : 'hover:bg-gray-50 hover:border-gray-300'
                              }`}
                            >
                              {/* Circle tick button positioned at top-right */}
                              <div className="absolute top-3 right-3">
                                {selectedSkills.has(skill.id) ? (
                                  <CheckCircle className="skill-card-tick h-5 w-5 text-green-600" />
                                ) : (
                                  <Circle className="skill-card-tick h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0 pr-8">
                                <div className="block font-medium text-sm mb-2">
                                  {skill.name}
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  {skill.basic && (
                                    <div><span className="font-medium">Basic:</span> {skill.basic}</div>
                                  )}
                                  {skill.low && (
                                    <div><span className="font-medium">Low:</span> {skill.low}</div>
                                  )}
                                  {skill.medium && (
                                    <div><span className="font-medium">Medium:</span> {skill.medium}</div>
                                  )}
                                  {skill.high && (
                                    <div><span className="font-medium">High:</span> {skill.high}</div>
                                  )}
                                  {skill.expert && (
                                    <div><span className="font-medium">Expert:</span> {skill.expert}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        );
                      })()}
                    </div>
                  )}
                </div>
 
                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t flex-shrink-0">
                  <Button
                    onClick={handleSaveSkills}
                    disabled={saving}
                    className="flex items-center space-x-2"
                    title="Save Requirements (Ctrl+S)"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Requirements</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};