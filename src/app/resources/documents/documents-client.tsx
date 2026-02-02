'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Search,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Building2,
  FolderOpen,
  File,
  Link as LinkIcon,
  Loader2,
  Plus,
  Upload,
  X,
  Download,
} from 'lucide-react';
import type { Property, Prospect } from '@/types';
import { createDocumentAction, deleteDocumentAction } from './actions';
import { uploadFile, validateFile, formatFileSize, type UploadProgress } from '@/lib/supabase/storage';

interface Document {
  id: string;
  name: string;
  type: string;
  file_url: string;
  file_size: number | null;
  property_id: string | null;
  prospect_id: string | null;
  created_at: string;
}

interface DocumentsClientProps {
  properties: Property[];
  prospects: Prospect[];
  initialDocuments: Document[];
}

const documentTypeLabels: Record<string, string> = {
  lease: 'Lease Agreement',
  inspection: 'Inspection Report',
  insurance: 'Insurance',
  tax: 'Tax Document',
  deed: 'Deed',
  contract: 'Contract',
  research: 'Research',
  other: 'Other',
};

// Detect source from URL
const getSourceFromUrl = (url: string, fileSize?: number | null): { source: string; icon: string; isUploaded: boolean } => {
  if (url.includes('supabase') && url.includes('/storage/')) {
    return { source: 'Uploaded', icon: '📄', isUploaded: true };
  }
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    return { source: 'Google Drive', icon: '📁', isUploaded: false };
  }
  if (url.includes('dropbox.com')) {
    return { source: 'Dropbox', icon: '📦', isUploaded: false };
  }
  if (url.includes('onedrive.com') || url.includes('sharepoint.com')) {
    return { source: 'OneDrive', icon: '☁️', isUploaded: false };
  }
  // If has file size, likely an upload
  if (fileSize) {
    return { source: 'Uploaded', icon: '📄', isUploaded: true };
  }
  return { source: 'Link', icon: '🔗', isUploaded: false };
};

