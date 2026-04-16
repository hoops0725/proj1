import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/login');
    await expect(page).toHaveTitle('登录');
    await expect(page.locator('h1')).toContainText('登录');
  });

  test('should load the register page', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/register');
    await expect(page).toHaveTitle('注册');
    await expect(page.locator('h1')).toContainText('注册');
  });

  test('should load the forgot password page', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/forgot-password');
    await expect(page).toHaveTitle('忘记密码');
    await expect(page.locator('h1')).toContainText('忘记密码');
  });
});