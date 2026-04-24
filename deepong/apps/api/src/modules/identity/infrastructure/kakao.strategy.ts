import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  private readonly kakaoClientID: string;
  private readonly kakaoClientSecret: string;

  constructor(config: ConfigService) {
    const clientID = config.get<string>('KAKAO_CLIENT_ID')!;
    const clientSecret = config.get<string>('KAKAO_CLIENT_SECRET')!;

    super({
      authorizationURL: 'https://kauth.kakao.com/oauth/authorize',
      tokenURL: 'https://kauth.kakao.com/oauth/token',
      clientID,
      clientSecret,
      callbackURL: config.get<string>(
        'KAKAO_CALLBACK_URL',
        'http://localhost:4000/api/v1/auth/kakao/callback',
      )!,
    });

    this.kakaoClientID = clientID;
    this.kakaoClientSecret = clientSecret;

    // 토큰 교환을 직접 처리
    (this as any)._oauth2.getOAuthAccessToken = (
      code: string,
      params: Record<string, string>,
      callback: (err: Error | null, accessToken?: string, refreshToken?: string, results?: any) => void,
    ) => {
      const tokenParams: Record<string, string> = {
        grant_type: 'authorization_code',
        client_id: this.kakaoClientID,
        redirect_uri: params.redirect_uri,
        code,
      };
      if (this.kakaoClientSecret) {
        tokenParams.client_secret = this.kakaoClientSecret;
      }
      console.log('[Kakao Token Request]', { ...tokenParams, code: '***' });
      const body = new URLSearchParams(tokenParams);

      fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
        .then(async (res) => {
          const json = await res.json();
          if (json.error) {
            console.error('[Kakao Token Error]', json);
            return callback(new Error(`${json.error}: ${json.error_description}`));
          }
          callback(null, json.access_token, json.refresh_token, json);
        })
        .catch((err) => callback(err));
    };
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    _profile: unknown,
    done: (error: Error | null, user?: Record<string, unknown>) => void,
  ): Promise<void> {
    try {
      const res = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();

      const kakaoAccount = json.kakao_account ?? {};
      const kakaoProfile = kakaoAccount.profile ?? {};

      const user = {
        provider: 'kakao' as const,
        providerUserId: String(json.id),
        email: kakaoAccount.email ?? null,
        nickname: kakaoProfile.nickname ?? null,
        avatarUrl: kakaoProfile.profile_image_url ?? null,
      };

      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }
}
