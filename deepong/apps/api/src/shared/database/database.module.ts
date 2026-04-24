import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {UpperSnakeNamingStrategy} from './naming.strategy';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'mysql' as const,
                host: config.get<string>('DB_HOST', 'localhost'),
                port: parseInt(config.get<string>('DB_PORT', '3306'), 10),
                username: config.get<string>('DB_USERNAME', 'deepong'),
                password: config.get<string>('DB_PASSWORD', 'deepong'),
                database: config.get<string>('DB_NAME', 'deepong'),
                charset: 'utf8mb4',
                namingStrategy: new UpperSnakeNamingStrategy(),
                autoLoadEntities: true,
                synchronize: true,
                retryAttempts: 3,
                extra: {
                    enableCleartextPlugin: true,
                },
            }),
        }),
    ],
})
export class DatabaseModule {
}