export function DocumentsClient({ properties, prospects, initialDocuments }: DocumentsClientProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadTab, setUploadTab] = useState<string>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newDoc, setNewDoc] = useState({
    name: '',
    type: 'other',
    file_url: '',
    property_id: 'none',
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const validation = validateFile(files[0]);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(files[0]);
      if (!newDoc.name) {
        setNewDoc(prev => ({ ...prev, name: files[0].name.replace(/\.[^/.]+$/, '') }));
      }
    }
  }, [newDoc.name]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (files && files[0]) {
      const validation = validateFile(files[0]);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(files[0]);
      if (!newDoc.name) {
        setNewDoc(prev => ({ ...prev, name: files[0].name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesProperty = propertyFilter === 'all' || doc.property_id === propertyFilter;
    return matchesSearch && matchesType && matchesProperty;
  });

  const handleAddDocument = async () => {
    // For file upload
    if (uploadTab === 'upload' && selectedFile) {
      if (!newDoc.name) return;

      setIsSubmitting(true);
      setUploadError(null);

      try {
        const propertyId = newDoc.property_id === 'none' ? null : newDoc.property_id;
        const uploadResult = await uploadFile(
          selectedFile,
          propertyId,
          setUploadProgress
        );

        if (!uploadResult.success) {
          setUploadError(uploadResult.error || 'Upload failed');
          return;
        }

        const result = await createDocumentAction({
          name: newDoc.name,
          type: newDoc.type,
          file_url: uploadResult.url!,
          property_id: propertyId,
          file_size: uploadResult.fileSize,
        });

        if (result.success && result.document) {
          setDocuments([result.document, ...documents]);
          resetForm();
        } else {
          setUploadError(result.error || 'Failed to save document');
        }
      } catch (error) {
        setUploadError('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // For URL link
    if (!newDoc.name || !newDoc.file_url) return;

    setIsSubmitting(true);
    try {
      const result = await createDocumentAction({
        name: newDoc.name,
        type: newDoc.type,
        file_url: newDoc.file_url,
        property_id: newDoc.property_id === 'none' ? null : newDoc.property_id,
      });

      if (result.success && result.document) {
        setDocuments([result.document, ...documents]);
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewDoc({ name: '', type: 'other', file_url: '', property_id: 'none' });
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadError(null);
    setIsDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteDocumentAction(id);
      if (result.success) {
        setDocuments(documents.filter(d => d.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Store and manage property documents
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
              <DialogDescription>
                Upload a file or link to an external document
              </DialogDescription>
            </DialogHeader>
            <Tabs value={uploadTab} onValueChange={setUploadTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="link">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Link URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 mt-4">
                {/* Drag and drop zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
                    ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                    ${selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <File className="mx-auto h-10 w-10 text-green-600" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSelectedFile();
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Drop file here or click to browse</p>
                        <p className="text-sm text-muted-foreground">
                          PDF, images, Word, Excel (max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {uploadProgress && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress.percentage} />
                    <p className="text-sm text-muted-foreground text-center">
                      Uploading... {uploadProgress.percentage}%
                    </p>
                  </div>
                )}

                {uploadError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {uploadError}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Document URL *</Label>
                  <Input
                    id="url"
                    value={newDoc.file_url}
                    onChange={(e) => setNewDoc({ ...newDoc, file_url: e.target.value })}
                    placeholder="Paste Google Drive, Dropbox, or other link"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports Google Drive, Dropbox, OneDrive, and any direct link
                  </p>
                </div>
                {newDoc.file_url && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                    <span className="text-lg">{getSourceFromUrl(newDoc.file_url).icon}</span>
                    <span className="text-sm">
                      Detected: <strong>{getSourceFromUrl(newDoc.file_url).source}</strong>
                    </span>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Name *</Label>
                <Input
                  id="name"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  placeholder="e.g., Lease Agreement - 123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Select
                    value={newDoc.type}
                    onValueChange={(value) => setNewDoc({ ...newDoc, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lease">Lease Agreement</SelectItem>
                      <SelectItem value="inspection">Inspection Report</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="tax">Tax Document</SelectItem>
                      <SelectItem value="deed">Deed</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property">Property</Label>
                  <Select
                    value={newDoc.property_id}
                    onValueChange={(value) => setNewDoc({ ...newDoc, property_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Property</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleAddDocument}
                disabled={
                  isSubmitting ||
                  !newDoc.name ||
                  (uploadTab === 'upload' ? !selectedFile : !newDoc.file_url)
                }
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : uploadTab === 'upload' ? (
                  <Upload className="mr-2 h-4 w-4" />
                ) : (
                  <LinkIcon className="mr-2 h-4 w-4" />
                )}
                {uploadTab === 'upload' ? 'Upload Document' : 'Add Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leases</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === 'lease').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspections</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === 'inspection').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties Covered</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(documents.map(d => d.property_id).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>Leases, inspections, insurance, and more</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lease">Leases</SelectItem>
                  <SelectItem value="inspection">Inspections</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="tax">Tax Documents</SelectItem>
                  <SelectItem value="deed">Deeds</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const property = properties.find(p => p.id === doc.property_id);
                  const { source, icon, isUploaded } = getSourceFromUrl(doc.file_url, doc.file_size);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 font-medium hover:underline text-primary"
                          download={isUploaded ? doc.name : undefined}
                        >
                          <span>{icon}</span>
                          <div>
                            <div>{doc.name}</div>
                            {doc.file_size && (
                              <div className="text-xs text-muted-foreground font-normal">
                                {formatFileSize(doc.file_size)}
                              </div>
                            )}
                          </div>
                          {isUploaded ? (
                            <Download className="h-3 w-3" />
                          ) : (
                            <ExternalLink className="h-3 w-3" />
                          )}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {documentTypeLabels[doc.type] || doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{source}</span>
                      </TableCell>
                      <TableCell>
                        {property ? (
                          <Link
                            href={`/properties/${property.id}`}
                            className="text-primary hover:underline"
                          >
                            {property.address}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={isUploaded ? doc.name : undefined}
                              >
                                {isUploaded ? (
                                  <Download className="mr-2 h-4 w-4" />
                                ) : (
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                )}
                                {isUploaded ? 'Download' : 'Open'}
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={deletingId === doc.id}
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Link documents from Google Drive, Dropbox, or any URL to keep all your property documents organized in one place.
              </p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links by Property */}
      {properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents by Property</CardTitle>
            <CardDescription>Quick access to property documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => {
                const propertyDocs = documents.filter(d => d.property_id === property.id);
                return (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{property.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {propertyDocs.length} {propertyDocs.length === 1 ? 'document' : 'documents'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
