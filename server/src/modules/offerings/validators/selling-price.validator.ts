import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface OfferingPrices {
  basePrice?: number;
}

@ValidatorConstraint({ name: 'discountNotGreaterThanActual' })
export class SellingPriceValidator implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const basePrice = (args.object as OfferingPrices).basePrice;
    return (
      typeof value === 'number' &&
      (basePrice === undefined || value <= basePrice)
    );
  }

  defaultMessage(): string {
    return 'sellingPrice must not be greater than basePrice';
  }
}
