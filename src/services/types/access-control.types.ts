export interface AccessControlRole {
  id: string;
  displayName: string;
  description: string;
  permissions?: string[];
}

export interface iTwinUserMember {
  id: string;
  email: string | null;
  givenName: string | null;
  surname: string | null;
  organization: string | null;
  roles: AccessControlRole[];
}

export interface iTwinUserMembersResponse {
  members: iTwinUserMember[];
  _links: {
    self: { href: string };
    prev?: { href: string };
    next?: { href: string };
  };
}

export interface iTwinRolesResponse {
  roles: AccessControlRole[];
}
