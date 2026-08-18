import { Request, Response } from 'express';
import { registerUser } from '../../../src/controllers/authController.js';
import { mockPrisma } from '../../helpers/prismaMock';

jest.mock('../../../src/config/prisma.js', () => ({
  prisma: mockPrisma,
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
}));

jest.mock('../../../src/utils/jwt.js', () => ({
  signToken: jest.fn().mockReturnValue('fake.jwt.token'),
}));

jest.mock('../../../src/config/logger.js', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

const mockReqRes = (body: any) => {
  const req = { body } as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
};

describe('registerUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 409 if email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@a.com' } as any);
    const { req, res } = mockReqRes({ name: 'A', email: 'a@a.com', password: 'pass1234' });

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('creates user and returns 201 with token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: '1',
      name: 'Prashant',
      email: 'p@p.com',
      role: 'USER',
      password: 'hashed_password_123',
    } as any);

    const { req, res } = mockReqRes({ name: 'Prashant', email: 'p@p.com', password: 'pass1234' });

    await registerUser(req, res);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { name: 'Prashant', email: 'p@p.com', password: 'hashed_password_123' },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User registered successfully',
        token: 'fake.jwt.token',
        user: expect.objectContaining({ email: 'p@p.com' }),
      })
    );
  });
});