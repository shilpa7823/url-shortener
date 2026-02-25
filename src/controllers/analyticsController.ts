import { Request, Response } from "express";
import * as analyticsService from "../services/analyticsService";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;

    const analytics = await analyticsService.getUrlAnalytics(shortCode);

    if (!analytics) {
      return res.status(404).json({ error: "URL not found" });
    }

    return res.status(200).json(analytics);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
