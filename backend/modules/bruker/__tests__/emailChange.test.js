/**
 * Tester for e-postendring sikkerhet
 */

const controller = require('../controller');
const service = require('../service');

jest.mock('../service');
jest.mock('../../../shared/utils/userMapper', () => ({
  mapUserToResponse: (user) => user,
}));

describe('E-postendring sikkerhet', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: '2' },
      body: {},
      user: { id: 1, email: 'admin@test.com', roles: ['admin'] },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('Egen profil med passord', () => {
    beforeEach(() => {
      req.user = { id: 2, email: 'user@test.com', roles: ['user'] };
      req.params.id = '2';
    });

    it('skal kreve passord når bruker endrer sin egen e-post', async () => {
      req.body = {
        email: 'ny@test.com',
      };

      service.findById.mockResolvedValue({
        id: 2,
        email: 'user@test.com',
        password_hash: 'hashedpassword',
      });

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Du må bekrefte med nåværende passord for å endre e-post',
        requiresPassword: true,
      });
    });

    it('skal godta e-postendring med korrekt passord', async () => {
      req.body = {
        email: 'ny@test.com',
        currentPassword: 'riktigpassord',
      };

      service.findById.mockResolvedValue({
        id: 2,
        email: 'user@test.com',
        password_hash: 'hashedpassword',
      });
      service.verifyPassword.mockResolvedValue(true);
      service.findByEmail.mockResolvedValue(null); // E-post ikke i bruk
      service.update.mockResolvedValue({
        id: 2,
        email: 'ny@test.com',
        first_name: 'Test',
      });

      await controller.update(req, res);

      expect(service.verifyPassword).toHaveBeenCalledWith('riktigpassord', 'hashedpassword');
      expect(service.update).toHaveBeenCalledWith('2', expect.objectContaining({
        email: 'ny@test.com',
      }));
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ email: 'ny@test.com' }),
      });
    });

    it('skal avvise med feil passord', async () => {
      req.body = {
        email: 'ny@test.com',
        currentPassword: 'feilpassord',
      };

      service.findById.mockResolvedValue({
        id: 2,
        password_hash: 'hashedpassword',
      });
      service.verifyPassword.mockResolvedValue(false);

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Feil passord' });
    });
  });

  describe('Admin endrer andres e-post', () => {
    it('skal tillate admin å endre uten passord', async () => {
      req.body = {
        email: 'ny@test.com',
      };

      service.findById.mockResolvedValue({
        id: 2,
        email: 'user@test.com',
        password_hash: 'hashedpassword',
      });
      service.findByEmail.mockResolvedValue(null);
      service.update.mockResolvedValue({
        id: 2,
        email: 'ny@test.com',
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await controller.update(req, res);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Admin admin@test.com endret e-post')
      );
      expect(service.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('E-post allerede i bruk', () => {
    it('skal avvise hvis e-post allerede er registrert', async () => {
      req.body = {
        email: 'eksisterende@test.com',
      };

      service.findById.mockResolvedValue({
        id: 2,
        email: 'user@test.com',
      });
      service.findByEmail.mockResolvedValue({
        id: 999, // Annen bruker
        email: 'eksisterende@test.com',
      });

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'E-postadressen er allerede i bruk' 
      });
    });

    it('skal tillate å beholde samme e-post', async () => {
      req.body = {
        firstName: 'Nytt',
        email: 'user@test.com',
      };

      service.findById.mockResolvedValue({
        id: 2,
        email: 'user@test.com',
      });
      service.findByEmail.mockResolvedValue({
        id: 2, // Samme bruker
        email: 'user@test.com',
      });
      service.update.mockResolvedValue({
        id: 2,
        first_name: 'Nytt',
      });

      await controller.update(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('OAuth/kun talent brukere', () => {
    it('skal tillate admin å endre e-post for bruker uten passord', async () => {
      req.body = {
        email: 'ny@test.com',
      };

      service.findById.mockResolvedValue({
        id: 2,
        email: 'user@test.com',
        password_hash: null, // OAuth-bruker
      });
      service.findByEmail.mockResolvedValue(null);
      service.update.mockResolvedValue({
        id: 2,
        email: 'ny@test.com',
      });

      await controller.update(req, res);

      expect(service.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});

