import { Request, Response } from "express";
import * as urlService from "../services/urlService";

export const createShortUrl = async (req: Request, res: Response) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "Original URL is required" });
    }

    const result = await urlService.createShortUrl(originalUrl);

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const redirectUrl = async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;

    const originalUrl = await urlService.getOriginalUrl(shortCode);

    if (!originalUrl) {
      return res.status(404).json({ error: "URL not found" });
    }

    return res.redirect(originalUrl);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
