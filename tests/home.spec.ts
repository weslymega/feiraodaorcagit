import { test, expect } from '@playwright/test';

test('deve fazer login com sucesso', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Seu e-mail')
    .fill('nininha@gmail.com');

  await page.getByPlaceholder('Sua senha')
    .fill('123456');

  await page.getByRole('button', { name: 'Entrar' }).click();

  // espera algo da home aparecer
  await expect(page.getByRole('button', { name: 'Anunciar' }))
    .toBeVisible();
});
