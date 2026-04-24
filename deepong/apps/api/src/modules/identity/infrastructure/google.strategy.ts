import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('OAUTH_CLIENT_ID')!,
      clientSecret: config.get<string>('OAUTH_CLIENT_PASSWORD')!,
      callbackURL: config.get<string>(
        'OAUTH_CALLBACK_URL',
        'http://localhost:4000/api/v1/auth/google/callback',
      )!,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const user = {
      provider: 'google' as const,
      providerUserId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      nickname: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    done(null, user);
  }
}
