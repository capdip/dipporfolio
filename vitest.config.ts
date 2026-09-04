import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      ASTRA_DB_API_ENDPOINT: 'YOUR_ASTRA_DB_API_ENDPOINT',
      ASTRA_DB_APPLICATION_TOKEN: 'YOUR_ASTRA_DB_APPLICATION_TOKEN',
      JWT_SECRET: 'test_secret_for_testing_2026',
      NODE_ENV: 'test',
      PORT: '5000',
      FRONTEND_URL: 'http://localhost:5173',
      ADMIN_EMAIL: 'test@dipeshthapa.local',
      ADMIN_PASSWORD: 'TestPassword123',
      ADMIN_NAME: 'Test Admin',
      UPLOAD_DIR: 'uploads',
    },
    globals: false,
    include: ['tests/**/*.test.ts', 'server/src/**/*.test.ts'],
  },
});
