import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCheckInSchema } from "@shared/schema";

const MILESTONE_ACHIEVEMENTS = [
  { streak: 7, type: "streak_7", name: "Week Warrior", description: "Checked in for 7 consecutive days!" },
  { streak: 14, type: "streak_14", name: "Two Week Titan", description: "Checked in for 14 consecutive days!" },
  { streak: 30, type: "streak_30", name: "Monthly Master", description: "Checked in for 30 consecutive days!" },
  { streak: 100, type: "streak_100", name: "Century Champion", description: "Checked in for 100 consecutive days!" },
  { streak: 365, type: "streak_365", name: "Year Legend", description: "Checked in for 365 consecutive days!" },
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Farcaster Frame webhook endpoint
  app.post("/api/webhook", async (req, res) => {
    try {
      const { untrustedData, trustedData } = req.body;
      
      console.log("Farcaster webhook received:", {
        fid: untrustedData?.fid,
        buttonIndex: untrustedData?.buttonIndex,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        success: true, 
        message: "Webhook received" 
      });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString() 
    });
  });

  // Get or create user profile by wallet address
  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        user = await storage.createUser({
          walletAddress,
          currentStreak: 0,
          longestStreak: 0,
          totalCheckIns: 0,
          lastCheckIn: null,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // Record a check-in
  app.post("/api/checkins", async (req, res) => {
    try {
      const { walletAddress, txHash, streakCount } = req.body;
      
      if (!walletAddress || !txHash) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        user = await storage.createUser({
          walletAddress,
          currentStreak: streakCount || 1,
          longestStreak: streakCount || 1,
          totalCheckIns: 1,
          lastCheckIn: new Date(),
        });
      } else {
        const newStreak = streakCount || user.currentStreak + 1;
        const newLongestStreak = Math.max(user.longestStreak, newStreak);
        user = await storage.updateUser(user.id, {
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          totalCheckIns: user.totalCheckIns + 1,
          lastCheckIn: new Date(),
        });
      }
      
      if (!user) {
        return res.status(500).json({ error: "Failed to update user" });
      }
      
      const checkIn = await storage.createCheckIn({
        userId: user.id,
        walletAddress,
        txHash,
        streakCount: streakCount || user.currentStreak,
      });
      
      const newAchievements = [];
      const existingAchievements = await storage.getAchievements(user.id);
      const existingTypes = new Set(existingAchievements.map(a => a.type));
      
      for (const milestone of MILESTONE_ACHIEVEMENTS) {
        if (user.currentStreak >= milestone.streak && !existingTypes.has(milestone.type)) {
          const achievement = await storage.createAchievement({
            userId: user.id,
            type: milestone.type,
            name: milestone.name,
            description: milestone.description,
            shared: false,
          });
          newAchievements.push(achievement);
        }
      }
      
      res.json({ 
        checkIn, 
        user, 
        newAchievements,
        message: newAchievements.length > 0 ? "New achievement unlocked!" : "Check-in recorded!" 
      });
    } catch (error) {
      console.error("Error recording check-in:", error);
      res.status(500).json({ error: "Failed to record check-in" });
    }
  });

  // Get user's check-in history
  app.get("/api/users/:walletAddress/checkins", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.json([]);
      }
      
      const checkIns = await storage.getCheckIns(user.id);
      res.json(checkIns);
    } catch (error) {
      console.error("Error getting check-ins:", error);
      res.status(500).json({ error: "Failed to get check-in history" });
    }
  });

  // Get user's achievements
  app.get("/api/users/:walletAddress/achievements", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.json([]);
      }
      
      const achievements = await storage.getAchievements(user.id);
      res.json(achievements);
    } catch (error) {
      console.error("Error getting achievements:", error);
      res.status(500).json({ error: "Failed to get achievements" });
    }
  });

  // Mark achievement as shared
  app.post("/api/achievements/:id/share", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markAchievementShared(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking achievement as shared:", error);
      res.status(500).json({ error: "Failed to mark achievement as shared" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  return httpServer;
}
