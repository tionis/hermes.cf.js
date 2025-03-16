/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */
import { APIApplicationCommand } from "discord-api-types/v10";

const INVITE_COMMAND: APIApplicationCommand = {
  name: "invite",
  description: "Get an invite link to add the bot to your server",
};

const ROLL_COMMAND: APIApplicationCommand = {
  name: "roll",
  name_localizations: {
    "fr": "lancer",
    "es": "tirar",
    "de": "würfeln",
  },
  description: "Roll some dice according to a roll20 style dice formula",
  description_localizations: {
    "fr": "Lancer des dés selon une formule de dés de style roll20",
    "es": "Tira unos dados según una fórmula de dados de estilo roll20",
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
};

export { INVITE_COMMAND, ROLL_COMMAND };
