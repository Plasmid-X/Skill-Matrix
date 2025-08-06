import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import Papa from 'papaparse';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
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
  User,
  Power,
  PowerOff,
  Mail,
  Phone,
  Building,
  MapPin,
  Shield,
  Filter,
  ChevronDown
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { userService, roleService, skillService, assessmentService } from '../../../services/api';
import { toast } from 'sonner';
import { UserDetailModal } from '../modals/UserDetailModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu';

interface UserData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  role?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    name: string;
  };
  Team?: {
    id: number;
    name: string;
  };
  SubTeam?: {
    id: number;
    name: string;
  };
  lead?: {
    id: number;
    name: string;
    userId: string;
  };
  hr?: {
    id: number;
    name: string;
    userId: string;
  };
  leadId?: number;
  hrId?: number;
  roleId: number;
  positionId: number;
  teamId: number;
  subTeamId?: number;
  skills?: Array<{
    id: number;
    name: string;
    level: number;
    lastAssessed?: string;
  }>;
}

interface Team {
  id: number;
  name: string;
}

interface SubTeam {
  id: number;
  name: string;
  teamId: number;
}

interface Position {
  id: number;
  name: string;
  roleId: number;
}

interface Role {
  id: number;
  name: string;
}

interface CreateUserRequest {
  userId: string;
  name: string;
  email?: string;
  role: string;
  position: string;
  team: string;
  subTeam?: string;
  lead?: string;
  hr?: string;
  isActive?: boolean;
}

