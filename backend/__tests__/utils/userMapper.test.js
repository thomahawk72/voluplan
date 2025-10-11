const { mapUserToResponse, mapUsersToResponse } = require('../../shared/utils/userMapper');

describe('User Mapper', () => {
  const mockDbUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    roles: ['user', 'admin'],
    talents: ['group1', 'group2'],
    is_active: true,
    created_at: new Date('2024-01-01'),
    password_hash: 'hashed_password_should_not_be_included',
    google_id: 'google123',
    facebook_id: 'facebook456',
  };

  describe('mapUserToResponse', () => {
    it('skal mappe database user til response format', () => {
      const result = mapUserToResponse(mockDbUser);

      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['user', 'admin'],
        talents: ['group1', 'group2'],
        isActive: true,
        createdAt: mockDbUser.created_at,
      });
    });

    it('skal IKKE inkludere sensitive felter', () => {
      const result = mapUserToResponse(mockDbUser);

      expect(result).not.toHaveProperty('password_hash');
      expect(result).not.toHaveProperty('google_id');
      expect(result).not.toHaveProperty('facebook_id');
    });

    it('skal håndtere user uten optional felter', () => {
      const minimalUser = {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        roles: [],
        talents: [],
        is_active: true,
        created_at: new Date('2024-01-02'),
      };

      const result = mapUserToResponse(minimalUser);

      expect(result).toEqual({
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        roles: [],
        talents: [],
        isActive: true,
        createdAt: minimalUser.created_at,
      });
    });
  });

  describe('mapUsersToResponse', () => {
    it('skal mappe array av users', () => {
      const users = [
        mockDbUser,
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          roles: ['user'],
          talents: [],
          is_active: false,
          created_at: new Date('2024-01-02'),
        },
      ];

      const result = mapUsersToResponse(users);

      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
      expect(result[1].firstName).toBe('Jane');
      expect(result[1].isActive).toBe(false);
    });

    it('skal håndtere tom array', () => {
      const result = mapUsersToResponse([]);
      expect(result).toEqual([]);
    });
  });
});


