import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { User } from './domain/user.entity';
import { UserOAuth } from './domain/user-oauth.entity';
import { RefreshToken } from './domain/refresh-token.entity';
import { GoogleStrategy } from './infrastructure/google.strategy';
import { KakaoStrategy } from './infrastructure/kakao.strategy';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { TokenService } from './application/token.service';
import { SignupUseCase } from './application/signup.usecase';
import { LoginUseCase } from './application/login.usecase';
import { RefreshUseCase } from './application/refresh.usecase';
import { LogoutUseCase } from './application/logout.usecase';
import { OAuthLoginUseCase } from './application/oauth-login.usecase';
import { GetMeUseCase } from './application/get-me.usecase';
import { AuthController } from './interface/auth.controller';
import { MeController } from './interface/me.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserOAuth, RefreshToken]),
    PassportModule,
  ],
  controllers: [AuthController, MeController],
  providers: [
    GoogleStrategy,
    KakaoStrategy,
    TokenService,
    JwtAuthGuard,
    SignupUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    OAuthLoginUseCase,
    GetMeUseCase,
  ],
  exports: [TokenService, JwtAuthGuard],
})
export class IdentityModule {}
