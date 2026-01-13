import { db, initializeDatabase, clearDatabase } from '../database-utils';
import { taskCRUD } from '../crud-operations';
import { Task, SyncableEntity } from '../../types';

describe('Database Operations', () => {
  beforeEach(async () => {
    await clearDatabase();
    await initializeDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    db.close();
  });

  test('should create and retrieve a task', async () => {
    const taskData: Omit<Task, keyof SyncableEntity> = {
      title: 'Test Task',
      description: 'A test task',
      completed: false,
      priority: 'medium' as const,
      category: 'work'
    };

    const createdTask = await taskCRUD.createSyncable(taskData);
    expect(createdTask.id).toBeDefined();
    expect((createdTask as Task).title).toBe(taskData.title);
    expect(createdTask.createdAt).toBeDefined();
    expect(createdTask.updatedAt).toBeDefined();
    expect(createdTask.syncStatus).toBe('pending');
    expect(createdTask.version).toBe(1);

    const retrievedTask = await taskCRUD.getById(createdTask.id);
    expect(retrievedTask).toBeDefined();
    expect((retrievedTask as Task)?.title).toBe(taskData.title);
  });
});