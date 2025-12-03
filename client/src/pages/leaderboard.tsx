import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Trophy, 
  ArrowLeft,
  Flame,
  Medal,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@shared/schema';

interface LeaderboardProps {
  currentWallet?: string;
}

export default function Leaderboard({ currentWallet }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useQuery<User[]>({
    queryKey: ['/api/leaderboard'],
  });

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 2:
        return 'bg-gray-400/10 border-gray-400/20';
      case 3:
        return 'bg-amber-600/10 border-amber-600/20';
      default:
        return 'bg-secondary/50';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20" data-testid="leaderboard-container">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-leaderboard-title">
            <Trophy className="w-6 h-6 text-primary" />
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Top streakers this season
          </p>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        <Card data-testid="card-leaderboard">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Top Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((user, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentWallet?.toLowerCase() === user.walletAddress.toLowerCase();
                  
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBgClass(rank)} ${
                        isCurrentUser ? 'ring-2 ring-primary' : ''
                      }`}
                      data-testid={`leaderboard-row-${rank}`}
                    >
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(rank)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {truncateAddress(user.walletAddress)}
                          {isCurrentUser && (
                            <span className="text-xs text-primary">(You)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.totalCheckIns} total check-ins
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">
                          {user.currentStreak}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase">
                          days
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No entries yet</p>
                <p className="text-xs">Be the first to start a streak!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {leaderboard && leaderboard.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Rankings update in real-time as users check in
          </p>
        )}
      </div>
    </div>
  );
}
