import { Keyboard } from 'grammy';

import { BOT_CONFIG } from '../../config/botConfig';

/**
 * Main reply keyboard with navigation buttons
 */
export function createMainKeyboard(): Keyboard {
  return new Keyboard()
    .text(BOT_CONFIG.BUTTONS.SHOP)
    .text(BOT_CONFIG.BUTTONS.ORDERS)
    .row()
    .text(BOT_CONFIG.BUTTONS.PROFILE)
    .text(BOT_CONFIG.BUTTONS.SUPPORT)
    .row()
    .resized()
    .persistent();
}

/**
 * Back navigation keyboard for all sub-pages
 */
export function createBackKeyboard(): Keyboard {
  return new Keyboard().text(BOT_CONFIG.BUTTONS.BACK_TO_MENU).resized().persistent();
}

/**
 * Clean keyboard for setup processes
 */
export function removeKeyboard(): { remove_keyboard: true } {
  return { remove_keyboard: true };
}
