import { useState, useEffect } from 'react';
import { CalendarCheck, Clock, ShieldCheck, Wallet, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';
import sdk from '@farcaster/frame-sdk';

// 🔴🔴🔴 请确认这里是你部署好的合约地址
const CONTRACT_ADDRESS = "Y0x8F53eaCb3968F31c4F5FDcaD751c82c1041Aba11"; 

const TARGET_CHAIN_ID = 8453; // Base Mainnet
const TARGET_CHAIN_HEX = '0x2105';

const CONTRACT_ABI = [
  "function checkIn() public",
  "function getUserStatus(address user) public view returns (uint256 count, uint256 lastTime, bool canCheckIn)"
];

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [canCheckIn, setCanCheckIn] = useState<boolean>(false);
  const [nextTime, setNextTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<'idle' | 'mining' | 'success' | 'error'>('idle'); 
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [context, setContext] = useState<any>(null);

  // 1. 初始化 Farcaster SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        sdk.actions.ready();
      } catch (e) {
        console.log("非 Frame 环境运行");
      }
    };
    initSDK();
  }, []);

  // 2. 钱包事件监听器
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setErrorMessage('');
        } else {
          setAccount(null);
          setStreak(0);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      checkWallet();

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // 3. 账户变化时读取数据
  useEffect(() => {
    if (account && CONTRACT_ADDRESS !== "YOUR_CONTRACT_ADDRESS_HERE") {
      fetchUserData();
    }
  }, [account]);

  const checkWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }
      } catch (err) {
        console.error("Check wallet failed", err);
      }
    }
  };

  const fetchUserData = async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      // @ts-ignore
      const [count, lastTimeBigInt, available] = await contract.getUserStatus(account);
      
      setStreak(Number(count));
      setCanCheckIn(available);
      
      const lastTime = Number(lastTimeBigInt);
      if (lastTime > 0) {
        setNextTime(new Date((lastTime + 86400) * 1000));
      }
    } catch (err) {
      console.error("读取数据失败:", err);
    }
  };

  const switchToBase = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARGET_CHAIN_HEX }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
          try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: TARGET_CHAIN_HEX,
                  chainName: 'Base',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                }],
              });
              return true;
          } catch (e) { return false; }
      }
      return false;
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert("未检测到钱包");
      return;
    }
    try {
      setErrorMessage('');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (err: any) {
      setErrorMessage(err.message || "连接已取消");
    }
  };

  const handleCheckIn = async () => {
    if (CONTRACT_ADDRESS.includes("YOUR_CONTRACT")) {
        alert("请先在代码中填入合约地址！");
        return;
    }

    try {
      setStatus('mining');
      setErrorMessage('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(TARGET_CHAIN_ID)) {
        const switched = await switchToBase();
        if (!switched) throw new Error("请切换到 Base 主网");
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.checkIn();
      await tx.wait(); 
      
      setStatus('success');
      fetchUserData();
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.reason || err.message || "打卡失败");
    }
  };

  const getTimeRemaining = () => {
    if (!nextTime) return "";
    const diff = nextTime.getTime() - new Date().getTime();
    if (diff <= 0) return "Ready!";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时 ${minutes}分`;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans flex flex-col items-center select-none p-6">
       <div className="text-center space-y-2 mb-8 mt-4">
          <div className="text-emerald-400 flex items-center justify-center gap-2 mb-4">
            <CalendarCheck size={24} /><span className="font-bold text-xl">每日打卡</span>
          </div>
          <div className="text-7xl font-black text-white flex items-end justify-center gap-2">
            {streak}<span className="text-lg text-gray-500 mb-2 font-medium">天</span>
          </div>
       </div>
       
       <div className="w-full max-w-xs space-y-4">
         
         {!account ? (
           <button 
             onClick={connectWallet}
             className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
           >
             <Wallet size={20} /> 连接钱包
           </button>
         ) : (
           <button 
             onClick={handleCheckIn} 
             disabled={status === 'mining' || !canCheckIn} 
             className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
               status === 'mining' ? 'bg-gray-700 cursor-wait' :
               status === 'success' ? 'bg-green-500 text-white' :
               canCheckIn ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/20' : 
               'bg-gray-800 text-gray-500 border border-gray-700'
             }`}
           >
             {status === 'mining' && "上链中..."}
             {status === 'success' && "打卡成功！"}
             {status === 'idle' && canCheckIn && <><ShieldCheck size={20}/> 立即打卡</>}
             {status === 'idle' && !canCheckIn && <><Clock size={20}/> {getTimeRemaining()}</>}
             {status === 'error' && "重试"}
           </button>
         )}

         {status === 'error' && (
           <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg flex items-center justify-center gap-2">
             <AlertCircle size={14} /> {errorMessage}
           </div>
         )}
         
         {account && (
           <div className="text-xs text-gray-600 text-center font-mono">
             当前: {account.slice(0,6)}...{account.slice(-4)}
           </div>
         )}
       </div>

       {context?.user && (
         <div className="fixed bottom-6 text-gray-500 text-xs text-center">
           加油, <span className="text-emerald-400">@{context.user.username}</span>!
         </div>
       )}
    </div>
  );
}