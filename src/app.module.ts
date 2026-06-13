import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: Number(configService.get<string>('POSTGRES_PORT', '5432')),
        username: configService.get<string>('POSTGRES_USER', 'admin'),
        password: configService.get<string>('POSTGRES_PASSWORD', 'admin'),
        database: configService.get<string>('POSTGRES_DB', 'task_notes'),
        autoLoadEntities: true,
        synchronize:
          configService.get<string>('TYPEORM_SYNCHRONIZE', 'true') === 'true',
      }),
    }),
    TasksModule,
  ],
})
export class AppModule {}
