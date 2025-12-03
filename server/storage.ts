import { 
  type User, type InsertUser, 
  type CheckIn, type InsertCheckIn,
  type Achievement, type InsertAchievement,
  users, checkIns, achievements 
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  getCheckIns(userId: string): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  
  getAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  markAchievementShared(id: string): Promise<void>;
  
  getLeaderboard(limit?: number): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private checkIns: Map<string, CheckIn> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private userIdCounter = 0;
  private checkInIdCounter = 0;
  private achievementIdCounter = 0;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const normalized = walletAddress.toLowerCase();
    return Array.from(this.users.values()).find(
      u => u.walletAddress.toLowerCase() === normalized
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = `user_${++this.userIdCounter}`;
    const user: User = {
      id,
      walletAddress: insertUser.walletAddress.toLowerCase(),
      currentStreak: insertUser.currentStreak ?? 0,
      longestStreak: insertUser.longestStreak ?? 0,
      totalCheckIns: insertUser.totalCheckIns ?? 0,
      lastCheckIn: insertUser.lastCheckIn ?? null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getCheckIns(userId: string): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const id = `checkin_${++this.checkInIdCounter}`;
    const newCheckIn: CheckIn = {
      id,
      userId: checkIn.userId,
      walletAddress: checkIn.walletAddress.toLowerCase(),
      txHash: checkIn.txHash,
      streakCount: checkIn.streakCount,
      checkInTime: new Date(),
    };
    this.checkIns.set(id, newCheckIn);
    return newCheckIn;
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = `achievement_${++this.achievementIdCounter}`;
    const newAchievement: Achievement = {
      id,
      userId: achievement.userId,
      type: achievement.type,
      name: achievement.name,
      description: achievement.description,
      earnedAt: new Date(),
      shared: achievement.shared ?? false,
    };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

  async markAchievementShared(id: string): Promise<void> {
    const achievement = this.achievements.get(id);
    if (achievement) {
      achievement.shared = true;
    }
  }

  async getLeaderboard(limit: number = 20): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
