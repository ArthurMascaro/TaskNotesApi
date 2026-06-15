import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RedisService } from '../redis/redis.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  private readonly tasksCacheKey = 'tasks:list';

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description ?? null,
      status: TaskStatus.Pending,
    });

    const createdTask = await this.tasksRepository.save(task);

    await this.invalidateTasksCache();

    return createdTask;
  }

  async findAll(): Promise<Task[]> {
    const cachedTasks = await this.redisService.get<Task[]>(this.tasksCacheKey);

    if (cachedTasks) {
      return cachedTasks;
    }

    const tasks = await this.tasksRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    const ttl = Number(this.configService.get<string>('REDIS_TTL', '30'));

    await this.redisService.set(this.tasksCacheKey, tasks, ttl);

    return tasks;
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (updateTaskDto.title !== undefined) {
      task.title = updateTaskDto.title;
    }

    if (updateTaskDto.description !== undefined) {
      task.description = updateTaskDto.description;
    }

    const updatedTask = await this.tasksRepository.save(task);

    await this.invalidateTasksCache();

    return updatedTask;
  }

  async markAsDone(id: string): Promise<Task> {
    const task = await this.findOne(id);
    task.status = TaskStatus.Done;

    const updatedTask = await this.tasksRepository.save(task);

    await this.invalidateTasksCache();

    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);

    await this.tasksRepository.remove(task);

    await this.invalidateTasksCache();
  }

  private async invalidateTasksCache(): Promise<void> {
    await this.redisService.del(this.tasksCacheKey);
  }
}