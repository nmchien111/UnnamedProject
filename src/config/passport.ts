import passport from "passport";
import { Router } from "express";
import logger from "@/shared/utils/logger";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { injectable } from "inversify";

@injectable()
export class PassportAuthRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRouter();
  }

  private initializeRouter(): void {
    this.router.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] }),
    );
    this.router.get(
      "/facebook",
      passport.authenticate("facebook", { scope: ["email"] }),
    );
    this.router.get("/github", passport.authenticate("github"));
  }

  public getRouter(): Router {
    return this.router;
  }
}

export function initializePassport(): void {
  passport.serializeUser((user: any, done) => {
    logger.info("Serializing user:", user);
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    logger.info("Deserializing user:", user);
    done(null, user);
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const userData: any = {
              providerId: profile.id,
              provider: "google",
              name: profile.displayName,
              email: profile.emails?.[0]?.value || null,
              avatar: profile.photos?.[0]?.value || null,
              profile: profile,
            };
            return done(null, userData);
          } catch (error) {
            logger.error("Error in GoogleStrategy:", error);
            return done(error as Error, false);
          }
        },
      ),
    );
    logger.info("Google OAuth strategy initialized.");
  } else {
    logger.warn("Google OAuth strategy not initialized.");
  }

  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/auth/facebook/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const userData: any = {
              providerId: profile.id,
              provider: "facebook",
              name: profile.displayName,
              email: profile.emails?.[0]?.value || null,
              avatar: profile.photos?.[0]?.value || null,
              profile: profile,
            };
            return done(null, userData);
          } catch (error) {
            logger.error("Error in FacebookStrategy:", error);
            return done(error as Error, false);
          }
        },
      ),
    );
    logger.info("Facebook OAuth strategy initialized.");
  } else {
    logger.warn("Facebook OAuth strategy not initialized.");
  }
}
