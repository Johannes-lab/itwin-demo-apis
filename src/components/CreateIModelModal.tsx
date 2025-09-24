import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus } from 'lucide-react';
import { iModelService } from '../services/api/IModelService';
import type { CreateIModelRequest } from '../services/types';

interface CreateIModelModalProps {
  iTwinId: string;
  onCreated: () => void;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const CreateIModelModal: React.FC<CreateIModelModalProps> = ({
  iTwinId,
  onCreated,
  onOpenChange,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
    if (!open) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
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
      const createRequest: CreateIModelRequest = {
        iTwinId,
        name: formData.displayName,
        description: formData.description
      };

      await iModelService.createIModel(createRequest);
      console.log('iModel created successfully');
      onCreated();
      setIsOpen(false);
      
      // Reset form
      setFormData({
        displayName: '',
        name: '',
        description: ''
      });
    } catch (error) {
      console.error('Failed to create iModel:', error);
      setErrors({ submit: 'Failed to create iModel. Please try again.' });
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

  const defaultTrigger = (
    <Button 
      size="sm"
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      Create iModel
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New iModel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Enter a display name for the iModel"
              className={errors.displayName ? 'border-red-500' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-red-600">{errors.displayName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Optional: internal name for the iModel"
            />
            <p className="text-xs text-muted-foreground">
              If not provided, display name will be used
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for the iModel"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            disabled={isCreating || !formData.displayName.trim()}
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create iModel
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};