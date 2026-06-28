import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { parseDateOnlyUtc } from '../date';

/**
 * Validates that a value is a strict calendar date in `YYYY-MM-DD` form.
 * Unlike `@IsDateString()`, this rejects full datetimes (e.g.
 * `2026-06-10T08:00:00Z`) so the date-only storage contract can't be bypassed.
 */
@ValidatorConstraint({ name: 'isDateOnly', async: false })
export class IsDateOnlyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return parseDateOnlyUtc(value) !== null;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid calendar date in YYYY-MM-DD format`;
  }
}

export function IsDateOnly(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: IsDateOnlyConstraint,
    });
  };
}
