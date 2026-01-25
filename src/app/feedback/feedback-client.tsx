'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bug, Palette, Lightbulb, Trash2, Filter, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedbackAction, deleteFeedbackAction } from './actions';
import type { UserFeedback, UserFeedbackCategory } from '@/types';

interface FeedbackClientProps {
  initialFeedback: UserFeedback[];
}

const CATEGORY_CONFIG: Record<UserFeedbackCategory, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
}> = {
  'fix-me': {
    label: 'Bug Report',
    icon: Bug,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Something is broken or not working correctly',
  },
  'style-me': {
    label: 'UI/Design',
    icon: Palette,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Visual improvements or design changes',
  },
  'bright-idea': {
    label: 'Feature Idea',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'New feature or enhancement suggestion',
  },
};

export function FeedbackClient({ initialFeedback }: FeedbackClientProps) {
  const [feedback, setFeedback] = useState<UserFeedback[]>(initialFeedback);
  const [selectedCategory, setSelectedCategory] = useState<UserFeedbackCategory>('fix-me');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    try {
      const newFeedback = await submitFeedbackAction({
        category: selectedCategory,
        message: message.trim(),
        user_email: null,
      });

      if (newFeedback) {
        setFeedback((prev) => [newFeedback, ...prev]);
        setMessage('');
        toast.success('Feedback submitted. Thank you!');
      }
    } catch {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteFeedbackAction(id);
      if (success) {
        setFeedback((prev) => prev.filter((f) => f.id !== id));
        toast.success('Feedback deleted');
      }
    } catch {
      toast.error('Failed to delete feedback');
    }
    setDeleteId(null);
  };

  const filteredFeedback =
    filterCategory === 'all'
      ? feedback
      : feedback.filter((f) => f.category === filterCategory);

  const counts = {
    total: feedback.length,
    'fix-me': feedback.filter((f) => f.category === 'fix-me').length,
    'style-me': feedback.filter((f) => f.category === 'style-me').length,
    'bright-idea': feedback.filter((f) => f.category === 'bright-idea').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Report bugs, suggest improvements, or share new ideas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        {(Object.keys(CATEGORY_CONFIG) as UserFeedbackCategory[]).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          return (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{counts[cat]}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>
            Select a category and describe your feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(CATEGORY_CONFIG) as UserFeedbackCategory[]).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const Icon = config.icon;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
                    isSelected
                      ? `border-primary ${config.bgColor}`
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  <div className={`p-2 rounded-full ${config.bgColor}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Message */}
          <Textarea
            placeholder="Describe your feedback in detail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />

          <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Feedback</CardTitle>
              <CardDescription>
                {filteredFeedback.length} item{filteredFeedback.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(Object.keys(CATEGORY_CONFIG) as UserFeedbackCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback yet</p>
              <p className="text-sm">Be the first to submit feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((item) => {
                const config = CATEGORY_CONFIG[item.category];
                const Icon = config.icon;

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-lg border"
                  >
                    <div className={`p-2 rounded-full ${config.bgColor} shrink-0`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{item.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The feedback will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
