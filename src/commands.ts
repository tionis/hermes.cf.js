/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */
import {APIApplicationCommandOption, ApplicationCommandType, Locale } from "discord-api-types/v10";

interface ApplicationCommandDefinition {
  type: ApplicationCommandType;
  name: string;
  name_localizations?: Partial<Record<Locale, string | null>>;
  description: string;
  description_localizations?: Partial<Record<Locale, string | null>>;
  options?: APIApplicationCommandOption[] | undefined
  default_member_permissions: string | null;
}


const INVITE_COMMAND: ApplicationCommandDefinition = {
  type: ApplicationCommandType.ChatInput,
  name: "invite",
  description: "Get an invite link to add the bot to your server",
  default_member_permissions: null,
};

const ROLL_COMMAND: ApplicationCommandDefinition = {
  type: ApplicationCommandType.ChatInput,
  name: "roll",
  name_localizations: {
    "fr": "lancer",
    "es-ES": "tirar",
    "de": "würfeln",
  },
  description: "Roll some dice according to a roll20 style dice formula",
  description_localizations: {
    "fr": "Lancer des dés selon une formule de dés de style roll20",
    "es-ES": "Tira unos dados según una fórmula de dados de estilo roll20",
    "de": "Würfeln Sie einige Würfel nach einer Roll20-Stil-Würfelformel",
  },
  options: [
    {
      name: "dice",
      description: "The dice formula to roll",
      type: 3,
      required: true,
      autocomplete: false, // Might be enabled in the future based on prior rolls or saved templates
    },
  ],
  default_member_permissions: null,
};

export { INVITE_COMMAND, ROLL_COMMAND };
