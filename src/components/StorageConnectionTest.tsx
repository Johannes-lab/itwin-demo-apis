import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { synchronizationService } from '../services';

export default function StorageConnectionTest() {
  const [connectionId, setConnectionId] = useState('9fDNlCPXE02DXmYsoATGtdqXmO7Of85HpUipfN4UZP0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testRun = async () => {
    if (!connectionId.trim()) {
      setResult('Please enter a connection ID');
      return;
    }

    try {
      setLoading(true);
      setResult('Starting run...');
      
      console.log('Testing storage connection run with ID:', connectionId);
      
      const response = await synchronizationService.runStorageConnection(connectionId);
      
      console.log('Run response status:', response.status);
      console.log('Run response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 202) {
        const location = response.headers.get('Location');
        console.log('Run started successfully. Location:', location);
        setResult(`Run started successfully! Status: ${response.status}, Location: ${location || 'Not provided'}`);
      } else if (response.status === 404) {
        console.log('Connection not found');
        setResult(`Connection not found (404). The connection ID "${connectionId}" may not exist.`);
      } else {
        const responseText = await response.text();
        console.log('Unexpected response:', responseText);
        setResult(`Unexpected response: ${response.status} - ${responseText}`);
      }
    } catch (error) {
      console.error('Error testing connection run:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Storage Connection Run Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="connection-id">Storage Connection ID</Label>
          <Input
            id="connection-id"
            value={connectionId}
            onChange={(e) => setConnectionId(e.target.value)}
            placeholder="Enter storage connection ID to test"
          />
        </div>
        
        <Button 
          onClick={testRun} 
          disabled={loading || !connectionId.trim()}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Run Storage Connection'}
        </Button>
        
        {result && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono whitespace-pre-wrap">{result}</p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>This component tests running an existing storage connection.</p>
          <p>Check the browser console for detailed debug information.</p>
        </div>
      </CardContent>
    </Card>
  );
}