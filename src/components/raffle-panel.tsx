'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, Trophy, Users, Coins, Calendar } from 'lucide-react';

interface RafflePanelProps {
  fid: number;
}

export function RafflePanel({ fid }: RafflePanelProps) {
  const [currentRaffle, setCurrentRaffle] = useState<any>(null);
  const [userTickets, setUserTickets] = useState<any>(null);
  const [pastWinners, setPastWinners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRaffleData();
    fetchPastWinners();
  }, [fid]);

  const fetchRaffleData = async () => {
    try {
      const [raffleRes, ticketsRes] = await Promise.all([
        fetch('/api/raffle/current'),
        fetch(`/api/raffle/my-tickets?fid=${fid}`),
      ]);

      const raffleData = await raffleRes.json();
      const ticketsData = await ticketsRes.json();

      if (raffleData.success) {
        setCurrentRaffle(raffleData);
      }

      if (ticketsData.success) {
        setUserTickets(ticketsData);
      }
    } catch (error) {
      console.error('Failed to fetch raffle data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPastWinners = async () => {
    try {
      const response = await fetch('/api/raffle/winners?limit=10');
      const data = await response.json();
      if (data.success) {
        setPastWinners(data.winners);
      }
    } catch (error) {
      console.error('Failed to fetch past winners:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className="border border-purple-500/20">
        <CardContent className="pt-6 text-center py-12">
          <p className="text-muted-foreground">Loading raffle data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Prize Pool */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Current Prize Pool</p>
            <p className="text-4xl font-bold text-yellow-400 mb-4">
              {currentRaffle?.prizePool.toLocaleString() || 0} SHADOW
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{currentRaffle?.uniqueParticipants || 0} Players</span>
              </div>
              <div className="flex items-center gap-1">
                <Ticket className="h-4 w-4" />
                <span>{currentRaffle?.totalTickets || 0} Tickets</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Tickets */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-purple-500/10 border border-purple-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <Ticket className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Your Tickets</p>
              <p className="text-3xl font-bold text-purple-400">
                {userTickets?.totalTickets || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border border-green-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Win Chance</p>
              <p className="text-3xl font-bold text-green-400">
                {userTickets?.winChancePercent || '0.00'}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card className="border border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-purple-400" />
            How Raffle Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Battle with paid entry to earn raffle tickets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Standard entry: 1 ticket | Premium entry: 5 tickets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>10% of all entry fees go to prize pool</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Every Monday 00:01 UTC: 10 random winners drawn</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Each winner gets flat 10% of prize pool</span>
            </li>
          </ul>

          {currentRaffle && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-yellow-400" />
                <span className="text-muted-foreground">
                  Next Draw: <span className="text-yellow-400 font-semibold">{formatDate(currentRaffle.nextDrawAt)}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Prize per winner: {currentRaffle.prizePerWinner.toLocaleString()} SHADOW
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Winners */}
      {pastWinners.length > 0 && (
        <Card className="border border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Recent Winners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastWinners.slice(0, 5).map((winner: any) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between p-3 bg-card border border-purple-500/20 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">FID: {winner.fid}</p>
                    <p className="text-xs text-muted-foreground">
                      Week {winner.week_number} • {winner.user_ticket_count} tickets
                    </p>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    +{winner.prize_amount.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {userTickets?.totalTickets === 0 && (
        <Card className="border border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-6 text-center py-8">
            <Ticket className="h-12 w-12 text-purple-400 mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-2">No tickets yet this week</p>
            <p className="text-sm text-purple-400">
              Battle with paid entry to earn tickets!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
