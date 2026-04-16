import { test, expect } from '@playwright/test';

test.describe('Task Management Tests', () => {
  test('should load the main task page', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page).toHaveTitle('任务管理');
    await expect(page.locator('h1')).toContainText('任务管理');
  });

  test('should show create task form when button is clicked', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.click('text=创建任务');
    await expect(page.locator('h2')).toContainText('创建新任务');
  });

  test('should have network status indicator', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page.locator('.inline-flex.items-center.px-3.py-1.rounded-full.text-sm.font-medium')).toBeVisible();
  });

  test('should have manual sync button', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page.locator('button:has-text("手动同步")')).toBeVisible();
  });
});