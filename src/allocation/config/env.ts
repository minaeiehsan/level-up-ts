const asInt = (str: string | undefined, varName: string): number => {
  if (!str) {
    return 0;
  }
  const num = parseInt(str, 10);
  if (Number.isNaN(num)) {
    throw new Error(`env.${varName} is expected to be number`);
  }
  return num;
};

const asBool = (str: string | undefined, varName: string): boolean => {
  if (!str) {
    return false;
  }
  if (str !== 'true' && str !== 'false') {
    throw new Error(
      `env.${varName} is expected to be either "true" or "false"`
    );
  }
  return str === 'true';
};

export const env = (
  varName: string,
  optional = false
): { asString: () => string; asInt: () => number; asBool: () => boolean } => {
  const variable = process.env[varName];
  if (!variable && !optional) {
    throw new Error(`env.${varName} is not set`);
  }
  return {
    asString: () => variable || '',
    asInt: () => asInt(variable, varName),
    asBool: () => asBool(variable, varName)
  };
};
