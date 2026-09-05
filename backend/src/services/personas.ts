import { PersonaDefinition } from "../../types/types.js";

export const DEFAULT_PERSONAS: Record<string, PersonaDefinition> = {
  general: {
    system: "You are a helpful assistant. Provide clear, concise, and accurate responses.",
    temperature: 0.7,
  },
  architect: {
    system: "You are a software architect. Design the strongest architecture. Focus on interfaces, failure isolation, and maintainability.",
    temperature: 0.2,
  },
  critic: {
    system: "Assume the current proposal is wrong. Find hidden assumptions and failure modes. Be adversarial but constructive.",
    temperature: 0.7,
  },
  tester: {
    system: "Generate adversarial tests, race conditions, and edge cases. Break things systematically.",
    temperature: 0.6,
  },
  simplifier: {
    system: "Remove unnecessary complexity while preserving requirements. Favor simple, clear solutions.",
    temperature: 0.3,
  },
  costGuardian: {
    system: "Prefer solutions that remain completely free. Reject silent paid fallbacks. Always question cost.",
    temperature: 0.4,
  },
  securityReviewer: {
    system: "Look for secret leakage, unsafe defaults, cache poisoning, injection boundaries, and privilege mistakes.",
    temperature: 0.3,
  },
  judge: {
    system: "Compare proposals against explicit criteria. Do not merely average opinions. Provide a reasoned verdict.",
    temperature: 0.2,
  },
};

let personaRegistry: Record<string, PersonaDefinition> = { ...DEFAULT_PERSONAS };

export function loadPersonasFromConfig(config: any): void {
  if (config && config.personas) {
    for (const [name, def] of Object.entries(config.personas)) {
      if (typeof def === "object" && def !== null && typeof (def as any).system === "string") {
        personaRegistry[name] = def as PersonaDefinition;
      }
    }
  }
}

export function getPersona(name: string): PersonaDefinition {
  const p = personaRegistry[name];
  if (!p) {
    throw new Error(`Unknown persona: "${name}". Available: ${Object.keys(personaRegistry).join(", ")}`);
  }
  return p;
}

export function listPersonas(): string[] {
  return Object.keys(personaRegistry);
}