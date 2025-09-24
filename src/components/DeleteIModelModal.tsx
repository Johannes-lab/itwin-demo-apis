import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Trash2, AlertTriangle } from 'lucide-react';
import { iModelService } from '../services/api/IModelService';
import type { IModel } from '../services/types';

interface DeleteIModelModalProps {
  iModel: IModel;
  onDeleted: () => void;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const DeleteIModelModal: React.FC<DeleteIModelModalProps> = ({
  iModel,
  onDeleted,
  onOpenChange,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
    if (!open) {
      setError(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await iModelService.deleteIModel(iModel.id);
      console.log('iModel deleted successfully');
      onDeleted();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete iModel:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete iModel');
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultTrigger = (
    <Button 
      variant="outline"
      size="sm"
      title="Delete iModel"
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete iModel
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete the iModel <strong>"{iModel.displayName}"</strong>?
          </p>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive font-medium">
              ⚠️ This action cannot be undone
            </p>
            <p className="text-sm text-destructive/80 mt-1">
              All data associated with this iModel will be permanently removed.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete iModel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};