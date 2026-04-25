import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface KakaoOAuthProfile {
  provider: 'kakao';
  providerUserId: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class KakaoStrategy {
  private readonly clientID: string;
  private readonly callbackURL: string;

  constructor(private readonly config: ConfigService) {
    this.clientID = config.get<string>('KAKAO_CLIENT_ID')!;
    this.callbackURL = config.get<string>(
      'KAKAO_CALLBACK_URL',
      'http://localhost:4000/api/v1/auth/kakao/callback',
    )!;
  }

  getAuthorizationURL(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientID,
      redirect_uri: this.callbackURL,
      scope: 'profile_nickname profile_image account_email',
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string): Promise<KakaoOAuthProfile> {
    const accessToken = await this.getAccessToken(code);
    return this.getUserProfile(accessToken);
  }

  private async getAccessToken(code: string): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientID,
      redirect_uri: this.callbackURL,
      code,
    });

    const res = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const json = await res.json();
    if (json.error) {
      throw new Error(`Kakao token error: ${json.error} - ${json.error_description}`);
    }

    return json.access_token;
  }

  private async getUserProfile(accessToken: string): Promise<KakaoOAuthProfile> {
    const res = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();

    const kakaoAccount = json.kakao_account ?? {};
    const kakaoProfile = kakaoAccount.profile ?? {};

    return {
      provider: 'kakao',
      providerUserId: String(json.id),
      email: kakaoAccount.email ?? null,
      nickname: kakaoProfile.nickname ?? null,
      avatarUrl: kakaoProfile.profile_image_url ?? null,
    };
  }
}
