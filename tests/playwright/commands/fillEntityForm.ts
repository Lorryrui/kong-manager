import type { Page } from '@playwright/test'

import { selectOption } from './selectOption'

interface Params {
  page: Page;

  formData?: Record<string, string | Array<string>>;

  /**
   * The action to perform after filling in the form.
   * If omitted, no actions will be performed.
   */
  withAction?: 'submit' | 'cancel';

  method?: 'type' | 'fill';

  /**
   * If set to true, the helper assumes that a model will show up after performing the `*-submit` action.
   * And the primary button on the modal will be clicked.
   */
  handleModal?: boolean;
}

export const fillEntityForm = async (params: Params) => {
  const {
    page,
    formData = {},
    withAction,
    method = 'type',
    handleModal,
  } = params

  for (const [key, value] of Object.entries(formData)) {
    // for select
    if (await page.locator(`[data-testid="${key}"] .k-select`).isVisible()) {
      const val = Array.isArray(value) ? value : [value]

      for (const item of val) {
        await selectOption(page.locator(`[data-testid="${key}"]`), item)
      }

      continue
    }

    // for text input
    if (typeof value === 'string') {
      await page.getByTestId(key).or(page.locator(`#${key}`))[method](value)
    }

    if (value && value.constructor === Array) {
      for (const [index, item] of value.entries()) {
        await page.click(`[data-testid="add-${key}"]`)
        await page.waitForSelector(`[data-testid="${key}-item-${index}"] input`)
        await page[method](`[data-testid="${key}-item-${index}"] input`, item)
      }
    }
  }

  if (!withAction) {
    return
  }

  await page.getByTestId(`form-${withAction}`)
    .or(page.getByTestId(`form-footer-action-${withAction}`))
    .click()

  if (handleModal) {
    await page.locator('.modal-dialog .k-button.primary').click()
  }
}
