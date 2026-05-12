type SeedScenario = "demo";
type SeedMode = "reset" | "clear";

export interface SeedConfig {
  enabled: boolean;
  scenario: SeedScenario;
  mode: SeedMode;
}

function parseScenario(value: string | undefined): SeedScenario {
  if (value === "demo") {
    return value;
  }

  throw new Error("SEED_SCENARIO must be set to demo");
}

function parseMode(value: string | undefined): SeedMode {
  if (value === "clear") {
    return value;
  }

  if (!value || value === "reset") {
    return "reset";
  }

  throw new Error("SEED_MODE must be reset or clear");
}

export function getSeedConfig(): SeedConfig {
  const enabled = process.env.ENABLE_DEMO_SEEDER === "true";

  if (!enabled) {
    throw new Error("Seeder execution is blocked unless ENABLE_DEMO_SEEDER=true");
  }

  return {
    enabled,
    scenario: parseScenario(process.env.SEED_SCENARIO),
    mode: parseMode(process.env.SEED_MODE)
  };
}
