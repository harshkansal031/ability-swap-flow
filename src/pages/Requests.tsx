import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, MessageSquare, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SwapRequest {
  id: string;
  requester_id: string;
  requested_user_id: string;
  status: string;
  message: string;
  created_at: string;
  requester_profile?: {
    full_name: string;
    location: string;
    profile_photo: string;
  };
  requested_profile?: {
    full_name: string;
    location: string;
    profile_photo: string;
  };
  offered_skill: {
    skill_name: string;
    experience_level: string;
  };
  wanted_skill: {
    skill_name: string;
    experience_level: string;
  };
}

interface FeedbackData {
  rating: number;
  comment: string;
  would_swap_again: boolean;
}

export default function Requests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [activeSwaps, setActiveSwaps] = useState<SwapRequest[]>([]);
  const [completedSwaps, setCompletedSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 5,
    comment: '',
    would_swap_again: true,
  });

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      // Fetch incoming requests
      const { data: incoming, error: incomingError } = await supabase
        .from('swap_requests')
        .select(`
          *,
          requester_profile:profiles!swap_requests_requester_id_fkey(full_name, location, profile_photo),
          offered_skill:skills!swap_requests_offered_skill_id_fkey(skill_name, experience_level),
          wanted_skill:skills!swap_requests_wanted_skill_id_fkey(skill_name, experience_level)
        `)
        .eq('requested_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (incomingError) throw incomingError;

      // Fetch outgoing requests
      const { data: outgoing, error: outgoingError } = await supabase
        .from('swap_requests')
        .select(`
          *,
          requested_profile:profiles!swap_requests_requested_user_id_fkey(full_name, location, profile_photo),
          offered_skill:skills!swap_requests_offered_skill_id_fkey(skill_name, experience_level),
          wanted_skill:skills!swap_requests_wanted_skill_id_fkey(skill_name, experience_level)
        `)
        .eq('requester_id', user?.id)
        .order('created_at', { ascending: false });

      if (outgoingError) throw outgoingError;

      // Separate requests by status with type assertions to handle Supabase join data
      setIncomingRequests((incoming || []).filter(req => req.status === 'pending') as unknown as SwapRequest[]);
      setOutgoingRequests((outgoing || []).filter(req => req.status === 'pending') as unknown as SwapRequest[]);
      
      const acceptedRequests = [
        ...(incoming || []).filter(req => req.status === 'accepted'),
        ...(outgoing || []).filter(req => req.status === 'accepted')
      ] as unknown as SwapRequest[];
      setActiveSwaps(acceptedRequests);

      const completedRequests = [
        ...(incoming || []).filter(req => req.status === 'completed'),
        ...(outgoing || []).filter(req => req.status === 'completed')
      ] as unknown as SwapRequest[];
      setCompletedSwaps(completedRequests);

    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('swap_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request accepted!",
        description: "The swap request has been accepted.",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('swap_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request rejected",
        description: "The swap request has been rejected.",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteSwap = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('swap_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Swap completed!",
        description: "The swap has been marked as completed.",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error completing swap:', error);
      toast({
        title: "Error",
        description: "Failed to complete swap. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLeaveFeedback = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setShowFeedbackDialog(true);
  };

  const submitFeedback = async () => {
    if (!selectedSwap) return;

    try {
      const revieweeId = selectedSwap.requester_id === user?.id 
        ? selectedSwap.requested_user_id 
        : selectedSwap.requester_id;

      const { error } = await supabase
        .from('feedback')
        .insert({
          swap_request_id: selectedSwap.id,
          reviewer_id: user?.id,
          reviewee_id: revieweeId,
          rating: feedback.rating,
          comment: feedback.comment,
          would_swap_again: feedback.would_swap_again,
        });

      if (error) throw error;

      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback.",
      });

      setShowFeedbackDialog(false);
      setFeedback({ rating: 5, comment: '', would_swap_again: true });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  const RequestCard = ({ request, type }: { request: SwapRequest; type: 'incoming' | 'outgoing' | 'active' | 'completed' }) => {
    const isIncoming = type === 'incoming';
    const profile = isIncoming ? request.requester_profile : request.requested_profile;
    const otherUserId = isIncoming ? request.requester_id : request.requested_user_id;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={profile?.profile_photo || ''} />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{profile?.full_name}</CardTitle>
                <CardDescription>
                  {formatDate(request.created_at)}
                  {profile?.location && ` • ${profile.location}`}
                </CardDescription>
              </div>
            </div>
            <Badge variant={
              request.status === 'pending' ? 'secondary' :
              request.status === 'accepted' ? 'default' :
              request.status === 'completed' ? 'outline' : 'destructive'
            }>
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">
                {isIncoming ? 'They Offer' : 'You Offer'}
              </h4>
              <Badge variant="secondary">
                {request.offered_skill.skill_name} ({request.offered_skill.experience_level})
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">
                {isIncoming ? 'They Want' : 'You Want'}
              </h4>
              <Badge variant="outline">
                {request.wanted_skill.skill_name} ({request.wanted_skill.experience_level})
              </Badge>
            </div>
          </div>

          {request.message && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Message</h4>
              <p className="text-sm bg-muted p-3 rounded-lg">{request.message}</p>
            </div>
          )}

          <div className="flex gap-2">
            {type === 'incoming' && (
              <>
                <Button
                  onClick={() => handleAcceptRequest(request.id)}
                  size="sm"
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleRejectRequest(request.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            
            {type === 'active' && (
              <Button
                onClick={() => handleCompleteSwap(request.id)}
                size="sm"
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>
            )}

            {type === 'completed' && (
              <Button
                onClick={() => handleLeaveFeedback(request)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Leave Feedback
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Requests</h1>
          <p className="text-muted-foreground">Manage your skill swap requests and ongoing swaps</p>
        </div>

        <Tabs defaultValue="incoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Incoming ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              Outgoing ({outgoingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              Active ({activeSwaps.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              Completed ({completedSwaps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4">
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No incoming requests.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {incomingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} type="incoming" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="space-y-4">
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No outgoing requests.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {outgoingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} type="outgoing" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeSwaps.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active swaps.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeSwaps.map((request) => (
                  <RequestCard key={request.id} request={request} type="active" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedSwaps.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No completed swaps.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {completedSwaps.map((request) => (
                  <RequestCard key={request.id} request={request} type="completed" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Feedback Dialog */}
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave Feedback</DialogTitle>
              <DialogDescription>
                Share your experience with this skill swap
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rating (1-5 stars)</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant={feedback.rating >= star ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                    >
                      ★
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Comment (Optional)</Label>
                <Textarea
                  value={feedback.comment}
                  onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wouldSwapAgain"
                  checked={feedback.would_swap_again}
                  onChange={(e) => setFeedback(prev => ({ ...prev, would_swap_again: e.target.checked }))}
                />
                <Label htmlFor="wouldSwapAgain">Would you swap with this person again?</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={submitFeedback} className="flex-1">
                  Submit Feedback
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}