interface UserManagementProps {
  onStatsUpdate: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onStatsUpdate }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [potentialLeads, setPotentialLeads] = useState<UserData[]>([]);
  const [potentialHRs, setPotentialHRs] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [formRole,setFormRole] = useState(null);
  const [formTeam,setFormTeam] = useState(null);
  const [isDialog,setIsDialog]=useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'deactivate' | 'activate';
    user: UserData | null;
    loading: boolean;
  }>({
    isOpen: false,
    type: 'delete',
    user: null,
    loading: false
  });
  const [formData, setFormData] = useState<CreateUserRequest>({
    userId: '',
    name: '',
    email: '',
    role: '',
    position: '',
    team: '',
    subTeam: '',
    lead: 'unassigned',
    hr: 'unassigned',
    isActive: true,
  });
  const [BulkUser,setBulkUser] = useState<any[]|null>([])

  useEffect(() => {
    loadData();
  }, [showInactive, selectedTeamFilter, selectedPositionFilter, selectedRoleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, teamsResponse, subTeamsResponse, positionsResponse, rolesResponse] = await Promise.all([
        userService.getAllUsers({}), // Get all users
        adminService.getAllTeams(false),
        adminService.getAllSubTeams(undefined, false),
        adminService.getAllPositions(false),
        roleService.getAllRoles()
      ]);

      if (usersResponse) {
        console.log('Users response:', usersResponse);
        const filteredUsers = usersResponse.filter(val=>val.isActive === !showInactive) || [];
        setUsers(filteredUsers);
        
        // Update selectedUser if modal is open and user exists in updated data
        if (selectedUser && isDetailModalOpen) {
          const updatedUser = usersResponse.find((u: UserData) => u.id === selectedUser.id);
          if (updatedUser) {
            setSelectedUser(updatedUser);
          }
        }
        
        // For admin users, all users can potentially be leads (except deleted ones)
        const leads = usersResponse.filter((user: UserData) => 
          !(user.role?.name === 'hr' || user.role?.name === 'admin')
        );
        // Filter potential HRs - only users with HR roles (for admin users to assign)
        const hrs = usersResponse.filter((user: UserData) => 
          user.role?.name === 'hr'
        );
        console.log('Potential leads:', leads);
        console.log('Potential HRs:', hrs);
        setPotentialLeads(leads || []);
        setPotentialHRs(hrs || []);
      }
      if (teamsResponse?.data) {
        setTeams(teamsResponse.data || []);
      }
      if (subTeamsResponse?.data) {
        setSubTeams(subTeamsResponse.data || []);
      }
      if (positionsResponse?.data) {
        setPositions(positionsResponse.data || []);
      }
      if (rolesResponse) {
        setRoles(rolesResponse || []);
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
    setLoading(true);
    try {
      if (editingUser) {
        await userService.updateUser({ id: editingUser.id, ...formData });
        toast.success('User updated successfully');
      } else {
        await userService.createUser([formData]);
        toast.success('User created successfully');
      }
      setLoading(false);
      setIsSingleOpen(false);
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        userId: '',
        name: '',
        email: '',
        role: '',
        position: '',
        team: '',
        subTeam: '',
        lead: 'unassigned',
        hr: 'unassigned',
        isActive: true,
      });
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const openConfirmationModal = (type: 'delete' | 'deactivate' | 'activate', user: UserData) => {
    setConfirmationModal({
      isOpen: true,
      type,
      user,
      loading: false
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: 'delete',
      user: null,
      loading: false
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal.user) return;

    setConfirmationModal(prev => ({ ...prev, loading: true }));

    try {
      switch (confirmationModal.type) {
        case 'activate':
          // For now, we'll use update to change isActive status
          await userService.updateUser({ 
            id: confirmationModal.user.id, 
            isActive: true
          });
          toast.success('User activated successfully');
          break;
        case 'deactivate':
          // For now, we'll use update to change isActive status
          await userService.updateUser({ 
            id: confirmationModal.user.id, 
            isActive: false 
          });
          toast.success('User deactivated successfully');
          break;
        case 'delete':
          await userService.deleteUser(confirmationModal.user.id);
          toast.success('User deleted successfully');
          break;
      }
      
      // Reload data (this will also update selectedUser if modal is open)
      await loadData();
      onStatsUpdate();
      closeConfirmationModal();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${confirmationModal.type} user`);
      setConfirmationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRestore = async (user: UserData) => {
    try {
      // For now, we'll use update to restore user (remove deletedAt)
      await userService.updateUser({ 
        id: user.id, 
        isActive: true 
      });
      toast.success('User restored successfully');
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore user');
    }
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    
    // Set form states first
    setFormRole(user.role?.id);
    setFormTeam(user.Team?.id);
    
    const formDataToSet = {
      userId: user.userId,
      name: user.name,
      email: user.email || '',
      role: user.role?.name || '',
      position: user.position?.name || '',
      team: user.Team?.name || '',
      subTeam: user.SubTeam?.name || '',
      lead: user.lead?.userId || 'unassigned',
      hr: user.hr?.userId || 'unassigned',
      isActive: user.isActive !== false,
    };
    
    setFormData(formDataToSet);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({
      userId: '',
      name: '',
      email: '',
      role: '',
      position: '',
      team: '',
      subTeam: '',
      lead: 'unassigned',
      hr: 'unassigned',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openDetailModal = async (user: UserData) => {
    try {
      // For now, just show user details without skills since we need to implement 
      // a proper API endpoint for getting skills by position for admin users
      setSelectedUser(user);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error opening detail modal:', error);
      setSelectedUser(user);
      setIsDetailModalOpen(true);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.role && user.role.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.position && user.position.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.Team && user.Team.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.SubTeam && user.SubTeam.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesActiveFilter = showInactive ? true : (user.isActive !== false);
    const matchesTeamFilter = selectedTeamFilter === 'all' || user.Team?.id === parseInt(selectedTeamFilter);
    const matchesPositionFilter = selectedPositionFilter === 'all' || user.position?.id === parseInt(selectedPositionFilter);
    const matchesRoleFilter = selectedRoleFilter === 'all' || user.role?.id === parseInt(selectedRoleFilter);
    
    return matchesSearch && matchesActiveFilter && matchesTeamFilter && 
           matchesPositionFilter && matchesRoleFilter;
  });

  function handleFileChange(e){
    const file = e.target.files[0];

     if (!file) return;

    Papa.parse(file, {
      header: true, // if CSV has headers
      skipEmptyLines: true,
      complete: function (results) {
        console.log('Parsed data:', results.data);
        setBulkUser(results.data);
      },
      error: function (err) {
        console.error('Error parsing:', err);
      }
    });


  }

  function downloadCSV(data: any[]) {
  const headers = ["Row", "User ID", "Email", "Reason"];
  const rows = data.map((err, idx) => [
    err.row || idx + 1,
    err.user?.userId || "",
    err.user?.email || "",
    err.reason || "Unknown",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(String).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "upload_errors.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


  async function handleSaveMultipleUser() {
  try {
    setLoading(true);
    const res = await userService.createUser(BulkUser);
    setLoading(false);
    loadData();
    onStatsUpdate();
    setIsBulkOpen(false);

    if (res.errors && res.errors.length > 0) {
      setErrors(res.errors); // Show in modal
      setShowErrorPopup(true);
      toast.warning(`${res.errors.length} users failed. Please review.`);
    } else {
      toast.success("All users added successfully");
    }
  } catch (err: any) {
    setLoading(false);
    if (err?.errors && Array.isArray(err.errors)) {
      setErrors(err.errors);
      setIsDialog(true);
      toast.error(`${err.errors.length} errors occurred.`);
    } else if (err.message) {
      toast.error(err.message);
    } else {
      toast.error("Unknown error occurred");
    }
  }
}

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
          <div className="flex items-center justify-end gap-2">
                <Dialog open={isSingleOpen || isDialogOpen} onOpenChange={isDialogOpen ? setIsDialogOpen : setIsSingleOpen}>
                  <DialogContent className="max-w-2xl h-[500px] overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-2">Add Single User</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>User ID</Label>
                          <Input
                            value={formData.userId}
                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                            placeholder="e.g., LMT20001"
                            required
                          />
                        </div>
                        <div>
                          <Label>Full Name</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) => {
                              setFormData({ ...formData, role: value });
                              setFormRole(roles.find((role)=>role.name === value ).id)
                          }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                              {roles.map(role => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Position</Label>
                          <Select
                            value={formData.position}
                            onValueChange={(value) => setFormData({ ...formData, position: value })}
                            disabled={!positions.some(val => val.roleId === formRole)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                            <SelectContent>
                              {positions
                                .filter(val => val.roleId === formRole)
                                .map(pos => (
                                  <SelectItem key={pos.id} value={pos.name}>
                                    {pos.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Team</Label>
                          <Select
                            value={formData.team}
                            onValueChange={(value) => {
                              setFormData({ ...formData, team: value, subTeam: null });
                              setFormTeam(teams.find((team)=>team.name === value).id);
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                            <SelectContent>
                              {teams.map(team => (
                                <SelectItem key={team.id} value={team.name} onClick={()=>setFormTeam(team.id)}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Sub Team</Label>
                          <Select
                            value={formData.subTeam}
                            onValueChange={(value) => 
                              setFormData({
                                ...formData,
                                subTeam: value
                              })
                            }
                            disabled={!subTeams.some(st => st.teamId === formTeam)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select sub team" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {subTeams
                                .filter(st => st.teamId === formTeam)
                                .map(st => (
                                  <SelectItem key={st.id} value={st.name}>
                                    {st.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Team Lead</Label>
                          <Select
                            value={formData.lead || "unassigned"}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                lead: value === "unassigned" ? "" : value
                              })
                            }
                          >
                            <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {potentialLeads.map(lead => (
                                <SelectItem key={lead.id} value={lead.userId}>
                                  {lead.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>HR Manager</Label>
                          <Select
                            value={formData.hr || "unassigned"}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                hr: value === "unassigned" ? "" : value
                              })
                            }
                          >
                            <SelectTrigger><SelectValue placeholder="Select HR" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {potentialHRs.map(hr => (
                                <SelectItem key={hr.id} value={hr.userId}>
                                  {hr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Status</Label>
                        <Select
                          value={formData.isActive ? "true" : "false"}
                          onValueChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => setIsSingleOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">{editingUser ? loading ? "updating..." : "Update" : loading ? "creating..." : "Create"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Bulk Upload Dialog */}
                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                  <DialogContent>
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Upload Bulk Users</h2>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveMultipleUser(); // 👈 Call on submit
                        }}
                        className="space-y-4"
                      >
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          required
                        />

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsBulkOpen(false)}
                          >
                            Cancel
                          </Button>

                          <Button type="submit">
                            {loading ? "submitting..." : "Submit" }
                          </Button>
                        </div>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              
                {/* Dropdown trigger button */}
                <div className="relative">
            <Select
              onValueChange={(value) => {
                if (value === "single") {
                  setFormData({
                    userId: '',
                    name: '',
                    email: '',
                    role: '',
                    position: '',
                    team: '',
                    subTeam: '',
                    lead: 'unassigned',
                    hr: 'unassigned',
                    isActive: true,
                  });
                  setIsSingleOpen(true);
                }
                if (value === "bulk") setIsBulkOpen(true);
              }}
            >
              <SelectTrigger className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-2 rounded flex items-center justify-between w-[160px]">
                <span className="font-medium pl-10">Add User</span>
              </SelectTrigger>

              <SelectContent className="w-25">
                <div
                  onClick={() => {
                    setIsSingleOpen(true);
                    setFormData({
                      userId: '',
                      name: '',
                      email: '',
                      role: '',
                      position: '',
                      team: '',
                      subTeam: '',
                      lead: 'unassigned',
                      hr: 'unassigned',
                      isActive: true,
                  });
                  }}
                  className="cursor-pointer px-3 py-2 hover:bg-blue-100 rounded text-sm"
                >
                  Add Single User
                </div>
                <div
                  onClick={() => setIsBulkOpen(true)}
                  className="cursor-pointer px-3 py-2 hover:bg-blue-100 rounded text-sm"
                >
                  Upload Bulk Users
                </div>
              </SelectContent>

            </Select>
          </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Teams" />
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



          <Select value={selectedPositionFilter} onValueChange={setSelectedPositionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positions.map((position) => (
                <SelectItem key={position.id} value={position.id.toString()}>
                  {position.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${user.deletedAt ? 'opacity-60' : ''} compact-card`}
              onClick={() => openDetailModal(user)}
            >
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.profilePhoto ? (
                        <img 
                          src={user.profilePhoto} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-medium text-sm">
                          {user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{user.name}</span>
                      <span className="text-sm text-gray-500 font-normal truncate">{user.userId}</span>
                    </div>
                  </CardTitle>
                  
                  {/* Action buttons beside the name */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(user);
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
                            openConfirmationModal('delete', user);
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
                    <div className="flex items-center space-x-2 min-w-0">
                      <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{user.email || "N/A"}</span>
                    </div>
                  
                    <div className="flex items-center space-x-2 min-w-0">
                      <Shield className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{user.role?.name || "N/A"}</span>
                    </div>
                  
                    <div className="flex items-center space-x-2 min-w-0">
                      <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{user.position?.name || "N/A"}</span>
                    </div>
                  
                    <div className="flex items-center space-x-2 min-w-0">
                      <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{user.Team?.name || "N/A"}</span>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No users found</p>
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
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
            ? 'Delete User' 
            : confirmationModal.type === 'deactivate'
            ? 'Deactivate User'
            : 'Activate User'
        }
        description={
          confirmationModal.type === 'delete'
            ? `Are you sure you want to delete "${confirmationModal.user?.name}"? This action cannot be undone.`
            : confirmationModal.type === 'deactivate'
            ? `Are you sure you want to deactivate "${confirmationModal.user?.name}"? This will make the user inactive.`
            : `Are you sure you want to activate "${confirmationModal.user?.name}"? This will make the user active.`
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

      {showErrorPopup && (
        <Dialog open={showErrorPopup} onOpenChange={setShowErrorPopup}>
          <DialogContent>
            <DialogTitle>User Upload Failed</DialogTitle>
            <p className="text-sm text-gray-700 mb-2">
              {errors.length} user{errors.length > 1 ? "s" : ""} failed to upload.
            </p>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setShowTable(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                View Details
              </button>

              <button
                onClick={() => downloadCSV(errors)}
                className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
              >
                Download CSV
              </button>
            </div>

            {showTable && (
              <div className="mt-4 max-h-[400px] max-w-[700px] overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      <th className="px-4 py-2 border">S.No</th>
                      <th className="px-4 py-2 border">User ID</th>
                      <th className="px-4 py-2 border">Email</th>
                      <th className="px-4 py-2 border">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((err, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 border text-center">{ idx + 1}</td>
                        <td className="px-4 py-2 border">{err.userId || "-"}</td>
                        <td className="px-4 py-2 border">{err.email || "-"}</td>
                        <td className="px-4 py-2 border">{err.reason || "Unknown error"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}


      {/* Bulk upload error */}
      {errors.length > 0 && (
        <Dialog open={isDialog} onOpenChange={setIsDialog}>
          <DialogContent>
            <DialogTitle>Upload Errors</DialogTitle>
            <div className="max-h-[400px] max-w-[700px] overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="px-4 py-2 border">#</th>
                    <th className="px-4 py-2 border">User ID</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 border text-center">{ idx + 1}</td>
                      <td className="px-4 py-2 border">{err.userId || "-"}</td>
                      <td className="px-4 py-2 border">{err.email || "-"}</td>
                      <td className="px-4 py-2 border">{err.reason || err.message || "Unknown error"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default UserManagement;