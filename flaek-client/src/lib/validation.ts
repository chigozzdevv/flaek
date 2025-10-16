/**
 * Client-side validation utilities
 * Matches server-side validation logic using JSON Schema
 */

export interface ValidationError {
  field: string
  message: string
  value?: any
}

/**
 * Validates inputs against operation schema (JSON Schema format)
 * This matches the server's AJV validation approach
 */
export function validateInputs(
  inputs: Record<string, any>,
  operation: { inputs?: string[] }
): ValidationError[] {
  const errors: ValidationError[] = []

  if (!operation.inputs || operation.inputs.length === 0) {
    return errors
  }

  // Check required inputs
  for (const inputName of operation.inputs) {
    const value = inputs[inputName]

    // Required field check
    if (value === undefined || value === null || value === '') {
      errors.push({
        field: inputName,
        message: `${inputName} is required`,
      })
      continue
    }

    // Type validation - must be numeric for Arcium circuits
    const numValue = Number(value)
    if (isNaN(numValue)) {
      errors.push({
        field: inputName,
        message: `${inputName} must be a valid number`,
        value,
      })
      continue
    }

    // Range validation for u64 (Arcium's most common type)
    if (numValue < 0) {
      errors.push({
        field: inputName,
        message: `${inputName} must be a positive number (u64 type)`,
        value: numValue,
      })
      continue
    }

    // JavaScript safe integer limit (2^53 - 1)
    // Actual u64 max is 2^64-1, but JS BigInt will handle conversion
    if (numValue > Number.MAX_SAFE_INTEGER) {
      errors.push({
        field: inputName,
        message: `${inputName} exceeds maximum safe integer (${Number.MAX_SAFE_INTEGER})`,
        value: numValue,
      })
      continue
    }

    // Check for decimal values (Arcium circuits expect integers)
    if (!Number.isInteger(numValue)) {
      errors.push({
        field: inputName,
        message: `${inputName} must be an integer (no decimals)`,
        value: numValue,
      })
    }
  }

  return errors
}

/**
 * Validates inputs against dataset schema (JSON Schema format)
 * This replicates server's compileValidator approach
 */
export function validateAgainstSchema(
  data: Record<string, any>,
  schema?: any
): ValidationError[] {
  const errors: ValidationError[] = []

  if (!schema || !schema.properties) {
    return errors
  }

  const properties = schema.properties
  const required = schema.required || []

  // Check required fields
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `${field} is required`,
      })
    }
  }

  // Validate types for each property
  for (const [field, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue

    const fieldSchema = properties[field]
    if (!fieldSchema) {
      // additionalProperties check
      if (schema.additionalProperties === false) {
        errors.push({
          field,
          message: `${field} is not a valid field`,
          value,
        })
      }
      continue
    }

    const type = fieldSchema.type

    // Type validation
    if (type === 'number' || type === 'integer') {
      const numValue = Number(value)
      if (isNaN(numValue)) {
        errors.push({
          field,
          message: `${field} must be a ${type}`,
          value,
        })
        continue
      }

      if (type === 'integer' && !Number.isInteger(numValue)) {
        errors.push({
          field,
          message: `${field} must be an integer`,
          value: numValue,
        })
        continue
      }

      // Range validation
      if (fieldSchema.minimum !== undefined && numValue < fieldSchema.minimum) {
        errors.push({
          field,
          message: `${field} must be >= ${fieldSchema.minimum}`,
          value: numValue,
        })
      }

      if (fieldSchema.maximum !== undefined && numValue > fieldSchema.maximum) {
        errors.push({
          field,
          message: `${field} must be <= ${fieldSchema.maximum}`,
          value: numValue,
        })
      }
    } else if (type === 'string') {
      if (typeof value !== 'string') {
        errors.push({
          field,
          message: `${field} must be a string`,
          value,
        })
        continue
      }

      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${fieldSchema.minLength} characters`,
          value,
        })
      }

      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${fieldSchema.maxLength} characters`,
          value,
        })
      }
    } else if (type === 'boolean') {
      if (typeof value !== 'boolean') {
        errors.push({
          field,
          message: `${field} must be a boolean`,
          value,
        })
      }
    }
  }

  return errors
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  
  return errors.map(e => `• ${e.message}`).join('\n')
}
