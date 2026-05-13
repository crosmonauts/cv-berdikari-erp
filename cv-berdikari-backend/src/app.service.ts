import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Database CV Berdikari Backend udah nyala cuy!';
  }
}
