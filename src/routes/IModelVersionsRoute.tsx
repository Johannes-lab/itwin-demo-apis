import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import IModelVersionsComponent from '../components/IModelVersionsComponent.tsx';
import type { IModel } from '../services/types';
import { iModelApiService } from '../services/api';

export default function IModelVersionsRoute() {
  const { itwinId, imodelId } = useParams<{ itwinId: string; imodelId: string }>();
  const [iModel, setIModel] = useState<IModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadIModel = async () => {
      if (!imodelId) {
        setError('iModel ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await iModelApiService.getIModel(imodelId);
        setIModel(response.iModel);
      } catch (err) {
        console.error('Error loading iModel:', err);
        setError(err instanceof Error ? err.message : 'Failed to load iModel');
      } finally {
        setLoading(false);
      }
    };

    loadIModel();
  }, [imodelId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-2">Loading iModel...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the iModel details</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!iModel) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-2">iModel Not Found</h2>
          <p className="text-muted-foreground">The requested iModel could not be found</p>
        </div>
      </div>
    );
  }

  return (
    <IModelVersionsComponent 
      iModel={iModel}
      iTwinId={itwinId}
    />
  );
}