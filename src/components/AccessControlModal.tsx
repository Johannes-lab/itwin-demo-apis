import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Mail, 
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { iTwin, iTwinUserMember, AccessControlRole } from '../services/iTwinAPIService';
import { iTwinApiService } from '../services/iTwinAPIService';

interface AccessControlModalProps {
  iTwin: iTwin;
  isOpen: boolean;
  onClose: () => void;
}

function AccessControlModal({ iTwin, isOpen, onClose }: AccessControlModalProps) {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState<iTwinUserMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [roles, setRoles] = useState<AccessControlRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch members and roles when modal opens
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      setMembersError(null);
      try {
        const fetchedMembers = await iTwinApiService.getiTwinUserMembers(iTwin.id);
        
        if (fetchedMembers) {
          setMembers(fetchedMembers);
        } else {
          setMembersError('Unable to fetch members. You may not have permission to view members of this iTwin.');
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        setMembersError('Failed to fetch members. Please check your permissions and try again.');
      } finally {
        setIsLoadingMembers(false);
      }
    };

    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      setRolesError(null);
      try {
        const fetchedRoles = await iTwinApiService.getiTwinRoles(iTwin.id);
        if (fetchedRoles) {
          setRoles(fetchedRoles);
          if (fetchedRoles.length > 0) {
            setSelectedRole((prev) => prev || fetchedRoles[0].id);
          } else {
            setSelectedRole("");
          }
        } else {
          setRoles([]);
          setSelectedRole("");
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRolesError('Failed to fetch roles. Please check your permissions and try again.');
      } finally {
        setIsLoadingRoles(false);
      }
    };

    if (isOpen && iTwin.id) {
      fetchMembers();
      fetchRoles();
    }
  }, [isOpen, iTwin.id]);

  const refetchMembers = async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      const fetchedMembers = await iTwinApiService.getiTwinUserMembers(iTwin.id);
      
      if (fetchedMembers) {
        setMembers(fetchedMembers);
      } else {
        setMembersError('Unable to fetch members. You may not have permission to view members of this iTwin.');
      }
    } catch (error) {
      console.error('Error refetching members:', error);
      setMembersError('Failed to fetch members. Please check your permissions and try again.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleInviteMember = () => {
    setNewMemberEmail('');
  };

  const getFullName = (member: iTwinUserMember): string => {
    if (member.givenName && member.surname) {
      return `${member.givenName} ${member.surname}`;
    }
    if (member.givenName) return member.givenName;
    if (member.surname) return member.surname;
    return member.email || 'Unknown User';
  };

  const isMissingUser = (member: iTwinUserMember): boolean => {
    return !member.email && !member.givenName && !member.surname;
  };

  const getRoleBadge = (role: { id: string; displayName: string; description: string }) => {
    // Map API roles to colors (could be enhanced with a proper role color mapping)
    const getColorForRole = (roleName: string) => {
      if (roleName.toLowerCase().includes('admin')) return 'bg-red-500';
      if (roleName.toLowerCase().includes('write') || roleName.toLowerCase().includes('contributor')) return 'bg-blue-500';
      return 'bg-green-500';
    };

    return (
      <Badge 
        key={role.id}
        className={`text-xs text-white ${getColorForRole(role.displayName)}`}
      >
        {role.displayName}
      </Badge>
    );
  };

  // Render up to a maximum number of role badges and collapse the rest
  const renderRoleBadges = (roles: iTwinUserMember['roles']) => {
    if (!roles || roles.length === 0) {
      return (
        <Badge variant="outline" className="text-xs">
          No Roles
        </Badge>
      );
    }
    const MAX_BADGES = 4;
  const shown = roles.slice(0, MAX_BADGES);
  const extra = roles.length - shown.length;
  const hidden = extra > 0 ? roles.slice(MAX_BADGES) : [];

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {shown.map((r) => getRoleBadge(r))}
        {extra > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-help">+{extra} more</Badge>
            </TooltipTrigger>
            <TooltipContent sideOffset={6} className="max-w-[320px] whitespace-normal break-words bg-popover text-popover-foreground">
              <div className="flex flex-wrap gap-1">
                {hidden.map((r) => (
                  <Badge key={r.id} variant="secondary" className="text-[10px]">
                    {r.displayName}
                  </Badge>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Access Control - {iTwin.displayName}</span>
          </DialogTitle>
          <DialogDescription>
            Manage roles, permissions, and member access for this iTwin
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Members</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Roles</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Permissions</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[500px] overflow-y-auto">
            <TabsContent value="members" className="space-y-4">
              {/* Add Member Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <UserPlus className="h-5 w-5" />
                    <span>Invite New Member</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@company.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Default Role</Label>
                      <Select
                        value={selectedRole}
                        onValueChange={setSelectedRole}
                        disabled={roles.length === 0}
                      >
                        <SelectTrigger id="role" className="w-full">
                          <SelectValue placeholder={roles.length === 0 ? 'No roles available' : 'Select a role'} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleInviteMember} disabled={!newMemberEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </CardContent>
              </Card>

              {/* Members List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Current Members {isLoadingMembers ? '(Loading...)' : `(${members.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMembers && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading members...</span>
                    </div>
                  )}
                  
                  {membersError && (
                    <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800 dark:text-red-200">{membersError}</span>
                      <Button variant="ghost" size="sm" onClick={refetchMembers}>
                        Retry
                      </Button>
                    </div>
                  )}

                  {!isLoadingMembers && !membersError && members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No members found for this iTwin.
                    </div>
                  )}

                  {!isLoadingMembers && !membersError && members.length > 0 && (
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                          <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {isMissingUser(member) ? (
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                              ) : (
                                <Users className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2 min-w-0">
                                <p className="font-medium">
                                  {isMissingUser(member) ? 'Missing User' : getFullName(member)}
                                </p>
                                {isMissingUser(member) && (
                                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                    Missing
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate max-w-[35ch]">
                                {member.email || 'No email available'}
                              </p>
                              {member.organization && (
                                <p className="text-xs text-muted-foreground truncate max-w-[40ch]">
                                  {member.organization}
                                </p>
                              )}
                              {renderRoleBadges(member.roles)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                            <Button variant="ghost" size="sm" title="Edit member">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Remove member">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Role Definitions</span>
                    </span>
                    <Button size="sm" disabled>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRoles && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading roles...</span>
                    </div>
                  )}

                  {rolesError && (
                    <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800 dark:text-red-200">{rolesError}</span>
                    </div>
                  )}

                  {!isLoadingRoles && !rolesError && roles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No roles found for this iTwin.
                    </div>
                  )}

                  {!isLoadingRoles && !rolesError && roles.length > 0 && (
                    <div className="space-y-3">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-4 h-4 rounded-full bg-muted-foreground/40 mt-1"></div>
                            <div>
                              <p className="font-medium">{role.displayName}</p>
                              {role.description && (
                                <p className="text-sm text-muted-foreground">{role.description}</p>
                              )}
                              {role.permissions && role.permissions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {role.permissions.slice(0, 8).map((perm, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[10px]">
                                      {perm}
                                    </Badge>
                                  ))}
                                  {role.permissions.length > 8 && (
                                    <Badge variant="outline" className="text-[10px]">
                                      +{role.permissions.length - 8} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" title="View role" disabled>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Edit role" disabled>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Delete role" disabled>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Permission Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <h4 className="font-medium mb-2">iTwin Platform Services</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Permissions control access to various iTwin Platform services and capabilities.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">iModels API</p>
                          <p className="text-muted-foreground">Create, read, update iModels</p>
                        </div>
                        <div>
                          <p className="font-medium">Reality Modeling</p>
                          <p className="text-muted-foreground">Process reality data</p>
                        </div>
                        <div>
                          <p className="font-medium">Synchronization</p>
                          <p className="text-muted-foreground">Configure data syncs</p>
                        </div>
                        <div>
                          <p className="font-medium">Visualization</p>
                          <p className="text-muted-foreground">View and interact with models</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Permission Inheritance</h4>
                      <p className="text-sm text-muted-foreground">
                        Permissions are granted through role assignments. Members can have multiple roles, 
                        and permissions are cumulative across all assigned roles.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default AccessControlModal;
