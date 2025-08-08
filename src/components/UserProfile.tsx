import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import type { MeProfile } from '../services/AuthService';
import { CheckCircle, User, X } from 'lucide-react';

function UserProfile() {
  const { isAuthenticated, getMe, signOut } = useAuth();
  const [meProfile, setMeProfile] = useState<MeProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleFetchProfile = async () => {
    if (meProfile) {
      setShowProfile(!showProfile);
      return;
    }
    
    setIsProfileLoading(true);
    const profile = await getMe();
    setMeProfile(profile);
    setIsProfileLoading(false);
    setShowProfile(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setMeProfile(null);
    setShowProfile(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFetchProfile}
        disabled={isProfileLoading}
        className="flex items-center space-x-2"
      >
        <CheckCircle className="h-4 w-4 text-green-500" />
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">
          {isProfileLoading ? 'Loading...' : 'Profile'}
        </span>
      </Button>

      {showProfile && meProfile && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">User Profile</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfile(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-base">
                  {meProfile.givenName} {meProfile.surname}
                </h3>
                <p className="text-sm text-muted-foreground">{meProfile.email}</p>
              </div>
              
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Organization:</span>
                    <p className="text-muted-foreground">{meProfile.organizationName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Country:</span>
                    <p className="text-muted-foreground">{meProfile.country}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
