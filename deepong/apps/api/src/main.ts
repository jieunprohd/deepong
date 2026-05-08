import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — WEB_ORIGIN 환경변수로 허용 도메인 제어
  //  '*'           : 모든 도메인 허용 (데모/개발)
  //  콤마 구분 리스트: 'http://localhost:3000,https://app.deepong.com'
  //  미설정         : true (요청 origin 그대로 반사)
  const webOrigin = process.env.WEB_ORIGIN;
  app.enableCors({
    origin: parseCorsOrigin(webOrigin),
    credentials: true,
  });

  const port = parseInt(process.env.PORT ?? '4000', 10);
  await app.listen(port);
}

function parseCorsOrigin(value: string | undefined): boolean | string | string[] {
  if (!value || value === '*') return true;
  const list = value.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length === 1 ? list[0] : list;
}

bootstrap();
