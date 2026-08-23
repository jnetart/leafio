import { expect, test } from '@playwright/test';

test('shows welcome screen before workspace is opened', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Leafio' })).toBeVisible();
  await expect(page.getByRole('button', { name: '新建文档' })).toBeVisible();
  await expect(page.getByRole('button', { name: '打开文件夹…' })).toBeVisible();
  await expect(page.getByRole('button', { name: '打开文件…' })).toBeVisible();
});
