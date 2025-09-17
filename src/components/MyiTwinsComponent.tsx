
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { iTwinApiService } from '../services/iTwinAPIService';
import type { iTwin } from '../services/iTwinAPIService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Globe, Hash, Tag } from 'lucide-react';
import AccessControlModal from './AccessControlModal';

function MyiTwinsComponent() {
  const [iTwins, setiTwins] = useState<iTwin[] | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectediTwinForAccess, setSelectediTwinForAccess] = useState<iTwin | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { itwinId } = useParams();

  const handleManageAccess = (iTwin: iTwin) => {
    // Navigate so URL reflects selection; modal will auto-open from param
    navigate(`/itwins/${iTwin.id}`);
  };

  const closeAccessModal = () => {
    setSelectediTwinForAccess(null);
    navigate('/itwins');
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

  // Auto-select based on route param
  useEffect(() => {
    if (!iTwins) return;
    if (itwinId) {
      const found = iTwins.find(t => t.id === itwinId);
      if (found) setSelectediTwinForAccess(found);
    } else {
      setSelectediTwinForAccess(null);
    }
  }, [iTwins, itwinId]);

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

  // Filter iTwins by search
  const filterediTwins = iTwins.filter(iTwin =>
    iTwin.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
  <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My iTwins</h1>
        <p className="text-muted-foreground">
          You have {iTwins.length} iTwin project{iTwins.length !== 1 ? 's' : ''}
        </p>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mt-4 w-full max-w-md px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring"
        />
        <div className="mt-4 flex gap-2">
          <button
            className={`px-3 py-1 rounded border ${view === 'grid' ? 'bg-primary text-white' : 'bg-muted'}`}
            onClick={() => setView('grid')}
          >
            Tile View
          </button>
          <button
            className={`px-3 py-1 rounded border ${view === 'list' ? 'bg-primary text-white' : 'bg-muted'}`}
            onClick={() => setView('list')}
          >
            List View
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filterediTwins.map((iTwin) => (
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
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded shadow-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Project #</th>
                <th className="px-4 py-2 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {filterediTwins.map((iTwin) => (
                <tr
                  key={iTwin.id}
                  className="hover:bg-primary/10 cursor-pointer"
                  onClick={() => handleManageAccess(iTwin)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleManageAccess(iTwin);
                    }
                  }}
                >
                  <td className="px-4 py-2 font-medium">{iTwin.displayName}</td>
                  <td className="px-4 py-2 font-mono text-xs">{iTwin.id}</td>
                  <td className="px-4 py-2">
                    <Badge variant={iTwin.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                      {iTwin.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{iTwin.number || '-'}</td>
                  <td className="px-4 py-2">
                    {iTwin.type ? (
                      <Badge variant="outline" className="text-xs">{iTwin.type}</Badge>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
