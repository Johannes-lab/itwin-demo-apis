import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { iTwinApiService } from '../services/iTwinAPIService';
import type { iTwin } from '../services/iTwinAPIService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

const AuthComponent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [iTwins, setiTwins] = useState<iTwin[] | null>(null);
  const [isFetchingiTwins, setIsFetchingiTwins] = useState(false);

  const handleGetMyiTwins = async () => {
    setIsFetchingiTwins(true);
    const result = await iTwinApiService.getMyiTwins();
    setiTwins(result);
    setIsFetchingiTwins(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Authenticating...</h2>
          <p className="text-muted-foreground">Please wait while we authenticate you with iTwin...</p>
          <div className="text-4xl animate-spin mt-4">
            ⚙️
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto mt-4">
          <CardHeader>
            <CardTitle>iTwin API Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGetMyiTwins} disabled={isFetchingiTwins}>
              {isFetchingiTwins ? 'Fetching...' : 'Get My iTwins'}
            </Button>
          </CardContent>
        </Card>

        {iTwins && (
          <Card className="max-w-2xl mx-auto mt-4">
            <CardHeader>
              <CardTitle>My iTwins</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-md overflow-auto text-sm">{JSON.stringify(iTwins, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>❌ Authentication Failed</CardTitle>
          <CardDescription>Unable to authenticate with iTwin. Please check your configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 border border-destructive/50 text-destructive p-4 rounded-md">
            <h3 className="font-semibold">🔧 Troubleshooting</h3>
            <ol className="list-decimal list-inside text-sm">
              <li>Verify your client ID in <code>.env</code></li>
              <li>Check redirect URIs at <a href="https://developer.bentley.com" className="underline" target="_blank" rel="noopener noreferrer">developer.bentley.com</a></li>
            </ol>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()} className="w-full">
            Retry Authentication
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthComponent;
