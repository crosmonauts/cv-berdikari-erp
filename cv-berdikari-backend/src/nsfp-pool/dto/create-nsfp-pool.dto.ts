import { IsInt, IsString, Matches, registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

function IsEndGteStart(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEndGteStart',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          if (!obj.startNum || !value) return true;
          try {
            return BigInt(value) >= BigInt(obj.startNum);
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return 'endNum must be >= startNum';
        },
      },
    });
  };
}

export class CreateNsfpPoolDto {
  @IsInt()
  year: number;

  @IsString()
  @Matches(/^\d{16}$/)
  startNum: string;

  @IsString()
  @Matches(/^\d{16}$/)
  @IsEndGteStart({ message: 'endNum must be >= startNum' })
  endNum: string;
}
