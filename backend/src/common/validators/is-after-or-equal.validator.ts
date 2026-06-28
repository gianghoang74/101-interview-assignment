import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { parseDateOnlyUtc } from '../date';

/**
 * Validates that a date string is on or after another date-string property on
 * the same object. Used for `dueDate` >= `invoiceDate`. Both values are parsed
 * as UTC-midnight calendar dates so the comparison is timezone-independent and
 * consistent with how the dates are stored.
 */
@ValidatorConstraint({ name: 'isAfterOrEqual', async: false })
export class IsAfterOrEqualConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedProperty] = args.constraints as [string];
    const related = (args.object as Record<string, unknown>)[relatedProperty];
    const due = parseDateOnlyUtc(value);
    const reference = parseDateOnlyUtc(related);
    if (due === null || reference === null) {
      return true; // format/missing errors are reported by @IsDateOnly
    }
    return due.getTime() >= reference.getTime(); // value is on or after related
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedProperty] = args.constraints as [string];
    return `${args.property} must be on or after ${relatedProperty}`;
  }
}

export function IsAfterOrEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isAfterOrEqual',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: IsAfterOrEqualConstraint,
    });
  };
}
