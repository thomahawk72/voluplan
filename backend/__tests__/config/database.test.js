const { Pool } = require('pg');

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Database Configuration', () => {
  let mockPool;
  let errorHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Get the mocked pool instance
    const PoolConstructor = require('pg').Pool;
    mockPool = new PoolConstructor();
    
    // Capture error handler when database.js is loaded
    mockPool.on.mockImplementation((event, handler) => {
      if (event === 'error') {
        errorHandler = handler;
      }
    });
  });

  it('skal registrere error handler for pool', () => {
    require('../../shared/config/database');
    
    expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('skal logge error men IKKE avslutte prosessen', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    
    require('../../shared/config/database');
    
    // Simuler en database error
    const testError = new Error('Database connection lost');
    errorHandler(testError);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error on idle client', testError);
    expect(processExitSpy).not.toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('skal eksportere query funksjon', () => {
    const db = require('../../shared/config/database');
    
    expect(db.query).toBeDefined();
    expect(typeof db.query).toBe('function');
  });

  it('skal eksportere pool', () => {
    const db = require('../../shared/config/database');
    
    expect(db.pool).toBeDefined();
  });
});


