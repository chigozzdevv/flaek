export interface BlockInput {
  name: string;
  type: 'u8' | 'u16' | 'u32' | 'u64' | 'bool' | 'array' | 'struct';
  description: string;
  required: boolean;
  default?: any;
  min?: number;
  max?: number;
  arrayLength?: number;
}

export interface BlockOutput {
  name: string;
  type: 'u8' | 'u16' | 'u32' | 'u64' | 'bool' | 'struct';
  description: string;
}

export interface BlockDefinition {
  id: string;
  name: string;
  category: 'math' | 'comparison' | 'logical' | 'statistical' | 'use_case' | 'control_flow';
  description: string;
  circuit: string; // Arcium circuit name
  inputs: BlockInput[];
  outputs: BlockOutput[];
  compDefOffset?: number;
  icon?: string;
  color?: string;
  examples?: Array<{ name: string; inputs: any; expected: any }>;
  tags?: string[];
}

export const BLOCKS_REGISTRY: BlockDefinition[] = [
  {
    id: 'add',
    name: 'Add',
    category: 'math',
    description: 'Add two numbers together',
    circuit: 'add',
    compDefOffset: 3277495934,
    inputs: [
      { name: 'a', type: 'u64', description: 'First number', required: true },
      { name: 'b', type: 'u64', description: 'Second number', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Sum of a and b' },
    ],
    icon: 'Plus',
    color: '#3B82F6',
    examples: [
      { name: 'Simple addition', inputs: { a: 10, b: 20 }, expected: { result: 30 } },
    ],
    tags: ['basic', 'arithmetic'],
  },
  {
    id: 'subtract',
    name: 'Subtract',
    category: 'math',
    description: 'Subtract second number from first',
    circuit: 'subtract',
    compDefOffset: 3139749404,
    inputs: [
      { name: 'a', type: 'u64', description: 'Number to subtract from', required: true },
      { name: 'b', type: 'u64', description: 'Number to subtract', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Difference (a - b)' },
    ],
    icon: 'Minus',
    color: '#3B82F6',
    tags: ['basic', 'arithmetic'],
  },
  {
    id: 'multiply',
    name: 'Multiply',
    category: 'math',
    description: 'Multiply two numbers',
    circuit: 'multiply',
    compDefOffset: 1639723277,
    inputs: [
      { name: 'a', type: 'u64', description: 'First number', required: true },
      { name: 'b', type: 'u64', description: 'Second number', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Product of a and b' },
    ],
    icon: 'X',
    color: '#3B82F6',
    tags: ['basic', 'arithmetic'],
  },
  {
    id: 'divide',
    name: 'Divide',
    category: 'math',
    description: 'Divide first number by second',
    circuit: 'divide',
    compDefOffset: 3212399753,
    inputs: [
      { name: 'a', type: 'u64', description: 'Dividend', required: true },
      { name: 'b', type: 'u64', description: 'Divisor', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Quotient (a / b)' },
    ],
    icon: 'Divide',
    color: '#3B82F6',
    tags: ['basic', 'arithmetic'],
  },
  {
    id: 'modulo',
    name: 'Modulo',
    category: 'math',
    description: 'Get remainder of division',
    circuit: 'modulo',
    compDefOffset: 958283923,
    inputs: [
      { name: 'a', type: 'u64', description: 'Dividend', required: true },
      { name: 'b', type: 'u64', description: 'Divisor', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Remainder (a % b)' },
    ],
    icon: 'Percent',
    color: '#3B82F6',
    tags: ['arithmetic'],
  },
  {
    id: 'power',
    name: 'Power',
    category: 'math',
    description: 'Raise base to exponent (max exponent 10)',
    circuit: 'power',
    compDefOffset: 3977631495,
    inputs: [
      { name: 'base', type: 'u64', description: 'Base number', required: true },
      { name: 'exponent', type: 'u8', description: 'Exponent (max 255)', required: true, max: 255 },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'base^exponent' },
    ],
    icon: 'Superscript',
    color: '#3B82F6',
    tags: ['arithmetic', 'advanced'],
  },
  {
    id: 'abs_diff',
    name: 'Absolute Difference',
    category: 'math',
    description: 'Get absolute difference between two numbers',
    circuit: 'abs_diff',
    compDefOffset: 1267961890,
    inputs: [
      { name: 'a', type: 'u64', description: 'First number', required: true },
      { name: 'b', type: 'u64', description: 'Second number', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: '|a - b|' },
    ],
    icon: 'MoveVertical',
    color: '#3B82F6',
    tags: ['arithmetic'],
  },
  {
    id: 'greater_than',
    name: 'Greater Than',
    category: 'comparison',
    description: 'Check if first number is greater than second',
    circuit: 'greater_than',
    compDefOffset: 2468853547,
    inputs: [
      { name: 'a', type: 'u64', description: 'First number', required: true },
      { name: 'b', type: 'u64', description: 'Second number', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if a > b, else 0' },
    ],
    icon: 'ChevronRight',
    color: '#10B981',
    tags: ['comparison', 'logic'],
  },
  {
    id: 'less_than',
    name: 'Less Than',
    category: 'comparison',
    description: 'Check if first number is less than second',
    circuit: 'less_than',
    compDefOffset: 2625294360,
    inputs: [
      { name: 'a', type: 'u64', description: 'First number', required: true },
      { name: 'b', type: 'u64', description: 'Second number', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if a < b, else 0' },
    ],
    icon: 'ChevronLeft',
    color: '#10B981',
    tags: ['comparison', 'logic'],
  },
  {
    id: 'equal',
    name: 'Equal',
    category: 'comparison',
    description: 'Check if two numbers are equal',
    circuit: 'equal',
    compDefOffset: 516806393,
    inputs: [
      { name: 'a', type: 'u64', description: 'First number', required: true },
      { name: 'b', type: 'u64', description: 'Second number', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if a == b, else 0' },
    ],
    icon: 'Equal',
    color: '#10B981',
    tags: ['comparison', 'logic'],
  },
  {
    id: 'greater_equal',
    name: 'Greater Than or Equal',
    category: 'comparison',
    description: 'Check if first number is greater than or equal to second',
    circuit: 'greater_equal',
    compDefOffset: 3981472816,
    inputs: [
      { name: 'a', type: 'u64', description: 'First number', required: true },
      { name: 'b', type: 'u64', description: 'Second number', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if a >= b, else 0' },
    ],
    icon: 'ChevronRight',
    color: '#10B981',
    tags: ['comparison', 'logic'],
  },
  {
    id: 'less_equal',
    name: 'Less Than or Equal',
    category: 'comparison',
    description: 'Check if first number is less than or equal to second',
    circuit: 'less_equal',
    compDefOffset: 2196857906,
    inputs: [
      { name: 'a', type: 'u64', description: 'First number', required: true },
      { name: 'b', type: 'u64', description: 'Second number', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if a <= b, else 0' },
    ],
    icon: 'ChevronLeft',
    color: '#10B981',
    tags: ['comparison', 'logic'],
  },
  {
    id: 'in_range',
    name: 'In Range',
    category: 'comparison',
    description: 'Check if value is within range [min, max]',
    circuit: 'in_range',
    compDefOffset: 2543242064,
    inputs: [
      { name: 'value', type: 'u64', description: 'Value to check', required: true },
      { name: 'min', type: 'u64', description: 'Minimum value (inclusive)', required: true },
      { name: 'max', type: 'u64', description: 'Maximum value (inclusive)', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if min <= value <= max, else 0' },
    ],
    icon: 'Scale',
    color: '#10B981',
    tags: ['comparison', 'validation'],
  },
  {
    id: 'and',
    name: 'AND',
    category: 'logical',
    description: 'Logical AND operation',
    circuit: 'and',
    compDefOffset: 454099298,
    inputs: [
      { name: 'a', type: 'u8', description: 'First boolean (0 or 1)', required: true },
      { name: 'b', type: 'u8', description: 'Second boolean (0 or 1)', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if both true, else 0' },
    ],
    icon: 'Ampersand',
    color: '#8B5CF6',
    tags: ['logic', 'boolean'],
  },
  {
    id: 'or',
    name: 'OR',
    category: 'logical',
    description: 'Logical OR operation',
    circuit: 'or',
    compDefOffset: 2052158833,
    inputs: [
      { name: 'a', type: 'u8', description: 'First boolean (0 or 1)', required: true },
      { name: 'b', type: 'u8', description: 'Second boolean (0 or 1)', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if either true, else 0' },
    ],
    icon: 'GitBranch',
    color: '#8B5CF6',
    tags: ['logic', 'boolean'],
  },
  {
    id: 'not',
    name: 'NOT',
    category: 'logical',
    description: 'Logical NOT operation',
    circuit: 'not',
    compDefOffset: 2075740965,
    inputs: [
      { name: 'a', type: 'u8', description: 'Boolean value (0 or 1)', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if false, 0 if true' },
    ],
    icon: 'Ban',
    color: '#8B5CF6',
    tags: ['logic', 'boolean'],
  },
  {
    id: 'xor',
    name: 'XOR',
    category: 'logical',
    description: 'Logical XOR (exclusive OR) operation',
    circuit: 'xor',
    compDefOffset: 3173110554,
    inputs: [
      { name: 'a', type: 'u8', description: 'First boolean (0 or 1)', required: true },
      { name: 'b', type: 'u8', description: 'Second boolean (0 or 1)', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if exactly one is true, else 0' },
    ],
    icon: 'Shuffle',
    color: '#8B5CF6',
    tags: ['logic', 'boolean'],
  },
  {
    id: 'if_else',
    name: 'If-Else',
    category: 'logical',
    description: 'Conditional selection (ternary operator)',
    circuit: 'if_else',
    compDefOffset: 3224992196,
    inputs: [
      { name: 'condition', type: 'u8', description: 'Condition (0 or 1)', required: true },
      { name: 'true_value', type: 'u64', description: 'Value if condition is true', required: true },
      { name: 'false_value', type: 'u64', description: 'Value if condition is false', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Selected value based on condition' },
    ],
    icon: 'GitBranch',
    color: '#8B5CF6',
    tags: ['control_flow', 'conditional'],
  },
  {
    id: 'average',
    name: 'Average',
    category: 'statistical',
    description: 'Calculate average of up to 10 numbers',
    circuit: 'average',
    compDefOffset: 922307864,
    inputs: [
      { name: 'values', type: 'array', description: 'Array of values', required: true, arrayLength: 10 },
      { name: 'count', type: 'u8', description: 'Number of valid values (1-10)', required: true, min: 1, max: 10 },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Average value' },
    ],
    icon: 'TrendingUp',
    color: '#F59E0B',
    tags: ['statistics', 'aggregation'],
  },
  {
    id: 'sum',
    name: 'Sum',
    category: 'statistical',
    description: 'Calculate sum of up to 10 numbers',
    circuit: 'sum',
    compDefOffset: 4026529033,
    inputs: [
      { name: 'values', type: 'array', description: 'Array of values', required: true, arrayLength: 10 },
      { name: 'count', type: 'u8', description: 'Number of valid values (1-10)', required: true, min: 1, max: 10 },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Sum of all values' },
    ],
    icon: 'Sigma',
    color: '#F59E0B',
    tags: ['statistics', 'aggregation'],
  },
  {
    id: 'min',
    name: 'Minimum',
    category: 'statistical',
    description: 'Find minimum value in array',
    circuit: 'min',
    compDefOffset: 4138102559,
    inputs: [
      { name: 'values', type: 'array', description: 'Array of values', required: true, arrayLength: 10 },
      { name: 'count', type: 'u8', description: 'Number of valid values (1-10)', required: true, min: 1, max: 10 },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Minimum value' },
    ],
    icon: 'ArrowDown',
    color: '#F59E0B',
    tags: ['statistics', 'aggregation'],
  },
  {
    id: 'max',
    name: 'Maximum',
    category: 'statistical',
    description: 'Find maximum value in array',
    circuit: 'max',
    compDefOffset: 1077587867,
    inputs: [
      { name: 'values', type: 'array', description: 'Array of values', required: true, arrayLength: 10 },
      { name: 'count', type: 'u8', description: 'Number of valid values (1-10)', required: true, min: 1, max: 10 },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Maximum value' },
    ],
    icon: 'ArrowUp',
    color: '#F59E0B',
    tags: ['statistics', 'aggregation'],
  },
  {
    id: 'median',
    name: 'Median (Approximation)',
    category: 'statistical',
    description: 'Returns average as median approximation',
    circuit: 'median',
    compDefOffset: 396793464,
    inputs: [
      { name: 'values', type: 'array', description: 'Array of values', required: true, arrayLength: 10 },
      { name: 'count', type: 'u8', description: 'Number of valid values (1-10)', required: true, min: 1, max: 10 },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Median value' },
    ],
    icon: 'Activity',
    color: '#F59E0B',
    tags: ['statistics', 'aggregation'],
  },
  {
    id: 'credit_score',
    name: 'Credit Score',
    category: 'use_case',
    description: 'Calculate credit score and approval status',
    circuit: 'credit_score',
    compDefOffset: 974272761,
    inputs: [
      { name: 'income', type: 'u64', description: 'Annual income', required: true },
      { name: 'debt', type: 'u64', description: 'Total debt amount', required: true },
      { name: 'credit_history', type: 'u8', description: 'Years of credit history', required: true },
      { name: 'missed_payments', type: 'u8', description: 'Number of missed payments', required: true },
    ],
    outputs: [
      { name: 'score', type: 'u16', description: 'Credit score (300-850)' },
      { name: 'approved', type: 'u8', description: '1 if approved, 0 if rejected' },
    ],
    icon: 'CreditCard',
    color: '#EF4444',
    examples: [
      {
        name: 'Good credit',
        inputs: { income: 75000, debt: 15000, credit_history: 10, missed_payments: 0 },
        expected: { score: 780, approved: 1 },
      },
    ],
    tags: ['finance', 'credit', 'scoring'],
  },
  {
    id: 'health_risk',
    name: 'Health Risk Assessment',
    category: 'use_case',
    description: 'Assess health risk based on lifestyle factors',
    circuit: 'health_risk',
    compDefOffset: 3701593828,
    inputs: [
      { name: 'age', type: 'u8', description: 'Age in years', required: true },
      { name: 'bmi', type: 'u8', description: 'Body Mass Index', required: true },
      { name: 'smoker', type: 'u8', description: '1 if smoker, 0 if non-smoker', required: true },
      { name: 'exercise_hours', type: 'u8', description: 'Exercise hours per week', required: true },
      { name: 'family_history', type: 'u8', description: '1 if family history, 0 otherwise', required: true },
    ],
    outputs: [
      { name: 'risk_score', type: 'u8', description: 'Risk score (0-100)' },
      { name: 'risk_category', type: 'u8', description: '0=low, 1=medium, 2=high, 3=critical' },
    ],
    icon: 'Heart',
    color: '#EC4899',
    examples: [
      {
        name: 'Low risk',
        inputs: { age: 30, bmi: 22, smoker: 0, exercise_hours: 5, family_history: 0 },
        expected: { risk_score: 15, risk_category: 0 },
      },
    ],
    tags: ['health', 'insurance', 'risk'],
  },
  {
    id: 'vote_tally',
    name: 'Vote Tally',
    category: 'use_case',
    description: 'Anonymous voting/survey response',
    circuit: 'vote_tally',
    compDefOffset: 1697330667,
    inputs: [
      { name: 'vote', type: 'u8', description: '0 for no, 1 for yes', required: true, min: 0, max: 1 },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: 'Vote value (to be aggregated)' },
    ],
    icon: 'Vote',
    color: '#6366F1',
    tags: ['voting', 'survey', 'governance'],
  },
  {
    id: 'meets_threshold',
    name: 'Threshold Check',
    category: 'use_case',
    description: 'Check if value meets or exceeds threshold',
    circuit: 'meets_threshold',
    compDefOffset: 2211568153,
    inputs: [
      { name: 'value', type: 'u64', description: 'Value to check', required: true },
      { name: 'threshold', type: 'u64', description: 'Threshold value', required: true },
    ],
    outputs: [
      { name: 'result', type: 'u8', description: '1 if value >= threshold, else 0' },
    ],
    icon: 'Lock',
    color: '#14B8A6',
    tags: ['access_control', 'validation'],
  },
  {
    id: 'weighted_average',
    name: 'Weighted Average',
    category: 'use_case',
    description: 'Calculate weighted average of values',
    circuit: 'weighted_average',
    compDefOffset: 4270605415,
    inputs: [
      { name: 'values', type: 'array', description: 'Array of 5 values', required: true, arrayLength: 5 },
      { name: 'weights', type: 'array', description: 'Array of 5 weights', required: true, arrayLength: 5 },
    ],
    outputs: [
      { name: 'result', type: 'u64', description: 'Weighted average' },
    ],
    icon: 'Scale',
    color: '#F59E0B',
    tags: ['statistics', 'ml', 'scoring'],
  },
];

// Helper functions
export function getBlockById(id: string): BlockDefinition | undefined {
  return BLOCKS_REGISTRY.find(b => b.id === id);
}

export function getBlocksByCategory(category: BlockDefinition['category']): BlockDefinition[] {
  return BLOCKS_REGISTRY.filter(b => b.category === category);
}

export function getBlocksByTag(tag: string): BlockDefinition[] {
  return BLOCKS_REGISTRY.filter(b => b.tags?.includes(tag));
}

export function searchBlocks(query: string): BlockDefinition[] {
  const lowerQuery = query.toLowerCase();
  return BLOCKS_REGISTRY.filter(b =>
    b.name.toLowerCase().includes(lowerQuery) ||
    b.description.toLowerCase().includes(lowerQuery) ||
    b.tags?.some(t => t.includes(lowerQuery))
  );
}
