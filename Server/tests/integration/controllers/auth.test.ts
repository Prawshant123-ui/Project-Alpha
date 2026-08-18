import request from 'supertest';
import { app } from '../../../src/app.js';
import { prisma } from '../../../src/config/prisma.js';

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Prashant',
      email: 'prashant@test.com',
      password: 'securepass123',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('prashant@test.com');

    const dbUser = await prisma.user.findUnique({ where: { email: 'prashant@test.com' } });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.password).not.toBe('securepass123'); // confirms it's hashed
  });

  it('returns 409 for duplicate email', async () => {
    await prisma.user.create({
      data: { name: 'Existing', email: 'dup@test.com', password: 'whatever' },
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'New',
      email: 'dup@test.com',
      password: 'securepass123',
    });

    expect(res.status).toBe(409);
  });
});