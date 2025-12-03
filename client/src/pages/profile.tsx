import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  User, 
  CalendarCheck, 
  Flame, 
  Trophy, 
  Clock, 
  ArrowLeft,
  ExternalLink,
  Share2,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType, CheckIn, Achievement } from '@shared/schema';
import sdk from '@farcaster/frame-sdk';

interface ProfileProps {
  walletAddress: string;
}

export default function Profile({ walletAddress }: ProfileProps) {
  const { toast } = useToast();
  
  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ['/api/users', walletAddress],
    enabled: !!walletAddress,
  });
  
  const { data: checkIns, isLoading: checkInsLoading } = useQuery<CheckIn[]>({
    queryKey: ['/api/users', walletAddress, 'checkins'],
    enabled: !!walletAddress,
  });
  
  const { data: achievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/users', walletAddress, 'achievements'],
    enabled: !!walletAddress,
  });

  const handleShare = async (achievement: Achievement) => {
    try {
      const message = `I just earned the "${achievement.name}" badge on Daily Check-in! ${achievement.description}`;
      
      try {
        await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`);
        toast({
          title: "Sharing to Farcaster",
          description: "Opening Warpcast to share your achievement!",
        });
      } catch (e) {
        if (navigator.share) {
          await navigator.share({
            title: 'Daily Check-in Achievement',
            text: message,
          });
        } else {
          await navigator.clipboard.writeText(message);
          toast({
            title: "Copied to clipboard!",
            description: "Share your achievement with friends!",
          });
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isLoading = userLoading || checkInsLoading || achievementsLoading;

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">Connect your wallet to view your profile.</p>
        <Link href="/">
          <Button variant="default" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20" data-testid="profile-container">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" data-testid="text-profile-title">Your Profile</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-wallet">
            {truncateAddress(walletAddress)}
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4 max-w-md mx-auto">
          <Card data-testid="card-stats">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-3xl font-black text-primary" data-testid="stat-current-streak">
                    {user?.currentStreak || 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Current Streak
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-3xl font-black" data-testid="stat-longest-streak">
                    {user?.longestStreak || 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Longest Streak
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-3xl font-black" data-testid="stat-total-checkins">
                    {user?.totalCheckIns || 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Total Check-ins
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-sm font-semibold" data-testid="stat-last-checkin">
                    {formatDate(user?.lastCheckIn || null)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Last Check-in
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-achievements">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Achievements
                {achievements && achievements.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {achievements.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements && achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                      data-testid={`achievement-${achievement.type}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {achievement.description}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(achievement)}
                        data-testid={`button-share-${achievement.type}`}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No achievements yet</p>
                  <p className="text-xs">Keep checking in to earn badges!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-history">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Check-in History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkIns && checkIns.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {checkIns.slice(0, 10).map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                      data-testid={`checkin-${checkIn.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            Day {checkIn.streakCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(checkIn.checkInTime)} at {formatTime(checkIn.checkInTime)}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`https://basescan.org/tx/${checkIn.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        data-testid={`link-tx-${checkIn.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                  {checkIns.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground pt-2">
                      Showing last 10 check-ins
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No check-ins recorded yet</p>
                  <p className="text-xs">Complete your first check-in!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
