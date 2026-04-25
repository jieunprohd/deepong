import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { SignupUseCase } from '../application/signup.usecase';
import { LoginUseCase } from '../application/login.usecase';
import { RefreshUseCase } from '../application/refresh.usecase';
import { LogoutUseCase } from '../application/logout.usecase';
import { OAuthLoginUseCase } from '../application/oauth-login.usecase';
import { KakaoStrategy } from '../infrastructure/kakao.strategy';
import { SignupDto } from '../application/dto/signup.dto';
import { LoginDto } from '../application/dto/login.dto';
import { RefreshDto } from '../application/dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signupUseCase: SignupUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly oauthLoginUseCase: OAuthLoginUseCase,
    private readonly kakaoStrategy: KakaoStrategy,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.signupUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.refreshUseCase.execute(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshDto) {
    await this.logoutUseCase.execute(dto);
    return { message: '로그아웃되었습니다.' };
  }

  // ---- Google OAuth ----

  @Get('google')
  @UseGuards(AuthGuard('google'))
  google(): void {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.handleOAuthCallback(req, res);
  }

  // ---- Kakao OAuth (Passport 미사용, 직접 구현) ----

  @Get('kakao')
  kakao(@Res() res: Response): void {
    res.redirect(this.kakaoStrategy.getAuthorizationURL());
  }

  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const profile = await this.kakaoStrategy.exchangeCodeForProfile(code);

      const result = await this.oauthLoginUseCase.execute({
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email ?? '',
        nickname: profile.nickname ?? profile.email?.split('@')[0] ?? 'user',
        avatarUrl: profile.avatarUrl,
      });

      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      res.redirect(`http://localhost:3000/auth/callback?${params.toString()}`);
    } catch (err) {
      console.error('[Kakao Callback Error]', err);
      res.redirect(
        `http://localhost:3000/auth?error=${encodeURIComponent(String(err))}`,
      );
    }
  }

  // ---- OAuth 공통 (Google용) ----

  private async handleOAuthCallback(
    req: Request,
    res: Response,
  ): Promise<void> {
    const profile = req.user as {
      provider: string;
      providerUserId: string;
      email: string;
      nickname: string;
      avatarUrl: string | null;
    };

    const result = await this.oauthLoginUseCase.execute({
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      nickname: profile.nickname ?? profile.email?.split('@')[0] ?? 'user',
      avatarUrl: profile.avatarUrl,
    });

    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.redirect(`http://localhost:3000/auth/callback?${params.toString()}`);
  }
}
