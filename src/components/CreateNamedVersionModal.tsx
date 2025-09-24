import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { iModelService } from '../services/api/IModelService';
import type { Changeset } from '../services/types/imodel.types';

interface CreateNamedVersionModalProps {
  iModelId: string;
  changesets: Changeset[];
  onNamedVersionCreated: () => void;
}

export const CreateNamedVersionModal: React.FC<CreateNamedVersionModalProps> = ({
  iModelId,
  changesets,
  onNamedVersionCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    changesetId: changesets[0]?.id || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.changesetId) {
      newErrors.changesetId = 'Please select a changeset';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      await iModelService.createNamedVersion(
        iModelId,
        formData.changesetId,
        formData.name,
        formData.description || undefined
      );

      console.log('Named version created successfully');
      onNamedVersionCreated();
      setIsOpen(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        changesetId: changesets[0]?.id || ''
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to create named version:', error);
      setErrors({ submit: 'Failed to create named version. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const selectedChangeset = changesets.find(cs => cs.id === formData.changesetId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Create Named Version
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Named Version</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter a name for this version"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for this named version"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="changeset">Changeset *</Label>
            <select
              id="changeset"
              value={formData.changesetId}
              onChange={(e) => handleInputChange('changesetId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.changesetId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a changeset</option>
              {changesets.map((changeset) => (
                <option key={changeset.id} value={changeset.id}>
                  #{changeset.index} - {changeset.description || changeset.displayName} 
                  {changeset.pushDateTime && ` (${new Date(changeset.pushDateTime).toLocaleDateString()})`}
                </option>
              ))}
            </select>
            {errors.changesetId && (
              <p className="text-sm text-red-600">{errors.changesetId}</p>
            )}
            
            {selectedChangeset && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <div><strong>Selected changeset:</strong></div>
                <div>Index: {selectedChangeset.index}</div>
                <div>ID: {selectedChangeset.id}</div>
                {selectedChangeset.description && <div>Description: {selectedChangeset.description}</div>}
                {selectedChangeset.pushDateTime && (
                  <div>Date: {new Date(selectedChangeset.pushDateTime).toLocaleString()}</div>
                )}
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={isCreating || !formData.name.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Named Version'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};