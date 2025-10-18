import { Keyboard } from "grammy";

/**
 * Clean interface - no persistent keyboard buttons
 * All navigation through commands only
 */

/**
 * Removes any persistent keyboard (clean interface)
 */
export function removeKeyboard(): { remove_keyboard: true } {
  return { remove_keyboard: true };
}