const { createOAuthCallbackHandler } = require('../../shared/utils/oauthHelpers');

describe('OAuth Helpers', () => {
  describe('createOAuthCallbackHandler', () => {
    let mockReq, mockRes, mockGenerateToken;

    beforeEach(() => {
      mockReq = {
        user: { id: 1 },
      };
      mockRes = {
        redirect: jest.fn(),
      };
      mockGenerateToken = jest.fn().mockReturnValue('mock_token_12345');
      process.env.FRONTEND_URL = 'http://localhost:3000';
    });

    it('skal generere token og redirecte til frontend', () => {
      const handler = createOAuthCallbackHandler(mockGenerateToken);
      
      handler(mockReq, mockRes);

      expect(mockGenerateToken).toHaveBeenCalledWith(1);
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mock_token_12345'
      );
    });

    it('skal bruke user ID fra request', () => {
      mockReq.user.id = 42;
      const handler = createOAuthCallbackHandler(mockGenerateToken);
      
      handler(mockReq, mockRes);

      expect(mockGenerateToken).toHaveBeenCalledWith(42);
    });

    it('skal håndtere ulike FRONTEND_URL verdier', () => {
      process.env.FRONTEND_URL = 'https://production.com';
      const handler = createOAuthCallbackHandler(mockGenerateToken);
      
      handler(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'https://production.com/auth/callback?token=mock_token_12345'
      );
    });
  });
});


