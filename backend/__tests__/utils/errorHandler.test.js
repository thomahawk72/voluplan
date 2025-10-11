const { asyncHandler, handleError } = require('../../shared/utils/errorHandler');

describe('Error Handler Utils', () => {
  describe('asyncHandler', () => {
    it('skal kjøre async funksjon uten error', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      const wrappedFn = asyncHandler(mockFn);
      await wrappedFn(mockReq, mockRes, mockNext);

      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('skal fange errors og kalle next', async () => {
      const testError = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(testError);
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      const wrappedFn = asyncHandler(mockFn);
      await wrappedFn(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
    });
  });

  describe('handleError', () => {
    let mockRes;
    let consoleErrorSpy;

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('skal håndtere standard error', () => {
      const error = new Error('Test error');
      const context = 'Test operation';

      handleError(error, mockRes, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Test operation error:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('skal bruke custom status code hvis satt', () => {
      const error = new Error('Test error');
      error.status = 400;
      const context = 'Validation';

      handleError(error, mockRes, context);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('skal bruke custom error message hvis satt', () => {
      const error = new Error('Custom error message');
      error.status = 404;
      const context = 'Find user';

      handleError(error, mockRes, context);

      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('skal default til 500 hvis status ikke er satt', () => {
      const error = new Error('Test error');
      const context = 'Test';

      handleError(error, mockRes, context);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});


