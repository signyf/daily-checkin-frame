import { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Clock, Loader2, CheckCircle2, Wallet, AlertCircle, User, Trophy } from 'lucide-react';
import { ethers } from 'ethers';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import sdk from '@farcaster/frame-sdk';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const CONTRACT_ADDRESS = "0x8F53eaCb3968F31c4F5FDcaD751c82c1041Aba11";
const TARGET_CHAIN_ID = BigInt(8453);
const TARGET_CHAIN_HEX = '0x2105';

const BASE_CHAIN_PARAMS = {
  chainId: TARGET_CHAIN_HEX,
  chainName: 'Base',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

const CONTRACT_ABI = [
  "function checkIn() public",
  "function getUserStatus(address user) public view returns (uint256 count, uint256 lastTime, bool canCheckIn)"
];

type AppStatus = 'loading' | 'ready' | 'mining' | 'success' | 'no-wallet' | 'error';

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [nextTime, setNextTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<AppStatus>('loading');
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.context;
        sdk.actions.ready();
      } catch (e) {
        console.log("Not in frame environment");
      }
    };
    init();
    checkWallet();
  }, []);

  useEffect(() => {
    if (account) fetchUserData();
  }, [account]);

  useEffect(() => {
    if (!nextTime || canCheckIn) return;
    
    const updateTimer = () => {
      const diff = nextTime.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeRemaining("Ready!");
        setCanCheckIn(true);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextTime, canCheckIn]);

  const checkWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        } else {
          setStatus('ready');
        }
      } catch (err) {
        console.error("Error checking wallet:", err);
        setStatus('ready');
      }
    } else {
      setStatus('no-wallet');
    }
  };

  const fetchUserData = useCallback(async () => {
    if (!account || !window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [count, lastTimeBigInt, available] = await contract.getUserStatus(account);
      setStreak(Number(count));
      setCanCheckIn(available);
      const lastTime = Number(lastTimeBigInt);
      if (lastTime > 0) {
        setNextTime(new Date((lastTime + 86400) * 1000));
      }
      setStatus('ready');
    } catch (err) {
      console.error("Error fetching user data:", err);
      setStatus('ready');
    }
  }, [account]);

  const switchToBaseNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARGET_CHAIN_HEX }],
      });
      return true;
    } catch (switchError: unknown) {
      const error = switchError as { code?: number };
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_CHAIN_PARAMS],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Base network:", addError);
          toast({
            title: "Network Error",
            description: "Failed to add Base network to your wallet.",
            variant: "destructive",
          });
          return false;
        }
      }
      console.error("Error switching network:", switchError);
      toast({
        title: "Network Error",
        description: "Failed to switch to Base network.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleCheckIn = async () => {
    if (!window.ethereum) {
      setStatus('no-wallet');
      return;
    }

    setErrorMessage("");

    if (!account) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
      } catch (err) {
        console.error("Error connecting wallet:", err);
        toast({
          title: "Connection Failed",
          description: "Could not connect to your wallet. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      setStatus('mining');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== TARGET_CHAIN_ID) {
        const switched = await switchToBaseNetwork();
        if (!switched) {
          setStatus('ready');
          return;
        }
      }
      
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.checkIn();
      await tx.wait();
      
      const newStreak = streak + 1;
      
      try {
        const response = await apiRequest('POST', '/api/checkins', {
          walletAddress: account,
          txHash: tx.hash,
          streakCount: newStreak,
        });
        
        const data = response as { newAchievements?: { name: string }[] };
        if (data.newAchievements && data.newAchievements.length > 0) {
          toast({
            title: "Achievement Unlocked!",
            description: data.newAchievements[0].name,
          });
        }
      } catch (apiError) {
        console.error("Error recording check-in to backend:", apiError);
      }
      
      setStatus('success');
      toast({
        title: "Check-in Successful!",
        description: `You're on a ${newStreak} day streak!`,
      });
      fetchUserData();
      setTimeout(() => setStatus('ready'), 3000);
    } catch (err: unknown) {
      console.error("Error during check-in:", err);
      const error = err as { reason?: string; message?: string; code?: string };
      const message = error.reason || error.message || "Transaction failed";
      setErrorMessage(message);
      setStatus('error');
      toast({
        title: "Check-in Failed",
        description: message,
        variant: "destructive",
      });
      setTimeout(() => {
        setStatus('ready');
        setErrorMessage("");
      }, 5000);
    }
  };

  const getButtonContent = () => {
    if (status === 'loading') {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </>
      );
    }
    
    if (status === 'mining') {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Mining...</span>
        </>
      );
    }
    
    if (status === 'success') {
      return (
        <>
          <CheckCircle2 className="w-5 h-5" />
          <span>Success!</span>
        </>
      );
    }

    if (status === 'error') {
      return (
        <>
          <AlertCircle className="w-5 h-5" />
          <span>Try Again</span>
        </>
      );
    }
    
    if (status === 'no-wallet') {
      return (
        <>
          <Wallet className="w-5 h-5" />
          <span>No Wallet Detected</span>
        </>
      );
    }
    
    if (!account) {
      return (
        <>
          <Wallet className="w-5 h-5" />
          <span>Connect Wallet</span>
        </>
      );
    }
    
    if (canCheckIn) {
      return (
        <>
          <CalendarCheck className="w-5 h-5" />
          <span>Check In</span>
        </>
      );
    }
    
    return (
      <>
        <Clock className="w-5 h-5" />
        <span>Wait {timeRemaining}</span>
      </>
    );
  };

  const isButtonDisabled = 
    status === 'mining' || 
    status === 'loading' || 
    status === 'no-wallet' ||
    (status !== 'error' && !canCheckIn && account !== null);

  const getButtonVariant = (): "default" | "secondary" | "destructive" => {
    if (status === 'error') return 'destructive';
    if (status === 'success') return 'default';
    if (canCheckIn || !account) return 'default';
    return 'secondary';
  };

  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center p-8 select-none"
      data-testid="home-container"
    >
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <CalendarCheck className="w-8 h-8" data-testid="icon-calendar" />
            <h1 
              className="text-2xl font-bold tracking-tight"
              data-testid="text-title"
            >
              Daily Check-in
            </h1>
          </div>
          {account && (
            <p 
              className="text-sm text-muted-foreground truncate max-w-[200px] mx-auto"
              data-testid="text-wallet-address"
            >
              {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          )}
        </header>

        <div className="text-center space-y-1" data-testid="streak-container">
          <div 
            className={`text-7xl font-black tabular-nums transition-transform duration-150 ${
              status === 'success' ? 'scale-105' : 'scale-100'
            }`}
            data-testid="text-streak-count"
          >
            {streak}
          </div>
          <p 
            className="text-xl font-medium text-muted-foreground uppercase tracking-widest"
            data-testid="text-streak-label"
          >
            Days
          </p>
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={isButtonDisabled}
          variant={getButtonVariant()}
          size="lg"
          className={`w-full max-w-xs py-6 text-lg font-bold rounded-xl gap-2 transition-all duration-150 ${
            status === 'success' ? 'bg-primary' : ''
          }`}
          data-testid="button-checkin"
        >
          {getButtonContent()}
        </Button>

        {status === 'error' && errorMessage && (
          <p 
            className="text-sm text-destructive text-center max-w-xs"
            data-testid="text-error-message"
          >
            {errorMessage.length > 100 ? errorMessage.slice(0, 100) + '...' : errorMessage}
          </p>
        )}

        {nextTime && !canCheckIn && account && (
          <div 
            className="flex items-center gap-2 text-muted-foreground text-sm"
            data-testid="next-checkin-info"
          >
            <Clock className="w-4 h-4" />
            <span>Next check-in available at {nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {account && (
          <div className="flex gap-3 mt-4">
            <Link href={`/profile/${account}`}>
              <Button variant="secondary" size="default" className="gap-2" data-testid="button-profile">
                <User className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="secondary" size="default" className="gap-2" data-testid="button-leaderboard">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
