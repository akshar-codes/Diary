import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { env } from "./env";
import { UserModel, IUser } from "../models/User";

export const isGoogleOAuthConfigured = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

export const isGithubOAuthConfigured = Boolean(
  env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET,
);

if (isGoogleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(
              new Error("No email found in Google account profile"),
              undefined,
            );
          }

          let user = await UserModel.findOne({
            provider: "google",
            providerId: profile.id,
          });

          if (!user) {
            user = await UserModel.findOne({ email });
            if (user) {
              user.provider = "google";
              user.providerId = profile.id;
              user.emailVerified = true;
              if (profile.photos?.[0]?.value && !user.avatarUrl) {
                user.avatarUrl = profile.photos[0].value;
              }
              await user.save();
            } else {
              user = await UserModel.create({
                name: profile.displayName || "Google User",
                email,
                provider: "google",
                providerId: profile.id,
                avatarUrl: profile.photos?.[0]?.value || null,
                emailVerified: true,
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );
}

if (isGithubOAuthConfigured) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ["user:email"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: any,
      ) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(
              new Error(
                "No email found in GitHub account. Please ensure your email is verified on GitHub.",
              ),
              undefined,
            );
          }

          let user = await UserModel.findOne({
            provider: "github",
            providerId: profile.id,
          });

          if (!user) {
            user = await UserModel.findOne({ email });
            if (user) {
              user.provider = "github";
              user.providerId = profile.id;
              user.emailVerified = true;
              if (profile.photos?.[0]?.value && !user.avatarUrl) {
                user.avatarUrl = profile.photos[0].value;
              }
              await user.save();
            } else {
              user = await UserModel.create({
                name: profile.displayName || profile.username || "GitHub User",
                email,
                provider: "github",
                providerId: profile.id,
                avatarUrl: profile.photos?.[0]?.value || null,
                emailVerified: true,
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );
}

export default passport;
