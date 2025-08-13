import { useState, useEffect } from 'react';
import { iTwinApiService } from '../services/iTwinAPIService';
import type { iTwin } from '../services/iTwinAPIService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Globe, Hash, Tag } from 'lucide-react';
import AccessControlModal from './AccessControlModal';

function MyiTwinsComponent() {
  const [iTwins, setiTwins] = useState<iTwin[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectediTwinForAccess, setSelectediTwinForAccess] = useState<iTwin | null>(null);

  const handleManageAccess = (iTwin: iTwin) => {
    setSelectediTwinForAccess(iTwin);
  };

  const closeAccessModal = () => {
    setSelectediTwinForAccess(null);
  };

  useEffect(() => {
    const fetchiTwins = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await iTwinApiService.getMyiTwins();
        setiTwins(result);
      } catch (err) {
        setError('Failed to fetch iTwins. Please try again.');
        console.error('Error fetching iTwins:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchiTwins();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-2">Loading Your iTwins...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your iTwin projects</p>
          <div className="text-4xl animate-spin mt-4">
            ⚙️
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">❌ Error Loading iTwins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!iTwins || iTwins.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>📂 No iTwins Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have any iTwin projects yet. Create your first iTwin to get started!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My iTwins</h1>
        <p className="text-muted-foreground">
          You have {iTwins.length} iTwin project{iTwins.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {iTwins.map((iTwin) => (
          <Card
            key={iTwin.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
            role="button"
            tabIndex={0}
            onClick={() => handleManageAccess(iTwin)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleManageAccess(iTwin);
              }
            }}
          >
            {/* Header */}
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl truncate">{iTwin.displayName}</CardTitle>
                </div>
                <div className="flex-shrink-0">
                  <Badge
                    variant={iTwin.status === 'Active' ? 'default' : 'secondary'}
                    className="text-xs whitespace-nowrap"
                  >
                    {iTwin.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {iTwin.id}
                  </span>
                </div>

                {iTwin.number && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Project:</span>
                    <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                      {iTwin.number}
                    </span>
                  </div>
                )}

                {iTwin.type && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {iTwin.type}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Access Control Modal */}
      {selectediTwinForAccess && (
        <AccessControlModal
          iTwin={selectediTwinForAccess}
          isOpen={!!selectediTwinForAccess}
          onClose={closeAccessModal}
        />
      )}
    </div>
  );
}

export default MyiTwinsComponent;
