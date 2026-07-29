import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface OfferingPrices {
  actualPrice?: number;
}

@ValidatorConstraint({ name: 'discountNotGreaterThanActual' })
export class DiscountPriceValidator implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const actualPrice = (args.object as OfferingPrices).actualPrice;
    return (
      typeof value === 'number' &&
      (actualPrice === undefined || value <= actualPrice)
    );
  }

  defaultMessage(): string {
    return 'discountPrice must not be greater than actualPrice';
  }
}
